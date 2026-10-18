# Container resource usage

Issue: [#1](https://github.com/falkenslab/docker-mcp/issues/1)

## Goal

Let an agent see what containers consume and which processes run inside them.

## Context

- The containers area lists, inspects and reads logs, but can't answer "why is my machine slow?" or "what is this container doing?".
- `docker stats` and `docker top` give that; both only read.
- Lab mode already limits what it sees: `list_containers` filters by the `falkenslab.docker-mcp` label, and `ownedInLab()` refuses other containers.

## Changes

- `container_stats` (containers area, every mode, `readOnlyHint`): one snapshot (`docker stats --no-stream`), never a stream; CPU, memory (used, limit, percent), network and block I/O and processes per container; all running ones, or the ones named. In lab mode, only the labs' containers (filtered by `LABEL`).
- `container_processes` (containers area, every mode, `readOnlyHint`): `docker top` of one container, as rows; `ownedInLab()` first.
- Parsing Docker's output in its own function, not in the tool's body.
- Tests with the fake Docker; `modes.test.ts` updated.
- Docs: the tools reference regenerated (`npm run tools`), the modes page in both languages if it lists tools.

## Acceptance

- In every mode both tools are listed, with `readOnlyHint: true`; `npm run check` passes.
- In lab mode, `container_stats` returns only labs' containers and `container_processes` refuses any other container.
- A stopped container gets a clear message, not Docker's raw error.
- The `verify` skill passes (typecheck, lint, tests, bundle, `npm run check`).
