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

## Con Podman en lugar de Docker

docker-mcp maneja la línea de órdenes de Docker, así que con Podman funciona a través del socket compatible con Docker de Podman: instala el CLI de Docker y su plugin de Compose (solo el cliente, no el motor de Docker) y apúntalos a Podman.

- **Podman Desktop** (Windows, macOS, Linux): activa su compatibilidad con Docker en los ajustes; apunta el CLI de Docker a Podman por ti.
- **Podman en Linux**: arranca su socket con `systemctl --user enable --now podman.socket` y define `DOCKER_HOST=unix://$XDG_RUNTIME_DIR/podman/podman.sock`.
- **Una máquina de Podman** (Windows, macOS): `podman machine start` muestra el socket o la tubería en la que escucha; úsalo como `DOCKER_HOST`.

Si lo apuntas con `DOCKER_HOST`, docker-mcp también lo necesita: `-e DOCKER_HOST=…` con `claude mcp add`, en `env` en `.mcp.json`, o `env_vars = ["DOCKER_HOST"]` en Codex (mira [Configuración](configuration.md)). Ejecuta antes `docker version`: debería mostrar Podman como servidor.

Dos límites:

- El propio comando `podman` con el nombre `docker` (el paquete `podman-docker`) no funciona: su salida es distinta de la de Docker, y docker-mcp lee la de Docker.
- Los laboratorios aún no se han probado con Podman. Podman sin root aplica sus límites de CPU, memoria y procesos solo con cgroups v2 y esos controladores delegados a tu usuario, y a menudo solo lo están la memoria y los procesos.

## Comprobar que funciona

Pregunta al agente: «¿Está Docker en marcha, y en qué modo estás?». Llamará a `check_requirements` y a `server_info`.
