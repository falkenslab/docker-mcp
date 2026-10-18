# ADR-002: English everywhere in the repository

## Decision

Code, comments, tool names and descriptions, the server's instructions, `README.md`, `CLAUDE.md`, `.minispec/` and commit messages are in English. Spanish lives in the documentation site's `es` locale.

## Motivation

The tools' descriptions are read by models, which follow English best; the repository is public and its contributors and users aren't only Spanish speakers. The people who use it in Spanish read the docs site in Spanish.

## Consequences

- Every docs page has its Spanish translation under `docs/i18n/es/`; the tools reference keeps the tools' descriptions in English on both, as the agent reads them.
- The README's hero links the docs in English and in Spanish.
