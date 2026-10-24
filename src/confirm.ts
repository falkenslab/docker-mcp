// The person's yes before a dangerous container or anything that can't be undone (ADR-007): the server asks them
// itself, through MCP elicitation, and the answer never passes through the model. A client that can't ask gets a
// refusal, unless the server was started trusting it to ask before every call (DOCKER_MCP_CONFIRM=client).
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Config } from "./config.js";

export interface Confirmation {
  /** What would be done, as a question to the person: "Remove the volume db-data and every file in it?" */
  question: string;
  /** What it means, in plain words, one line each: what goes, what the container gets. */
  details?: string[];
  /** The same, for the model when it's refused: "removing the volume db-data". */
  action: string;
}

export class NotConfirmed extends Error {}

/** Resolves when the person said yes (or the client is trusted to have asked); throws NotConfirmed otherwise. */
export async function confirm(server: McpServer, config: Pick<Config, "confirm">, { question, details = [], action }: Confirmation): Promise<void> {
  const canAsk = Boolean(server.server.getClientCapabilities()?.elicitation);
  if (!canAsk) {
    if (config.confirm === "client") return;
    throw new NotConfirmed(
      `This app can't ask the person to confirm (it doesn't support MCP elicitation), so ${action} was refused and nothing was changed. Tell them; if their app already asks them before each call to this tool, they can start docker-mcp with DOCKER_MCP_CONFIRM=client.`,
    );
  }
  const message = [question, ...details.map((line) => `- ${line}`)].join("\n");
  let answer;
  try {
    answer = await server.server.elicitInput({
      mode: "form",
      message,
      requestedSchema: {
        type: "object",
        properties: { confirm: { type: "boolean", title: "Yes, go ahead", description: "Leave it unchecked, or decline, to keep everything as it is", default: false } },
        required: ["confirm"],
      },
    });
  } catch (error) {
    throw new NotConfirmed(`The person couldn't be asked (${error instanceof Error ? error.message : String(error)}), so ${action} was refused and nothing was changed.`);
  }
  if (answer.action === "accept" && answer.content?.confirm === true) return;
  throw new NotConfirmed(`The person said no, so ${action} wasn't done and nothing was changed. Don't try again unless they ask for it.`);
}
