import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { loginCommand, needsLogin, registryOf } from "../src/registry.js";

describe("registries", () => {
  it("finds the registry an image points to", () => {
    assert.equal(registryOf("nginx:1.27"), "docker.io");
    assert.equal(registryOf("someone/app:1.0"), "docker.io");
    assert.equal(registryOf("ghcr.io/owner/app:1.0"), "ghcr.io");
    assert.equal(registryOf("localhost:5000/app"), "localhost:5000");
  });

  it("knows a refusal for want of a login", () => {
    assert.equal(needsLogin("denied: requested access to the resource is denied"), true);
    assert.equal(needsLogin("unauthorized: authentication required"), true);
    assert.equal(needsLogin("no basic auth credentials"), true);
    assert.equal(needsLogin("An image does not exist locally with the tag: app"), false);
  });

  it("says which login command the person runs", () => {
    assert.equal(loginCommand("docker.io"), "docker login");
    assert.equal(loginCommand("ghcr.io"), "docker login ghcr.io");
  });
});
