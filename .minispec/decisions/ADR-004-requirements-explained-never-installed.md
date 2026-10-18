# ADR-004: Programs installed apart are checked and explained, never installed

## Decision

When the server needs a program the person installs apart (Docker, ffmpeg), it's a `Requirement` in `src/requirements.ts`, in the shape of agent-kit's `metadata["agent-kit"].requirements`: its name, its program on the `PATH`, how to read its version and the minimum, how to install it on Windows, macOS and Linux, and what it's for. The server then offers a read-only `check_requirements`, `server_info` reports it, and every tool that needs it starts with `await needs("<program>")`, which fails with what's missing, what it's for and how to install it. The server never installs anything. A server that needs nothing leaves `REQUIREMENTS` empty and has none of this.

## Motivation

agent-kit installs no programs and runs no installers; the person decides what goes on their computer. An error that says what to install, and how, beats a raw `spawn ENOENT`.

## Consequences

- The extension that runs the server copies the same requirements into its `plugin.json`, so agent-kit warns at install and the catalog shows them.
- What doesn't need the program keeps working when it's missing.
