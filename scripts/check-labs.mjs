// Checks, against the engine the Docker CLI points at (Docker, or Podman through its Docker-compatible socket),
// what labs rely on (ADR-006): the built server starts a throwaway lab in lab mode and this script looks at
// what the engine really did: the limits from inside the container, no new privileges, no internet, and that
// lab mode sees only the labs' containers. It cleans up after itself. Run after `npm run build`.
//   node scripts/check-labs.mjs
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const LAB = "policy-check";
const OUTSIDE = "docker-mcp-check-outside";
const docker = (...args) => execFileSync("docker", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const engine = (() => {
  try {
    const version = JSON.parse(docker("version", "--format", "{{json .Server}}"));
    const podman = (version.Components ?? []).some((c) => /podman/i.test(c.Name ?? ""));
    return `${podman ? "Podman" : "Docker"} ${version.Version ?? ""} (${version.Os ?? ""})`;
  } catch (error) {
    console.error(`The Docker CLI can't reach an engine: ${error.stderr ?? error.message}`);
    process.exit(1);
  }
})();
console.log(`Engine: ${engine}`);

const labsDir = mkdtempSync(path.join(tmpdir(), "docker-mcp-labs-"));
mkdirSync(path.join(labsDir, LAB));
writeFileSync(path.join(labsDir, LAB, "compose.yaml"), "services:\n  box:\n    image: alpine:3\n    command: [\"sleep\", \"600\"]\n");

const server = fileURLToPath(new URL("../dist/server.mjs", import.meta.url));
const env = { ...process.env, DOCKER_MCP_MODE: "lab", DOCKER_MCP_LABS_DIR: labsDir, DOCKER_MCP_CPUS: "0.5", DOCKER_MCP_MEMORY: "64m", DOCKER_MCP_PIDS: "32", DOCKER_MCP_CONFIRM: "client" };
delete env.DOCKER_MCP_ALLOW_INTERNET;
const client = new Client({ name: "check-labs", version: "0.0.0" });
await client.connect(new StdioClientTransport({ command: process.execPath, args: [server], env, stderr: "ignore" }));
const call = async (name, args) => {
  const result = await client.callTool({ name, arguments: args });
  if (result.isError) throw new Error(`${name}: ${result.content?.[0]?.text}`);
  return result.structuredContent;
};
const inside = async (command) => (await call("lab_exec", { lab: LAB, service: "box", command: ["sh", "-c", command], timeoutSeconds: 30 })).output.trim();

const results = [];
const check = async (what, test) => {
  try {
    const detail = await test();
    results.push({ what, ok: true, detail });
  } catch (error) {
    results.push({ what, ok: false, detail: error.message });
  }
};
const expect = (value, condition, wanted) => {
  if (!condition) throw new Error(`${value || "(nothing)"}, ${wanted} expected`);
  return value;
};

try {
  const up = await call("lab_up", { lab: LAB });
  const container = up.services[0]?.container;
  console.log(`Lab started: ${container}`);
  await check("CPU limit (0.5)", async () => {
    const max = await inside("cat /sys/fs/cgroup/cpu.max 2>/dev/null || echo missing");
    return expect(max, /^50000 100000$/.test(max), '"50000 100000" in cpu.max');
  });
  await check("Memory limit (64m)", async () => {
    const max = await inside("cat /sys/fs/cgroup/memory.max 2>/dev/null || cat /sys/fs/cgroup/memory/memory.limit_in_bytes");
    return expect(max, max === String(64 * 1024 * 1024), "67108864");
  });
  await check("Process limit (32)", async () => {
    const max = await inside("cat /sys/fs/cgroup/pids.max 2>/dev/null || echo missing");
    return expect(max, max === "32", "32");
  });
  await check("No new privileges", async () => {
    const line = await inside("grep NoNewPrivs /proc/self/status");
    return expect(line, /NoNewPrivs:\s*1/.test(line), "NoNewPrivs: 1");
  });
  await check("No internet", async () => {
    const out = await inside("wget -q -T 5 -O /dev/null http://1.1.1.1 2>/dev/null && echo reached || echo blocked");
    return expect(out, out.endsWith("blocked"), "blocked");
  });
  await check("Lab mode sees only the labs' containers", async () => {
    docker("run", "-d", "--rm", "--name", OUTSIDE, "alpine:3", "sleep", "120");
    const names = (await call("list_containers", {})).containers.map((c) => c.name);
    return expect(names.join(", "), names.includes(container) && !names.includes(OUTSIDE), `${container} and not ${OUTSIDE}`);
  });
  await check("A container that isn't a lab's is refused", async () => {
    const result = await client.callTool({ name: "container_logs", arguments: { container: OUTSIDE } });
    return expect(result.content?.[0]?.text?.slice(0, 60), result.isError === true, "a refusal");
  });
} catch (error) {
  results.push({ what: "Starting the lab", ok: false, detail: error.message });
} finally {
  await client.callTool({ name: "lab_down", arguments: { lab: LAB } }).catch(() => {});
  await client.close();
  try {
    docker("rm", "-f", OUTSIDE);
  } catch {
    // it wasn't started, or is gone already
  }
  rmSync(labsDir, { recursive: true, force: true });
}

for (const { what, ok, detail } of results) console.log(`${ok ? "ok  " : "FAIL"}  ${what}: ${detail}`);
const failed = results.filter((r) => !r.ok).length;
console.log(failed ? `${failed} of ${results.length} failed on ${engine}.` : `All ${results.length} hold on ${engine}.`);
process.exit(failed ? 1 : 0);
