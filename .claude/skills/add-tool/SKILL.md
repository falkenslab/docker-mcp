---
name: add-tool
description: Checklist for adding or changing a mcp-server-template tool - where the domain logic goes, how the tool file is written (name, schemas, annotations, description, reply), registering it, requirements, tests, the strict check and the docs to update. Use when adding a tool, or changing one's inputs, outputs or behavior.
---

# Adding a mcp-server-template tool

## 1. The domain's logic goes in its own module

A tool is a schema, a description, annotations and a call (`.minispec/core/architecture.md`). The work itself (an API client, a parser, a file format) lives in a module under `src/` with its own tests, never inside the tool file. A tool is a task the person would name, never a raw HTTP call or a shell (ADR-003).

## 2. Write the tool

Copy the shape of `src/tools/serverInfo.ts`: one file in `src/tools/`, exporting a `RegisterTool`.

- **Name**: snake_case verb and noun of the domain (`list_items`, `create_report`).
- **Title**: a few words for people.
- **Description**: written for the model: what it does in the domain's terms, what it takes (and which tool gives each id), what it returns and what to do with it. For writes, "confirm with the person first". For long lists, that it pages.
- **Schemas** with zod: every input `.describe()`d for an agent; an `outputSchema` matching what the handler returns. No nullable types and no unions of types: an optional field instead, which every client accepts.
- **Annotations**, always: `readOnlyHint: true` only when it changes nothing (agent-kit's plan mode calls those); for writes `readOnlyHint: false` plus `destructiveHint` and `idempotentHint`; `openWorldHint: true` when it talks to anything outside the machine.
- **Handler**: `async (input) => reply(await doTheWork(input))`. Long lists take `limit` and `offset` and return `more`.
- **A program installed apart** (Docker, ffmpeg…): add it to `REQUIREMENTS` in `src/requirements.ts` and start the handler with `await needs("<program>")` (ADR-004). Copy the requirement into the extension's `plugin.json` in agent-kit-extensions (`metadata["agent-kit"].requirements`).
- **Settings**: `setting("<VARIABLE>")` from `src/settings.ts`, never `process.env`. A required one that's missing (or arrived as an unexpanded `${user_config.*}`, as in Codex) makes the tool fail with what to set and how, never the server at startup.
- **State or caches**: under `dataDir()`. Logs: stderr only.

## 3. Register it

Add it to `TOOLS` in `src/tools/index.ts`, in the order clients should see it. `src/instructions.ts` changes only when agents need a usage rule the description can't carry.

## 4. Test

- `test/tools/<tool>.test.ts`: the tool through the in-memory client (as in `test/createServer.test.ts`), against a fake of whatever it talks to, made-up data only. Cover the main path, the main error (as the agent reads it) and the annotations.
- The domain module gets its own tests next to it, mirroring `src/`.
- Run the `verify` skill: `npm run check` fails on a tool without a title, a description, both schemas or `readOnlyHint`.

## 5. Docs

Run the `update-docs` skill: the regenerated tools reference (`npm run tools` in `docs/`), any page that explains the tool, in English and Spanish.

## 6. Finish

Commit with the `commit` skill (`feat(tools): …`). If an input or output changed in a way existing clients would notice, say so in the body.
