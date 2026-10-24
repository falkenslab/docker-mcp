# The person confirms dangerous options and removals, not the model

Issue: [#8](https://github.com/falkenslab/docker-mcp/issues/8)

## Goal

Ask the person directly, through MCP elicitation, before a dangerous container or anything that can't be undone, so their yes never depends on the model.

## Context

- `run_container` refuses dangerous options (privileged, the host's network, processes or IPC, extra capabilities, devices, the Docker socket, the host's root or home) until `confirmedDangerous: true`, an input the model sets (ADR-005); the description tells it to set it only with the person's yes.
- Removals and `prune` are marked `destructiveHint` and their descriptions say to confirm first, but nothing stops a call: `remove_container`, `remove_image`, `remove_volume`, `remove_network`, `prune`, `compose_down` (with volumes), `lab_down`, `lab_reset`.
- MCP elicitation lets the server ask the person a question through the client and get the answer itself; the SDK in use (1.32.1) has `elicitInput`. agent-kit will also gate an extension's listed tools on its side (falkenslab/agent-kit#76).

## Changes

- An ADR first: who confirms (the person through the server, not the model), what is asked, and what a client without elicitation gets. It changes ADR-005's `confirmedDangerous`.
- Dangerous options: an elicitation that says, in plain words, what each one gives the container (the Docker socket, control of all of Docker; privileged, the whole machine) and asks yes or no. `confirmedDangerous` goes away or is ignored.
- What can't be undone asks the same way, naming what goes: a container (and its volumes), an image, a volume and its data, a network, what `prune` would remove (as `disk_usage` sees it), a Compose project's volumes, and a lab's work for `lab_down` and `lab_reset`.
- A client without elicitation: the tool refuses, unless the server was started with `DOCKER_MCP_CONFIRM=client` (read with `setting()`), trusting the client to have asked (e.g. agent-kit with `confirmTools`). Never a tool input.
- `read` mode and lab mode's policy unchanged; the instructions and the docs (both languages) say how confirmation works.
- Tests with an in-memory client that does and doesn't support elicitation, answering yes and no.

## Acceptance

- In an agent on agent-kit and in Claude Code, `run_container` with the Docker socket shows the form; yes runs it, no doesn't and the model is told.
- `remove_volume` asks, naming the volume and that its data goes.
- Without elicitation and without the setting, they refuse; with `DOCKER_MCP_CONFIRM=client`, they run as today.
- The `verify` skill passes; docker-lab (falkenslab/agent-extensions) bumps to the release and its skills stop telling the model to pass `confirmedDangerous`.
