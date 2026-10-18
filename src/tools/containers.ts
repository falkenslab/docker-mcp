import { z } from "zod";
import { docker, dockerOutput, forModel, jsonLines } from "../docker.js";
import { dangers } from "../policy.js";
import { parseStats, parseTop } from "../usage.js";
import { reply } from "./reply.js";
import { LABEL, ownedInLab, ref, withDocker } from "./shared.js";
import { ALL_MODES, FULL, type ToolEntry } from "./types.js";

const container = ref("container");
const output = { exitCode: z.number().int(), output: z.string(), truncated: z.boolean().describe("The start was left out: it was longer than a model's context fits") };

export const CONTAINER_TOOLS: ToolEntry[] = [
  {
    area: "containers",
    modes: ALL_MODES,
    register: (server, { config }) =>
      server.registerTool(
        "list_containers",
        {
          title: "List containers",
          description: `List Docker containers, running or not (all unless running is true): id, name, image, state, status and ports. ${config.mode === "lab" ? "In lab mode, only the labs' containers. " : ""}Names and ids are what the other container tools take.`,
          inputSchema: { running: z.boolean().optional().describe("Only the running ones") },
          outputSchema: { containers: z.array(z.object({ id: z.string(), name: z.string(), image: z.string(), state: z.string(), status: z.string(), ports: z.string() })) },
          annotations: { readOnlyHint: true, openWorldHint: false },
        },
        async ({ running }) =>
          withDocker(async () => {
            const rows = jsonLines<Record<string, string>>(await docker(["ps", ...(running ? [] : ["-a"]), ...(config.mode === "lab" ? ["--filter", `label=${LABEL}`] : []), "--format", "{{json .}}"]));
            return reply({ containers: rows.map((r) => ({ id: r.ID ?? "", name: r.Names ?? "", image: r.Image ?? "", state: r.State ?? "", status: r.Status ?? "", ports: r.Ports ?? "" })) });
          }),
      ),
  },
  {
    area: "containers",
    modes: ALL_MODES,
    register: (server, { config }) =>
      server.registerTool(
        "inspect_container",
        {
          title: "Inspect a container",
          description: "A container's details: image, command, state (with its exit code), ports, mounts, networks and labels, and the names of its environment variables (never their values, which may hold secrets).",
          inputSchema: { container },
          outputSchema: {
            name: z.string(),
            image: z.string(),
            command: z.string(),
            state: z.object({ status: z.string(), running: z.boolean(), exitCode: z.number().int(), startedAt: z.string() }),
            ports: z.array(z.string()),
            mounts: z.array(z.object({ type: z.string(), source: z.string(), destination: z.string(), readOnly: z.boolean() })),
            networks: z.array(z.string()),
            labels: z.record(z.string(), z.string()),
            environment: z.array(z.string()).describe("Variable names only"),
          },
          annotations: { readOnlyHint: true, openWorldHint: false },
        },
        async ({ container: id }) =>
          withDocker(async () => {
            await ownedInLab(config, id);
            const [info] = JSON.parse(await docker(["inspect", "--type", "container", id])) as ContainerInfo[];
            if (!info) throw new Error(`No container ${id}.`);
            const ports = Object.entries((info.NetworkSettings?.Ports ?? {}) as Record<string, { HostIp: string; HostPort: string }[] | null>).flatMap(([port, binds]) => (binds ?? []).map((b) => `${b.HostIp || "0.0.0.0"}:${b.HostPort}->${port}`));
            return reply({
              name: String(info.Name ?? "").replace(/^\//, ""),
              image: String(info.Config?.Image ?? ""),
              command: [info.Path, ...(info.Args ?? [])].filter(Boolean).join(" "),
              state: { status: String(info.State?.Status ?? ""), running: Boolean(info.State?.Running), exitCode: Number(info.State?.ExitCode ?? 0), startedAt: String(info.State?.StartedAt ?? "") },
              ports,
              mounts: (info.Mounts ?? []).map((m) => ({ type: String(m.Type ?? ""), source: String(m.Source ?? m.Name ?? ""), destination: String(m.Destination ?? ""), readOnly: m.RW === false })),
              networks: Object.keys(info.NetworkSettings?.Networks ?? {}),
              labels: (info.Config?.Labels ?? {}) as Record<string, string>,
              environment: ((info.Config?.Env ?? []) as string[]).map((variable) => variable.split("=")[0] ?? ""),
            });
          }),
      ),
  },
  {
    area: "containers",
    modes: ALL_MODES,
    register: (server, { config }) =>
      server.registerTool(
        "container_logs",
        {
          title: "A container's logs",
          description: "A container's last log lines (stdout and stderr), 200 by default; the start is left out when they're very long.",
          inputSchema: { container, tail: z.number().int().min(1).max(5000).default(200).describe("How many lines from the end"), since: z.string().optional().describe("Only since then: a timestamp, or a duration like 10m") },
          outputSchema: { output: z.string(), truncated: z.boolean() },
          annotations: { readOnlyHint: true, openWorldHint: false },
        },
        async ({ container: id, tail, since }) =>
          withDocker(async () => {
            await ownedInLab(config, id);
            const result = await dockerOutput(["logs", "--tail", String(tail), ...(since ? ["--since", since] : []), id]);
            if (result.code !== 0) throw new Error(result.stderr.trim());
            return reply(forModel(`${result.stdout}${result.stderr}`));
          }),
      ),
  },
  {
    area: "containers",
    modes: ALL_MODES,
    register: (server, { config }) =>
      server.registerTool(
        "container_stats",
        {
          title: "Containers' resource usage",
          description: `What containers consume right now, one snapshot (not a stream): CPU, memory (used, limit, percent), network and disk I/O, and processes. All running containers, or the ones named; a stopped one shows zeros. ${config.mode === "lab" ? "In lab mode, only the labs' containers. " : ""}Use it to answer why the computer is slow or which container uses the most; container_processes shows what runs inside one.`,
          inputSchema: { containers: z.array(container).optional().describe("Only these containers; all running ones when missing") },
          outputSchema: {
            containers: z.array(
              z.object({
                id: z.string(),
                name: z.string(),
                cpu: z.string().describe("Percent of one CPU, e.g. 12.5%; above 100% uses more than one"),
                memoryUsage: z.string(),
                memoryLimit: z.string(),
                memoryPercent: z.string(),
                networkReceived: z.string(),
                networkSent: z.string(),
                blockRead: z.string(),
                blockWritten: z.string(),
                processes: z.number().int(),
              }),
            ),
          },
          annotations: { readOnlyHint: true, openWorldHint: false },
        },
        async ({ containers }) =>
          withDocker(async () => {
            for (const id of containers ?? []) await ownedInLab(config, id);
            const targets = containers?.length ? containers : config.mode === "lab" ? (await docker(["ps", "-q", "--filter", `label=${LABEL}`])).split(/\s+/).filter(Boolean) : [];
            if (config.mode === "lab" && !targets.length) return reply({ containers: [] });
            return reply({ containers: parseStats(await docker(["stats", "--no-stream", "--format", "{{json .}}", ...targets])) });
          }),
      ),
  },
  {
    area: "containers",
    modes: ALL_MODES,
    register: (server, { config }) =>
      server.registerTool(
        "container_processes",
        {
          title: "A container's processes",
          description: "The processes running inside a container (docker top): their user, PID, start time, CPU time and command, with the columns Docker gives. The container must be running.",
          inputSchema: { container },
          outputSchema: { columns: z.array(z.string()), processes: z.array(z.record(z.string(), z.string())).describe("One per process, keyed by column") },
          annotations: { readOnlyHint: true, openWorldHint: false },
        },
        async ({ container: id }) =>
          withDocker(async () => {
            await ownedInLab(config, id);
            return reply(parseTop(await docker(["top", id])));
          }),
      ),
  },
  {
    area: "containers",
    modes: FULL,
    register: (server) =>
      server.registerTool(
        "run_container",
        {
          title: "Run a container",
          description:
            "Create and start a container from an image (pulled if missing), in the background unless detach is false. Dangerous options (privileged, the host's network, processes or IPC, extra capabilities, devices, mounting the Docker socket, the host's root or the person's home) are refused unless confirmedDangerous is true: ask the person first, naming what they give the container. Changes the machine: confirm with the person first.",
          inputSchema: {
            image: z.string().min(1).describe("The image, e.g. nginx:1.27 or postgres:17"),
            name: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_.-]*$/).optional(),
            command: z.array(z.string()).optional().describe("The command and its arguments, one per item; the image's when missing"),
            env: z.record(z.string(), z.string()).optional().describe("Environment variables"),
            ports: z.array(z.string()).optional().describe('Published ports, "host:container", e.g. "8080:80"; "127.0.0.1:8080:80" to keep them on this computer'),
            volumes: z.array(z.string()).optional().describe('Mounts, "named-volume:/path" or "/host/path:/path[:ro]"'),
            network: z.string().optional().describe("A network to join"),
            workdir: z.string().optional(),
            detach: z.boolean().default(true).describe("In the background (default); false waits for it to finish and returns its output"),
            remove: z.boolean().default(false).describe("Remove it when it stops"),
            restart: z.enum(["no", "on-failure", "unless-stopped", "always"]).optional(),
            privileged: z.boolean().optional(),
            capAdd: z.array(z.string()).optional(),
            devices: z.array(z.string()).optional(),
            pid: z.string().optional(),
            ipc: z.string().optional(),
            confirmedDangerous: z.boolean().optional().describe("The person confirmed the dangerous options, knowing what they give the container"),
          },
          outputSchema: { container: z.string().describe("Its id (detached)"), ...output },
          annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
        },
        async (input) =>
          withDocker(async () => {
            const found = dangers(input);
            if (found.length && !input.confirmedDangerous)
              throw new Error(`This container would get ${found.join(", ")}. Ask the person whether they want that, and only with their yes call again with confirmedDangerous: true.`);
            const args = ["run", ...(input.detach ? ["-d"] : []), ...(input.remove ? ["--rm"] : []), ...(input.name ? ["--name", input.name] : [])];
            for (const [key, value] of Object.entries(input.env ?? {})) args.push("-e", `${key}=${value}`);
            for (const port of input.ports ?? []) args.push("-p", port);
            for (const volume of input.volumes ?? []) args.push("-v", volume);
            if (input.network) args.push("--network", input.network);
            if (input.workdir) args.push("-w", input.workdir);
            if (input.restart) args.push("--restart", input.restart);
            if (input.privileged) args.push("--privileged");
            for (const cap of input.capAdd ?? []) args.push("--cap-add", cap);
            for (const device of input.devices ?? []) args.push("--device", device);
            if (input.pid) args.push("--pid", input.pid);
            if (input.ipc) args.push("--ipc", input.ipc);
            args.push(input.image, ...(input.command ?? []));
            const result = await dockerOutput(args, { timeoutMs: 600_000 });
            if (result.code !== 0 && input.detach) throw new Error(result.stderr.trim() || "docker run failed");
            return reply({ container: input.detach ? result.stdout.trim() : "", exitCode: result.code, ...forModel(input.detach ? result.stderr : `${result.stdout}${result.stderr}`) });
          }),
      ),
  },
  ...(["start", "stop", "restart"] as const).map(
    (action): ToolEntry => ({
      area: "containers",
      modes: FULL,
      register: (server) =>
        server.registerTool(
          `${action}_container`,
          {
            title: `${action[0]!.toUpperCase()}${action.slice(1)} a container`,
            description: `${action[0]!.toUpperCase()}${action.slice(1)} an existing container${action === "stop" ? " (it gets 10 seconds to stop cleanly)" : ""}. Confirm with the person first.`,
            inputSchema: { container },
            outputSchema: { container: z.string(), state: z.string() },
            annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
          },
          async ({ container: id }) =>
            withDocker(async () => {
              await docker([action, id], { timeoutMs: 60_000 });
              return reply({ container: id, state: (await docker(["inspect", "--format", "{{.State.Status}}", id])).trim() });
            }),
        ),
    }),
  ),
  {
    area: "containers",
    modes: FULL,
    register: (server) =>
      server.registerTool(
        "remove_container",
        {
          title: "Remove a container",
          description: "Remove a container, with force to stop it first if it's running, and with volumes to remove its anonymous volumes. Its data is gone: confirm with the person first, naming it.",
          inputSchema: { container, force: z.boolean().default(false), volumes: z.boolean().default(false) },
          outputSchema: { removed: z.string() },
          annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
        },
        async ({ container: id, force, volumes }) =>
          withDocker(async () => {
            await docker(["rm", ...(force ? ["-f"] : []), ...(volumes ? ["-v"] : []), id]);
            return reply({ removed: id });
          }),
      ),
  },
  {
    area: "containers",
    modes: FULL,
    register: (server) =>
      server.registerTool(
        "exec_in_container",
        {
          title: "Run a command in a container",
          description: "Run a command in a running container and return its exit code and output (stdout and stderr together), stopped after timeoutSeconds. The command is a list, one argument per item; for a shell line, use [\"sh\", \"-c\", \"…\"]. Can change the container: confirm with the person first unless it only reads.",
          inputSchema: {
            container,
            command: z.array(z.string()).min(1),
            workdir: z.string().optional(),
            user: z.string().optional(),
            env: z.record(z.string(), z.string()).optional(),
            timeoutSeconds: z.number().int().min(1).max(3600).default(60),
          },
          outputSchema: output,
          annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
        },
        async ({ container: id, command, workdir, user, env, timeoutSeconds }) =>
          withDocker(async () => {
            const args = ["exec", ...(workdir ? ["-w", workdir] : []), ...(user ? ["-u", user] : [])];
            for (const [key, value] of Object.entries(env ?? {})) args.push("-e", `${key}=${value}`);
            const result = await dockerOutput([...args, id, ...command], { timeoutMs: timeoutSeconds * 1000 });
            return reply({ exitCode: result.code, ...forModel(`${result.stdout}${result.stderr}`) });
          }),
      ),
  },
  {
    area: "containers",
    modes: FULL,
    register: (server) =>
      server.registerTool(
        "copy_to_container",
        {
          title: "Copy files into a container",
          description: "Copy a local file or folder into a container's path. Overwrites what's there: confirm with the person first.",
          inputSchema: { container, from: z.string().min(1).describe("A local file or folder (absolute path)"), to: z.string().min(1).describe("The path in the container") },
          outputSchema: { copied: z.string() },
          annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
        },
        async ({ container: id, from, to }) =>
          withDocker(async () => {
            await docker(["cp", from, `${id}:${to}`], { timeoutMs: 300_000 });
            return reply({ copied: `${from} → ${id}:${to}` });
          }),
      ),
  },
  {
    area: "containers",
    modes: FULL,
    register: (server) =>
      server.registerTool(
        "copy_from_container",
        {
          title: "Copy files out of a container",
          description: "Copy a container's file or folder to a local path. Overwrites what's there locally: confirm with the person first.",
          inputSchema: { container, from: z.string().min(1).describe("The path in the container"), to: z.string().min(1).describe("A local path (absolute)") },
          outputSchema: { copied: z.string() },
          annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
        },
        async ({ container: id, from, to }) =>
          withDocker(async () => {
            await docker(["cp", `${id}:${from}`, to], { timeoutMs: 300_000 });
            return reply({ copied: `${id}:${from} → ${to}` });
          }),
      ),
  },
];

interface ContainerInfo {
  Name?: string;
  Path?: string;
  Args?: string[];
  Config?: { Image?: string; Labels?: Record<string, string>; Env?: string[] };
  State?: { Status?: string; Running?: boolean; ExitCode?: number; StartedAt?: string };
  NetworkSettings?: { Ports?: Record<string, { HostIp: string; HostPort: string }[] | null>; Networks?: Record<string, unknown> };
  Mounts?: { Type?: string; Source?: string; Name?: string; Destination?: string; RW?: boolean }[];
}
