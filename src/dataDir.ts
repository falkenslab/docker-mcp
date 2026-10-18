// Where the server keeps its state and caches: the folder agent-kit or Claude Code gives an extension
// (CLAUDE_PLUGIN_DATA), else ~/.<command> when it runs on its own.
import { homedir } from "node:os";
import path from "node:path";
import { setting } from "./settings.js";
import { COMMAND } from "./version.js";

export function dataDir(env: NodeJS.ProcessEnv = process.env): string {
  return path.resolve(setting("CLAUDE_PLUGIN_DATA", env) ?? path.join(homedir(), `.${COMMAND}`));
}
