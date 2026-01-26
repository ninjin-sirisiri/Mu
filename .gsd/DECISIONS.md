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

*Add new decisions above this line*
