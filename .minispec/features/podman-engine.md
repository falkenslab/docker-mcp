# Podman as an alternative to Docker

Issue: [#5](https://github.com/falkenslab/docker-mcp/issues/5)

## Goal

Find out whether docker-mcp can work with Podman, and decide with the owner whether to support it.

## Context

- Some people, and some schools' Linux machines, use Podman instead of Docker; it's rootless by default.
- Every tool calls `docker` through `src/docker.ts` (`spawnDocker`), and `REQUIREMENTS` asks for Docker 24 or later.
- Podman's CLI is largely compatible, but not entirely: JSON shapes, the compose provider, labels and the socket may differ.
- Lab mode depends on labels and on internal networks (ADR-006); those must hold under Podman.

## Changes

- Investigate first, with a real Podman: which tools work as they are with `podman` as the program, and what differs, area by area.
- Write the findings for the owner: what works, what needs changes, what can't work.
- Decide with the owner whether it's worth it, and in which modes.
- If yes: a setting (`DOCKER_MCP_ENGINE=podman`, read with `setting()`), its own requirement in `REQUIREMENTS` and the extension's `plugin.json`, the differences handled in the domain modules, and an ADR.

## Acceptance

- The owner has the findings and has decided.
- If supported: the tools that differ are tested with a fake Podman, lab mode's policy holds under it, the `verify` skill passes, and the docs say how to choose the engine in both languages.
- If not: the issue is closed saying why, and this note is deleted.
