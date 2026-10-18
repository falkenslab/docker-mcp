---
name: upgrade-deps
description: Upgrade mcp-server-template's dependencies - the MCP TypeScript SDK, zod, esbuild, TypeScript, the lint stack and Docusaurus - and re-check what the server relies on. Use when the user asks to bump a dependency, or when investigating a behavior change after an update.
---

# Upgrading mcp-server-template's dependencies

Every dependency is a `devDependency`: it ends up inside `dist/server.mjs` (ADR-001), so an upgrade changes the bundle people run. An upgrade is more than `npm update`.

## 1. Upgrade

```
npm outdated
npm install -D <package>@<version>
```

Read the release notes when reachable. One package (or one family: `typescript-eslint` with `eslint`) per commit.

## 2. Package by package

- **`@modelcontextprotocol/sdk`**: `registerTool` with `outputSchema` and `structuredContent`; annotations; the in-memory transport the tests use; tool errors coming back as `isError` with the thrown message (what `RequirementMissing` relies on); the stdio transport closing when stdin closes. `npm run check` and `npm run tools` in `docs/` import it from `node_modules` too.
- **`zod`**: the tool schemas, and the JSON Schema the SDK makes of them (`npm run check`, and a look at the regenerated tools reference for a changed type).
- **`typescript`**: stays on the line `typescript-eslint` supports (`~6.0.x` in `package.json` until it supports the next).
- **`esbuild`**: the bundle is still one file that runs with plain `node dist/server.mjs --version`, and `npx` of a packed tarball works.
- **Docusaurus** (in `docs/`): all `@docusaurus/*` to the same version; `npm run build` in both languages, and the local search.
- **Node**: CI runs the oldest and newest supported (`.github/workflows/ci.yml`); raising the minimum is `engines` in `package.json`, the matrix, `@types/node` and `.minispec/core/stack.md` together.

## 3. Run the gate

Run the `verify` skill, the site included. Type errors are usually the first sign of a changed contract.

## 4. Record it

Commit with the `commit` skill: `build(deps): …` for a plain bump, `fix` or `refactor` for code that had to adapt, saying what was re-checked and on which version. A fix every server built from the template needs belongs in the Falken's Lab MCP server template too.
