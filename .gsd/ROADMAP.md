# ROADMAP.md

> **Current Phase**: Not started
> **Milestone**: v1.0 — Core Browser Experience

## Must-Haves (from SPEC)

- [x] SPEC.md finalized
- [ ] URL入力でWebページ表示
- [ ] 複数タブの開閉・切り替え
- [ ] コマンドパレット操作
- [ ] キーボードショートカット動作

---

## Phases

### Phase 1: Foundation — WebView統合
**Status**: ⬜ Not Started
**Objective**: TauriでWebViewを表示し、基本的なナビゲーションを実装する

**Deliverables:**
- [ ] WebViewコンポーネントの作成
- [ ] URL読み込み機能
- [ ] ナビゲーション（戻る、進む、リロード）
- [ ] 基本ウィンドウレイアウト

**Technical Notes:**
- Tauri v2の `WebviewWindow` API使用
- Rust側でナビゲーションコマンドを実装
- SolidJSでUIを構築

---

### Phase 2: Tab System — タブ管理
**Status**: ⬜ Not Started
**Objective**: 複数タブの作成・管理・切り替えを実装する

**Deliverables:**
- [ ] タブ状態管理（store）
- [ ] 新規タブ作成
- [ ] タブ切り替え
- [ ] タブを閉じる
- [ ] 垂直タブリスト表示（サイドバー左固定）

**Technical Notes:**
- `@simple-stack/store` でタブ状態管理
- 各タブにWebViewを関連付け
- アクティブタブのみ表示

---

### Phase 3: Command Palette — コマンドパレット
**Status**: ⬜ Not Started
**Objective**: `Ctrl+K`で起動するコマンドパレットを実装する

**Deliverables:**
- [ ] モーダルダイアログUI
- [ ] URL入力 → ナビゲーション
- [ ] Web検索（デフォルト検索エンジン）
- [ ] タブ操作コマンド
- [ ] 設定アクセス（基本）

**Technical Notes:**
- コマンドのファジー検索
- キーボードナビゲーション
- アクション実行後の自動クローズ

---

### Phase 4: Keyboard Shortcuts — キーボード操作
**Status**: ⬜ Not Started
**Objective**: グローバルショートカットキーを実装する

**Deliverables:**
- [ ] `Ctrl+K` — コマンドパレット
- [ ] `Ctrl+T` — 新規タブ
- [ ] `Ctrl+W` — タブを閉じる
- [ ] `Ctrl+1-9` — タブ切り替え
- [ ] `Ctrl+R` — リロード

**Technical Notes:**
- Tauriのグローバルショートカット or Webイベントリスナー
- コンフリクト回避（WebView内の入力と区別）

---

### Phase 5: Polish — 仕上げ
**Status**: ⬜ Not Started
**Objective**: パフォーマンス最適化とUI調整

**Deliverables:**
- [ ] 起動速度1秒以内達成
- [ ] メモリ使用量測定・最適化
- [ ] UIスタイリング調整
- [ ] エラーハンドリング強化

**Technical Notes:**
- リリースビルドでのパフォーマンス計測
- 不要な依存関係の削除

---

## Phase Dependencies

```
Phase 1 (Foundation)
    └── Phase 2 (Tab System)
            ├── Phase 3 (Command Palette)
            └── Phase 4 (Keyboard Shortcuts)
                    └── Phase 5 (Polish)
```

---

## Milestone Completion Checklist

When all phases are done:
- [ ] All success criteria from SPEC.md verified
- [ ] Performance targets met
- [ ] README updated with usage instructions
- [ ] v1.0 release tag created

---

*Last Updated: 2026-01-26*
