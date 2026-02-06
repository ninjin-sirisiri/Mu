# Commit Message Checks (Repo Signals)

## What to check in a repo

- `commitlint.config.*` / `.commitlintrc*`: required subject format, allowed types/scopes
- `CONTRIBUTING.md`: project-specific conventions (ticket IDs, issue refs)
- `.gitmessage`: template used by contributors
- Recent `git log --pretty=format:%s`: the real source of truth

## Good subjects (general)

- Imperative: "add", "fix", "remove", "refactor"
- Concrete: names the area and behavior
- Honest: matches staged changes

## Common pitfalls

- Too vague: "update" / "changes" / "wip"
- Includes implementation detail but not intent
- Describes unstaged work
- Mentions secrets or internal URLs
