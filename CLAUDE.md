# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`@falkenslab/mcp-server-template`: A Falken's Lab MCP server. An MCP server over stdio, bundled into one file and run with `npx`; agents built on agent-kit get it through its extension in [agent-kit-extensions](https://github.com/falkenslab/agent-kit-extensions). Read `.minispec/README.md` first: it says what to read for each task.

If this is still the template (`package.json` says `"private": true`), turn it into a server with `npm run init -- <name> "<description>"`, then rewrite `.minispec/core/project.md` and the README for it.

## Commands

- `npm install`, then `npm run build` writes `dist/server.mjs`, the whole server in one file (ADR-001).
- `npm run typecheck`, `npm run lint`, `npm test` (all tests), `npm test -- test/requirements.test.ts` (one file).
- `npm run check` starts the bundle and checks its `tools/list` strictly: every tool with a title, a description, both schemas and `readOnlyHint`.
- `npm run inspect` opens the MCP Inspector on the bundle.
- Docs: `cd docs && npm install`, `npm run tools` (the tools reference from the bundle; build the server first), `npm start` (English) or `npm run start:es`, `npm run build`.
- Releasing: bump the version, update `docs/content/releases.md` and its Spanish page, commit, tag `v<x.y.z>`, push; the owner runs `npm publish` (`prepublishOnly` runs every check). Then pin the new version in the extension's `.mcp.json` in agent-kit-extensions.

## How it fits

- A tool is a file in `src/tools/` registered in `src/tools/index.ts`; `serverInfo.ts` shows the house style. The domain's logic lives in its own modules under `src/`, not in tool files.
- A program the person installs apart goes in `REQUIREMENTS` (`src/requirements.ts`); then `check_requirements` appears, `server_info` reports it, and tools that need it start with `await needs("<program>")`. Copy the same requirements into the extension's `plugin.json` (`metadata["agent-kit"].requirements`).
- Settings are read with `setting("<VARIABLE>")` (`src/settings.ts`), never `process.env` directly: an extension's `${user_config.*}` reaches Codex unexpanded, and `setting()` treats it as not set.
- State and caches go in `dataDir()`.
- stdout is the MCP channel: log to stderr only.

## Skills

`.claude/skills/` has the workflows: `add-tool`, `verify`, `commit`, `update-docs`, `release` (only when the owner asks), `upgrade-deps`, and MiniSpec's `minispec-feature`, `minispec-bugfix`, `minispec-adr`, `minispec-implement` and `sync-issues`, which keep `.minispec/features/` and the GitHub issues together.

## Conventions

The full list is `.minispec/core/conventions.md`. In short: English everywhere (Spanish in the docs' `es` locale); Conventional Commits; domain tools with their annotations (ADR-003); one line per paragraph in Markdown, no `---` separators; nothing published to npm without the owner.
