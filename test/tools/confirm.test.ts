import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { CONFIRM_TIMEOUT_MS, confirmWait } from "../../src/confirm.js";
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

  it("asks in Spanish when the app starts it in a Spanish locale", async () => {
    docker = fakeDocker();
    const asked: { message: string; title?: string }[] = [];
    const client = await connect(testConfig({ LANG: "es_ES.UTF-8" }), (params) => {
      const schema = (params as { requestedSchema?: { properties: { confirm: { title?: string } } } }).requestedSchema;
      asked.push({ message: params.message, title: schema?.properties.confirm.title });
      return yes();
    });
    await client.callTool({ name: "lab_down", arguments: { lab: "web" } });
    assert.match(asked[0]?.message ?? "", /^¿Parar el laboratorio web\?\n- Se borran sus contenedores/);
    assert.equal(asked[0]?.title, "Sí, adelante");
    const info = await client.callTool({ name: "server_info", arguments: {} });
    assert.equal((info.structuredContent as { language: string }).language, "es");
  });

  it("keeps what the model reads in English, whatever the person's language", async () => {
    docker = fakeDocker();
    const result = await (await connect(testConfig({ LANG: "es_ES.UTF-8" }), () => ({ action: "decline" }))).callTool({ name: "remove_volume", arguments: { volume: "db-data" } });
    assert.match(text(result), /The person said no, so removing the volume db-data wasn't done/);
  });

  it("waits for the person longer than the MCP SDK's own 60 seconds, well below Node's timer limit", () => {
    assert.ok(CONFIRM_TIMEOUT_MS > 60_000 && CONFIRM_TIMEOUT_MS < 2 ** 31 - 1);
  });

  it("waits for a slow answer within its time, and says when a question expired", async () => {
    const previous = confirmWait.ms;
    confirmWait.ms = 400;
    try {
      docker = fakeDocker();
      const late = (ms: number) => () => new Promise<ReturnType<typeof yes>>((resolve) => setTimeout(() => resolve(yes()), ms));
      const inTime = await (await connect(testConfig(), late(150))).callTool({ name: "remove_volume", arguments: { volume: "db-data" } });
      assert.notEqual(inTime.isError, true);
      assert.deepEqual(docker.calls[0]?.args, ["volume", "rm", "db-data"]);
      docker.restore();
      docker = fakeDocker();
      const expired = await (await connect(testConfig(), late(1500))).callTool({ name: "remove_volume", arguments: { volume: "db-data" } });
      assert.equal(expired.isError, true);
      assert.match(text(expired), /question to the person expired after 0 seconds without an answer, so removing the volume db-data wasn't done/);
      assert.doesNotMatch(text(expired), /couldn't be asked/);
      assert.equal(docker.calls.length, 0);
    } finally {
      confirmWait.ms = previous;
    }
  });

  it("refuses an unknown DOCKER_MCP_CONFIRM at startup", () => {
    assert.throws(() => testConfig({ DOCKER_MCP_CONFIRM: "model" }), /DOCKER_MCP_CONFIRM is "model": it takes server, client/);
  });
});
