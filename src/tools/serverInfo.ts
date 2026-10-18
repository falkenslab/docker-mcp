import { z } from "zod";
import { dataDir } from "../dataDir.js";
import { REQUIREMENTS, checkRequirement } from "../requirements.js";
import { PACKAGE_NAME, PACKAGE_VERSION } from "../version.js";
import { reply } from "./reply.js";
import type { RegisterTool } from "./types.js";

// The example of the house style (ADR-003): a domain verb, a description for the model, both schemas,
// and readOnlyHint, which lets agent-kit's plan mode call it.
export const registerServerInfo: RegisterTool = (server) => {
  server.registerTool(
    "server_info",
    {
      title: "Server info",
      description: "Show this server's name, version and data folder, and, for a server that needs programs installed apart, whether they're there. Contains no secrets.",
      inputSchema: {},
      outputSchema: {
        name: z.string(),
        version: z.string(),
        dataDir: z.string().describe("Where it keeps its state and caches"),
        node: z.string(),
        requirements: z.array(z.object({ name: z.string(), ok: z.boolean(), problem: z.string().optional() })).optional(),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () => {
      const requirements = await Promise.all(REQUIREMENTS.map(checkRequirement));
      return reply({
        name: PACKAGE_NAME,
        version: PACKAGE_VERSION,
        dataDir: dataDir(),
        node: process.version,
        ...(requirements.length ? { requirements: requirements.map(({ name, ok, problem }) => ({ name, ok, ...(problem ? { problem } : {}) })) } : {}),
      });
    },
  );
};
