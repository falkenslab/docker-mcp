# ADR-005: Modes chosen at startup decide which tools exist

## Decision

The server has a complete set of Docker tools, each with its area (containers, images, volumes, networks, compose, system, labs) and the modes it exists in. The mode (`DOCKER_MCP_MODE`: `read`, `lab` or `full`, default `full`) and the areas (`DOCKER_MCP_SCOPES`, default all) are read once at startup, and only the tools they allow are registered: a tool outside them isn't listed at all.

- `read`: only tools that read (list, inspect, logs, info, disk usage, labs' status).
- `lab`: the labs (ADR-006), and reading the labs' containers and the images; nothing else can run.
- `full`: everything. What deletes is annotated destructive; a container with dangerous options (privileged, the host's network, processes or IPC, extra capabilities, devices, the Docker socket, the host's root or the person's home mounted) is refused until the call says `confirmedDangerous: true`, which the description tells the agent to set only with the person's yes. ADR-007 replaces that flag: the server asks the person itself, through elicitation, before dangerous options and before anything that can't be undone.

## Motivation

One server for very different people: a developer who wants all of Docker, and a teacher or a student whose agent should only run practices safely. A tool that doesn't exist can't be misused or talked into; hiding it is safer than refusing it at call time, as moodle-mcp does with its role and access.

## Consequences

- Changing the mode means restarting the server (the extension's settings), never a tool.
- The instructions tell the agent which mode it's in and what to say when the person asks for what it doesn't allow.
- `test/tools/modes.test.ts` checks each mode's tools; a new tool declares its area and modes in its entry.
