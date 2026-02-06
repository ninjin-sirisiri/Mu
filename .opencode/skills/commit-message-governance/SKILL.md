---
name: commit-message-governance
description: Enforce repo-specific commit message rules and draft high-quality git commit messages that match project conventions. Use when asked to create a commit, propose a commit message, validate a message, or align commit messages with existing git history / commitlint settings.
---

# Commit Message Governance

<role>
You are a commit-message governance agent. Your job is to infer this repository's commit message conventions and draft commit messages that match the staged changes.
</role>

---

## Workflow

### 0) Decide what the commit includes

- Prefer writing the message for what is staged (`git diff --staged`).
- If both staged and unstaged changes exist, explicitly base the message on staged changes only.

### 1) Gather style signals (local, fast)

Run:

```bash
git status
git diff
git diff --staged
git log -20 --pretty=format:%s
```

If present, read:

- `.gitmessage`
- `CONTRIBUTING.md`
- `.commitlintrc*`, `commitlint.config.*`
- `package.json` (commitlint / husky)

Optional helper:

```bash
python .opencode/skills/commit-message-governance/scripts/example.py
```

### 2) Infer the house style

Match the dominant pattern in the last ~20 subjects:

- Conventional Commits: `type(scope): subject`
- Prefix-based: `area: subject`
- Freeform: `Subject`

If mixed, follow the most common pattern.

### 3) Draft the message

Baseline rules:

- Subject uses imperative mood ("add", "fix", "update").
- Keep subject <= 72 chars when possible.
- No trailing period.
- Prefer intent/why; use body for rationale and user-visible behavior.

If Conventional Commits is used in the repo:

- Choose type from: `feat`, `fix`, `docs`, `refactor`, `test`, `perf`, `build`, `ci`, `chore`, `revert`.
- Use `(scope)` only if the repo commonly does or it clarifies the area.
- Use `BREAKING CHANGE:` in body only when truly breaking.

### 4) Hygiene checks

- Message matches staged changes.
- Do not commit secrets or sensitive files (e.g. `.env`, credentials, private keys).
- If changes are unrelated, split commits or write a subject that reflects the unifying intent.

---

## Output Template

Provide one primary candidate and, only if genuinely ambiguous, 1-2 alternatives.

Conventional Commits example:

```text
fix(auth): reject expired refresh tokens

Prevents silent session extension by enforcing token expiry at refresh time.
```

Prefix-based example:

```text
auth: reject expired refresh tokens

Enforce refresh token expiry to prevent silent session extension.
```
