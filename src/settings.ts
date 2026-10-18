// The server's settings: environment variables, which an extension's .mcp.json fills in from the person's
// options ("${user_config.city}"). A client without plugin settings (Codex) passes that placeholder as it is,
// so a whole unexpanded "${…}" counts as not set, and the default applies. Read every setting through here.

/** The setting's value, trimmed; undefined when it's missing, empty or an unexpanded placeholder. */
export function setting(name: string, env: NodeJS.ProcessEnv = process.env): string | undefined {
  const value = env[name]?.trim();
  return value && !/^\$\{[^}]*\}$/.test(value) ? value : undefined;
}
