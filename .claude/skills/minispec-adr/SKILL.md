---
name: minispec-adr
description: Record an architectural decision as a new ADR under .minispec/decisions/ from the ADR template. Use when an important, hard-to-reverse decision is made.
---

# MiniSpec: new ADR

Record a permanent decision under `.minispec/decisions/`.

## Steps

1. Read `.minispec/README.md` for the standard.
2. Read the template `.minispec/templates/adr.md`.
3. Decide where it belongs: a decision every Falken's Lab MCP server shares (how they're built, run or shipped) belongs in the Falken's Lab MCP server template too: say so. Here go this server's own.
4. Determine the next sequential number: list `.minispec/decisions/`, find the highest `ADR-NNN-*` and add 1. Numbers are never reused or renumbered.
5. Create `.minispec/decisions/ADR-NNN-<slug>.md` with `<slug>` in kebab-case.
6. Fill the three sections:
   - **Decision**: what was decided, in one or two sentences.
   - **Motivation**: why; what problem it solves, what was rejected. When the owner decided it, say so with the date.
   - **Consequences**: what it makes easier, what it costs, what now has to be done a certain way.

## Rules

- One page. No more. Document the *why*, not the implementation. English.
- ADRs are permanent: never delete or renumber one.
- If it replaces an earlier decision, update or point the earlier ADR to it.
