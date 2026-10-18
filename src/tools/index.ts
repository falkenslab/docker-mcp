import { REQUIREMENTS } from "../requirements.js";
import { registerCheckRequirements } from "./checkRequirements.js";
import { registerServerInfo } from "./serverInfo.js";
import type { RegisterTool } from "./types.js";

/** Every tool, in the order clients list them. A new tool is a file in this folder, added here. */
export const TOOLS: RegisterTool[] = [registerServerInfo, ...(REQUIREMENTS.length ? [registerCheckRequirements] : [])];
