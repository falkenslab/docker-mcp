# Conventions

- Everything in English: code, comments, `README.md`, `CLAUDE.md`, `.minispec/`, tool names and descriptions, the server's `instructions`, commit messages (ADR-002).
- Commits follow Conventional Commits, one logical change each.
- Relative imports inside `src/` use explicit `.js` extensions (NodeNext).
- One tool per file in `src/tools/`, registered from `src/tools/index.ts`. Tool names are snake_case verbs and nouns of the domain (ADR-003).
- Every tool has a `title`, a description written for the model (what it does, what it takes, what to do with the result), an `inputSchema`, an `outputSchema` and its annotations: `readOnlyHint` always, `destructiveHint` and `idempotentHint` when it writes. `npm run check` fails otherwise.
- Tools return `structuredContent` matching the `outputSchema`, plus the same data as JSON text (`reply()`). Schemas avoid nullable types: an optional field instead.
- A tool that can return a long list takes `limit` and `offset` and returns `more`; its description says so.
- stdout belongs to the MCP protocol: logs and diagnostics go to stderr only (ESLint enforces it in `src/`).
- Settings are environment variables read only through `setting()` (`src/settings.ts`), which treats an unexpanded `${…}` placeholder as not set: Codex runs extensions without their options. A required setting that's missing makes the tools that need it say so and how to set it; the server never fails at startup for it.
- State and caches live in `dataDir()` (`CLAUDE_PLUGIN_DATA` in an extension), never next to the code.
- A program the person installs apart is a `Requirement` in `src/requirements.ts`; a tool that needs it starts with `await needs("<program>")` (ADR-004).
- No credentials anywhere in the repo: code, tests, fixtures, docs.
- Tests mirror `src/` under `test/`, with a fake for whatever the server talks to; a bug fixed gets a regression test.
- Documentation Markdown: one line per paragraph and list item, no horizontal rules between sections.
- Nothing is published to npm without the owner: they run `npm publish` with their one-time code.
