---
name: sync-issues
description: Keep docker-mcp's MiniSpec feature and fix notes (.minispec/features/) and its GitHub issues in sync, both ways, in English - open and link the issue a note lacks, write and link the note an open issue lacks, close with a solution summary the issue whose note is done. Use when the user asks to sync issues and features, after creating or finishing a note by hand, or when asked what's pending. Only once the repository has a GitHub remote.
---

# Sync features and issues

## 0. Is there a repository?

`git remote get-url origin`. If there's none, stop and say so. Never create the GitHub repository yourself; the owner decides when (and whether it's public).

## 1. Collect both sides

```
ls .minispec/features/
gh issue list --state all --limit 100 --json number,title,state,labels,body
```

A note is linked when it has an `Issue: [#N](<issue URL>)` line right under its title. An issue is linked when its body's last line points to `.minispec/features/<file>.md`. The sync goes both ways: every note has its issue, and every open issue has its note.

## 2. Fix each mismatch

- **Note without an issue:** open one (`gh issue create --label feature` or `--label fix`; `gh label create` if missing). Title: what it achieves for someone who uses the server. Body: the problem and the proposal in a few sentences (not the note's wording), and a last line `Feature: \`.minispec/features/<slug>.md\`` (`Fix:` for a fix). Then add the `Issue:` line under the note's title, with a blank line before and after.
- **Open issue without a note:** write it from the issue and the real code, as `minispec-feature` does (`<slug>.md`, Goal / Context / Changes / Acceptance) for a change, or as `minispec-bugfix` does (`fix-<slug>.md`) for something broken: the issue's problem and proposal, checked against the code and the decisions it touches, never more than it asks. If the issue is too thin to write Changes and Acceptance from, ask rather than invent them. Add the `Issue:` line under the note's title, then a last line `Feature: \`.minispec/features/<slug>.md\`` (`Fix:` for a fix) to the issue's body (`gh issue edit N --body-file`, no trailing newline), and its `feature` or `fix` label.
- **Note with an issue that isn't linked from it:** add the `Issue:` line.
- **Issue not in English:** translate its title and body with `gh issue edit`; don't open a duplicate.
- **Open issue whose note no longer exists:** the work is done or dropped. Find the commits (`git log --oneline -- .minispec/features/<file>.md` and after), then close it with a comment on the solution: what changed for clients, the design choices, how it was verified, the commits (`gh issue close N --comment "…"`). If dropped, say why. Ask when you can't tell.
- **Closed issue whose note still exists:** ask whether to reopen the issue or delete the note.

## 3. Commit

Commit the notes you linked or wrote (`docs: link <slug> to its issue`, `docs(minispec): notes for #N…`, with the session's attribution trailer); push only if asked. Report the notes and issues, and what you opened, edited or closed.

## Rules

- One issue per note; search before creating.
- Never close an issue for work that isn't pushed.
- The notes' lifecycle belongs to `minispec-feature`, `minispec-bugfix` and `minispec-implement`; this skill repairs drift.
