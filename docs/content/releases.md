---
title: Releases
sidebar_label: Releases
---

# Releases

## 0.2.0

October 24, 2026.

- **You confirm, not the agent.** Before removing a container, an image, a volume or a network, cleaning up with `prune` (saying how much it would free), stopping a Compose project with its volumes, stopping or resetting a lab, and before a container with dangerous options, docker-mcp asks you itself through your app, and your answer never passes through the model. See [Modes and settings](modes.md#you-confirm-not-the-agent).
- **What changes for you:** in an app that can't show that question (MCP elicitation), those tools now refuse. Claude Code and Codex can show it. If your app already asks before every call, start docker-mcp with `DOCKER_MCP_CONFIRM=client`. `run_container`'s `confirmedDangerous` is gone.
- **Trying something isolated:** `run_container` takes CPU, memory and process limits, a read-only root, no new privileges and labels, and `network: "none"` cuts a container off; a run that waits for its result is stopped and removed when `timeoutSeconds` runs out. `list_containers` filters by label.
- **Podman**, through its Docker-compatible socket: how, in [Getting started](getting-started.md#with-podman-instead-of-docker).
- The extension is `docker-lab`, in [falkenslab/agent-extensions](https://github.com/falkenslab/agent-extensions); [Configuration](configuration.md) shows `.mcp.json`, Codex's `config.toml` and their command lines, with every setting.

## 0.1.0

October 18, 2026. The first release.

- 47 tools over containers, images, volumes, networks, Compose, the system and labs, with structured results: among them what containers consume and run (`container_stats`, `container_processes`), building a Compose project without starting it (`compose_build`), and pushing an image with your own `docker login` (`push_image`), never with credentials passed to the agent.
- Modes chosen at startup: `read` (only reads), `lab` (only labs, under a safety policy, seeing only their containers) and `full` (everything, with destructive tools marked and dangerous container options needing the person's yes); areas to narrow a mode.
- Labs: a folder with a compose file and a check, refused when it breaks the policy, run as its own Compose project with limits and, unless allowed, without internet.
- Docker 24 or later as a requirement: checked and explained, never installed.
