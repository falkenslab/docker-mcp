import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { RequirementMissing, atLeast, checkRequirement, howToInstall, needs, type Requirement } from "../src/requirements.js";

const missing: Requirement = {
  name: "Nothing",
  program: "no-such-program-falkenslab",
  version: { args: ["--version"], min: "1.0.0" },
  install: { windows: "winget install Nothing", macos: "brew install nothing", linux: "sudo apt install nothing", url: "https://example.org" },
  for: "testing",
};
// node itself is always there: a requirement that holds.
const node: Requirement = { name: "Node.js", program: "node", version: { args: ["--version"], min: "20.0.0" }, install: { url: "https://nodejs.org" } };

describe("requirements", () => {
  it("compares versions", () => {
    assert.equal(atLeast("24.0.7", "24.0.0"), true);
    assert.equal(atLeast("23.9", "24.0.0"), false);
    assert.equal(atLeast("24", "24.0.0"), true);
  });

  it("says how to install a program on each system", () => {
    assert.equal(howToInstall(missing, "windows"), "run winget install Nothing, or see https://example.org");
    assert.equal(howToInstall(node, "linux"), "see https://nodejs.org");
  });

  it("finds a program that's there, with its version", async () => {
    const status = await checkRequirement(node);
    assert.equal(status.ok, true);
    assert.match(status.version ?? "", /^\d+\.\d+/);
  });

  it("explains a missing program instead of failing raw", async () => {
    const status = await checkRequirement(missing);
    assert.equal(status.installed, false);
    assert.equal(status.ok, false);
    await assert.rejects(needs("no-such-program-falkenslab", [missing]), (error: unknown) => {
      assert.ok(error instanceof RequirementMissing);
      assert.match(error.message, /Nothing is needed for testing: not installed.*To install it, run .*nothing was changed/);
      return true;
    });
  });
});
