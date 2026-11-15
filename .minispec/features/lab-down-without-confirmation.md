# An unattended agent can stop the labs it started

Issue: [#11](https://github.com/falkenslab/docker-mcp/issues/11)

## Goal

Let `lab_down` stop a lab without asking the person, as `lab_up` starts one, so an agent with nobody there can clean up after itself.

## Context

- Since ADR-007, `lab_down` asks the person through elicitation (`confirm()`, `src/tools/labs.ts`). In an unattended run (padawan's `run --mode autonomous`) nobody can answer, the client declines, and the lab can't be stopped: its containers keep running after the session ends. Seen with docker-mcp 0.3.0 in falkenslab/agent-extensions#36.
- What `lab_down` loses is small: a lab lives in its folder under the labs folder, under ADR-006's policy; stopping it removes its containers, networks and volumes, but its files stay and `lab_up` brings it back. Only the state built inside it during the session goes, which the agent itself created.
- `DOCKER_MCP_CONFIRM=client` isn't the answer: it turns off every confirmation, removing the person's own containers, images and volumes included.
- Rejected, as the issue says: asking only when the client can, and stopping anyway when a form is declined. A declined form can't be told apart from a person saying no.

## Changes

- `lab_down` no longer calls `confirm()`. Its description still says what goes (containers, networks and volumes; the folder's files stay) and that `lab_up` brings it back; `destructiveHint: true` stays.
- `lab_reset` keeps asking: it loses the work mid-task.
- ADR-007 updated: `lab_down` leaves the list of what the server confirms, and why (a lab's own disposable state, which an unattended agent must be able to clean up).
- `messages.ts`: `labDown` removed from both catalogs.
- The docs, both languages: "You confirm, not the agent" no longer lists stopping a lab.
- Tests: `lab_down` stops a lab without elicitation and without `DOCKER_MCP_CONFIRM=client`, in lab and full mode; `lab_reset` still asks.

## Acceptance

- With a client that declines every form, `lab_down` stops the lab and its containers are gone; `lab_reset` is still refused.
- The `verify` skill passes; `npm run check:labs` still cleans up after itself.
- Once released, docker-lab (falkenslab/agent-extensions) takes `lab_down` out of `serverConfirmTools` and pins the new version.
