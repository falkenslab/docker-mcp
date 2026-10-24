---
title: Modes and settings
sidebar_label: Modes and settings
---

# Modes and settings

docker-mcp reads its settings once, when it starts: as environment variables, or as the extension's options in an agent built on agent-kit or in Claude Code. Changing them means restarting it.

## Modes

The mode decides which tools exist. A tool outside the mode isn't offered to the agent at all, so it can't be used by mistake or talked into.

| Mode | What the agent can do |
| --- | --- |
| `read` | Only look: list and inspect containers, images, volumes and networks, read logs, see what containers consume and run, Compose projects and labs' status, Docker's information and disk usage |
| `lab` | Only labs: start, use, check, reset and stop them, under the policy below; it sees only the labs' containers |
| `full` (default) | Everything Docker does. Before removing anything, and before a container with dangerous options, docker-mcp asks you itself |

Pushing an image to a registry uses the login you made yourself with `docker login`: the agent never asks for your password or token, and when there is no login it tells you what to run in your own terminal.

The dangerous options are: a privileged container, the host's network, processes or IPC, extra capabilities, devices, and mounting the Docker socket, the host's root folder or your home folder. With any of them, `run_container` asks you first.

### You confirm, not the agent

Before what can't be undone (removing a container, an image, a volume or a network, cleaning up with `prune`, stopping a Compose project with its volumes, stopping or resetting a lab) and before a container with dangerous options, docker-mcp asks you itself, through your app: what goes, or what the container would get, and a yes or no. Your answer goes to docker-mcp, not to the agent, so the agent can't answer for you. If you say no, nothing changes.

That needs an app that can show you the question (MCP elicitation): Claude Code and Codex can. In an app that can't, these tools refuse. If your app already asks you before every call to a tool, start docker-mcp with `DOCKER_MCP_CONFIRM=client` and they run as they did.

### Trying something isolated

In full mode, `run_container` can also start a single container cut off from your computer, for the agent to try a tool or someone's code without building a lab: no network (`network: "none"`), limits on CPU, memory and processes, a read-only root filesystem, no new privileges, and a label to find it and remove it later (`list_containers` filters by label). A run that waits for its result (`detach: false`) is stopped and removed when its time runs out (`timeoutSeconds`, 600 by default). Ask for it in your own words: "try this in an isolated container".

## Areas

`DOCKER_MCP_SCOPES` narrows a mode to some areas, comma-separated: `containers`, `images`, `volumes`, `networks`, `compose`, `system`, `labs`. For example, `containers,compose` in full mode keeps only those tools (and `server_info` and `check_requirements`, always there).

## Labs

A lab is a folder in the labs folder with a `compose.yaml` (or `compose.yml`, `docker-compose.yaml`) and, optionally, a `lab.json` with its check:

```json
{ "check": { "service": "web", "command": "curl -fs http://localhost/ | grep -q 'Hello'" } }
```

The check runs inside the service and passes when it exits 0: for a teacher, whether a statement or a solution works; for a student, whether their practice does.

Before a lab starts, its compose file is checked. It's refused, with every problem listed, if a service is privileged, adds capabilities or devices, uses the host's network, processes or IPC, mounts anything outside the lab's folder or the Docker socket, builds from outside the folder, or uses an image outside the allowed ones. A lab that complies runs as its own Compose project with limits on CPU, memory and processes, no new privileges, and, unless you allow it, no internet: its services reach each other and nothing else, and your computer can't reach their ports either, so checks run inside.

Labs exist in full mode too, under the same policy.

## Settings

| Variable | Extension option | What it does | Default |
| --- | --- | --- | --- |
| `DOCKER_MCP_MODE` | `mode` | `read`, `lab` or `full` | `full` |
| `DOCKER_MCP_SCOPES` | `scopes` | The areas, comma-separated | all |
| `DOCKER_MCP_LABS_DIR` | `labs_dir` | The labs folder | `labs` in its data folder |
| `DOCKER_MCP_ALLOW_INTERNET` | `allow_internet` | Labs reach the internet (and publish ports) | no |
| `DOCKER_MCP_CPUS` | `cpus` | CPUs per lab service | `1` |
| `DOCKER_MCP_MEMORY` | `memory` | Memory per lab service | `512m` |
| `DOCKER_MCP_PIDS` | | Processes per lab service | `256` |
| `DOCKER_MCP_ALLOWED_IMAGES` | `allowed_images` | Images a lab may use, comma-separated | any |
| `DOCKER_MCP_CONFIRM` | | Who confirms removals and dangerous options: `server` (docker-mcp asks you) or `client` (your app asks before every call) | `server` |

A value the app leaves as an unexpanded `${user_config…}` (Codex has no plugin settings) counts as not set.
