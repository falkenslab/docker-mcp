// Programs the person installs apart (Docker, ffmpeg…), for the servers that need one (ADR-004): checked,
// explained, never installed. A server that needs nothing leaves REQUIREMENTS empty and gets no tool.
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);

/** The same shape as agent-kit's metadata["agent-kit"].requirements, so the manifest can copy it. */
export interface Requirement {
  /** What the person knows it as: "Docker". */
  name: string;
  /** A bare name on the PATH: "docker". */
  program: string;
  /** How to read its version, and the minimum: { args: ["--version"], min: "24.0.0" }. */
  version?: { args: string[]; min: string };
  /** A command per system, and a page. */
  install: { windows?: string; macos?: string; linux?: string; url?: string };
  /** What it's for, in a few words, for the messages: "running the labs". */
  for?: string;
}

export interface RequirementStatus {
  name: string;
  program: string;
  installed: boolean;
  version?: string;
  ok: boolean;
  problem?: string;
  install?: string;
}

/** The requirements of this server. Empty: it needs nothing installed apart. */
export const REQUIREMENTS: Requirement[] = [];

type System = "windows" | "macos" | "linux";
const system = (): System => (process.platform === "win32" ? "windows" : process.platform === "darwin" ? "macos" : "linux");

/** Whether a version like 24.0.7 is at least a minimum like 24.0.0. */
export function atLeast(found: string, min: string): boolean {
  const [a, b] = [found, min].map((v) => v.split(".").map((n) => Number.parseInt(n, 10) || 0));
  for (let i = 0; i < 3; i++) {
    const [x, y] = [a?.[i] ?? 0, b?.[i] ?? 0];
    if (x !== y) return x > y;
  }
  return true;
}

/** How to install it on this system, in one line. */
export function howToInstall(requirement: Requirement, on: System = system()): string {
  const command = requirement.install[on];
  return [command && `run ${command}`, requirement.install.url && `see ${requirement.install.url}`].filter(Boolean).join(", or ") || "see its website";
}

export async function checkRequirement(requirement: Requirement): Promise<RequirementStatus> {
  const base = { name: requirement.name, program: requirement.program };
  try {
    const { stdout, stderr } = await run(requirement.program, requirement.version?.args ?? ["--version"], { timeout: 15_000, windowsHide: true });
    const version = `${stdout}${stderr}`.match(/\d+\.\d+(\.\d+)?/)?.[0];
    if (requirement.version && version && !atLeast(version, requirement.version.min))
      return { ...base, installed: true, version, ok: false, problem: `version ${version}, ${requirement.version.min} or later needed`, install: howToInstall(requirement) };
    return { ...base, installed: true, ...(version ? { version } : {}), ok: true };
  } catch {
    return { ...base, installed: false, ok: false, problem: "not installed, or not on the PATH", install: howToInstall(requirement) };
  }
}

/** A tool's error when its program is missing: what, what for, and how to install it; never a raw error. */
export class RequirementMissing extends Error {
  constructor(status: RequirementStatus, requirement: Requirement) {
    super(`${requirement.name} is needed${requirement.for ? ` for ${requirement.for}` : ""}: ${status.problem}. To install it, ${status.install}. Then try again; nothing was changed.`);
    this.name = "RequirementMissing";
  }
}

/** Throws RequirementMissing unless the program is there: the first line of a tool that needs one. */
export async function needs(program: string, requirements: Requirement[] = REQUIREMENTS): Promise<void> {
  const requirement = requirements.find((r) => r.program === program);
  if (!requirement) throw new Error(`${program} isn't one of this server's requirements`);
  const status = await checkRequirement(requirement);
  if (!status.ok) throw new RequirementMissing(status, requirement);
}
