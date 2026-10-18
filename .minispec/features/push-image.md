# Push an image

Issue: [#2](https://github.com/falkenslab/docker-mcp/issues/2)

## Goal

Let an agent publish an image to a registry, using the login the person made themselves.

## Context

- `build_image` and `tag_image` exist (full mode, images area); pushing doesn't.
- `docker login` is out of scope on purpose (`core/project.md`): credentials are the person's and never pass through the model.
- Pushing publishes outside the machine, so it needs the person's yes.

## Changes

- `push_image` (images area, full mode only): `docker push <image>`, its output trimmed for a model.
- Annotations: `readOnlyHint: false`, `destructiveHint: false`, `idempotentHint: true`, `openWorldHint: true`; the description says to confirm with the person first, naming the registry and tag.
- When Docker answers that authentication is required or access is denied, the error tells the person to run `docker login <registry>` in their own terminal, then try again. No login tool, no credentials in any input.
- Tests with the fake Docker: a push, and the not-logged-in answer; `modes.test.ts` updated.
- Docs: the tools reference regenerated, and a line in both languages on the login being the person's.

## Acceptance

- Only in full mode; `npm run check` passes.
- Not logged in, the reply names the registry and the `docker login` command, never a raw error.
- No input takes a password or a token.
- The `verify` skill passes (typecheck, lint, tests, bundle, `npm run check`).
