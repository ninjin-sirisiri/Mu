---
name: commit
description: Conventional Commits に沿ってコミットする
---

# Goal
差分に合う Conventional Commits のコミットメッセージを作り、コミットする。

# Instructions
- `git status` / `git diff` / `git diff --staged` を確認してから作業する。
- 変更は最小限に留め、コミットのための無関係な修正はしない。
- 破壊的操作（`reset`/`rebase`/`push --force`）はしない。
- コミット前にメッセージ案を 1 つ提示し、問題なければそのままコミットする。

# Steps
1. `git status` で状態確認し、必要なら `git add -A` でステージする。
2. 差分から type（`feat`/`fix`/`refactor`/`docs`/`chore` 等）と scope を決める。
3. コミットメッセージ案を提示する。
4. `git commit -m "<type>(<scope>): <subject>"` を実行する。

# Output
- 採用したコミットメッセージ
- 作成されたコミットハッシュ
