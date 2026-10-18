import assert from "node:assert/strict";
import { homedir } from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { dataDir } from "../src/dataDir.js";
import { setting } from "../src/settings.js";

describe("settings", () => {
  it("reads a setting, trimmed", () => {
    assert.equal(setting("CITY", { CITY: " Santa Cruz " }), "Santa Cruz");
  });

  it("treats a missing or empty setting as not set", () => {
    assert.equal(setting("CITY", {}), undefined);
    assert.equal(setting("CITY", { CITY: "  " }), undefined);
  });

  it("treats an unexpanded placeholder as not set, as Codex passes it", () => {
    assert.equal(setting("CITY", { CITY: "${user_config.city}" }), undefined);
    assert.equal(setting("CITY", { CITY: " ${CLAUDE_PLUGIN_DATA} " }), undefined);
  });

  it("keeps a value that only contains a placeholder", () => {
    assert.equal(setting("URL", { URL: "https://example.org/${path}" }), "https://example.org/${path}");
  });

  it("falls back to the home folder when the data folder is a placeholder", () => {
    assert.equal(path.dirname(dataDir({ CLAUDE_PLUGIN_DATA: "${CLAUDE_PLUGIN_DATA}" })), homedir());
  });
});
