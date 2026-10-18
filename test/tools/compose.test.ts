import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { connect, fakeDocker } from "../helpers.js";

let docker: ReturnType<typeof fakeDocker>;
afterEach(() => docker?.restore());

describe("compose tools", () => {
  it("builds some services with their options, starting nothing", async () => {
    docker = fakeDocker([[["compose"], { stdout: "#5 DONE 0.4s\n", stderr: " Image app-web Built\n" }]]);
    const result = await (await connect()).callTool({ name: "compose_build", arguments: { folder: "/work/app", services: ["web"], noCache: true, pull: true } });
    assert.deepEqual(docker.calls[0]?.args, ["compose", "--project-directory", "/work/app", "build", "--no-cache", "--pull", "web"]);
    assert.equal(docker.calls.length, 1);
    assert.deepEqual(result.structuredContent, { exitCode: 0, output: "#5 DONE 0.4s\n Image app-web Built\n", truncated: false });
  });

  it("returns a failed build's exit code and output, not a bare error", async () => {
    docker = fakeDocker([[["compose"], { code: 1, stderr: 'failed to solve: process "/bin/sh -c exit 3" did not complete successfully: exit code: 3\n' }]]);
    const result = await (await connect()).callTool({ name: "compose_build", arguments: { folder: "/work/app" } });
    assert.notEqual(result.isError, true);
    const { exitCode, output } = result.structuredContent as { exitCode: number; output: string };
    assert.equal(exitCode, 1);
    assert.match(output, /exit code: 3/);
  });
});
