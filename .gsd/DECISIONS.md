# DECISIONS.md — Architecture Decision Records

> Log of significant technical and design decisions.

## Format

Each decision follows this structure:
```
## ADR-XXX: Title
**Date:** YYYY-MM-DD
**Status:** Proposed | Accepted | Deprecated | Superseded
**Context:** Why we needed to make this decision
**Decision:** What we decided
**Consequences:** The trade-offs and impacts
```

---

## ADR-001: Tauri v2 + SolidJS Stack
**Date:** 2026-01-26
**Status:** Accepted
**Context:** 軽量ブラウザを構築するためのフレームワーク選定が必要だった。
**Decision:** Tauri v2（Rust + OS Native WebView）をコアに、SolidJSをUIフレームワークとして採用。
**Consequences:** 
- ✅ デスクトップアプリのバンドルサイズが小さい
- ✅ OSネイティブWebViewでメモリ効率が良い
- ✅ SolidJSはReactより軽量で高速
- ⚠️ WebView2/WKWebViewの挙動差異に注意が必要

---

## ADR-002: Sidebar Fixed Left for v1.0
**Date:** 2026-01-26
**Status:** Accepted
**Context:** サイドバーの配置オプション（左/右、固定/自動隠蔽）の優先度を決定する必要があった。
**Decision:** v1.0ではサイドバーを左側固定のみとし、右側配置と自動隠蔽はv1.1以降に延期。
**Consequences:**
- ✅ 実装スコープを削減
- ✅ まずコア機能に集中できる
- ⚠️ 左利きユーザーへの配慮は後回し

---

## ADR-003: Command Palette as Primary UI
**Date:** 2026-01-26
**Status:** Accepted
**Context:** 従来のアドレスバーを排除し、ミニマルなUIを実現したい。
**Decision:** コマンドパレット（`Ctrl+K`）をURL入力・検索・操作の中心に据える。
**Consequences:**
- ✅ 視覚的ノイズを削減
- ✅ キーボード中心の操作体験
- ⚠️ マウスユーザーには学習コストが発生

---

## ADR-004: Phase 1 — WebView Architecture
**Date:** 2026-01-26
**Status:** Accepted
**Context:** Phase 1でWebViewをどのように統合するかの設計決定が必要だった。

### Decisions

#### 1. Child WebView方式を採用
- 単一ウィンドウ内にSolidJS UI（サイドバー）とWebViewを並べて配置
- `window.add_child()` を使用してWebViewを埋め込む
- **理由:** サイドバーとWebViewの同一ウィンドウ配置が自然で、Phase 2のタブシステムとの統合が容易

#### 2. フロントエンド主導のナビゲーション
- SolidJSからTauri IPCでRustのナビゲーションコマンドを呼び出す
- 状態管理はフロントエンド側で行う
- **理由:** UIイベントとの統合が容易で、Phase 2/3との一貫性が保たれる

#### 3. サイドバー幅は固定値
- 初期実装では固定幅（200px程度）
- リサイズ機能は余裕があればv1.0に含める、なければv1.1以降
- **理由:** スコープを絞ってコア機能に集中

#### 4. ナビゲーションボタンはサイドバー上部
- 「戻る」「進む」「リロード」ボタンをサイドバー上部に配置
- **理由:** 常にアクセス可能で視認性が高い

#### 5. デフォルトURLはgoogle.com
- 新規タブのデフォルトは `https://www.google.com`
- 将来的にはユーザー設定で変更可能にする（v1.1以降）
- **理由:** 即座に検索を開始できる利便性

**Consequences:**
- ✅ 実装スコープが明確になった
- ✅ アーキテクチャの方向性が決定
- ⚠️ サイドバーリサイズは優先度低（Nice-to-have）
- ⚠️ デフォルトURL設定は後日実装

---

*Add new decisions above this line*
