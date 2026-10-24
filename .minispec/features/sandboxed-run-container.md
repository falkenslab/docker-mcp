# A one-off container cut off from the computer

Issue: [#6](https://github.com/falkenslab/docker-mcp/issues/6)

## Goal

Let `run_container` start a single container limited and isolated, so an agent can try software in it without building a lab.

## Context

- The docker-lab extension (falkenslab/agent-extensions) uses Docker as a sandbox: the agent runs and tries a tool, a service or someone's code without touching the computer.
- Today only labs can be isolated: `lab_up` applies ADR-006's policy (limits, `no-new-privileges`, internal networks, the `falkenslab.docker-mcp` label). `run_container` (full mode) takes `network` as any network to join, but no limits, no read-only root, no `no-new-privileges` and no labels, so the extension routes every try through a lab, even a one-service one.
- A foreground run (`detach: false`) waits as long as the container runs; nothing stops one that never ends.

## Changes

- `run_container` inputs, all optional: `cpus`, `memory`, `pids` (`--cpus`, `--memory`, `--pids-limit`); `readOnly` (`--read-only`); `noNewPrivileges` (`--security-opt no-new-privileges`); `labels` (`--label key=value`); `timeoutSeconds` for a foreground run, stopping and removing the container when it runs out.
- `network: "none"` documented in its description as the way to cut a container off.
- `list_containers` takes a `label` filter (`--filter label=…`), so an agent finds and cleans up only what it marked.
- The description says how to ask for an isolated try: limits, `network: "none"`, read-only, no new privileges, a label.
- Optional, to decide while implementing: the lab settings (`DOCKER_MCP_CPUS`, `DOCKER_MCP_MEMORY`, `DOCKER_MCP_PIDS`) as defaults for those limits.
- Tests with the fake Docker for the arguments, the timeout and the filter; the tools reference regenerated.

## Acceptance

- `run_container` with limits, `network: "none"`, `readOnly`, `noNewPrivileges` and a label passes each as its Docker option, as a list of arguments.
- A foreground run longer than `timeoutSeconds` is stopped and removed, and the reply says so.
- `list_containers` with a label lists only those containers.
- Dangerous options still need the person's yes; `npm run check` passes; the docs in both languages describe the isolated try.
- Once released, docker-lab's `try-in-a-lab` skill can offer it.
