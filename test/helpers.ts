import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { type Config, loadConfig } from "../src/config.js";
import { createServer } from "../src/createServer.js";
import { type RunOptions, type RunResult, useRunner } from "../src/docker.js";

/** A configuration from made-up settings, as the server would read them. */
export const testConfig = (env: Record<string, string> = {}): Config => loadConfig({ ...env, CLAUDE_PLUGIN_DATA: env.CLAUDE_PLUGIN_DATA ?? "/tmp/docker-mcp-test" });

/** The server, connected in memory to a client. */
export async function connect(config: Config = testConfig()) {
  const server = createServer(config);
  const client = new Client({ name: "test", version: "0.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return client;
}

export interface Call {
  args: string[];
  options?: RunOptions;
}

/** A fake Docker: records every call and answers with the first matching reply (by the arguments' start). */
export function fakeDocker(replies: [string[], Partial<RunResult>][] = []) {
  const calls: Call[] = [];
  const restore = useRunner(async (args, options) => {
    calls.push({ args, ...(options ? { options } : {}) });
    const match = replies.find(([prefix]) => prefix.every((part, i) => args[i] === part));
    return { stdout: "", stderr: "", code: 0, ...(match?.[1] ?? {}) };
  });
  return { calls, restore: () => useRunner(restore) };
}
