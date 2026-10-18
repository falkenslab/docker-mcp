// Volumes and networks: the same four tools each (list, inspect, create, remove).
import { z } from "zod";
import { docker, jsonLines } from "../docker.js";
import { reply } from "./reply.js";
import { ref, withDocker } from "./shared.js";
import { FULL, READ_AND_FULL, type ToolEntry } from "./types.js";

type Kind = "volume" | "network";

function tools(kind: Kind): ToolEntry[] {
  const area = kind === "volume" ? "volumes" : "networks";
  const name = ref(kind);
  const plural = `${kind}s`;
  return [
    {
      area,
      modes: READ_AND_FULL,
      register: (server) =>
        server.registerTool(
          `list_${plural}`,
          {
            title: `List ${plural}`,
            description: kind === "volume" ? "List Docker volumes: name, driver and where it lives." : "List Docker networks: id, name, driver and scope.",
            inputSchema: {},
            outputSchema: { [plural]: z.array(z.record(z.string(), z.string())) },
            annotations: { readOnlyHint: true, openWorldHint: false },
          },
          async () =>
            withDocker(async () => {
              const rows = jsonLines<Record<string, string>>(await docker([kind, "ls", "--format", "{{json .}}"]));
              return reply({ [plural]: rows });
            }),
        ),
    },
    {
      area,
      modes: READ_AND_FULL,
      register: (server) =>
        server.registerTool(
          `inspect_${kind}`,
          {
            title: `Inspect a ${kind}`,
            description: kind === "volume" ? "A volume's details: driver, mount point, labels and when it was created." : "A network's details: driver, subnet, whether it's internal, and the containers attached.",
            inputSchema: { [kind]: name },
            outputSchema: { details: z.record(z.string(), z.unknown()) },
            annotations: { readOnlyHint: true, openWorldHint: false },
          },
          async (input) =>
            withDocker(async () => {
              const [details] = JSON.parse(await docker([kind, "inspect", String(input[kind])])) as Record<string, unknown>[];
              return reply({ details: details ?? {} });
            }),
        ),
    },
    {
      area,
      modes: FULL,
      register: (server) =>
        server.registerTool(
          `create_${kind}`,
          {
            title: `Create a ${kind}`,
            description: kind === "volume" ? "Create a named volume, for data that outlives a container. Confirm with the person first." : "Create a network, internal if it shouldn't reach the outside. Confirm with the person first.",
            inputSchema: { name: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_.-]*$/), ...(kind === "network" ? { internal: z.boolean().default(false) } : {}) },
            outputSchema: { created: z.string() },
            annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
          },
          async (input) =>
            withDocker(async () => {
              const args = [kind, "create", ...(kind === "network" && input.internal ? ["--internal"] : []), String(input.name)];
              await docker(args);
              return reply({ created: String(input.name) });
            }),
        ),
    },
    {
      area,
      modes: FULL,
      register: (server) =>
        server.registerTool(
          `remove_${kind}`,
          {
            title: `Remove a ${kind}`,
            description: kind === "volume" ? "Remove a volume and every file in it. Can't be undone: confirm with the person first, naming it." : "Remove a network (no container may be attached). Confirm with the person first.",
            inputSchema: { [kind]: name },
            outputSchema: { removed: z.string() },
            annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
          },
          async (input) =>
            withDocker(async () => {
              await docker([kind, "rm", String(input[kind])]);
              return reply({ removed: String(input[kind]) });
            }),
        ),
    },
  ];
}

export const RESOURCE_TOOLS: ToolEntry[] = [...tools("volume"), ...tools("network")];
