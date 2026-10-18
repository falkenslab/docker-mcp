import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const manifest = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as { private?: boolean; publishConfig?: { access?: string } };

describe("package.json", () => {
  it("publishes the scoped package as public: npm makes it private, and paid, otherwise", () => {
    assert.equal(manifest.publishConfig?.access, "public");
  });

  it("isn't private, unlike the template it came from", () => {
    assert.equal(manifest.private, undefined);
  });
});
