---
title: Empezar
sidebar_label: Empezar
---

# Empezar

Necesitas [Node.js](https://nodejs.org) 20 o posterior y [Docker](https://docs.docker.com/get-started/get-docker/) 24 o posterior, en marcha: Docker Desktop en Windows y macOS, Docker Engine en Linux. docker-mcp nunca instala Docker: si falta o está parado, dice cómo instalarlo o arrancarlo.

## En un agente hecho con agent-kit

Instala su extensión, `docker-lab`, desde el [marketplace de Falken's Lab](https://falkenslab.github.io/agent-extensions/). Usa Docker como un laboratorio donde el agente ejecuta y prueba software sin tocar tu ordenador: ejecuta este servidor a una versión fija, te pide el modo al instalarla y añade las skills para usarlo bien:

```bash
my-agent extension marketplace add falkenslab/agent-extensions
my-agent extension add docker-lab@falkenslab
```

## En Claude Code

```bash
claude mcp add docker -- npx -y @falkenslab/docker-mcp
```

Así funciona en modo full. Para otro, pásalo como variable (mira [Modos y ajustes](modes.md)):

```bash
claude mcp add docker -e DOCKER_MCP_MODE=read -- npx -y @falkenslab/docker-mcp
```

O, con sus skills, como plugin del mismo marketplace:

```bash
claude plugin marketplace add falkenslab/agent-extensions
claude plugin install docker-lab@falkenslab
```

## En Codex

```bash
codex plugin marketplace add falkenslab/agent-extensions
codex plugin add docker-lab@falkenslab
```

Codex no tiene ajustes de plugins, así que funciona en modo full con la carpeta de laboratorios por defecto. Para otro modo, añádelo como un servidor propio:

```bash
codex mcp add docker --env DOCKER_MCP_MODE=read -- npx -y @falkenslab/docker-mcp
```

Para escribirlo en `.mcp.json` (Claude Code) o en `config.toml` (Codex), con todos los ajustes, mira [Configuración](configuration.md).

## Comprobar que funciona

Pregunta al agente: «¿Está Docker en marcha, y en qué modo estás?». Llamará a `check_requirements` y a `server_info`.
