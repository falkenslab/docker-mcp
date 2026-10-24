// Docker Compose on any project folder (full mode; read mode only reads). Labs, under lab mode's policy, are labs.ts.
import { z } from "zod";
import { docker, dockerOutput, forModel, jsonLines } from "../docker.js";
import { reply } from "./reply.js";
import { withDocker } from "./shared.js";
import { confirm } from "../confirm.js";
import { FULL, READ_AND_FULL, type ToolEntry } from "./types.js";

const folder = z.string().min(1).describe("The Compose project's folder (absolute path), where its compose.yaml is");
const file = z.string().optional().describe("Its compose file, when it isn't the folder's compose.yaml");
const base = (dir: string, composeFile?: string) => ["compose", "--project-directory", dir, ...(composeFile ? ["-f", composeFile] : [])];
const service = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_.-]*$/);

function parsePs(output: string) {
  const text = output.trim();
  const rows = (text.startsWith("[") ? JSON.parse(text) : jsonLines(text)) as Record<string, string>[];
  return rows.map((r) => ({ service: r.Service ?? "", container: r.Name ?? "", state: r.State ?? "", status: r.Status ?? "" }));
}

export const COMPOSE_TOOLS: ToolEntry[] = [
  {
    area: "compose",
    modes: READ_AND_FULL,
    register: (server) =>
      server.registerTool(
        "compose_ps",
        {
          title: "A Compose project's services",
          description: "The services of a Compose project and their containers' state.",
          inputSchema: { folder, file },
          outputSchema: { services: z.array(z.object({ service: z.string(), container: z.string(), state: z.string(), status: z.string() })) },
          annotations: { readOnlyHint: true, openWorldHint: false },
        },
        async ({ folder: dir, file: f }) => withDocker(async () => reply({ services: parsePs(await docker([...base(dir, f), "ps", "-a", "--format", "json"], { cwd: dir })) })),
      ),
  },
  {
    area: "compose",
    modes: READ_AND_FULL,
    register: (server) =>
      server.registerTool(
        "compose_logs",
        {
          title: "A Compose project's logs",
          description: "The last log lines of a Compose project's services (or one), 200 per service by default.",
          inputSchema: { folder, file, service: service.optional(), tail: z.number().int().min(1).max(5000).default(200) },
          outputSchema: { output: z.string(), truncated: z.boolean() },
          annotations: { readOnlyHint: true, openWorldHint: false },
        },
        async ({ folder: dir, file: f, service: s, tail }) =>
          withDocker(async () => {
            const result = await dockerOutput([...base(dir, f), "logs", "--no-color", "--tail", String(tail), ...(s ? [s] : [])], { cwd: dir });
            return reply(forModel(`${result.stdout}${result.stderr}`));
          }),
      ),
  },
  {
    area: "compose",
    modes: FULL,
    register: (server) =>
      server.registerTool(
        "compose_build",
        {
          title: "Build a Compose project",
          description: "Build the images of a Compose project's services that have a build (all, or some), without starting anything: to check a Dockerfile change, or to have the images ready. Returns the exit code and the build's output (its end when long); a failed build says why at the end. Uses the network and disk: confirm with the person first.",
          inputSchema: {
            folder,
            file,
            services: z.array(service).optional().describe("Only these services; all with a build when missing"),
            noCache: z.boolean().default(false).describe("Build every step again, ignoring the cache"),
            pull: z.boolean().default(false).describe("Pull newer versions of the base images first"),
          },
          outputSchema: { exitCode: z.number().int(), output: z.string(), truncated: z.boolean() },
          annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
        },
        async ({ folder: dir, file: f, services, noCache, pull }) =>
          withDocker(async () => {
            const result = await dockerOutput([...base(dir, f), "build", ...(noCache ? ["--no-cache"] : []), ...(pull ? ["--pull"] : []), ...(services ?? [])], { cwd: dir, timeoutMs: 1_800_000 });
            return reply({ exitCode: result.code, ...forModel(`${result.stdout}${result.stderr}`) });
          }),
      ),
  },
  {
    area: "compose",
    modes: FULL,
    register: (server) =>
      server.registerTool(
        "compose_up",
        {
          title: "Start a Compose project",
          description: "Start a Compose project's services in the background (building what has a build), or only some. Runs whatever its compose file says, privileged services and host mounts included: read it first and confirm with the person, naming anything dangerous in it.",
          inputSchema: { folder, file, services: z.array(service).optional(), build: z.boolean().default(true) },
          outputSchema: { services: z.array(z.object({ service: z.string(), container: z.string(), state: z.string(), status: z.string() })), output: z.string(), truncated: z.boolean() },
          annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
        },
        async ({ folder: dir, file: f, services, build }) =>
          withDocker(async () => {
            const result = await dockerOutput([...base(dir, f), "up", "-d", ...(build ? ["--build"] : []), ...(services ?? [])], { cwd: dir, timeoutMs: 1_800_000 });
            if (result.code !== 0) throw new Error(result.stderr.trim() || "docker compose up failed");
            return reply({ services: parsePs(await docker([...base(dir, f), "ps", "-a", "--format", "json"], { cwd: dir })), ...forModel(result.stderr) });
          }),
      ),
  },
  {
    area: "compose",
    modes: FULL,
    register: (server, { config }) =>
      server.registerTool(
        "compose_down",
        {
          title: "Stop a Compose project",
          description: "Stop and remove a Compose project's containers and networks; with volumes, its volumes and their data too. Confirm with the person first; with volumes, the server asks the person to confirm it, naming what goes; if they say no, nothing is done.",
          inputSchema: { folder, file, volumes: z.boolean().default(false) },
          outputSchema: { stopped: z.string() },
          annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
        },
        async ({ folder: dir, file: f, volumes }) =>
          withDocker(async () => {
            if (volumes) await confirm(server, config, { question: `Stop the Compose project in ${dir} and remove its volumes?`, details: ["Its containers and networks go, and its volumes with all their data; that can't be undone."], action: `removing the Compose project in ${dir} with its volumes` });
            await docker([...base(dir, f), "down", "--remove-orphans", ...(volumes ? ["--volumes"] : [])], { cwd: dir, timeoutMs: 300_000 });
            return reply({ stopped: dir });
          }),
      ),
  },
  {
    area: "compose",
    modes: FULL,
    register: (server) =>
      server.registerTool(
        "compose_exec",
        {
          title: "Run a command in a Compose service",
          description: "Run a command in a running service of a Compose project, returning its exit code and output. The command is a list; for a shell line, [\"sh\", \"-c\", \"…\"]. Can change the service: confirm with the person first unless it only reads.",
          inputSchema: { folder, file, service, command: z.array(z.string()).min(1), timeoutSeconds: z.number().int().min(1).max(3600).default(60) },
          outputSchema: { exitCode: z.number().int(), output: z.string(), truncated: z.boolean() },
          annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
        },
        async ({ folder: dir, file: f, service: s, command, timeoutSeconds }) =>
          withDocker(async () => {
            const result = await dockerOutput([...base(dir, f), "exec", "-T", s, ...command], { cwd: dir, timeoutMs: timeoutSeconds * 1000 });
            return reply({ exitCode: result.code, ...forModel(`${result.stdout}${result.stderr}`) });
          }),
      ),
  },
];
