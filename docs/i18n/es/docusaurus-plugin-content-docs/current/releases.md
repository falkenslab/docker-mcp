---
title: Versiones
sidebar_label: Versiones
---

# Versiones

## 0.2.0

24 de octubre de 2026.

- **Confirmas tú, no el agente.** Antes de borrar un contenedor, una imagen, un volumen o una red, limpiar con `prune` (diciendo cuánto liberaría), parar un proyecto de Compose con sus volúmenes, parar o reiniciar un laboratorio, y antes de un contenedor con opciones peligrosas, docker-mcp te lo pregunta a ti a través de tu app, y tu respuesta nunca pasa por el modelo. Mira [Modos y ajustes](modes.md#confirmas-tú-no-el-agente).
- **Qué cambia para ti:** en una app que no puede mostrar esa pregunta (elicitación de MCP), esas herramientas ahora se niegan. Claude Code y Codex pueden mostrarla. Si tu app ya pregunta antes de cada llamada, arranca docker-mcp con `DOCKER_MCP_CONFIRM=client`. El `confirmedDangerous` de `run_container` desaparece.
- **Probar algo aislado:** `run_container` admite límites de CPU, memoria y procesos, raíz de solo lectura, sin privilegios nuevos y etiquetas, y `network: "none"` lo deja sin red; si se espera a su resultado, se para y se borra cuando se acaba `timeoutSeconds`. `list_containers` filtra por etiqueta.
- **Podman**, a través de su socket compatible con Docker: cómo, en [Empezar](getting-started.md#con-podman-en-lugar-de-docker).
- La extensión es `docker-lab`, en [falkenslab/agent-extensions](https://github.com/falkenslab/agent-extensions); [Configuración](configuration.md) muestra `.mcp.json`, el `config.toml` de Codex y sus líneas de comandos, con todos los ajustes.

## 0.1.0

18 de octubre de 2026. La primera versión.

- 47 herramientas para contenedores, imágenes, volúmenes, redes, Compose, el sistema y laboratorios, con resultados estructurados: entre ellas, qué consumen y qué ejecutan los contenedores (`container_stats`, `container_processes`), construir un proyecto de Compose sin arrancarlo (`compose_build`) y subir una imagen con tu propio `docker login` (`push_image`), sin pasar nunca credenciales al agente.
- Modos que se eligen al arrancar: `read` (solo lee), `lab` (solo laboratorios, con reglas de seguridad, viendo solo sus contenedores) y `full` (todo, con las herramientas destructivas marcadas y las opciones peligrosas de un contenedor pendientes del sí de la persona); áreas para reducir un modo.
- Laboratorios: una carpeta con su compose y su comprobación, rechazada si incumple las reglas, que funciona como su propio proyecto de Compose, con límites y, salvo que se permita, sin internet.
- Docker 24 o posterior como requisito: se comprueba y se explica, nunca se instala.
