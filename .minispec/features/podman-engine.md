# Podman as an alternative to Docker

Issue: [#5](https://github.com/falkenslab/docker-mcp/issues/5)

## Goal

Find out whether docker-mcp can work with Podman, and decide with the owner whether to support it.

## Context

- Some people, and some schools' Linux machines, use Podman instead of Docker; it's rootless by default.
- Every tool calls `docker` through `src/docker.ts` (`spawnDocker`), and `REQUIREMENTS` asks for Docker 24 or later.
- Podman's CLI is largely compatible, but not entirely: JSON shapes, the compose provider, labels and the socket may differ.
- Lab mode depends on labels and on internal networks (ADR-006); those must hold under Podman.

## Findings (from Podman's docs, 2026-10-18; no Podman on the machine to try)

What the server calls: `ps`, `inspect`, `logs`, `run`, `start/stop/restart/rm`, `exec`, `cp`, `top`, `stats --no-stream`, `images`, `image inspect`, `pull`, `build`, `tag`, `push`, `rmi`, `volume/network ls|inspect|create|rm`, `info`, `version`, `system df`, and `compose` (`--project-directory`, `-f`, `-p`, `ps --format json`, `up`, `down`, `exec -T`, `logs`, `build`), almost all with `--format '{{json .}}'`.

- **The JSON differs, so `podman` as the program breaks the parsers.** `podman ps` gives `Names` as an array and `Command` as an array, and `Created` changes type between versions; `podman stats --format json` is an array with other keys (`cpu_percent`, `mem_usage`, `netio`…), and `cpu_percent` can be `"--"`. `info`, `version` and `system df` have their own shapes. Every list and inspect tool would need a second parser.
- **Compose isn't Podman's.** `podman compose` runs an external provider: `docker-compose` first if installed, else `podman-compose` (`PODMAN_COMPOSE_PROVIDER` or `compose_providers` in `containers.conf` choose). With `docker-compose`, Compose behaves as today; with `podman-compose`, flags such as `--project-directory` and `ps --format json` need checking, and it prints a warning on every call.
- **Lab limits need cgroups v2.** Rootless Podman enforces `cpus`, `mem_limit` and `pids_limit` only on cgroups v2 with systemd, and only for the controllers delegated to the user (often just `memory` and `pids`); on v1 it ignores them silently. ADR-006's limits could then not hold, with no error.
- **Not confirmed:** internal networks (`internal: true`, no internet for labs) and `no-new-privileges` under rootless Podman, and its labels with `--filter label=`. They need a real Podman.
- **A cheaper path:** Podman serves a Docker-compatible API socket (`podman system service`, or Podman Desktop's Docker compatibility). The Docker CLI and `docker compose` pointed at it (`DOCKER_HOST=unix:///run/user/<uid>/podman/podman.sock`) produce Docker's own JSON, so the server would work unchanged; what would remain is documenting it and checking the lab policy (limits, internal networks) on that socket.

## Options for the owner

- **A. Document the socket path** (no code): "Podman works through its Docker-compatible socket, with the Docker CLI installed"; labs only where cgroups v2 delegates `cpu`, `memory` and `pids`. Needs one real check of the lab policy.
- **B. A `DOCKER_MCP_ENGINE=podman` setting**: a second parser for each list, inspect, stats and system tool, `podman-compose` differences, its own requirement and an ADR. Several days of work, and labs still depend on cgroups.
- **C. Not now**: close the issue explaining the socket path for whoever needs it.

## Changes

- Investigate first, with a real Podman: which tools work as they are with `podman` as the program, and what differs, area by area.
- Write the findings for the owner: what works, what needs changes, what can't work.
- Decide with the owner whether it's worth it, and in which modes.
- If yes: a setting (`DOCKER_MCP_ENGINE=podman`, read with `setting()`), its own requirement in `REQUIREMENTS` and the extension's `plugin.json`, the differences handled in the domain modules, and an ADR.

## Acceptance

- The owner has the findings and has decided.
- If supported: the tools that differ are tested with a fake Podman, lab mode's policy holds under it, the `verify` skill passes, and the docs say how to choose the engine in both languages.
- If not: the issue is closed saying why, and this note is deleted.
