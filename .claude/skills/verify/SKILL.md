---
name: verify
description: Run mcp-server-template's full quality gate (typecheck, lint, tests, the one-file bundle, the strict tools/list check, and the docs site when docs/ changed) and report the result. Use before committing, before a release, and after any change under src/, test/, scripts/ or docs/.
---

# Verify mcp-server-template

Run from the repo root, in this order, stopping at the first failure and reporting it. It's what CI runs, on Node 20 and 24.

```
npm run typecheck
npm run lint
npm test
npm run build
npm run check
```

When `docs/` or a tool changed, also the site (its links and anchors break the build):

```
cd docs && npm run tools && npm run build
```

Notes:

- Tests must report `fail 0`; quote the pass and fail counts. `npm run check` must end with "N tools, all complete"; quote the tool count.
- `npm run tools` rewrites `docs/content/reference/tools.md` and its Spanish page from the bundle: if they changed, they go in the commit with the tool.
- Nothing is left running: the check and the reference start the bundle and close it; if one hangs, look for a `node … dist/server.mjs` left behind.
- Never "fix" a failure by weakening a rule, skipping a test or adding `any`. Find the cause.

Report only: what ran, pass or fail per step, the counts, and the exact error for any failure.
