import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Area, Config, Mode } from "../config.js";

/** What every tool gets: the configuration it was started with. */
export interface ToolContext {
  config: Config;
}

/** A tool's registration: each file exports one or more of these, listed in index.ts. */
export type RegisterTool = (server: McpServer, context: ToolContext) => void;

/** A tool with where it belongs: its area (or the server's own) and the modes it exists in (ADR-005). */
export interface ToolEntry {
  register: RegisterTool;
  area: Area | "server";
  modes: readonly Mode[];
}

export const ALL_MODES: readonly Mode[] = ["read", "lab", "full"];
export const FULL: readonly Mode[] = ["full"];
export const LAB_AND_FULL: readonly Mode[] = ["lab", "full"];
export const READ_AND_FULL: readonly Mode[] = ["read", "full"];
