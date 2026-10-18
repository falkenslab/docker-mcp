<div align="center">

<img src="https://raw.githubusercontent.com/falkenslab/mcp-server-template/main/docs/static/img/logo.svg" alt="mcp-server-template logo: a plug" width="112"/>

# mcp-server-template

**A Falken's Lab MCP server.**<br/>
The starting point for Falken's Lab's MCP servers: one bundled file, tests, docs in English and Spanish, ready for agent-kit.

![Node.js 20+](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)
![MCP server](https://img.shields.io/badge/MCP-server-0b0b0b)
[![License: MIT](https://img.shields.io/badge/license-MIT-16a34a)](LICENSE)

**[🧩 Use this template](https://github.com/falkenslab/mcp-server-template/generate)**

</div>

This is a template repository: every Falken's Lab MCP server starts here, so they all look and work the same. It's an MCP server over stdio, written in TypeScript with the official MCP SDK and bundled into a single file that runs with `npx`, so an agent built on [agent-kit](https://github.com/falkenslab/agent-kit) can run it without installing anything. It comes with one example tool, tests, a strict check of its tools, CI, a documentation site in English and Spanish, and the design notes every server shares.

## ✨ Why this template

- 📦 **One file, nothing to install.** esbuild bundles every dependency into `dist/server.mjs`, which agent-kit runs with `npx`.
- 🧭 **Tools a model chooses well.** Each tool has a title, a description for the model, schemas and `readOnlyHint`, and `npm run check` fails if one doesn't.
- 🔧 **Programs installed apart, explained.** A server that needs Docker or ffmpeg declares it once and gets `check_requirements` and clear errors; it never installs anything.
- 🧪 **Tested from the start.** `node:test` with the SDK's in-memory transport, and CI on Node 20 and 24.
- 🌍 **Docs in two languages.** A Docusaurus site in English and Spanish, with the tools reference generated from the server itself.
- 🧠 **Design memory.** `.minispec/` with the decisions every Falken's Lab server shares, and a `CLAUDE.md` for coding agents.

## 🚀 Quick start

On GitHub, **Use this template** to create the new repository, then:

```bash
npm install
npm run init -- docker-lab-mcp "Hands-on practices in Docker, safe by default."
npm run build && npm run check
```

`init` renames the package, the command, the links and the docs, and notes in `.minispec/core/stack.md` the template's commit it comes from, so later fixes here can be found with `git log <commit>..main`. Then rewrite `.minispec/core/project.md` and this README for the new server, and add its tools in `src/tools/`.

## 🧰 What's inside

| Area | For example |
| --- | --- |
| 🔌 Server | `src/server.ts` (stdio), `src/createServer.ts`, `src/instructions.ts` |
| 🛠️ Tools | `server_info`, one file per tool in `src/tools/`, `reply()` for structured results |
| 🔧 Requirements | `src/requirements.ts`: `check_requirements` and `needs()`, only when a server needs programs |
| 🧪 Checks | `npm test`, `npm run check` (strict `tools/list`), typecheck and lint, CI |
| 📖 Docs | `docs/`, Docusaurus in English and Spanish, published to GitHub Pages by each server (the template only builds it) |
| 🧠 Design | `.minispec/` (project, conventions, ADRs), `CLAUDE.md` |

## 📚 Documentation

The template has no site of its own: `docs/` is the one each server publishes. What a new server needs is here:

- **[CLAUDE.md](CLAUDE.md)**: the commands, how the pieces fit, and the skills in `.claude/skills/` (adding a tool, checks, docs, releases).
- **[.minispec/](.minispec/README.md)**: the project, its conventions and the decisions every Falken's Lab server shares.
- **[docs/](docs/)**: the site's skeleton, with getting started, the tools reference generated from the server and the releases; `cd docs && npm install && npm start` previews it.

## 🛠️ Developing

`npm run build`, `npm test` and `npm run check` before every commit; `CLAUDE.md` lists every command, and `.minispec/` the decisions behind them. Releases are published to npm by the owner.

<div align="center">

Made with 💖 by Falken's Lab Team

</div>
