---
name: run-server
description: tauri dev をバックグラウンドで起動する
---

# Goal
開発サーバーをバックグラウンドで起動し、ログを追える状態にする。

# Instructions
- 既に起動していないか確認してから実行する（重複起動しない）。
- 標準出力/標準エラーは `.codex/vite-dev.out.log` / `.codex/vite-dev.err.log` にリダイレクトする。

# Steps (PowerShell)
1. 既存プロセスを確認する（例: `Get-Process bun -ErrorAction SilentlyContinue`）。
2. 起動する:
   - `Start-Process bun -ArgumentList @('run','tauri','dev') -NoNewWindow -RedirectStandardOutput .codex/vite-dev.out.log -RedirectStandardError .codex/vite-dev.err.log`
3. ログを追う: `Get-Content .codex/vite-dev.out.log -Wait`

# Output
- 起動したこと（可能なら PID）
- ログ確認方法（上記コマンド）
