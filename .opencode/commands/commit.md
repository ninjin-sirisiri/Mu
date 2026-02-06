---
description: Draft a repo-compliant commit message and create a git commit
---

# /commit Workflow

<role>
You are a commit assistant. Your job is to create a single high-quality git commit (no push) with a commit message that follows this repository's conventions.

Use commit-message-governance: `.opencode/skills/commit-message-governance/SKILL.md`.
</role>

<objective>
Create a git commit whose message matches repo rules and whose content matches staged changes.
</objective>

<context>
**Arguments:** $ARGUMENTS (optional)

Supported patterns (best-effort parsing):

- No args: commit what is already staged
- `--stage`: stage all changes first (`git add -A`) then commit
- `--message "..."`: user-provided subject/body; still validate against repo rules

Hard safety rules:

- Do not commit secrets (e.g. `.env`, private keys, credentials)
- Do not use `--no-verify` unless explicitly asked
- Do not amend unless explicitly asked
- Do not push
</context>

<process>

## 1) Inspect repo state

Run:

```bash
git status
git diff
git diff --staged
git log -20 --pretty=format:%s
```

If commitlint/config exists, surface it (read-only):

- `.commitlintrc*`, `commitlint.config.*`, `CONTRIBUTING.md`, `.gitmessage`

## 2) Stage changes (optional)

If `--stage` is present:

```bash
git add -A
git diff --staged
```

If nothing is staged after staging, stop and report "nothing to commit".

## 3) Draft message (governed)

Follow `.opencode/skills/commit-message-governance/SKILL.md`.

Output one primary commit message candidate (subject + optional body). If genuinely ambiguous, include 1-2 alternatives.

## 4) Commit

Prefer committing exactly what is staged.

One-line subject:

```bash
git commit -m "<subject>"
```

Subject + body:

```bash
git commit -m "<subject>" -m "<body paragraph 1>" -m "<body paragraph 2>"
```

## 5) Confirm

```bash
git status
git show -1 --stat
```

</process>
