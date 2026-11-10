// What's dangerous in a container's options (full mode asks for an explicit confirmation), what isolates a
// one-off container, and lab mode's policy for a lab's compose file: what it refuses, and the override that
// adds limits and isolation.
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

/** One dangerous option a run asks for, with what it names (capabilities, devices, a folder). */
export interface Danger {
  kind: "privileged" | "host-network" | "host-pid" | "host-ipc" | "capabilities" | "devices" | "docker-socket" | "host-root" | "home";
  value?: string;
}

/** The dangerous options a run asks for; empty when none. The person reads them in their language (messages.ts). */
export function dangers(options: ContainerOptions): Danger[] {
  const found: Danger[] = [];
  if (options.privileged) found.push({ kind: "privileged" });
  if (options.network === "host") found.push({ kind: "host-network" });
  if (options.pid === "host") found.push({ kind: "host-pid" });
  if (options.ipc === "host") found.push({ kind: "host-ipc" });
  if (options.capAdd?.length) found.push({ kind: "capabilities", value: options.capAdd.join(", ") });
  if (options.devices?.length) found.push({ kind: "devices", value: options.devices.join(", ") });
  for (const volume of options.volumes ?? []) {
    const source = bindSource(volume);
    if (!source) continue;
    if (DOCKER_SOCKET.test(source)) found.push({ kind: "docker-socket" });
    else if (isRoot(source)) found.push({ kind: "host-root", value: source });
    else if (isHome(source)) found.push({ kind: "home", value: source });
  }
  return found;
}

/** A dangerous option in English words, for the model (what the refusals say). */
export function describeDanger({ kind, value }: Danger): string {
  const words: Record<Danger["kind"], string> = {
    privileged: "a privileged container (full access to the host)",
    "host-network": "the host's network",
    "host-pid": "the host's processes",
    "host-ipc": "the host's IPC",
    capabilities: `extra capabilities (${value})`,
    devices: `host devices (${value})`,
    "docker-socket": "the Docker socket (control of every container on the host)",
    "host-root": `the host's root folder (${value})`,
    home: `the person's home folder (${value})`,
  };
  return words[kind];
}

/** What limits and cuts off one container (#6): the run's options for a try that can't reach the computer. */
export interface Isolation {
  cpus?: string;
  memory?: string;
  pids?: number;
  readOnly?: boolean;
  noNewPrivileges?: boolean;
  labels?: Record<string, string>;
}

/** `docker run`'s arguments for an isolation, as a list: limits, a read-only root, no new privileges, labels. */
export function isolationArgs(isolation: Isolation): string[] {
  const args: string[] = [];
  if (isolation.cpus) args.push("--cpus", isolation.cpus);
  if (isolation.memory) args.push("--memory", isolation.memory);
  if (isolation.pids) args.push("--pids-limit", String(isolation.pids));
  if (isolation.readOnly) args.push("--read-only");
  if (isolation.noNewPrivileges) args.push("--security-opt", "no-new-privileges");
  for (const [key, value] of Object.entries(isolation.labels ?? {})) args.push("--label", value ? `${key}=${value}` : key);
  return args;
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
