import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { connect, testConfig } from "./helpers.js";

describe("createServer", () => {
  it("sends its instructions, with its mode", async () => {
    const instructions = (await connect(testConfig({ DOCKER_MCP_MODE: "lab" }))).getInstructions() ?? "";
    assert.match(instructions, /read-only/);
    assert.match(instructions, /lab mode/);
  });

  it("lists server_info and check_requirements as read-only", async () => {
    const { tools } = await (await connect()).listTools();
    for (const name of ["server_info", "check_requirements"]) assert.equal(tools.find((t) => t.name === name)?.annotations?.readOnlyHint, true, name);
  });

  it("returns its name, version, mode and areas", async () => {
    const result = await (await connect(testConfig({ DOCKER_MCP_MODE: "read", DOCKER_MCP_SCOPES: "containers,images" }))).callTool({ name: "server_info", arguments: {} });
    const info = result.structuredContent as Record<string, unknown>;
    assert.equal(info.name, "@falkenslab/docker-mcp");
    assert.equal(info.mode, "read");
    assert.deepEqual(info.areas, ["containers", "images"]);
  });
});
