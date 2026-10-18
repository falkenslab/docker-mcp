---
name: update-docs
description: Keep mcp-server-template's documentation in step with the code - the documentation site in docs/ (English and Spanish, with the tools reference generated from the bundle), the README, the MiniSpec core and decisions, CLAUDE.md and the server's instructions. Use after any change to a tool, a setting, a requirement, the instructions or the build, before committing it. A change is not done until its documentation is.
---

# Keep mcp-server-template's docs up to date

Documentation here is for three readers: people installing and using the server (the site in `docs/`, English in `docs/content/` and Spanish in `docs/i18n/es/docusaurus-plugin-content-docs/current/`, in plain terms, not for developers; the README is a front door with a quick start), people developing it, and future sessions working on it (`.minispec/`, `CLAUDE.md`). Every page changes in both languages in the same commit. Code that changes what a client sees, can configure or must do, and isn't documented, is unfinished work.

## 1. Find what changed

```
git status --short
git diff --stat
git diff -- src/tools/index.ts src/instructions.ts src/requirements.ts
```

Counts as visible: a tool added, removed or renamed; a tool's inputs, outputs, annotations or behavior; a setting or its default; a requirement; the instructions; an error an agent reads; the build; a fix that changes what a client could rely on.

## 2. Update the owners

| Change | Where |
| --- | --- |
| A tool added, removed or changed | Its description (that's what agents read), then `npm run tools` in `docs/` after `npm run build` at the root: it regenerates the reference in both languages; any page that explains it, and tool counts (`grep -rn "tools" docs/content docs/i18n README.md`) |
| A setting | The site's page for settings, the README's quick start if it's needed to start, `server_info` |
| A requirement | `getting-started` in both languages, and the extension's `plugin.json` in agent-kit-extensions |
| Usage rules for agents | `src/instructions.ts` (and its test) |
| A new piece of the server (a module, a client) | `.minispec/core/architecture.md` |
| Build, stack, commands | `.minispec/core/stack.md`, `CLAUDE.md`'s commands |
| A rule for all future work | `.minispec/core/conventions.md` or `principles.md` |
| A decision that's hard to reverse | A new ADR with the `minispec-adr` skill (or an existing one updated) |
| Work done from a card | The card deleted (`minispec-implement`), its permanent lessons promoted first |

Search too: `grep -rn "<tool or setting>" README.md CLAUDE.md .minispec docs/content docs/i18n src/instructions.ts` finds every place that names it, so none keeps describing the old behavior.

## 3. Write it

- English; Spanish only in the site's `es` locale. One paragraph or list item per line, no horizontal rules between sections.
- Change the existing explanation rather than appending a note that contradicts it.
- MiniSpec limits: 100 lines per document, `project.md` ≤ 50, `principles.md` ≤ 20.
- README and site follow the `falkenslab-docs` skill when it's available.
- No credentials, ever.

Check the site builds in both languages (`npm run build` in `docs/`): it fails on broken links and anchors.

## 4. Commit with the code

The documentation goes in the same commit as the change (or right next to it, `docs: …`). Report which documents you changed, or why none needed to.
