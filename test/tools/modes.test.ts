import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { connect, testConfig } from "../helpers.js";

const names = async (env: Record<string, string>) => (await (await connect(testConfig(env))).listTools()).tools;

describe("modes and areas", () => {
  it("read mode has only tools that read", async () => {
    const tools = await names({ DOCKER_MCP_MODE: "read" });
    assert.ok(tools.length > 10);
    for (const tool of tools) assert.equal(tool.annotations?.readOnlyHint, true, tool.name);
    assert.ok(!tools.some((t) => ["run_container", "lab_up", "compose_build", "push_image"].includes(t.name)));
    assert.ok(tools.some((t) => t.name === "container_stats") && tools.some((t) => t.name === "container_processes"));
  });

  it("lab mode has the labs and no general writes", async () => {
    const tools = (await names({ DOCKER_MCP_MODE: "lab" })).map((t) => t.name);
    for (const name of ["lab_up", "lab_exec", "lab_check", "lab_reset", "lab_down", "list_containers", "container_stats", "container_processes"]) assert.ok(tools.includes(name), name);
    for (const name of ["run_container", "exec_in_container", "compose_up", "compose_build", "push_image", "prune", "remove_volume", "list_volumes"]) assert.ok(!tools.includes(name), name);
  });

  it("full mode has everything, destructive tools marked", async () => {
    const tools = await names({ DOCKER_MCP_MODE: "full" });
    for (const name of ["run_container", "exec_in_container", "compose_up", "compose_build", "push_image", "container_stats", "container_processes", "prune", "lab_up", "remove_image"]) assert.ok(tools.some((t) => t.name === name), name);
    for (const name of ["remove_container", "remove_image", "remove_volume", "prune", "compose_down", "lab_down"]) assert.equal(tools.find((t) => t.name === name)?.annotations?.destructiveHint, true, name);
  });

  it("areas narrow a mode, keeping the server's own tools", async () => {
    const tools = (await names({ DOCKER_MCP_MODE: "full", DOCKER_MCP_SCOPES: "containers" })).map((t) => t.name);
    assert.ok(tools.includes("run_container") && tools.includes("server_info") && tools.includes("check_requirements"));
    assert.ok(!tools.some((t) => /image|volume|network|compose|lab|prune|docker_info/.test(t)));
  });
});
