# ADR-007: The person confirms dangerous options and removals, through elicitation

## Decision

Before a container with dangerous options, and before anything that can't be undone (removing a container, an image, a volume or a network, `prune`, `compose_down` with volumes, `lab_down`, `lab_reset`), the server itself asks the person through MCP elicitation: what goes or what the container gets, in plain words, and a yes or no. The answer reaches the server, never the model. A client without elicitation gets a refusal, unless the server was started with `DOCKER_MCP_CONFIRM=client`, which trusts the client to ask before every call. `confirmedDangerous`, the input the model set, is gone.

## Motivation

ADR-005 refused dangerous options until `confirmedDangerous: true`, and left removals to the model's judgement: the person's yes depended on the model asking, and on it reporting the answer honestly. Elicitation lets the server ask the person directly in any client that supports it (owner's issue #8, 2026-10-20). The setting covers clients that gate tools on their own side (agent-kit's `confirmTools`, falkenslab/agent-kit#76); a tool input can't, since the model would set it. `read` mode reads only, and lab mode's policy already keeps dangerous options out of labs, so neither changes.

## Consequences

- In a client without elicitation and without the setting, these tools refuse, saying why and what the person can do; the rest work as before.
- Every new tool that removes data, or a new dangerous option, asks through `confirm()` (`src/confirm.ts`), naming what goes.
- Their descriptions say the server asks; the model doesn't need to ask again, but still says what it's about to do.
- The docker-lab extension's skills stop telling the model to pass `confirmedDangerous`.
