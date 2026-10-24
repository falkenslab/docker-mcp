# Project

**docker-mcp**: Docker for AI agents: a complete set of tools, with modes chosen at startup (read, lab, full).

- **What**: an MCP server over stdio, published on npm as `@falkenslab/docker-mcp`, that works the person's Docker through its command line: containers, images, volumes, networks, Compose, the system, and labs (practices under a safety policy).
- **Modes** (ADR-005): `read` only reads; `lab` runs only labs, under the policy of ADR-006, and sees only their containers; `full` (the default) does everything, with destructive tools marked, and removals and dangerous container options confirmed by the person, whom the server asks itself (ADR-007). Areas narrow a mode further.
- **For whom**: anyone whose agent needs Docker; in Falken's Lab's agents, teachers checking practices (miyagi) and students doing them (padawan), who use lab mode.
- **How it reaches agents**: as the `docker-lab` extension in [agent-extensions](https://github.com/falkenslab/agent-extensions), which uses Docker as a lab to try software in, pins this server's version, adds the skills and declares its capabilities and its requirement (Docker 24 or later).
- **Out of scope**: installing Docker (ADR-004), Kubernetes and swarm, registries' accounts (`docker login` is the person's), and teaching how to use Docker, which belongs to the agent.
