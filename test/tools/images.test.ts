import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { connect, fakeDocker, testConfig } from "../helpers.js";

let docker: ReturnType<typeof fakeDocker>;
afterEach(() => docker?.restore());

const text = (result: unknown) => ((result as { content?: { text: string }[] }).content?.[0]?.text ?? "");

describe("image tools", () => {
  it("pushes an image to the registry its name points to", async () => {
    docker = fakeDocker([[["push"], { stdout: "1.0: digest: sha256:abc size: 1234\n" }]]);
    const result = await (await connect()).callTool({ name: "push_image", arguments: { image: "ghcr.io/owner/app:1.0" } });
    assert.equal((result.structuredContent as { registry: string }).registry, "ghcr.io");
    assert.deepEqual(docker.calls[0]?.args, ["push", "ghcr.io/owner/app:1.0"]);
  });

  it("without a login, tells the person what to run, and asks for no credentials", async () => {
    docker = fakeDocker([[["push"], { code: 1, stderr: "denied: requested access to the resource is denied" }]]);
    const client = await connect();
    const result = await client.callTool({ name: "push_image", arguments: { image: "ghcr.io/owner/app:1.0" } });
    assert.equal(result.isError, true);
    assert.match(text(result), /"docker login ghcr\.io" in their own terminal.*Nothing was pushed/);
    const tool = (await client.listTools()).tools.find((t) => t.name === "push_image");
    assert.deepEqual(Object.keys((tool?.inputSchema as { properties: object }).properties), ["image"]);
    assert.deepEqual(tool?.annotations, { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true });
  });

  it("exists only in full mode", async () => {
    for (const mode of ["read", "lab"]) {
      const tools = (await (await connect(testConfig({ DOCKER_MCP_MODE: mode }))).listTools()).tools.map((t) => t.name);
      assert.ok(!tools.includes("push_image"), mode);
    }
  });
});
