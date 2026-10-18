<div align="center">

<img src="https://raw.githubusercontent.com/falkenslab/docker-mcp/main/docs/static/img/logo.svg" alt="docker-mcp logo: four containers on a hull, plugged in" width="112"/>

# docker-mcp

**Your AI agent works Docker for you: containers, images, Compose and practice labs.**<br/>
A complete set of tools, with modes chosen at startup: only read, only safe labs, or everything.

[![npm](https://img.shields.io/npm/v/@falkenslab/docker-mcp?color=cb3837&logo=npm)](https://www.npmjs.com/package/@falkenslab/docker-mcp)
![Node.js 20+](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)
![Docker 24+](https://img.shields.io/badge/Docker-24%2B-1d63ed?logo=docker&logoColor=white)
![MCP server](https://img.shields.io/badge/MCP-server-0b0b0b)
[![License: MIT](https://img.shields.io/badge/license-MIT-16a34a)](LICENSE)

**[📖 Documentation](https://falkenslab.github.io/docker-mcp/)** · [📖 Documentación en español](https://falkenslab.github.io/docker-mcp/es/)

</div>

docker-mcp is an MCP server that lets an AI agent (Claude Code, Codex, an agent built on [agent-kit](https://github.com/falkenslab/agent-kit)) work the Docker on your computer: run and inspect containers, build and pull images, manage volumes and networks, start Compose projects, clean up, and run practice labs that check themselves. You choose how far it can go when it starts: `read` only looks, `lab` only runs labs under a safety policy, and `full` does everything Docker does, asking before anything dangerous. It drives Docker's own command line, so it works wherever Docker does.

## ✨ Why docker-mcp

- 🎚️ **Modes, not trust.** A tool outside the mode doesn't exist for the agent: in `read` it can't change anything, in `lab` it can't run anything but labs.
- 🛡️ **Asks before the dangerous.** Removing anything is marked destructive, and a privileged container, the host's network or the Docker socket needs your explicit yes.
- 🧪 **Labs for practices.** A folder with a `compose.yaml` and a check: no internet, no host mounts, limits on CPU and memory, refused if it breaks the rules, reset in one call.
- 🧰 **The whole of Docker.** 43 tools over containers, images, volumes, networks, Compose and the system, each with structured results.
- 🔧 **Explains, never installs.** Without Docker, or with it stopped, it says how to install or start it.
- 📦 **Nothing to install.** One bundled file run with `npx`, for agent-kit, Claude Code and Codex alike.

## 🚀 Quick start

You need [Node.js](https://nodejs.org) 20 or later and [Docker](https://docs.docker.com/get-started/get-docker/) 24 or later, running.

```bash
# Claude Code (full mode)
claude mcp add docker -- npx -y @falkenslab/docker-mcp

# Only labs, with the practices in a folder of your own
claude mcp add docker -e DOCKER_MCP_MODE=lab -e DOCKER_MCP_LABS_DIR=/path/to/labs -- npx -y @falkenslab/docker-mcp
```

In an agent built on agent-kit, or with its skills in Claude Code and Codex, install the `docker-mcp` extension from [agent-kit-extensions](https://github.com/falkenslab/agent-kit-extensions). Then ask: "What containers are running?"

## 💬 What you can ask

- 🧑‍💻 "Start a PostgreSQL 17 with a volume for its data, on port 5432 only for this computer."
- 🧑‍💻 "Why does my web container keep restarting? Look at its logs."
- 🧑‍💻 "How much disk is Docker using, and what could I clean up?"
- 👩‍🏫 "Start the volumes lab and check the solution works."
- 🧑‍🎓 "Reset my lab: I broke the database."

## 🧰 What's inside

| Area | Tools |
| --- | --- |
| 📦 Containers | `list_containers`, `inspect_container`, `container_logs`, `run_container`, `start_container`, `stop_container`, `restart_container`, `remove_container`, `exec_in_container`, `copy_to_container`, `copy_from_container` |
| 🖼️ Images | `list_images`, `inspect_image`, `pull_image`, `build_image`, `tag_image`, `remove_image` |
| 💾 Volumes and networks | `list_volumes`, `inspect_volume`, `create_volume`, `remove_volume`, and the same for networks |
| 🧩 Compose | `compose_ps`, `compose_logs`, `compose_up`, `compose_down`, `compose_exec` |
| ⚙️ System | `docker_info`, `disk_usage`, `prune` |
| 🧪 Labs | `list_labs`, `lab_status`, `lab_logs`, `lab_up`, `lab_exec`, `lab_check`, `lab_reset`, `lab_down` |
| 🔌 Server | `server_info`, `check_requirements` |

Every tool, with what each mode keeps: [the tools reference](https://falkenslab.github.io/docker-mcp/reference/tools).

## 📚 Documentation

- **[Getting started](https://falkenslab.github.io/docker-mcp/getting-started)**: installing it in your AI app.
- **[Modes and settings](https://falkenslab.github.io/docker-mcp/modes)**: `read`, `lab` and `full`, the areas, and the labs' policy.
- **[Tools](https://falkenslab.github.io/docker-mcp/reference/tools)**: every tool, generated from the server.

## 🛠️ Developing

`npm install`, then `npm run build`, `npm test` and `npm run check` before every commit; `CLAUDE.md` lists every command and `.minispec/` the decisions behind them (the modes are ADR-005, the labs' policy ADR-006). Releases are published to npm by the owner.

<div align="center">

Made with 💖 by Falken's Lab Team

</div>
