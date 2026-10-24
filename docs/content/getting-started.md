---
title: Getting started
sidebar_label: Getting started
---

# Getting started

You need [Node.js](https://nodejs.org) 20 or later and [Docker](https://docs.docker.com/get-started/get-docker/) 24 or later, running: Docker Desktop on Windows and macOS, Docker Engine on Linux. docker-mcp never installs Docker: if it's missing or stopped, it says how to install or start it.

## In an agent built on agent-kit

Install its extension, `docker-lab`, from [Falken's Lab's marketplace](https://falkenslab.github.io/agent-extensions/). It uses Docker as a lab where the agent runs and tries software without touching your computer: it runs this server at a fixed version, asks for its mode when you install it, and adds the skills to use it well:

```bash
my-agent extension marketplace add falkenslab/agent-extensions
my-agent extension add docker-lab@falkenslab
```

## In Claude Code

```bash
claude mcp add docker -- npx -y @falkenslab/docker-mcp
```

That's full mode. For another, give it as a variable (see [Modes and settings](modes.md)):

```bash
claude mcp add docker -e DOCKER_MCP_MODE=read -- npx -y @falkenslab/docker-mcp
```

Or, with its skills, as a plugin from the same marketplace:

```bash
claude plugin marketplace add falkenslab/agent-extensions
claude plugin install docker-lab@falkenslab
```

## In Codex

```bash
codex plugin marketplace add falkenslab/agent-extensions
codex plugin add docker-lab@falkenslab
```

Codex has no plugin settings, so it runs in full mode with the default labs folder. For another mode, add it as a server of its own:

```bash
codex mcp add docker --env DOCKER_MCP_MODE=read -- npx -y @falkenslab/docker-mcp
```

To write it in `.mcp.json` (Claude Code) or `config.toml` (Codex) instead, with every setting, see [Configuration](configuration.md).

## Checking it works

Ask the agent: "Is Docker running, and which mode are you in?" It calls `check_requirements` and `server_info`.
