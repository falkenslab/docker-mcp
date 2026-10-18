# A real screenshot in the README

Issue: [#4](https://github.com/falkenslab/docker-mcp/issues/4)

## Goal

Show docker-mcp at work with a real screenshot in the README and the docs' intro.

## Context

- Falken's Lab READMEs have a 📸 *See it at work* section, after the examples and before *What's inside*; docker-mcp's has none.
- It must come from a real session, never be generated: Claude Code, or an agent on agent-kit with the docker-mcp extension.

## Changes

- The owner takes the screenshot: for example a lab started and its check passing, or a dangerous `run_container` refused until the person agrees.
- The image goes in the repository, about 760 px wide.
- README: the 📸 *See it at work* section between *💬 What you can ask* and *🧰 What's inside*, with the image's absolute raw.githubusercontent.com URL and a one-line caption.
- Docs: the same image and caption on `intro.md` in English and Spanish.

## Acceptance

- The image shows on GitHub and on npm's page (absolute URL).
- The docs site builds in both languages with the image on the intro.
