# ADR-006: Labs run under a policy, as their own Compose projects

## Decision

A lab is a folder in the labs folder (`DOCKER_MCP_LABS_DIR`, default `<data>/labs`) with a compose file and, optionally, `lab.json` with its check (`{ "check": { "service", "command" } }`, passed when it exits 0). Before starting one, its compose file is checked: no `privileged`, `cap_add`, `devices`, `security_opt`, host or shared `network_mode`, `pid`, `ipc` or `userns_mode`, no bind mounts outside the lab's folder, never the Docker socket, build contexts inside the folder, and only the allowed images when a list is set. A lab that breaks it is refused with every problem, never changed silently. One that complies runs as the Compose project `docker-mcp-lab-<name>` with an override file, kept in the data folder, that adds CPU, memory and process limits, `no-new-privileges`, the `falkenslab.docker-mcp` label, and, without `DOCKER_MCP_ALLOW_INTERNET`, every network of the lab internal.

## Motivation

Practices with students need a hard line that doesn't depend on the agent's judgement: the policy is code, the override is applied by the server, and the label lets lab mode see and touch only its own containers. Compose projects make starting, resetting and removing a whole practice one call.

## Consequences

- Without internet, the host can't reach a lab's published ports either: checks run inside, with `lab_exec` or the lab's check.
- A practice that needs what the policy refuses is a full-mode task, said so in the refusal.
- Labs work in full mode too, under the same policy: they're practices whatever the mode.
