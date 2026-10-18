import { z } from "zod";
import { REQUIREMENTS, checkRequirement } from "../requirements.js";
import { reply } from "./reply.js";
import type { RegisterTool } from "./types.js";

// Registered only when the server has requirements (index.ts): a server that needs nothing has no such tool.
export const registerCheckRequirements: RegisterTool = (server) => {
  server.registerTool(
    "check_requirements",
    {
      title: "Check the programs this server needs",
      description:
        "Check the programs this server needs installed apart on the person's computer: whether each is there, its version, and, when one is missing or too old, how to install it on this system. Never installs anything: tell the person what to do.",
      inputSchema: {},
      outputSchema: {
        ok: z.boolean().describe("Every requirement is there"),
        requirements: z.array(
          z.object({ name: z.string(), program: z.string(), installed: z.boolean(), version: z.string().optional(), ok: z.boolean(), problem: z.string().optional(), install: z.string().optional() }),
        ),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () => {
      const requirements = await Promise.all(REQUIREMENTS.map(checkRequirement));
      return reply({ ok: requirements.every((r) => r.ok), requirements });
    },
  );
};
