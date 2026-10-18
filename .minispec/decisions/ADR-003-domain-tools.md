# ADR-003: Domain tools, with what they change said

## Decision

Each tool is a task of the domain the person would name (`search_legislation`, `lab_up`), not a generic operation (an HTTP request, a shell command). It has a title, a description written for the model, input and output schemas, and annotations: `readOnlyHint` always; `destructiveHint` and `idempotentHint` when it writes. Its description says when to confirm with the person first.

## Motivation

A model chooses tools by their names and descriptions: domain tools are chosen right and used safely. agent-kit's plan mode lets through only tools that say they only read, and a client asks before the rest.

## Consequences

- `npm run check` fails on a tool without a title, a description, schemas or `readOnlyHint`.
- A task with no tool yet is a new tool, not a generic escape hatch.
