---
title: Releases
sidebar_label: Releases
---

# Releases

## 0.1.0

The first release.

- 43 tools over containers, images, volumes, networks, Compose, the system and labs, with structured results.
- Modes chosen at startup: `read` (only reads), `lab` (only labs, under a safety policy, seeing only their containers) and `full` (everything, with destructive tools marked and dangerous container options needing the person's yes); areas to narrow a mode.
- Labs: a folder with a compose file and a check, refused when it breaks the policy, run as its own Compose project with limits and, unless allowed, without internet.
- Docker 24 or later as a requirement: checked and explained, never installed.
