/**
 * The server's usage rules, sent in the MCP `instructions` field so every client reads them.
 * Generic: no client, agent or institution is named here.
 */
export const INSTRUCTIONS = `- Each tool is a task in this server's domain: use the one that fits; its description says what it needs and what it returns.
- Tools annotated read-only only read. Any tool that changes something says so in its annotations and description; confirm with the person before calling one.
- server_info shows this server's version and configuration, useful when something fails.`;
