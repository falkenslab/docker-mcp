---
title: Modos y ajustes
sidebar_label: Modos y ajustes
---

# Modos y ajustes

docker-mcp lee sus ajustes una vez, al arrancar: como variables de entorno, o como opciones de la extensión en un agente hecho con agent-kit o en Claude Code. Para cambiarlos hay que reiniciarlo.

## Modos

El modo decide qué herramientas existen. Una herramienta que el modo no permite no se le ofrece al agente, así que no se puede usar por error ni convencerle de usarla.

| Modo | Qué puede hacer el agente |
| --- | --- |
| `read` | Solo mirar: listar e inspeccionar contenedores, imágenes, volúmenes y redes, leer logs, el estado de los proyectos de Compose y de los laboratorios, la información de Docker y su uso de disco |
| `lab` | Solo laboratorios: arrancarlos, usarlos, comprobarlos, reiniciarlos y pararlos, con las reglas de abajo; solo ve los contenedores de los laboratorios |
| `full` (por defecto) | Todo lo que hace Docker. Borrar cualquier cosa se marca como destructivo, así que el agente lo confirma antes, y un contenedor con opciones peligrosas necesita tu sí explícito |

Las opciones peligrosas son: un contenedor privilegiado, la red, los procesos o el IPC del equipo, capacidades extra, dispositivos, y montar el socket de Docker, la carpeta raíz del equipo o tu carpeta personal. Con cualquiera de ellas, `run_container` se niega hasta que el agente te lo pregunta y vuelve a llamar diciendo que has aceptado.

## Áreas

`DOCKER_MCP_SCOPES` reduce un modo a algunas áreas, separadas por comas: `containers`, `images`, `volumes`, `networks`, `compose`, `system`, `labs`. Por ejemplo, `containers,compose` en modo full deja solo esas herramientas (más `server_info` y `check_requirements`, que siempre están).

## Laboratorios

Un laboratorio es una carpeta dentro de la carpeta de laboratorios con un `compose.yaml` (o `compose.yml`, `docker-compose.yaml`) y, si se quiere, un `lab.json` con su comprobación:

```json
{ "check": { "service": "web", "command": "curl -fs http://localhost/ | grep -q 'Hola'" } }
```

La comprobación se ejecuta dentro del servicio y pasa cuando termina con código 0: para un docente, si un enunciado o una solución funcionan; para un alumno, si su práctica funciona.

Antes de arrancar un laboratorio se revisa su `compose.yaml`. Se rechaza, con todos los problemas enumerados, si un servicio es privilegiado, añade capacidades o dispositivos, usa la red, los procesos o el IPC del equipo, monta algo de fuera de la carpeta del laboratorio o el socket de Docker, se construye desde fuera de la carpeta, o usa una imagen que no está entre las permitidas. Un laboratorio que cumple las reglas funciona como su propio proyecto de Compose, con límites de CPU, memoria y procesos, sin privilegios nuevos y, salvo que lo permitas, sin internet: sus servicios se ven entre sí y nada más, y tu ordenador tampoco llega a sus puertos, así que las comprobaciones se hacen desde dentro.

Los laboratorios existen también en modo full, con las mismas reglas.

## Ajustes

| Variable | Opción de la extensión | Qué hace | Por defecto |
| --- | --- | --- | --- |
| `DOCKER_MCP_MODE` | `mode` | `read`, `lab` o `full` | `full` |
| `DOCKER_MCP_SCOPES` | `scopes` | Las áreas, separadas por comas | todas |
| `DOCKER_MCP_LABS_DIR` | `labs_dir` | La carpeta de laboratorios | `labs` en su carpeta de datos |
| `DOCKER_MCP_ALLOW_INTERNET` | `allow_internet` | Los laboratorios salen a internet (y publican puertos) | no |
| `DOCKER_MCP_CPUS` | `cpus` | CPU por servicio de un laboratorio | `1` |
| `DOCKER_MCP_MEMORY` | `memory` | Memoria por servicio de un laboratorio | `512m` |
| `DOCKER_MCP_PIDS` | | Procesos por servicio de un laboratorio | `256` |
| `DOCKER_MCP_ALLOWED_IMAGES` | `allowed_images` | Imágenes que puede usar un laboratorio, separadas por comas | cualquiera |

Un valor que la aplicación deja como `${user_config…}` sin expandir (Codex no tiene ajustes de plugins) cuenta como no puesto.
