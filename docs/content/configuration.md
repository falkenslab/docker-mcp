---
title: Configuration
sidebar_label: Configuration
---

# Configuration

docker-mcp is configured where your AI app starts it: a command, its arguments, and the [settings](modes.md#settings) as environment variables. You can write that with the app's command line or in its configuration file; both end up in the same place. This page shows both for Claude Code and Codex, with every setting.

## The settings

Every setting is optional; without any, docker-mcp runs in full mode with all areas. What each one means is in [Modes and settings](modes.md#settings).

| Variable | Values | Default |
| --- | --- | --- |
| `DOCKER_MCP_MODE` | `read`, `lab` or `full` | `full` |
| `DOCKER_MCP_SCOPES` | Areas, comma-separated: `containers`, `images`, `volumes`, `networks`, `compose`, `system`, `labs` | all |
| `DOCKER_MCP_LABS_DIR` | The labs folder, an absolute path | `labs` in its data folder |
| `DOCKER_MCP_ALLOW_INTERNET` | `true` or `false` | `false` |
| `DOCKER_MCP_CPUS` | CPUs per lab service, e.g. `1` or `0.5` | `1` |
| `DOCKER_MCP_MEMORY` | Memory per lab service, e.g. `512m` or `1g` | `512m` |
| `DOCKER_MCP_PIDS` | Processes per lab service | `256` |
| `DOCKER_MCP_ALLOWED_IMAGES` | Images a lab may use, comma-separated | any |
| `DOCKER_MCP_CONFIRM` | `server` (docker-mcp asks you before removals and dangerous options) or `client` (your app asks before every call) | `server` |

To run a fixed version instead of the latest, name it in the command: `npx -y @falkenslab/docker-mcp@0.1.0`.

## Claude Code

### With the command line

```bash
claude mcp add docker -- npx -y @falkenslab/docker-mcp
```

Each setting is an `-e` (or `--env`), before the name; `--` separates Claude Code's options from the server's command:

```bash
claude mcp add --scope project \
  -e DOCKER_MCP_MODE=lab \
  -e DOCKER_MCP_LABS_DIR=/home/me/labs \
  -e DOCKER_MCP_MEMORY=1g \
  docker -- npx -y @falkenslab/docker-mcp
```

`--scope` decides where it's saved:

| Scope | Where | For |
| --- | --- | --- |
| `local` (default) | `~/.claude.json`, under this project | You, in this project |
| `project` | `.mcp.json` at the project's root | Everyone who clones the project (commit the file) |
| `user` | `~/.claude.json` | You, in every project |

When the same name is in several scopes, `local` wins over `project`, and `project` over `user`; the entries aren't merged. To check or undo it: `claude mcp list`, `claude mcp get docker`, `claude mcp remove docker` (with `--scope` when it's in more than one). Inside a session, `/mcp` shows whether it's connected.

### With `.mcp.json`

`.mcp.json` at the project's root is the `project` scope written by hand: create it, or add `docker` to the servers already there. Every setting, with its default, except the labs folder and the images, which are examples:

```json
{
  "mcpServers": {
    "docker": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@falkenslab/docker-mcp"],
      "env": {
        "DOCKER_MCP_MODE": "full",
        "DOCKER_MCP_SCOPES": "containers,images,volumes,networks,compose,system,labs",
        "DOCKER_MCP_LABS_DIR": "/home/me/labs",
        "DOCKER_MCP_ALLOW_INTERNET": "false",
        "DOCKER_MCP_CPUS": "1",
        "DOCKER_MCP_MEMORY": "512m",
        "DOCKER_MCP_PIDS": "256",
        "DOCKER_MCP_ALLOWED_IMAGES": "nginx:alpine,postgres:17",
        "DOCKER_MCP_CONFIRM": "server"
      }
    }
  }
}
```

Keep only the settings you change. All values are strings, `true` and numbers included. On Windows, write paths with forward slashes (`C:/Users/me/labs`) or doubled backslashes. Claude Code asks you to approve a project's `.mcp.json` servers the first time it finds them.

Values can come from your environment, so each person keeps their own: `${VAR}` takes a variable, and `${VAR:-default}` a default when it isn't set. For example, `"DOCKER_MCP_LABS_DIR": "${LABS_DIR}"`, or `"DOCKER_MCP_MODE": "${DOCKER_MODE:-read}"`.

An entry can also carry `"timeout"`, in milliseconds, for how long a tool call may take before Claude Code gives up: `compose_up`, `build_image` and `compose_build` can run for minutes.

The same entry, without the outer `mcpServers`, works on the command line: `claude mcp add-json docker '{"type":"stdio","command":"npx","args":["-y","@falkenslab/docker-mcp"],"env":{"DOCKER_MCP_MODE":"read"}}'`.

## Codex

Codex keeps its servers in `config.toml`, not in `.mcp.json`: `~/.codex/config.toml` for you, or `.codex/config.toml` in a project, which Codex reads only for projects you trust.

### With the command line

```bash
codex mcp add docker -- npx -y @falkenslab/docker-mcp
```

Each setting is an `--env`:

```bash
codex mcp add docker \
  --env DOCKER_MCP_MODE=lab \
  --env DOCKER_MCP_LABS_DIR=/home/me/labs \
  -- npx -y @falkenslab/docker-mcp
```

It's saved in `~/.codex/config.toml`. To check or undo it: `codex mcp list`, `codex mcp get docker`, `codex mcp remove docker`.

### With `config.toml`

Every setting, with its default, except the labs folder and the images, which are examples:

```toml
[mcp_servers.docker]
command = "npx"
args = ["-y", "@falkenslab/docker-mcp"]
startup_timeout_sec = 30
tool_timeout_sec = 1800

[mcp_servers.docker.env]
DOCKER_MCP_MODE = "full"
DOCKER_MCP_SCOPES = "containers,images,volumes,networks,compose,system,labs"
DOCKER_MCP_LABS_DIR = "/home/me/labs"
DOCKER_MCP_ALLOW_INTERNET = "false"
DOCKER_MCP_CPUS = "1"
DOCKER_MCP_MEMORY = "512m"
DOCKER_MCP_PIDS = "256"
DOCKER_MCP_ALLOWED_IMAGES = "nginx:alpine,postgres:17"
DOCKER_MCP_CONFIRM = "server"
```

Keep only what you change. Codex's own keys for the entry:

- `startup_timeout_sec` (default `10`): how long it waits for the server to start. The first run downloads the package with `npx`, so give it `30`.
- `tool_timeout_sec` (default `60`): how long a tool call may take. Builds, pulls and `compose_up` take longer: `1800` lets them finish.
- `enabled = false`: keeps the entry but doesn't start it.
- `enabled_tools` and `disabled_tools`: lists of tool names to offer or hide, e.g. `disabled_tools = ["prune"]`. To limit what it can do, prefer the mode and the areas: a tool outside them doesn't exist at all.
- `env_vars`: names of variables to pass through from your environment, e.g. `env_vars = ["DOCKER_HOST"]`.
- `cwd`: the folder it starts in.

### As a plugin

The plugin from Falken's Lab's marketplace (see [Getting started](getting-started.md#in-codex)) brings the skills too, but Codex has no plugin settings: it runs in full mode with the default labs folder. For another mode, configure it as above instead.
