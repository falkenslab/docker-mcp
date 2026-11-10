import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { LANGUAGES, MESSAGES, languageFrom } from "../src/messages.js";

describe("the person's language", () => {
  it("comes from the locale: LC_ALL, then LC_MESSAGES, then LANG", () => {
    assert.equal(languageFrom({ LANG: "es_ES.UTF-8" }), "es");
    assert.equal(languageFrom({ LANG: "en_US.UTF-8", LC_MESSAGES: "es_ES.UTF-8" }), "es");
    assert.equal(languageFrom({ LANG: "es_ES.UTF-8", LC_ALL: "en_GB.UTF-8" }), "en");
    assert.equal(languageFrom({ LANG: "es" }), "es");
  });

  it("is English without a locale, with C or POSIX, or with one it doesn't speak", () => {
    for (const env of [{}, { LANG: "C" }, { LANG: "POSIX" }, { LANG: "fr_FR.UTF-8" }, { LANG: "${user_config.language}" }]) assert.equal(languageFrom(env), "en", JSON.stringify(env));
  });

  it("has every question in every language", () => {
    const keys = Object.keys(MESSAGES.en).sort();
    for (const language of LANGUAGES) assert.deepEqual(Object.keys(MESSAGES[language]).sort(), keys, language);
  });

  it("names every dangerous option in Spanish, with no English left", () => {
    const kinds = ["privileged", "host-network", "host-pid", "host-ipc", "capabilities", "devices", "docker-socket", "host-root", "home"] as const;
    const { details } = MESSAGES.es.runDangerous("alpine", kinds.map((kind) => ({ kind, value: "x" })));
    assert.equal(details.length, kinds.length);
    for (const line of details) assert.doesNotMatch(line ?? "", /\b(the|host's|container|folder)\b/, line);
  });

  it("says in Spanish what a prune would free", () => {
    const { question, details } = MESSAGES.es.prune("everything", false, true, [{ type: "Images", amount: "1.2GB" }, { type: "Local Volumes", amount: "300MB" }]);
    assert.match(question, /^Limpiar Docker: ¿borrar los contenedores parados.*volúmenes sin usar con sus datos\?$/);
    assert.deepEqual(details, ["Imágenes: se liberarían hasta 1.2GB", "Volúmenes: se liberarían hasta 300MB", "No se puede deshacer."]);
  });
});
