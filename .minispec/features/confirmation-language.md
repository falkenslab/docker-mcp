# Confirmations in the person's language

Issue: [#9](https://github.com/falkenslab/docker-mcp/issues/9)

## Goal

Ask the person in their own language when the server confirms a removal or a dangerous option (ADR-007).

## Context

- `confirm()` (`src/confirm.ts`) and its callers write the question, the details and the field ("Yes, go ahead") in English, so a Spanish chat gets an English form. Seen in miyagi with docker-lab 0.2.1 before stopping a lab.
- agent-kit now tells an extension's local servers the session's language the standard way (falkenslab/agent-kit#86, 2688763): their locale, `LANG` and `LC_MESSAGES` (`es_ES.UTF-8` in a Spanish session), and `LC_ALL` when the system sets one. Any client can do the same, and a server that doesn't read it keeps asking in English.
- What the model reads (tool descriptions, errors, instructions) stays English (ADR-002): only what the person reads in the form changes.

## Changes

- The language from the locale, read with `setting()`: `LC_ALL`, then `LC_MESSAGES`, then `LANG`; its language part (`es` from `es_ES.UTF-8`); English when unset, `C`, `POSIX` or not one we have.
- The confirmations' texts in a small catalog per language, English and Spanish, in their own module: every question and detail the callers pass today (removing a container, an image, a volume, a network; `prune` and its estimate lines; `compose_down` with volumes; `lab_down`, `lab_reset`; the dangerous options' descriptions from `dangers()`), and the field's title and description. The callers pass a key and its values, not a sentence.
- The refusal the model reads stays English, saying what was asked.
- `server_info` reports the language it asks in.
- Tests: the catalog has every key in both languages; with `LANG=es_ES.UTF-8` the form is in Spanish, without it in English. The docs (both languages) say confirmations follow the app's language.

## Acceptance

- With `LANG=es_ES.UTF-8` (or `LC_ALL`, `LC_MESSAGES`), `lab_down`'s form reads in Spanish; without a locale, in English as now.
- No English left in a Spanish form, the dangerous options included.
- The `verify` skill passes; a real session in miyagi (docker-lab) shows the Spanish form.
