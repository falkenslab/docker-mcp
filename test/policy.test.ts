import assert from "node:assert/strict";
import { homedir } from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { parse } from "yaml";
import { bindSource, dangers, labOverride, labProblems } from "../src/policy.js";

const lab = path.resolve("/labs/web");
const limits = { allowInternet: false, cpus: "1", memory: "512m", pids: 256 };

describe("policy", () => {
  it("tells a bind mount from a named volume", () => {
    assert.equal(bindSource("data:/var/lib/data"), undefined);
    assert.equal(bindSource("/srv/app:/app:ro"), "/srv/app");
    assert.equal(bindSource("./src:/app"), "./src");
    assert.equal(bindSource("C:\\work:/app"), "C:\\work");
  });

  it("finds a run's dangerous options", () => {
    assert.deepEqual(dangers({ volumes: ["data:/data"], network: "bridge" }), []);
    const found = dangers({ privileged: true, network: "host", volumes: ["/var/run/docker.sock:/var/run/docker.sock", "/:/host", `${homedir()}:/me`], capAdd: ["SYS_ADMIN"] });
    assert.equal(found.length, 6);
    assert.match(found.join(" "), /privileged.*network.*capabilities.*Docker socket.*root.*home/s);
  });

  it("accepts a lab within the policy", () => {
    const compose = parse("services:\n  web:\n    image: nginx:1.27\n    volumes: [ './site:/usr/share/nginx/html:ro', 'cache:/cache' ]\n  app:\n    build: ./app\n");
    assert.deepEqual(labProblems(compose, lab, { allowedImages: [] }), []);
  });

  it("refuses what breaks it, saying where", () => {
    const compose = parse(
      "services:\n  bad:\n    image: alpine\n    privileged: true\n    network_mode: host\n    cap_add: [NET_ADMIN]\n    volumes: [ '/var/run/docker.sock:/var/run/docker.sock', '../other:/other' ]\n    build: { context: ../outside }\n",
    );
    const problems = labProblems(compose, lab, { allowedImages: ["nginx"] });
    for (const expected of [/privileged/, /cap_add/, /network_mode: host/, /Docker socket/, /\.\.\/other is outside/, /build context \.\.\/outside/, /alpine isn't among the allowed/]) assert.ok(problems.some((p) => expected.test(p)), `${expected}: ${problems.join(" | ")}`);
  });

  it("adds limits, its label and an internal network", () => {
    type Override = { services: { web: { mem_limit: string; security_opt: string[]; labels: Record<string, string> } }; networks?: unknown };
    const override = parse(labOverride(parse("services:\n  web:\n    image: nginx\nnetworks:\n  back: {}\n"), "web", limits)) as Override;
    assert.equal(override.services.web.mem_limit, "512m");
    assert.deepEqual(override.services.web.security_opt, ["no-new-privileges:true"]);
    assert.equal(override.services.web.labels["falkenslab.docker-mcp"], "web");
    assert.deepEqual(override.networks, { default: { internal: true }, back: { internal: true } });
    assert.equal((parse(labOverride(parse("services:\n  web:\n    image: nginx\n"), "web", { ...limits, allowInternet: true })) as Record<string, unknown>).networks, undefined);
  });
});
