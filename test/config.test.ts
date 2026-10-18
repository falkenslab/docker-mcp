import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AREAS, ConfigError, loadConfig } from "../src/config.js";

describe("loadConfig", () => {
  it("defaults to full mode, every area and lab limits", () => {
    const config = loadConfig({});
    assert.equal(config.mode, "full");
    assert.deepEqual(config.areas, [...AREAS]);
    assert.equal(config.allowInternet, false);
    assert.equal(config.memory, "512m");
  });

  it("treats Codex's unexpanded placeholders as not set", () => {
    const config = loadConfig({ DOCKER_MCP_MODE: "${user_config.mode}", DOCKER_MCP_SCOPES: "${user_config.scopes}", DOCKER_MCP_ALLOW_INTERNET: "${user_config.allow_internet}" });
    assert.equal(config.mode, "full");
    assert.deepEqual(config.areas, [...AREAS]);
    assert.equal(config.allowInternet, false);
  });

  it("reads the mode, the areas and the lab settings", () => {
    const config = loadConfig({ DOCKER_MCP_MODE: "Lab", DOCKER_MCP_SCOPES: "labs, containers", DOCKER_MCP_ALLOW_INTERNET: "true", DOCKER_MCP_ALLOWED_IMAGES: "nginx, postgres" });
    assert.equal(config.mode, "lab");
    assert.deepEqual(config.areas, ["labs", "containers"]);
    assert.equal(config.allowInternet, true);
    assert.deepEqual(config.allowedImages, ["nginx", "postgres"]);
  });

  it("refuses an unknown mode or area, saying what's valid", () => {
    assert.throws(() => loadConfig({ DOCKER_MCP_MODE: "admin" }), (e: unknown) => e instanceof ConfigError && /read, lab, full/.test(e.message));
    assert.throws(() => loadConfig({ DOCKER_MCP_SCOPES: "containers,kubernetes" }), (e: unknown) => e instanceof ConfigError && /kubernetes/.test(e.message));
  });
});
