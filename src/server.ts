// The entry point and the bundle's (dist/server.mjs): arguments, stdio, shutdown.
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./createServer.js";
import { COMMAND, PACKAGE_VERSION } from "./version.js";

const USAGE = `Usage: ${COMMAND} [--help] [--version]

An MCP server over stdio: an MCP client (Claude Code, an agent built on agent-kit…) starts it.`;

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  // stdout is free here: the MCP session hasn't started.
  if (args.includes("--help")) return void process.stdout.write(`${USAGE}\n`);
  if (args.includes("--version")) return void process.stdout.write(`${PACKAGE_VERSION}\n`);

  const server = createServer();
  let closing = false;
  const shutdown = async () => {
    if (closing) return;
    closing = true;
    await server.close().catch(() => undefined);
    process.exit(0);
  };
  // The client ends the session by closing stdin or by a signal.
  process.stdin.on("close", shutdown);
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  await server.connect(new StdioServerTransport());
  // stdout is the MCP channel from here on: messages go to stderr.
  console.error(`${COMMAND} ${PACKAGE_VERSION} running on stdio`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
