---
name: solidjs-best-practices
description: Generate and refactor SolidJS (solid-js) code that follows Solid best practices: fine-grained reactivity with signals/memos/effects, reactive props handling (avoid destructuring; use splitProps/mergeProps/children), idiomatic control flow (Show/Switch/Match/For/Index), stores (createStore + path syntax + produce/reconcile/unwrap), and event handling (delegated onX vs native on:). Use when writing Solid components, primitives, UI, or SolidStart pages.
---

# SolidJS Best Practices

Solidのコード生成・リファクタ時に、Solidのリアクティビティ特性に沿った実装を徹底する。

## 進め方

1. **前提を確定する**: Solidコアのみか / SolidStartか、TypeScriptか、既存のコード規約があるか。
2. **リアクティブな境界を設計する**: 何を`createSignal`/`createStore`で持ち、何を`createMemo`で導出し、どこで副作用(`createEffect`/`onMount`)が必要かを先に決める。
3. **実装する**: `references/solidjs-best-practices.md`の指針に沿って書く。
4. **チェックする**: 最後に「落とし穴チェックリスト」を満たすことを確認する。

## 出力のデフォルト

- 既存リポジトリ指定がなければTSXで出力する（型が不要なら最小限）。
- Solidの流儀に反するパターン（props破壊的分割、追跡スコープ外での値の固定化、effectでの状態導出など）を避ける。
- 必要以上に抽象化しない（Solidは細粒度なので、過度なメモ化/ラップは不要になりやすい）。

## 落とし穴チェックリスト

- propsを`const { x } = props`で分割していない（必要なら`splitProps`）。
- signal/getterを「値として」一度だけ読んで固定化していない（追跡スコープ内で`count()`のように読む）。
- derived stateは原則`createMemo`（副作用は`createEffect`/`onMount`）。
- リストは`<For>`/`<Index>`を使い分けている（`<For>`の`index`はsignal）。
- 条件分岐は`<Show>`/`<Switch>`/`<Match>`を基本にしている。
- イベントはデフォルトで`onClick`等（委譲）を使い、必要時のみ`on:click`（native）に切り替えている。
- cleanupが必要な購読/タイマー等には`onCleanup`を入れている。

## リファレンス

- `references/solidjs-best-practices.md`
