# ADR-001: One bundled file, nothing to install

## Decision

esbuild bundles the server and every dependency into a single `dist/server.mjs` (ESM, `--platform=node`, a `createRequire` banner for CommonJS dependencies), published to npm with `"bin"` pointing at it and `"files": ["dist/server.mjs"]`. Dependencies are `devDependencies`: they're inside the bundle. Nothing native (sql.js instead of better-sqlite3), no Python, no install scripts.

## Motivation

agent-kit installs an extension's files and never runs `npm install`; it runs a server published on npm with `npx -y <package>@<exact version>` and its own Node. A single file with everything inside starts fast, runs anywhere Node runs, and needs nothing compiled for the person's system.

## Consequences

- A dependency that can't be bundled (it reads its own package's files at run time, it's native) needs its own ADR before it's added.
- `tsc` only typechecks; esbuild doesn't, so `typecheck` runs before a release (`prepublishOnly`).
- The bundle is the thing tested by `npm run check` and listed by the docs' tools reference.
