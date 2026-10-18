// Labs: a folder per practice under the labs folder, with its compose file and, optionally, lab.json with
// the check that says whether it works. Every lab runs as its own Compose project, under lab mode's policy
// (an override file kept outside the lab's folder), so only what docker-mcp created is ever touched.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import type { Config } from "./config.js";
import { dataDir } from "./dataDir.js";
import { docker, dockerOutput, forModel, jsonLines } from "./docker.js";
import { PolicyError, labOverride, labProblems } from "./policy.js";

export const LAB_PREFIX = "docker-mcp-lab-";
const COMPOSE_FILES = ["compose.yaml", "compose.yml", "docker-compose.yaml", "docker-compose.yml"];

export interface LabCheck {
  service: string;
  command: string[];
}
export interface Lab {
  name: string;
  folder: string;
  composeFile: string;
  check?: LabCheck;
}

export class LabError extends Error {}

const project = (name: string) => `${LAB_PREFIX}${name.toLowerCase()}`;

function readLab(config: Config, name: string): Lab {
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(name)) throw new LabError(`"${name}" isn't a lab's name: letters, digits, - and _ only, as list_labs gives them.`);
  const folder = path.join(config.labsDir, name);
  const file = COMPOSE_FILES.find((candidate) => existsSync(path.join(folder, candidate)));
  if (!file) throw new LabError(`No lab called ${name} in ${config.labsDir}: a lab is a folder there with a compose.yaml. list_labs gives the ones there are.`);
  const lab: Lab = { name, folder, composeFile: path.join(folder, file) };
  const manifest = path.join(folder, "lab.json");
  if (existsSync(manifest)) {
    const check = (JSON.parse(readFileSync(manifest, "utf8")) as { check?: { service?: string; command?: string | string[] } }).check;
    if (check?.service && check.command) lab.check = { service: check.service, command: Array.isArray(check.command) ? check.command : ["sh", "-c", check.command] };
  }
  return lab;
}

/** The labs in the labs folder. */
export function listLabs(config: Config): Lab[] {
  if (!existsSync(config.labsDir)) return [];
  return readdirSync(config.labsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && COMPOSE_FILES.some((file) => existsSync(path.join(config.labsDir, entry.name, file))))
    .map((entry) => readLab(config, entry.name));
}

/** The compose arguments for a lab: its project, its file and lab mode's override on top. */
function composeArgs(config: Config, lab: Lab): string[] {
  const compose = parse(readFileSync(lab.composeFile, "utf8")) as unknown;
  const problems = labProblems(compose, lab.folder, config);
  if (problems.length) throw new PolicyError(`The lab ${lab.name} breaks lab mode's policy, so it won't start:\n- ${problems.join("\n- ")}\nChange its compose file, or use full mode for anything a lab can't do.`);
  const overrides = path.join(dataDir(), "overrides");
  mkdirSync(overrides, { recursive: true });
  const override = path.join(overrides, `${lab.name}.yaml`);
  writeFileSync(override, labOverride(compose, lab.name, config));
  return ["compose", "-p", project(lab.name), "-f", lab.composeFile, "-f", override];
}

export interface LabService {
  service: string;
  container: string;
  state: string;
  status?: string;
  ports?: string;
}

/** `docker compose ps` output: JSON lines in Compose 2.21 and later, an array before. */
function parsePs(output: string): LabService[] {
  const text = output.trim();
  const rows = (text.startsWith("[") ? JSON.parse(text) : jsonLines(text)) as Record<string, string>[];
  return rows.map((row) => ({ service: row.Service ?? "", container: row.Name ?? "", state: row.State ?? "", ...(row.Status ? { status: row.Status } : {}), ...(row.Publishers || row.Ports ? { ports: String(row.Ports ?? "") } : {}) }));
}

export async function labStatus(config: Config, name: string): Promise<LabService[]> {
  const lab = readLab(config, name);
  return parsePs(await docker(["compose", "-p", project(lab.name), "ps", "-a", "--format", "json"], { cwd: lab.folder }));
}

export async function labUp(config: Config, name: string): Promise<LabService[]> {
  const lab = readLab(config, name);
  await docker([...composeArgs(config, lab), "up", "-d", "--build", "--remove-orphans"], { cwd: lab.folder, timeoutMs: 600_000 });
  return labStatus(config, name);
}

export async function labDown(config: Config, name: string): Promise<void> {
  const lab = readLab(config, name);
  await docker(["compose", "-p", project(lab.name), "down", "--volumes", "--remove-orphans"], { cwd: lab.folder, timeoutMs: 300_000 });
}

export async function labReset(config: Config, name: string): Promise<LabService[]> {
  await labDown(config, name);
  return labUp(config, name);
}

export type CommandResult = { exitCode: number; output: string; truncated: boolean };

export async function labExec(config: Config, name: string, service: string, command: string[], timeoutSeconds = 60): Promise<CommandResult> {
  const lab = readLab(config, name);
  const result = await dockerOutput(["compose", "-p", project(lab.name), "exec", "-T", service, ...command], { cwd: lab.folder, timeoutMs: timeoutSeconds * 1000 });
  return { exitCode: result.code, ...forModel(`${result.stdout}${result.stderr}`) };
}

export async function labLogs(config: Config, name: string, service: string | undefined, tail = 200): Promise<{ output: string; truncated: boolean }> {
  const lab = readLab(config, name);
  const result = await dockerOutput(["compose", "-p", project(lab.name), "logs", "--no-color", "--tail", String(tail), ...(service ? [service] : [])], { cwd: lab.folder });
  return forModel(`${result.stdout}${result.stderr}`);
}

export async function labCheck(config: Config, name: string): Promise<CommandResult & { passed: boolean }> {
  const lab = readLab(config, name);
  if (!lab.check) throw new LabError(`The lab ${name} has no check: add a lab.json with { "check": { "service": "<service>", "command": "<command>" } }, a command that exits 0 when the practice works.`);
  const result = await labExec(config, name, lab.check.service, lab.check.command, 120);
  return { ...result, passed: result.exitCode === 0 };
}
