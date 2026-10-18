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

  it("takes one snapshot of the running containers' usage", async () => {
    docker = fakeDocker([[["stats"], { stdout: '{"BlockIO":"0B / 0B","CPUPerc":"12.00%","Container":"web","ID":"a1","MemPerc":"1.00%","MemUsage":"80MiB / 7.68GiB","Name":"web","NetIO":"1kB / 2kB","PIDs":"4"}\n' }]]);
    const result = await (await connect()).callTool({ name: "container_stats", arguments: {} });
    const [stats] = (result.structuredContent as { containers: { name: string; cpu: string; memoryUsage: string; processes: number }[] }).containers;
    assert.deepEqual([stats?.name, stats?.cpu, stats?.memoryUsage, stats?.processes], ["web", "12.00%", "80MiB", 4]);
    assert.deepEqual(docker.calls[0]?.args, ["stats", "--no-stream", "--format", "{{json .}}"]);
  });

  it("in lab mode, measures only the labs' containers", async () => {
    docker = fakeDocker([[["ps"], { stdout: "a1\nb2\n" }]]);
    const client = await connect(testConfig({ DOCKER_MCP_MODE: "lab" }));
    await client.callTool({ name: "container_stats", arguments: {} });
    assert.deepEqual(docker.calls[0]?.args, ["ps", "-q", "--filter", "label=falkenslab.docker-mcp"]);
    assert.deepEqual(docker.calls[1]?.args.slice(-2), ["a1", "b2"]);
  });

  it("in lab mode, with no lab running, measures nothing", async () => {
    docker = fakeDocker();
    const result = await (await connect(testConfig({ DOCKER_MCP_MODE: "lab" }))).callTool({ name: "container_stats", arguments: {} });
    assert.deepEqual((result.structuredContent as { containers: unknown[] }).containers, []);
    assert.ok(!docker.calls.some((call) => call.args[0] === "stats"));
  });

  it("lists a container's processes", async () => {
    docker = fakeDocker([[["top"], { stdout: "PID                 USER                TIME                COMMAND\n1                   root                0:00                sleep 120\n" }]]);
    const result = await (await connect()).callTool({ name: "container_processes", arguments: { container: "web" } });
    assert.deepEqual(result.structuredContent, { columns: ["PID", "USER", "TIME", "COMMAND"], processes: [{ PID: "1", USER: "root", TIME: "0:00", COMMAND: "sleep 120" }] });
  });

  it("in lab mode, refuses the processes of a container that isn't a lab's", async () => {
    docker = fakeDocker([[["inspect"], { stdout: "<no value>\n" }]]);
    const result = await (await connect(testConfig({ DOCKER_MCP_MODE: "lab" }))).callTool({ name: "container_processes", arguments: { container: "other" } });
    assert.equal(result.isError, true);
    assert.match(text(result), /only the labs' containers/);
    assert.ok(!docker.calls.some((call) => call.args[0] === "top"));
  });

  it("explains a stopped container instead of Docker's raw error", async () => {
    docker = fakeDocker([[["top"], { code: 1, stderr: "Error response from daemon: container e01715b744a8 is not running" }]]);
    const result = await (await connect()).callTool({ name: "container_processes", arguments: { container: "web" } });
    assert.equal(result.isError, true);
    assert.match(text(result), /isn't running: start it first/);
  });

  it("explains Docker not running", async () => {
    docker = fakeDocker([[["ps"], { code: 1, stderr: "Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?" }]]);
    const result = await (await connect()).callTool({ name: "list_containers", arguments: {} });
    assert.equal(result.isError, true);
    assert.match(text(result), /installed but not running/);
  });
});
