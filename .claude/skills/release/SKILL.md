---
name: release
description: Cut a mcp-server-template release - decide the semver bump from the commits since the last tag, bump the version, write the release notes in the docs, commit, tag, push and create the GitHub release; the owner publishes to npm, then the extension in agent-kit-extensions pins the new version. Only when the owner explicitly asks to release or publish.
disable-model-invocation: true
---

# Release mcp-server-template

A release is a version commit, a `vX.Y.Z` tag on `main`, a GitHub release and the same version on npm as `@falkenslab/mcp-server-template`. Nothing is published or pushed without the owner asking.

## 1. Preconditions

Stop and report at the first that fails:

- No `"private": true` in `package.json`: with it, this is still the template, which isn't released (`npm run init` removes it).
- On `main`, working tree clean, up to date with `origin/main` (`git fetch && git status -sb`). No remote yet: stop and ask.
- The `verify` skill is green, the site included.
- `gh auth status` works.
- The documentation describes every change since the last tag (`update-docs`).

## 2. Decide the bump

`git describe --tags --abbrev=0` (none: the first release), then `git log <tag>..HEAD --format=%s`. While `0.x`: **minor** for any `feat` or breaking change (a tool removed or renamed, an input or output changed incompatibly, a setting renamed); **patch** for fixes, docs, refactors and chores only. **major** only when the owner declares `1.0.0`. If nothing but docs or chores changed, say a release may not be worthwhile and confirm first. State the bump and why.

## 3. Bump and notes

`npm version <patch|minor> --no-git-tag-version` (updates `package.json` and the lock; `src/version.ts` reads it at build time). Draft the notes in English from the commits: new tools, changed tools (with what a client must change), fixes.

Add the version to `docs/content/releases.md` and its Spanish page (`docs/i18n/es/docusaurus-plugin-content-docs/current/releases.md`): date and the notes in plain terms for users. Rebuild the server and run `npm run tools` and `npm run build` in `docs/`.

## 4. Commit, tag, push

```
git add package.json package-lock.json docs
git commit -F -        # "chore(release): vX.Y.Z" plus the session's attribution trailer
git tag vX.Y.Z
git push origin main
git push origin vX.Y.Z
gh release create vX.Y.Z --verify-tag --title "vX.Y.Z" --notes "<notes>"
```

Check with `npm pack --dry-run` that the package holds only `dist/server.mjs`, `package.json`, the README and the license. Tags are lightweight; never move or delete one, never force-push. If a step fails half-way, report exactly what is pushed and what isn't.

## 5. The owner publishes

Ask the owner to run `npm publish` themselves (with their one-time code; `prepublishOnly` runs every check). Never run it for them. A published version can't be reused: fix forward with a patch.

## 6. Pin it in the extension

Once `npm view @falkenslab/mcp-server-template version` shows it, the extension in agent-kit-extensions pins it: `npx -y @falkenslab/mcp-server-template@X.Y.Z` in its `.mcp.json`, and its `plugin.json` requirements copied from `src/requirements.ts` if they changed. That's a change in that repository, from its own session unless the owner asks for it here. Report the version, tag, release URL and npm page.
