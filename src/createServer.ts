import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { type Config, loadConfig } from "./config.js";
import { instructionsFor } from "./instructions.js";
import { toolsFor } from "./tools/index.js";
import { PACKAGE_NAME, PACKAGE_VERSION } from "./version.js";

/** The MCP server with its instructions and its mode's tools, not yet connected to a transport. */
export function createServer(config: Config = loadConfig()): McpServer {
  const server = new McpServer({ name: PACKAGE_NAME, version: PACKAGE_VERSION }, { instructions: instructionsFor(config) });
  for (const tool of toolsFor(config)) tool.register(server, { config });
  return server;
}
