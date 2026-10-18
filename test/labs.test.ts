import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, it } from "node:test";
import { labCheck, labUp, listLabs } from "../src/labs.js";
import { fakeDocker, testConfig } from "./helpers.js";

let docker: ReturnType<typeof fakeDocker>;
afterEach(() => docker?.restore());

function labs(files: Record<string, Record<string, string>>) {
  const root = mkdtempSync(path.join(tmpdir(), "docker-mcp-labs-"));
  for (const [lab, content] of Object.entries(files)) {
    mkdirSync(path.join(root, lab));
    for (const [file, text] of Object.entries(content)) writeFileSync(path.join(root, lab, file), text);
  }
  return testConfig({ DOCKER_MCP_LABS_DIR: root, CLAUDE_PLUGIN_DATA: path.join(root, ".data") });
}

describe("labs", () => {
  it("lists the folders with a compose file, and their checks", () => {
    const config = labs({ web: { "compose.yaml": "services:\n  web:\n    image: nginx\n", "lab.json": '{ "check": { "service": "web", "command": "curl -fs localhost" } }' }, notes: { "README.md": "no compose" } });
    const found = listLabs(config);
    assert.deepEqual(found.map((l) => l.name), ["web"]);
    assert.deepEqual(found[0]?.check, { service: "web", command: ["sh", "-c", "curl -fs localhost"] });
  });

  it("starts a lab as its own project with the policy's override", async () => {
    const config = labs({ web: { "compose.yaml": "services:\n  web:\n    image: nginx\n" } });
    docker = fakeDocker([[["compose", "-p", "docker-mcp-lab-web", "ps"], { stdout: '{"Service":"web","Name":"docker-mcp-lab-web-web-1","State":"running"}\n' }]]);
    const services = await labUp(config, "web");
    assert.deepEqual(services, [{ service: "web", container: "docker-mcp-lab-web-web-1", state: "running" }]);
    const up = docker.calls[0]!.args;
    assert.deepEqual(up.slice(0, 3), ["compose", "-p", "docker-mcp-lab-web"]);
    const override = up[up.indexOf("-f", up.indexOf("-f") + 1) + 1]!;
    assert.match(readFileSync(override, "utf8"), /internal: true/);
    assert.ok(!override.startsWith(path.join(config.labsDir, "web")), "the override stays out of the lab's folder");
  });

  it("refuses a lab that breaks the policy, without calling Docker", async () => {
    const config = labs({ evil: { "compose.yaml": "services:\n  x:\n    image: alpine\n    privileged: true\n" } });
    docker = fakeDocker();
    await assert.rejects(labUp(config, "evil"), /breaks lab mode's policy[\s\S]*privileged/);
    assert.equal(docker.calls.length, 0);
  });

  it("checks a lab with its command, passed on exit 0", async () => {
    const config = labs({ web: { "compose.yaml": "services:\n  web:\n    image: nginx\n", "lab.json": '{ "check": { "service": "web", "command": ["curl", "-fs", "localhost"] } }' } });
    docker = fakeDocker([[["compose", "-p", "docker-mcp-lab-web", "exec"], { code: 7, stderr: "curl: (7) Failed to connect" }]]);
    const result = await labCheck(config, "web");
    assert.equal(result.passed, false);
    assert.match(result.output, /Failed to connect/);
    assert.deepEqual(docker.calls[0]?.args.slice(-5), ["-T", "web", "curl", "-fs", "localhost"]);
  });
});
