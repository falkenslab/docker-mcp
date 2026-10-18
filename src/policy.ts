// What's dangerous in a container's options (full mode asks for an explicit confirmation), and lab mode's
// policy for a lab's compose file: what it refuses, and the override that adds limits and isolation.
import { homedir } from "node:os";
import path from "node:path";
import { stringify } from "yaml";
import type { Config } from "./config.js";

export interface ContainerOptions {
  privileged?: boolean;
  network?: string;
  volumes?: string[];
  capAdd?: string[];
  devices?: string[];
  pid?: string;
  ipc?: string;
}

const DOCKER_SOCKET = /(^|[\\/])docker\.sock$|^\/\/\.\/pipe\/docker_engine$|^\\\\\.\\pipe\\docker_engine$/i;
const isRoot = (source: string) => /^(\/|[A-Za-z]:[\\/]?)$/.test(source.trim());
const isHome = (source: string) => {
  const home = path.resolve(homedir());
  const resolved = /^[~]/.test(source) ? home : path.resolve(source);
  return resolved.toLowerCase() === home.toLowerCase();
};
/** The host side of a `-v` bind ("/host:/container[:ro]", "C:\\x:/y"); undefined for a named volume. */
export function bindSource(volume: string): string | undefined {
  const match = volume.match(/^((?:[A-Za-z]:)?[^:]+):/);
  const source = match?.[1];
  if (!source) return undefined;
  return /^[./~\\]|^[A-Za-z]:/.test(source) || source.includes("/") ? source : undefined;
}

/** The dangerous options a run asks for, in words; empty when none. */
export function dangers(options: ContainerOptions): string[] {
  const found: string[] = [];
  if (options.privileged) found.push("a privileged container (full access to the host)");
  if (options.network === "host") found.push("the host's network");
  if (options.pid === "host") found.push("the host's processes");
  if (options.ipc === "host") found.push("the host's IPC");
  if (options.capAdd?.length) found.push(`extra capabilities (${options.capAdd.join(", ")})`);
  if (options.devices?.length) found.push(`host devices (${options.devices.join(", ")})`);
  for (const volume of options.volumes ?? []) {
    const source = bindSource(volume);
    if (!source) continue;
    if (DOCKER_SOCKET.test(source)) found.push("the Docker socket (control of every container on the host)");
    else if (isRoot(source)) found.push(`the host's root folder (${source})`);
    else if (isHome(source)) found.push(`the person's home folder (${source})`);
  }
  return found;
}

export class PolicyError extends Error {}

type Service = Record<string, unknown>;

/** Lab mode's checks on a lab's compose file: every problem found, in words; empty when it complies. */
export function labProblems(compose: unknown, labDir: string, config: Pick<Config, "allowedImages">): string[] {
  const problems: string[] = [];
  const services = (compose as { services?: Record<string, Service> } | null)?.services;
  if (!services || typeof services !== "object") return ["it has no services"];
  const inside = (source: string) => {
    const resolved = path.resolve(labDir, source);
    const relative = path.relative(path.resolve(labDir), resolved);
    return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
  };
  for (const [name, service] of Object.entries(services)) {
    const say = (problem: string) => problems.push(`${name}: ${problem}`);
    if (service.privileged) say("privileged isn't allowed");
    if (service.cap_add) say("cap_add isn't allowed");
    if (service.devices) say("devices aren't allowed");
    for (const key of ["network_mode", "pid", "ipc", "userns_mode"]) {
      const value = service[key];
      if (typeof value === "string" && (value === "host" || value.startsWith("container:") || value.startsWith("service:"))) say(`${key}: ${value} isn't allowed`);
    }
    if (service.security_opt) say("security_opt isn't allowed");
    const image = typeof service.image === "string" ? service.image : undefined;
    if (image && config.allowedImages.length && !config.allowedImages.some((allowed) => image === allowed || image.startsWith(`${allowed}:`) || image.startsWith(`${allowed}@`)))
      say(`the image ${image} isn't among the allowed ones (${config.allowedImages.join(", ")})`);
    const build = service.build;
    const context = typeof build === "string" ? build : (build as { context?: unknown } | undefined)?.context;
    if (typeof context === "string" && !/^https?:|^git@/.test(context) && !inside(context)) say(`its build context ${context} is outside the lab's folder`);
    for (const volume of (service.volumes as unknown[] | undefined) ?? []) {
      const source = typeof volume === "string" ? bindSource(volume) : (volume as { type?: string; source?: string }).type === "bind" ? (volume as { source?: string }).source : undefined;
      if (!source) continue;
      if (DOCKER_SOCKET.test(source)) say("the Docker socket can't be mounted");
      else if (!inside(source)) say(`${source} is outside the lab's folder: only the lab's own files can be mounted`);
    }
  }
  return problems;
}

/** The override file lab mode adds on top of a lab's compose file: limits, no new privileges, its label, and isolation. */
export function labOverride(compose: unknown, lab: string, config: Pick<Config, "allowInternet" | "cpus" | "memory" | "pids">): string {
  const services = Object.keys((compose as { services?: Record<string, Service> }).services ?? {});
  const override: Record<string, unknown> = {
    services: Object.fromEntries(
      services.map((name) => [name, { cpus: config.cpus, mem_limit: config.memory, pids_limit: config.pids, security_opt: ["no-new-privileges:true"], labels: { "falkenslab.docker-mcp": lab } }]),
    ),
  };
  // Without the internet, every network of the lab is internal, its own and the default: services reach each
  // other and nothing else (and the host can't reach their published ports).
  if (!config.allowInternet) {
    const own = Object.keys((compose as { networks?: Record<string, unknown> }).networks ?? {});
    override.networks = Object.fromEntries(["default", ...own].map((name) => [name, { internal: true }]));
  }
  return stringify(override);
}
