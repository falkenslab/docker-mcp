# A confirmation form expires while the person is still reading it

Issue: [#10](https://github.com/falkenslab/docker-mcp/issues/10)

## Problem

A tool that asks the person (ADR-007) comes back with `The person couldn't be asked (MCP error -32001: Request timed out), so … was refused` when the person takes a while to answer: a refusal they didn't give. Seen twice with `lab_down` in miyagi's desktop app (falkenslab/miyagi#92).

## Cause

`confirm()` (`src/confirm.ts`) calls `server.server.elicitInput()` without request options, so the MCP SDK applies its default request timeout, `DEFAULT_REQUEST_TIMEOUT_MSEC`, 60 seconds. A confirmation waits for a person, not for a program. The catch then reports any failure, a timeout included, as "the person couldn't be asked".

## Solution

- Send the elicitation with a long timeout made for a person: an hour, say, below Node's timer limit (a `setTimeout` beyond 2^31 − 1 ms fires at once, so never `Infinity`), in a named constant.
- When it does run out, the refusal says the question expired without an answer and nothing was changed, and that the person can ask again; other failures keep saying the person couldn't be asked.
- A regression test with an in-memory client that answers late: the call waits past the SDK's 60 seconds without failing (a fake clock or a short constant for the test), and a test for the expired message.

## Verification

- The tests pass, with the rest of the `verify` skill.
- In a real Claude Code session, a `remove_volume` form left open for more than a minute and then accepted removes the volume.
- moodle-mcp: the same check for its own confirmations, in that repository (the issue points to it).
