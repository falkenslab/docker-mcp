---
title: Getting started
sidebar_label: Getting started
---

# Getting started

You need [Node.js](https://nodejs.org) 20 or later.

## In an agent built on agent-kit

Install its extension from Falken's Lab's marketplace, which runs this server at a fixed version and adds the skills to use it well:

```bash
my-agent extension marketplace add falkenslab/agent-kit-extensions
my-agent extension add docker-mcp@falkenslab
```

## In Claude Code

```bash
claude mcp add docker-mcp -- npx -y @falkenslab/docker-mcp
```

Or, with its skills, as a plugin from the same marketplace:

```bash
claude plugin marketplace add falkenslab/agent-kit-extensions
claude plugin install docker-mcp@falkenslab
```

## Checking it works

Ask the agent: "Which version of docker-mcp are you using?" It calls `server_info`.
