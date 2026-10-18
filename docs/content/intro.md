---
title: Introduction
sidebar_label: Introduction
slug: /
---

# docker-mcp

Your AI agent works Docker for you: containers, images, volumes, networks, Compose projects, clean-ups and practice labs that check themselves.

It's an [MCP](https://modelcontextprotocol.io) server: an AI app (Claude Code, Codex, an agent built on [agent-kit](https://falkenslab.github.io/agent-kit/)) starts it and gets its tools. You don't call the tools yourself: you ask in your own words ("start a PostgreSQL with a volume for its data"), and the agent picks them. It drives Docker's own command line on your computer.

You choose how far it can go when it starts: **read** only looks, **lab** only runs practice labs under a safety policy, and **full** does everything Docker does, asking before anything dangerous.

- **[Getting started](getting-started.md)**: install it in your AI app.
- **[Modes and settings](modes.md)**: what each mode allows, the areas, and the labs.
- **[Tools](reference/tools.md)**: every tool, with the description the agent reads.
- **[Releases](releases.md)**: what changed in each version.
