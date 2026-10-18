---
title: Introducción
sidebar_label: Introducción
slug: /
---

# docker-mcp

Tu agente de IA maneja Docker por ti: contenedores, imágenes, volúmenes, redes, proyectos de Compose, limpiezas y laboratorios de prácticas que se comprueban solos.

Es un servidor [MCP](https://modelcontextprotocol.io): una aplicación de IA (Claude Code, Codex, un agente hecho con [agent-kit](https://falkenslab.github.io/agent-kit/)) lo arranca y obtiene sus herramientas. Tú no llamas a las herramientas: pides lo que necesitas con tus palabras («arranca un PostgreSQL con un volumen para sus datos») y el agente las elige. Usa la propia línea de órdenes de Docker de tu ordenador.

Tú decides hasta dónde puede llegar al arrancarlo: **read** solo mira, **lab** solo ejecuta laboratorios de prácticas con unas reglas de seguridad, y **full** hace todo lo que hace Docker, preguntando antes de lo peligroso.

- **[Empezar](getting-started.md)**: instalarlo en tu aplicación de IA.
- **[Modos y ajustes](modes.md)**: qué permite cada modo, las áreas y los laboratorios.
- **[Herramientas](reference/tools.md)**: todas las herramientas, con la descripción que lee el agente.
- **[Versiones](releases.md)**: qué cambió en cada versión.
