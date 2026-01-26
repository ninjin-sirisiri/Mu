---
description: コミットする
---

# /commit — コミットワークフロー

Conventional Commits規約に従って適切なコミットを作成します。

---

## ワークフロー手順

### 1. スキルを読み込む

```
まず、committerスキルを読み込んでください:
c:\Users\user\Desktop\Mu\.agent\skills\committer\SKILL.md
```

### 2. ステージング状況を確認

// turbo
```powershell
git status --short
```

**ステージングされていない場合:**
- ユーザーに何をステージするか確認
- または `git add -A` を提案

### 3. 差分を分析

// turbo
```powershell
git diff --staged --stat
git diff --staged --name-only
```

### 4. コード品質チェック（任意）

```powershell
bunx tsc --noEmit
bunx oxlint
```

**エラーがある場合:**
- コミットを中断
- エラーを修正するか確認

### 5. コミットメッセージを構築

スキルのガイドラインに従って:

1. **Type を選択**: feat, fix, docs, style, refactor, perf, test, build, ci, chore
2. **Scope を特定** (任意): ui, tabs, command-palette, sidebar, adblock, tauri, config, deps
3. **Subject を作成**: 50文字以内、命令形、小文字開始、ピリオドなし
4. **Body を追加** (重要な変更の場合)
5. **Footer を追加**: Issue参照、BREAKING CHANGE

### 6. コミットを実行

```powershell
git commit -m "<type>(<scope>): <subject>

<body>

<footer>
Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

### 7. 結果を確認

// turbo
```powershell
git log -1 --oneline
```

### 8. 完了報告

ユーザーに報告:
- コミットハッシュ
- コミットメッセージ
- 変更ファイル数

---

## クイックリファレンス

**コミットメッセージテンプレート:**
```
<type>(<scope>): <subject>

<body - WHYとHOWを説明>

<footer - Issue参照、Breaking Changes>
Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**Types:**
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメントのみ
- `style`: フォーマット（コード変更なし）
- `refactor`: リファクタリング
- `perf`: パフォーマンス改善
- `test`: テスト追加/修正
- `build`: ビルドシステム変更
- `ci`: CI設定変更
- `chore`: その他のメンテナンス

**重要なルール:**
- 英語で書く
- 命令形を使う（"add" not "added"）
- 件名は50文字以内
- Issue参照を含める
- Breaking Changesは明記する
