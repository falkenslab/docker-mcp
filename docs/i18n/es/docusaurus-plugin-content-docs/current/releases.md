---
title: Versiones
sidebar_label: Versiones
---

# Versiones

## 0.1.0

La primera versión.

- 43 herramientas para contenedores, imágenes, volúmenes, redes, Compose, el sistema y laboratorios, con resultados estructurados.
- Modos que se eligen al arrancar: `read` (solo lee), `lab` (solo laboratorios, con reglas de seguridad, viendo solo sus contenedores) y `full` (todo, con las herramientas destructivas marcadas y las opciones peligrosas de un contenedor pendientes del sí de la persona); áreas para reducir un modo.
- Laboratorios: una carpeta con su compose y su comprobación, rechazada si incumple las reglas, que funciona como su propio proyecto de Compose, con límites y, salvo que se permita, sin internet.
- Docker 24 o posterior como requisito: se comprueba y se explica, nunca se instala.
