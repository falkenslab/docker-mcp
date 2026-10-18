// The server's configuration, read once at startup from its settings: the mode and the areas decide which
// tools exist (ADR-005), and lab mode's limits.
import path from "node:path";
import { dataDir } from "./dataDir.js";
import { setting } from "./settings.js";

export const MODES = ["read", "lab", "full"] as const;
export type Mode = (typeof MODES)[number];
export const AREAS = ["containers", "images", "volumes", "networks", "compose", "system", "labs"] as const;
export type Area = (typeof AREAS)[number];

export interface Config {
  mode: Mode;
  areas: Area[];
  /** Where the labs live: a folder per lab. */
  labsDir: string;
  /** Lab mode: whether a lab's services reach the internet (and publish ports to the host). */
  allowInternet: boolean;
  /** Lab mode: limits per service. */
  cpus: string;
  memory: string;
  pids: number;
  /** Lab mode: the images a lab may use; empty is any. */
  allowedImages: string[];
}

export class ConfigError extends Error {}

const list = (value: string | undefined) => (value ?? "").split(",").map((item) => item.trim()).filter(Boolean);
const bool = (value: string | undefined) => /^(1|true|yes|on)$/i.test(value ?? "");

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const mode = (setting("DOCKER_MCP_MODE", env) ?? "full").toLowerCase();
  if (!(MODES as readonly string[]).includes(mode)) throw new ConfigError(`DOCKER_MCP_MODE is "${mode}": it takes ${MODES.join(", ")}.`);
  const areas = list(setting("DOCKER_MCP_SCOPES", env)?.toLowerCase());
  const unknown = areas.filter((area) => !(AREAS as readonly string[]).includes(area));
  if (unknown.length) throw new ConfigError(`DOCKER_MCP_SCOPES has ${unknown.join(", ")}: it takes ${AREAS.join(", ")}.`);
  const pids = Number.parseInt(setting("DOCKER_MCP_PIDS", env) ?? "256", 10);
  return {
    mode: mode as Mode,
    areas: areas.length ? (areas as Area[]) : [...AREAS],
    labsDir: path.resolve(setting("DOCKER_MCP_LABS_DIR", env) ?? path.join(dataDir(env), "labs")),
    allowInternet: bool(setting("DOCKER_MCP_ALLOW_INTERNET", env)),
    cpus: setting("DOCKER_MCP_CPUS", env) ?? "1",
    memory: setting("DOCKER_MCP_MEMORY", env) ?? "512m",
    pids: Number.isFinite(pids) && pids > 0 ? pids : 256,
    allowedImages: list(setting("DOCKER_MCP_ALLOWED_IMAGES", env)),
  };
}
