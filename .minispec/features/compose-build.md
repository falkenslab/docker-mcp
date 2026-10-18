# Build a Compose project

Issue: [#3](https://github.com/falkenslab/docker-mcp/issues/3)

## Goal

Let an agent build a Compose project's images without starting it.

## Context

- `compose_up` builds what has a build (unless `build` is false), but always starts the services.
- Checking a Dockerfile change, or preparing images before a session, needs a build alone.

## Changes

- `compose_build` (compose area, full mode): `docker compose build` for all services or the ones named, with `noCache` and `pull` options; the same `folder` and `file` inputs as the other compose tools.
- Returns the exit code and the build's output trimmed for a model (`forModel`), with the same long timeout as `compose_up`.
- Annotations: `readOnlyHint: false`, `destructiveHint: false`, `idempotentHint: false`, `openWorldHint: true` (it may pull); the description says to confirm with the person first.
- Tests with the fake Docker; `modes.test.ts` updated.
- Docs: the tools reference regenerated.

## Acceptance

- Only in full mode; `npm run check` passes.
- A failed build returns its exit code and the end of its output, not a bare error.
- No container is created or started by the call.
- The `verify` skill passes (typecheck, lint, tests, bundle, `npm run check`).
