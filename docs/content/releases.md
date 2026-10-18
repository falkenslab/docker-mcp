---
title: Releases
sidebar_label: Releases
---

# Releases

## 0.1.0

October 18, 2026. The first release.

- 47 tools over containers, images, volumes, networks, Compose, the system and labs, with structured results: among them what containers consume and run (`container_stats`, `container_processes`), building a Compose project without starting it (`compose_build`), and pushing an image with your own `docker login` (`push_image`), never with credentials passed to the agent.
- Modes chosen at startup: `read` (only reads), `lab` (only labs, under a safety policy, seeing only their containers) and `full` (everything, with destructive tools marked and dangerous container options needing the person's yes); areas to narrow a mode.
- Labs: a folder with a compose file and a check, refused when it breaks the policy, run as its own Compose project with limits and, unless allowed, without internet.
- Docker 24 or later as a requirement: checked and explained, never installed.
