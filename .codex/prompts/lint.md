---
name: lint
description: bun lint を実行して修正する
---

# Goal
`bun lint` を実行し、出たエラー/警告を最小修正で解消する。

# Instructions
- まず `bun lint` を実行し、出力に沿って直す。
- ルール回避のための不自然な変更はしない。
- TypeScript は `any` を使わず、型を正しく直す。
- 修正後に `bun lint` を再実行し、クリーンになるまで繰り返す。

# Output
- 修正したファイル一覧
- 残る警告/エラーがあれば、その理由と次の打ち手
