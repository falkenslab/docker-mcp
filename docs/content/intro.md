---
title: Introduction
sidebar_label: Introduction
slug: /
---

# docker-mcp

Your AI agent works Docker for you: containers, images, volumes, networks, Compose projects, clean-ups and practice labs that check themselves.

It's an [MCP](https://modelcontextprotocol.io) server: an AI app (Claude Code, Codex, an agent built on [agent-kit](https://falkenslab.github.io/agent-kit/)) starts it and gets its tools. You don't call the tools yourself: you ask in your own words ("start a PostgreSQL with a volume for its data"), and the agent picks them. It drives Docker's own command line on your computer.

You choose how far it can go when it starts: **read** only looks, **lab** only runs practice labs under a safety policy, and **full** does everything Docker does, asking before anything dangerous.

![Claude Code starting a lab with docker-mcp and its check passing](/img/see-it-claude-code.png)

*Claude Code, in lab mode: it starts a practice lab and its check passes, all through docker-mcp.*

![Codex starting a lab with docker-mcp and running its check](/img/see-it-codex.png)

*Codex, with the same lab: it calls list_labs, lab_up and lab_check, and the check passes.*

- **[Getting started](getting-started.md)**: install it in your AI app.
- **[Configuration](configuration.md)**: `.mcp.json`, Codex's `config.toml` or their command lines, with every setting.
- **[Modes and settings](modes.md)**: what each mode allows, the areas, and the labs.
- **[Tools](reference/tools.md)**: every tool, with the description the agent reads.
- **[Releases](releases.md)**: what changed in each version.
