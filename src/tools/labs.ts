// Labs: practices that run under lab mode's policy, in lab and full modes (ADR-006).
import { z } from "zod";
import { labCheck, labDown, labExec, labLogs, labReset, labStatus, labUp, listLabs } from "../labs.js";
import { reply } from "./reply.js";
import { withDocker } from "./shared.js";
import { ALL_MODES, LAB_AND_FULL, type ToolEntry } from "./types.js";

const lab = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/).describe("The lab's name, as list_labs gives it");
const service = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_.-]*$/).describe("One of the lab's services, as lab_status gives them");
const services = z.array(z.object({ service: z.string(), container: z.string(), state: z.string(), status: z.string().optional(), ports: z.string().optional() }));
const command = { exitCode: z.number().int(), output: z.string(), truncated: z.boolean() };

export const LAB_TOOLS: ToolEntry[] = [
  {
    area: "labs",
    modes: ALL_MODES,
    register: (server, { config }) =>
      server.registerTool(
        "list_labs",
        {
          title: "List the labs",
          description: `List the labs: practices in the labs folder (${config.labsDir}), each a folder with its compose.yaml and, optionally, a lab.json with the check that says whether it works.`,
          inputSchema: {},
          outputSchema: { labsDir: z.string(), labs: z.array(z.object({ name: z.string(), folder: z.string(), hasCheck: z.boolean() })) },
          annotations: { readOnlyHint: true, openWorldHint: false },
        },
        async () => reply({ labsDir: config.labsDir, labs: listLabs(config).map((l) => ({ name: l.name, folder: l.folder, hasCheck: Boolean(l.check) })) }),
      ),
  },
  {
    area: "labs",
    modes: ALL_MODES,
    register: (server, { config }) =>
      server.registerTool(
        "lab_status",
        {
          title: "A lab's status",
          description: "A lab's services and their containers' state (empty when it isn't running).",
          inputSchema: { lab },
          outputSchema: { lab: z.string(), services },
          annotations: { readOnlyHint: true, openWorldHint: false },
        },
        async ({ lab: name }) => withDocker(async () => reply({ lab: name, services: await labStatus(config, name) })),
      ),
  },
  {
    area: "labs",
    modes: ALL_MODES,
    register: (server, { config }) =>
      server.registerTool(
        "lab_logs",
        {
          title: "A lab's logs",
          description: "The last log lines of a lab's services (or one), 200 per service by default.",
          inputSchema: { lab, service: service.optional(), tail: z.number().int().min(1).max(5000).default(200) },
          outputSchema: { output: z.string(), truncated: z.boolean() },
          annotations: { readOnlyHint: true, openWorldHint: false },
        },
        async ({ lab: name, service: s, tail }) => withDocker(async () => reply(await labLogs(config, name, s, tail))),
      ),
  },
  {
    area: "labs",
    modes: LAB_AND_FULL,
    register: (server, { config }) =>
      server.registerTool(
        "lab_up",
        {
          title: "Start a lab",
          description: `Start a lab under lab mode's policy: no privileged services, no host mounts but the lab's own folder, never the Docker socket, limits of ${config.cpus} CPU and ${config.memory} per service, ${config.allowInternet ? "with" : "without"} internet${config.allowInternet ? "" : " (so the host can't reach its ports either: check it from inside with lab_exec)"}${config.allowedImages.length ? `, only the images ${config.allowedImages.join(", ")}` : ""}. A lab that breaks the policy is refused with the reason. Confirm with the person first, saying what it will run (its services and images).`,
          inputSchema: { lab },
          outputSchema: { lab: z.string(), services },
          annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
        },
        async ({ lab: name }) => withDocker(async () => reply({ lab: name, services: await labUp(config, name) })),
      ),
  },
  {
    area: "labs",
    modes: LAB_AND_FULL,
    register: (server, { config }) =>
      server.registerTool(
        "lab_exec",
        {
          title: "Run a command in a lab",
          description: "Run a command in one of a running lab's services, returning its exit code and output. The command is a list; for a shell line, [\"sh\", \"-c\", \"…\"]. Can change the lab: confirm with the person first unless it only reads.",
          inputSchema: { lab, service, command: z.array(z.string()).min(1), timeoutSeconds: z.number().int().min(1).max(3600).default(60) },
          outputSchema: command,
          annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
        },
        async ({ lab: name, service: s, command: cmd, timeoutSeconds }) => withDocker(async () => reply(await labExec(config, name, s, cmd, timeoutSeconds))),
      ),
  },
  {
    area: "labs",
    modes: LAB_AND_FULL,
    register: (server, { config }) =>
      server.registerTool(
        "lab_check",
        {
          title: "Check a lab",
          description: "Run the lab's check (its lab.json) in its running service: passed when it exits 0, with its output to explain what failed. For a teacher, whether a statement or a solution works; for a student, whether their practice does. Runs inside the lab: confirm with the person first.",
          inputSchema: { lab },
          outputSchema: { passed: z.boolean(), ...command },
          annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
        },
        async ({ lab: name }) => withDocker(async () => reply(await labCheck(config, name))),
      ),
  },
  {
    area: "labs",
    modes: LAB_AND_FULL,
    register: (server, { config }) =>
      server.registerTool(
        "lab_reset",
        {
          title: "Reset a lab",
          description: "Back to a clean start: the lab's containers, networks and volumes are removed (what was done inside them is lost; the files in its folder stay) and it starts again. Confirm with the person first.",
          inputSchema: { lab },
          outputSchema: { lab: z.string(), services },
          annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true },
        },
        async ({ lab: name }) => withDocker(async () => reply({ lab: name, services: await labReset(config, name) })),
      ),
  },
  {
    area: "labs",
    modes: LAB_AND_FULL,
    register: (server, { config }) =>
      server.registerTool(
        "lab_down",
        {
          title: "Stop a lab",
          description: "Stop a lab and remove its containers, networks and volumes (what was done inside them is lost; the files in its folder stay). Confirm with the person first.",
          inputSchema: { lab },
          outputSchema: { stopped: z.string() },
          annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
        },
        async ({ lab: name }) =>
          withDocker(async () => {
            await labDown(config, name);
            return reply({ stopped: name });
          }),
      ),
  },
];
