import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/** A tool's registration: each tool is a file that exports one of these, listed in index.ts. */
export type RegisterTool = (server: McpServer) => void;
