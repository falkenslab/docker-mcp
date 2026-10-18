import type { Config } from "../config.js";
import { registerCheckRequirements } from "./checkRequirements.js";
import { COMPOSE_TOOLS } from "./compose.js";
import { CONTAINER_TOOLS } from "./containers.js";
import { IMAGE_TOOLS } from "./images.js";
import { LAB_TOOLS } from "./labs.js";
import { RESOURCE_TOOLS } from "./resources.js";
import { registerServerInfo } from "./serverInfo.js";
import { SYSTEM_TOOLS } from "./system.js";
import { ALL_MODES, type ToolEntry } from "./types.js";

/** Every tool, in the order clients list them, with its area and the modes it exists in (ADR-005). */
export const TOOLS: ToolEntry[] = [
  { area: "server", modes: ALL_MODES, register: registerServerInfo },
  { area: "server", modes: ALL_MODES, register: registerCheckRequirements },
  ...SYSTEM_TOOLS,
  ...CONTAINER_TOOLS,
  ...IMAGE_TOOLS,
  ...RESOURCE_TOOLS,
  ...COMPOSE_TOOLS,
  ...LAB_TOOLS,
];

/** The tools this configuration offers: its mode's, in its areas. A tool outside them doesn't exist for the client. */
export function toolsFor(config: Config): ToolEntry[] {
  return TOOLS.filter((tool) => tool.modes.includes(config.mode) && (tool.area === "server" || config.areas.includes(tool.area)));
}
