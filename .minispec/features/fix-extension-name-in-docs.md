# The docs install an extension that doesn't exist

Issue: [#7](https://github.com/falkenslab/docker-mcp/issues/7)

## Problem

The README and "Getting started" (both languages) tell people to install `docker-mcp@falkenslab` from `falkenslab/agent-kit-extensions`: `my-agent extension add docker-mcp@falkenslab`, `claude plugin install docker-mcp@falkenslab`, `codex plugin add docker-mcp@falkenslab`. None of them works: there is no `docker-mcp` extension.

## Cause

On the extensions' side, two things changed after the docs were written:

- The extension is **`docker-lab`**: it uses Docker as a lab where the agent runs and tries software without touching the computer, and still runs `@falkenslab/docker-mcp` at a fixed version (`@0.1.0` in its `.mcp.json`).
- The marketplace repository is **`falkenslab/agent-extensions`**, renamed from `agent-kit-extensions` (GitHub redirects the old name), with its catalog at https://falkenslab.github.io/agent-extensions/.

## Solution

- Every install command and mention: `docker-lab@falkenslab`, and `falkenslab/agent-extensions` for the marketplace (`… marketplace add falkenslab/agent-extensions`).
- Where: `README.md`, `docs/content/getting-started.md` and its Spanish page, `CLAUDE.md`, `.minispec/core/project.md` and `glossary.md`, and the `add-tool`, `release` and `update-docs` skills (`grep -rn "agent-kit-extensions\|docker-mcp@falkenslab"` finds them all).
- Say once, where the extension is introduced, that `docker-lab` is the extension and `docker-mcp` the server it runs, so nobody looks for the old name.

## Verification

- `grep -rn "agent-kit-extensions\|docker-mcp@falkenslab"` outside `node_modules`, `build` and `dist` finds nothing.
- The docs site builds in both languages.
- `claude plugin marketplace add falkenslab/agent-extensions` lists `docker-lab`.
