// Docker through its CLI, with arguments as a list (never a shell string), a timeout, and output a model
// can use: JSON lines parsed, long text truncated, Docker's errors explained. The runner can be replaced,
// so tests never need Docker.
import { spawn } from "node:child_process";

export interface RunResult {
  stdout: string;
  stderr: string;
  code: number;
}
export interface RunOptions {
  cwd?: string;
  timeoutMs?: number;
}
export type Runner = (args: string[], options?: RunOptions) => Promise<RunResult>;

/** The real runner: `docker <args>`, killed after the timeout. */
export const spawnDocker: Runner = (args, { cwd, timeoutMs = 120_000 } = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn("docker", args, { cwd, windowsHide: true });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => child.kill(), timeoutMs);
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      resolve({ stdout, stderr: signal ? `${stderr}\nStopped after ${Math.round(timeoutMs / 1000)} s.` : stderr, code: code ?? 1 });
    });
  });

let runner: Runner = spawnDocker;
/** Replaces the runner (tests); returns the previous one. */
export function useRunner(next: Runner): Runner {
  const previous = runner;
  runner = next;
  return previous;
}
/** Whether calls go to the real Docker: only then is its installation checked first. */
export const usingRealDocker = () => runner === spawnDocker;

export class DockerError extends Error {}

/** Docker's own message, explained when the cause is usual and fixable. */
export function explain(stderr: string): string {
  const text = stderr.trim();
  if (/cannot connect to the docker daemon|error during connect|docker daemon is not running|pipe\/docker_engine/i.test(text))
    return "Docker is installed but not running: ask the person to start Docker Desktop (or the Docker service), then try again.";
  if (/permission denied.*docker\.sock/i.test(text)) return "This user can't use Docker: on Linux, add them to the docker group (then log in again) or run Docker rootless.";
  if (/no such (container|image|volume|network|object)/i.test(text)) return `${text} List them first to get a valid name or id.`;
  if (/container [0-9a-f]+ is not running/i.test(text)) return "That container isn't running: start it first, then try again.";
  return text || "Docker failed without a message.";
}

/** Runs `docker <args>` and returns its output; fails with Docker's message, explained. */
export async function docker(args: string[], options?: RunOptions): Promise<string> {
  const result = await runner(args, options);
  if (result.code !== 0) throw new DockerError(explain(result.stderr || result.stdout));
  return result.stdout;
}

/** Runs it and returns stdout and stderr together, and the exit code, without failing (exec, logs, checks). */
export async function dockerOutput(args: string[], options?: RunOptions): Promise<RunResult> {
  return runner(args, options);
}

/** `--format '{{json .}}'` output: one JSON object per line. */
export function jsonLines<T = Record<string, unknown>>(output: string): T[] {
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as T);
}

const MAX = 20_000;
/** Text for a model: control sequences removed, and the end kept when it's long (logs grow at the end). */
export function forModel(text: string, max = MAX): { output: string; truncated: boolean } {
  // eslint-disable-next-line no-control-regex
  const clean = text.replace(/\x1b\[[0-9;?]*[A-Za-z]/g, "").replace(/\r(?!\n)/g, "\n");
  return clean.length > max ? { output: `[…first ${clean.length - max} characters left out]\n${clean.slice(-max)}`, truncated: true } : { output: clean, truncated: false };
}
