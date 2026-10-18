---
title: Configuración
sidebar_label: Configuración
---

# Configuración

docker-mcp se configura allí donde lo arranca tu app de IA: un comando, sus argumentos y los [ajustes](modes.md#ajustes) como variables de entorno. Puedes escribirlo con la línea de comandos de la app o en su fichero de configuración; las dos cosas acaban en el mismo sitio. Esta página muestra ambas para Claude Code y Codex, con todos los ajustes.

## Los ajustes

Todos son opcionales; sin ninguno, docker-mcp funciona en modo full con todas las áreas. Qué significa cada uno está en [Modos y ajustes](modes.md#ajustes).

| Variable | Valores | Por defecto |
| --- | --- | --- |
| `DOCKER_MCP_MODE` | `read`, `lab` o `full` | `full` |
| `DOCKER_MCP_SCOPES` | Áreas, separadas por comas: `containers`, `images`, `volumes`, `networks`, `compose`, `system`, `labs` | todas |
| `DOCKER_MCP_LABS_DIR` | La carpeta de los laboratorios, una ruta absoluta | `labs` en su carpeta de datos |
| `DOCKER_MCP_ALLOW_INTERNET` | `true` o `false` | `false` |
| `DOCKER_MCP_CPUS` | CPU por servicio de un laboratorio, p. ej. `1` o `0.5` | `1` |
| `DOCKER_MCP_MEMORY` | Memoria por servicio de un laboratorio, p. ej. `512m` o `1g` | `512m` |
| `DOCKER_MCP_PIDS` | Procesos por servicio de un laboratorio | `256` |
| `DOCKER_MCP_ALLOWED_IMAGES` | Imágenes que puede usar un laboratorio, separadas por comas | cualquiera |

Para usar una versión fija en lugar de la última, nómbrala en el comando: `npx -y @falkenslab/docker-mcp@0.1.0`.

## Claude Code

### Con la línea de comandos

```bash
claude mcp add docker -- npx -y @falkenslab/docker-mcp
```

Cada ajuste es un `-e` (o `--env`), antes del nombre; `--` separa las opciones de Claude Code del comando del servidor:

```bash
claude mcp add --scope project \
  -e DOCKER_MCP_MODE=lab \
  -e DOCKER_MCP_LABS_DIR=/home/yo/labs \
  -e DOCKER_MCP_MEMORY=1g \
  docker -- npx -y @falkenslab/docker-mcp
```

`--scope` decide dónde se guarda:

| Ámbito | Dónde | Para quién |
| --- | --- | --- |
| `local` (por defecto) | `~/.claude.json`, dentro de este proyecto | Tú, en este proyecto |
| `project` | `.mcp.json` en la raíz del proyecto | Quien clone el proyecto (sube el fichero al repositorio) |
| `user` | `~/.claude.json` | Tú, en todos tus proyectos |

Si el mismo nombre está en varios ámbitos, `local` gana a `project` y `project` a `user`; las entradas no se mezclan. Para revisarlo o deshacerlo: `claude mcp list`, `claude mcp get docker`, `claude mcp remove docker` (con `--scope` si está en más de uno). Dentro de una sesión, `/mcp` muestra si está conectado.

### Con `.mcp.json`

`.mcp.json` en la raíz del proyecto es el ámbito `project` escrito a mano: créalo, o añade `docker` a los servidores que ya tenga. Todos los ajustes, con su valor por defecto, salvo la carpeta de los laboratorios y las imágenes, que son ejemplos:

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
        "DOCKER_MCP_LABS_DIR": "/home/yo/labs",
        "DOCKER_MCP_ALLOW_INTERNET": "false",
        "DOCKER_MCP_CPUS": "1",
        "DOCKER_MCP_MEMORY": "512m",
        "DOCKER_MCP_PIDS": "256",
        "DOCKER_MCP_ALLOWED_IMAGES": "nginx:alpine,postgres:17"
      }
    }
  }
}
```

Deja solo los ajustes que cambies. Todos los valores son texto, también `true` y los números. En Windows, escribe las rutas con barras normales (`C:/Users/yo/labs`) o con las barras invertidas dobladas. Claude Code te pide aprobar los servidores del `.mcp.json` de un proyecto la primera vez que los encuentra.

Los valores pueden salir de tu entorno, para que cada persona tenga los suyos: `${VAR}` toma una variable, y `${VAR:-valor}` un valor por defecto cuando no está definida. Por ejemplo, `"DOCKER_MCP_LABS_DIR": "${LABS_DIR}"`, o `"DOCKER_MCP_MODE": "${DOCKER_MODE:-read}"`.

Una entrada también puede llevar `"timeout"`, en milisegundos: cuánto puede durar una llamada a una herramienta antes de que Claude Code la abandone. `compose_up`, `build_image` y `compose_build` pueden tardar minutos.

La misma entrada, sin el `mcpServers` de fuera, sirve en la línea de comandos: `claude mcp add-json docker '{"type":"stdio","command":"npx","args":["-y","@falkenslab/docker-mcp"],"env":{"DOCKER_MCP_MODE":"read"}}'`.

## Codex

Codex guarda sus servidores en `config.toml`, no en `.mcp.json`: `~/.codex/config.toml` para ti, o `.codex/config.toml` en un proyecto, que Codex solo lee en los proyectos en los que confías.

### Con la línea de comandos

```bash
codex mcp add docker -- npx -y @falkenslab/docker-mcp
```

Cada ajuste es un `--env`:

```bash
codex mcp add docker \
  --env DOCKER_MCP_MODE=lab \
  --env DOCKER_MCP_LABS_DIR=/home/yo/labs \
  -- npx -y @falkenslab/docker-mcp
```

Se guarda en `~/.codex/config.toml`. Para revisarlo o deshacerlo: `codex mcp list`, `codex mcp get docker`, `codex mcp remove docker`.

### Con `config.toml`

Todos los ajustes, con su valor por defecto, salvo la carpeta de los laboratorios y las imágenes, que son ejemplos:

```toml
[mcp_servers.docker]
command = "npx"
args = ["-y", "@falkenslab/docker-mcp"]
startup_timeout_sec = 30
tool_timeout_sec = 1800

[mcp_servers.docker.env]
DOCKER_MCP_MODE = "full"
DOCKER_MCP_SCOPES = "containers,images,volumes,networks,compose,system,labs"
DOCKER_MCP_LABS_DIR = "/home/yo/labs"
DOCKER_MCP_ALLOW_INTERNET = "false"
DOCKER_MCP_CPUS = "1"
DOCKER_MCP_MEMORY = "512m"
DOCKER_MCP_PIDS = "256"
DOCKER_MCP_ALLOWED_IMAGES = "nginx:alpine,postgres:17"
```

Deja solo lo que cambies. Las claves propias de Codex para la entrada:

- `startup_timeout_sec` (por defecto `10`): cuánto espera a que arranque el servidor. La primera vez `npx` descarga el paquete, así que dale `30`.
- `tool_timeout_sec` (por defecto `60`): cuánto puede durar una llamada a una herramienta. Las construcciones, las descargas de imágenes y `compose_up` tardan más: con `1800` les da tiempo a terminar.
- `enabled = false`: conserva la entrada pero no lo arranca.
- `enabled_tools` y `disabled_tools`: listas de herramientas que ofrecer u ocultar, p. ej. `disabled_tools = ["prune"]`. Para limitar lo que puede hacer, mejor el modo y las áreas: una herramienta fuera de ellos no existe.
- `env_vars`: nombres de variables de tu entorno que se le pasan, p. ej. `env_vars = ["DOCKER_HOST"]`.
- `cwd`: la carpeta en la que arranca.

### Como plugin

El plugin del marketplace de Falken's Lab (mira [Empezar](getting-started.md#en-codex)) trae también las skills, pero Codex no tiene ajustes para plugins: funciona en modo full con la carpeta de laboratorios por defecto. Para otro modo, configúralo como arriba.
