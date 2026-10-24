import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { connect, fakeDocker, testConfig } from "../helpers.js";

let docker: ReturnType<typeof fakeDocker>;
afterEach(() => docker?.restore());

const text = (result: unknown) => ((result as { content?: { text: string }[] }).content?.[0]?.text ?? "");
const yes = () => ({ action: "accept" as const, content: { confirm: true } });

describe("removals ask the person (ADR-007)", () => {
  it("asks before removing a volume, naming it and that its data goes", async () => {
    docker = fakeDocker();
    const asked: string[] = [];
    const result = await (await connect(testConfig(), (params) => (asked.push(params.message), yes()))).callTool({ name: "remove_volume", arguments: { volume: "db-data" } });
    assert.notEqual(result.isError, true);
    assert.match(asked[0] ?? "", /db-data.*Every file in it goes/s);
    assert.deepEqual(docker.calls[0]?.args, ["volume", "rm", "db-data"]);
  });

  it("removes nothing when the person says no", async () => {
    docker = fakeDocker();
    const result = await (await connect(testConfig(), () => ({ action: "cancel" }))).callTool({ name: "remove_volume", arguments: { volume: "db-data" } });
    assert.equal(result.isError, true);
    assert.match(text(result), /said no, so removing the volume db-data wasn't done/);
    assert.equal(docker.calls.length, 0);
  });

  it("refuses in an app that can't ask, saying why and what the person can do", async () => {
    docker = fakeDocker();
    for (const [name, args] of [
      ["remove_container", { container: "web" }],
      ["remove_image", { image: "nginx" }],
      ["remove_network", { network: "back" }],
      ["prune", { what: "everything" }],
    ] as const) {
      const result = await (await connect()).callTool({ name, arguments: args });
      assert.equal(result.isError, true, name);
      assert.match(text(result), /can't ask the person.*DOCKER_MCP_CONFIRM=client/s, name);
    }
    assert.ok(!docker.calls.some((call) => ["rm", "rmi"].includes(call.args[0] ?? "") || call.args.includes("prune")));
  });

  it("trusts the app to have asked with DOCKER_MCP_CONFIRM=client", async () => {
    docker = fakeDocker();
    const result = await (await connect(testConfig({ DOCKER_MCP_CONFIRM: "client" }))).callTool({ name: "remove_volume", arguments: { volume: "db-data" } });
    assert.notEqual(result.isError, true);
    assert.deepEqual(docker.calls[0]?.args, ["volume", "rm", "db-data"]);
  });

  it("tells the person how much a prune would free", async () => {
    docker = fakeDocker([[["system", "df"], { stdout: '{"Type":"Images","Reclaimable":"1.2GB (40%)"}\n{"Type":"Local Volumes","Reclaimable":"300MB (10%)"}\n{"Type":"Build Cache","Reclaimable":"80MB"}\n' }]]);
    const asked: string[] = [];
    await (await connect(testConfig(), (params) => (asked.push(params.message), yes()))).callTool({ name: "prune", arguments: { what: "everything" } });
    assert.match(asked[0] ?? "", /Images: up to 1\.2GB could be freed.*Build Cache: up to 80MB/s);
    assert.doesNotMatch(asked[0] ?? "", /Local Volumes/);
    assert.ok(docker.calls.some((call) => call.args.join(" ") === "system prune -f"));
  });

  it("asks before compose_down only when its volumes go", async () => {
    docker = fakeDocker();
    let asked = 0;
    const client = await connect(testConfig(), () => (asked++, yes()));
    await client.callTool({ name: "compose_down", arguments: { folder: "/work/app" } });
    assert.equal(asked, 0);
    await client.callTool({ name: "compose_down", arguments: { folder: "/work/app", volumes: true } });
    assert.equal(asked, 1);
  });

  it("asks before stopping or resetting a lab, in lab mode too", async () => {
    docker = fakeDocker();
    const result = await (await connect(testConfig({ DOCKER_MCP_MODE: "lab" }))).callTool({ name: "lab_down", arguments: { lab: "web" } });
    assert.equal(result.isError, true);
    assert.match(text(result), /stopping the lab web was refused/);
    assert.equal(docker.calls.length, 0);
  });

  it("refuses an unknown DOCKER_MCP_CONFIRM at startup", () => {
    assert.throws(() => testConfig({ DOCKER_MCP_CONFIRM: "model" }), /DOCKER_MCP_CONFIRM is "model": it takes server, client/);
  });
});
