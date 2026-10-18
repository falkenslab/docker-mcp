import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { connect, fakeDocker, testConfig } from "../helpers.js";

let docker: ReturnType<typeof fakeDocker>;
afterEach(() => docker?.restore());

const text = (result: unknown) => ((result as { content?: { text: string }[] }).content?.[0]?.text ?? "");

describe("container tools", () => {
  it("lists containers from Docker's JSON lines", async () => {
    docker = fakeDocker([[["ps"], { stdout: '{"ID":"a1","Names":"web","Image":"nginx","State":"running","Status":"Up 2 minutes","Ports":"0.0.0.0:8080->80/tcp"}\n' }]]);
    const result = await (await connect()).callTool({ name: "list_containers", arguments: {} });
    assert.deepEqual((result.structuredContent as { containers: unknown[] }).containers, [{ id: "a1", name: "web", image: "nginx", state: "running", status: "Up 2 minutes", ports: "0.0.0.0:8080->80/tcp" }]);
    assert.deepEqual(docker.calls[0]?.args, ["ps", "-a", "--format", "{{json .}}"]);
  });

  it("in lab mode, lists only the labs' containers", async () => {
    docker = fakeDocker();
    await (await connect(testConfig({ DOCKER_MCP_MODE: "lab" }))).callTool({ name: "list_containers", arguments: {} });
    assert.ok(docker.calls[0]?.args.includes("label=falkenslab.docker-mcp"));
  });

  it("runs a container with its options as arguments, never a shell", async () => {
    docker = fakeDocker([[["run"], { stdout: "c0ffee\n" }]]);
    const result = await (await connect()).callTool({ name: "run_container", arguments: { image: "nginx:1.27", name: "web", ports: ["127.0.0.1:8080:80"], env: { A: "1; rm -rf /" }, command: ["nginx", "-g", "daemon off;"] } });
    assert.equal((result.structuredContent as { container: string }).container, "c0ffee");
    assert.deepEqual(docker.calls[0]?.args, ["run", "-d", "--name", "web", "-e", "A=1; rm -rf /", "-p", "127.0.0.1:8080:80", "nginx:1.27", "nginx", "-g", "daemon off;"]);
  });

  it("refuses dangerous options until the person confirms them", async () => {
    docker = fakeDocker();
    const client = await connect();
    const refused = await client.callTool({ name: "run_container", arguments: { image: "alpine", privileged: true, volumes: ["/var/run/docker.sock:/var/run/docker.sock"] } });
    assert.equal(refused.isError, true);
    assert.match(text(refused), /privileged.*Docker socket.*confirmedDangerous/s);
    assert.equal(docker.calls.length, 0);
    const confirmed = await client.callTool({ name: "run_container", arguments: { image: "alpine", privileged: true, confirmedDangerous: true } });
    assert.notEqual(confirmed.isError, true);
    assert.ok(docker.calls[0]?.args.includes("--privileged"));
  });

  it("explains Docker not running", async () => {
    docker = fakeDocker([[["ps"], { code: 1, stderr: "Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?" }]]);
    const result = await (await connect()).callTool({ name: "list_containers", arguments: {} });
    assert.equal(result.isError, true);
    assert.match(text(result), /installed but not running/);
  });
});
