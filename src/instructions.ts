import type { Config } from "./config.js";

/**
 * The server's usage rules, sent in the MCP `instructions` field so every client reads them.
 * Generic: no client, agent or institution is named here.
 */
const COMMON = `This server works Docker on the person's computer through its command line.
- Each tool is a Docker task: use the one that fits; its description says what it needs and what it returns.
- Tools annotated read-only only read. Any tool that changes something says so in its annotations and description; confirm with the person before calling one, and name what a destructive one removes.
- Removals, prune and dangerous container options are confirmed by the person themselves: the server asks them before acting. If it says they said no, don't try again unless they ask; if it says the app can't ask, tell them why.
- When a tool says Docker is missing or not running, tell the person how to install or start it, as the tool says; never try to install it.
- server_info shows this server's version, mode and areas; check_requirements whether Docker is there.`;

const MODE: Record<Config["mode"], string> = {
  read: "- This server is in read mode: it only reads. When the person asks to change something, say it's configured to only read; they change the mode in their app's settings for this server.",
  lab: "- This server is in lab mode: only labs (practices in the labs folder, under a safety policy) can run, and only the labs' containers are visible. For anything else, say it's configured for labs only; they change the mode in their app's settings for this server.",
  full: "- This server is in full mode: everything Docker does. A container with dangerous options (privileged, the host's network, the Docker socket…) needs the person's explicit yes, which the server asks them for.",
};

export function instructionsFor(config: Config): string {
  return `${COMMON}\n${MODE[config.mode]}`;
}
