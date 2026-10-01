---
description: Commit staged changes, push to the current branch, and open a pull request
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git commit:*), Bash(git push:*), Bash(git branch:*), Bash(gh pr create:*)
---

Commit all staged changes, push them to the current branch, and open a pull request.

Follow these steps in order:

1. Run `git status` to show what will be committed.
2. Run `git diff --staged` to review the staged changes. If nothing is staged, stop and tell me.
3. Write a commit message in the Conventional Commits format (e.g. `feat: ...`, `fix: ...`, `refactor: ...`, `docs: ...`, `test: ...`, `chore: ...`) based on what was staged. Use a concise subject line, and add a body explaining the why if the change is non-trivial.
4. Run `git commit -m "<message>"` with that message.
5. Run `git push origin <current-branch>`, using the current branch name from `git branch --show-current`.
6. Run `gh pr create --fill --body "<commit-message>"` to open a pull request, using the commit message as the PR title and body.

When done, show me the commit hash and the PR URL.

$ARGUMENTS
