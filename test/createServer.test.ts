import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../src/createServer.js";

async function connect() {
  const server = createServer();
  const client = new Client({ name: "test", version: "0.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return client;
}

describe("createServer", () => {
  it("sends its instructions", async () => {
    const client = await connect();
    assert.match(client.getInstructions() ?? "", /read-only/);
  });

  it("lists server_info as read-only", async () => {
    const { tools } = await (await connect()).listTools();
    const tool = tools.find((t) => t.name === "server_info");
    assert.ok(tool);
    assert.equal(tool.annotations?.readOnlyHint, true);
  });

  it("has no check_requirements when it needs nothing installed apart", async () => {
    const { tools } = await (await connect()).listTools();
    assert.equal(tools.some((t) => t.name === "check_requirements"), false);
  });

  it("returns its name, version and data folder", async () => {
    const result = await (await connect()).callTool({ name: "server_info", arguments: {} });
    const info = result.structuredContent as Record<string, unknown>;
    assert.equal(info.name, "@falkenslab/mcp-server-template");
    assert.equal(typeof info.dataDir, "string");
  });
});
