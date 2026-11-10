// The person's yes before a dangerous container or anything that can't be undone (ADR-007): the server asks them
// itself, through MCP elicitation, in their language, and the answer never passes through the model. A client that
// can't ask gets a refusal, unless the server was started trusting it to ask before every call (DOCKER_MCP_CONFIRM=client).
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import type { Config } from "./config.js";
import { type Ask, MESSAGES, type Messages } from "./messages.js";

export interface Confirmation {
  /** What the person is asked, from the messages in their language: (m) => m.removeVolume("db-data"). */
  ask: (messages: Messages) => Ask;
  /** What would be done, in English, for the model when it isn't: "removing the volume db-data". */
  action: string;
}

/** How long a question waits for the person: they read it, think, maybe look something up. Well below Node's
 * timer limit (2^31 - 1 ms), beyond which a timeout fires at once; the SDK's default is 60 seconds. */
export const CONFIRM_TIMEOUT_MS = 60 * 60 * 1000;
/** The wait in use; tests shorten it. */
export const confirmWait = { ms: CONFIRM_TIMEOUT_MS };

export class NotConfirmed extends Error {}

const waited = (ms: number) => (ms >= 60_000 ? `${Math.round(ms / 60_000)} minutes` : `${Math.round(ms / 1000)} seconds`);

/** Resolves when the person said yes (or the client is trusted to have asked); throws NotConfirmed otherwise. */
export async function confirm(server: McpServer, config: Pick<Config, "confirm" | "language">, { ask, action }: Confirmation): Promise<void> {
  const canAsk = Boolean(server.server.getClientCapabilities()?.elicitation);
  if (!canAsk) {
    if (config.confirm === "client") return;
    throw new NotConfirmed(
      `This app can't ask the person to confirm (it doesn't support MCP elicitation), so ${action} was refused and nothing was changed. Tell them; if their app already asks them before each call to this tool, they can start docker-mcp with DOCKER_MCP_CONFIRM=client.`,
    );
  }
  const messages = MESSAGES[config.language];
  const { question, details } = ask(messages);
  let answer;
  try {
    answer = await server.server.elicitInput(
      {
        mode: "form",
        message: [question, ...details.map((line) => `- ${line}`)].join("\n"),
        requestedSchema: {
          type: "object",
          properties: { confirm: { type: "boolean", title: messages.field.title, description: messages.field.description, default: false } },
          required: ["confirm"],
        },
      },
      { timeout: confirmWait.ms },
    );
  } catch (error) {
    if (error instanceof McpError && error.code === ErrorCode.RequestTimeout)
      throw new NotConfirmed(`The question to the person expired after ${waited(confirmWait.ms)} without an answer, so ${action} wasn't done and nothing was changed. If they still want it, ask again.`);
    throw new NotConfirmed(`The person couldn't be asked (${error instanceof Error ? error.message : String(error)}), so ${action} was refused and nothing was changed.`);
  }
  if (answer.action === "accept" && answer.content?.confirm === true) return;
  throw new NotConfirmed(`The person said no, so ${action} wasn't done and nothing was changed. Don't try again unless they ask for it.`);
}
