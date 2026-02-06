# SolidJS ベストプラクティス（コード生成用）

このドキュメントは「Solidのコードを生成する時に、失敗しやすい点を避けつつ、Solidらしい書き方に寄せる」ための実践チェック集。

## 1) リアクティビティの基本

- コンポーネント関数は基本的に**1回だけ**実行される。更新は細粒度に追跡された式（JSX内、memo/effect等）だけが再評価される。
- signalのgetterは**関数**。値が必要な場所で`count()`のように呼ぶ。
- 「追跡スコープ外」で値を読んでも、その後は更新されない（単なる初期化になる）。必要なら`createEffect`/`createMemo`/JSX内で読む。

## 2) Signals

- 単一値・独立状態は`createSignal`。
- 更新は`setCount(prev => prev + 1)`の関数形式を優先（競合に強い）。

良い例:

```tsx
const [count, setCount] = createSignal(0);
const inc = () => setCount((c) => c + 1);

return <button onClick={inc}>{count()}</button>;
```

避けたい例（値の固定化）:

```tsx
const now = count();
return <span>{now}</span>; // nowは更新されない
```

## 3) Props（重要: 破壊的分割を避ける）

- Solidではpropsがリアクティブな読み取り口になり得るため、`const { foo } = props`は**リアクティビティを壊しやすい**。
- 直接`props.foo`で読むか、`const foo = () => props.foo`のようにaccessor化する。
- 分割が必要なら`splitProps`を使う（リアクティビティを保持）。
- デフォルト値の注入は`mergeProps`を使う（`Object.assign`的にしない）。
- `props.children`を複数回参照する場合は`children(() => props.children)`で安全化。

推奨:

```tsx
function MyComponent(props: { name: string }) {
  return <div>Hello {props.name}</div>;
}
```

`splitProps`:

```tsx
const [local, rest] = splitProps(props, ["value", "onChange"]);
```

## 4) Derived State: memos優先、effectsは副作用に

- 値の導出（派生状態）は`createMemo`。
- `createMemo`は**純粋関数**に保つ（memo内でsetterを呼ばない）。
- `createEffect`はログ出力、DOM操作、購読、外部I/Oなど**副作用**のため。
- `createEffect`内でsignalを更新すると無限ループや余計な更新を招きやすい。導出はmemoへ。

推奨:

```tsx
const isEven = createMemo(() => count() % 2 === 0);
```

副作用:

```tsx
createEffect(() => {
  console.log(count());
});
```

## 5) ライフサイクル

- 1回だけ走らせたい処理（初回fetchなど）は`onMount`。
- タイマー、購読解除、イベント解除などは`onCleanup`。

```tsx
onMount(() => {
  const id = setInterval(() => setCount((c) => c + 1), 1000);
  onCleanup(() => clearInterval(id));
});
```

## 6) Stores（入れ子状態・複雑状態）

- オブジェクト/配列の入れ子状態は`createStore`。
- 更新は`setStore("users", i, "name", "...")`などの**path syntax**を使う。
- まとめて変更するなら`produce`。
- サーバから来た新データを差分更新するなら`reconcile`。
- 非追跡の外部へ渡すなら`unwrap`。

```tsx
const [state, setState] = createStore({
  users: [] as { id: string; name: string }[],
});
setState("users", state.users.length, { id: "u1", name: "Ada" });
```

## 7) Control Flow（条件分岐・リスト）

条件:

- `if`/三項演算子の多用より、`<Show>`/`<Switch>`/`<Match>`で意図を明確にする。

```tsx
<Show when={ready()} fallback={<Spinner />}>
  <Content />
</Show>
```

リスト:

- 順序/長さがよく変わる: `<For>`
- 順序/長さが安定で中身が変わる: `<Index>`
- `<For>`の`index`はsignalなので`index()`。
- `<Index>`は`item`がsignalなので`item()`。

```tsx
<For each={items()}>{(item, i) => <li>{i()}: {item.name}</li>}</For>
<Index each={rows()}>{(row) => <Row value={row()} />}</Index>
```

## 8) Event Handling（委譲 onX と native on:）

- 既定は`onClick`などの**委譲イベント**（高効率）。
- `stopPropagation`を期待通りに効かせたい等、必要な場合だけ`on:click`の**native**を使う。
- ハンドラ最適化には`onClick={[handler, data]}`のバインド形式が使える。

```tsx
<button onClick={[onSelect, id]}>Select</button>
<button on:click={(e) => { e.stopPropagation(); }}>Native</button>
```

## 9) 実装時の型付け（TSの場合）

- propsは明示的に型を付ける（`{ ... }`で十分）。
- イベントは`e.currentTarget`を使うと型推論が安定しやすい。

```tsx
<input value={text()} onInput={(e) => setText(e.currentTarget.value)} />
```

## 10) 生成物の最終チェック（短縮版）

- propsを分割していない（必要なら`splitProps`）
- derivedはmemo、effectは副作用
- 追跡スコープ外でsignal値を固定化していない
- リスト/条件はSolidの制御コンポーネントを使っている
- cleanupが必要なものは`onCleanup`

## 参考（一次ソース）

このスキルの指針は、Solid公式ドキュメント（solidjs/solid-docs）に基づく。

- Signals: `src/routes/concepts/signals.mdx`
- Intro to reactivity: `src/routes/concepts/intro-to-reactivity.mdx`
- Effects: `src/routes/concepts/effects.mdx`
- Props: `src/routes/concepts/components/props.mdx`
- Event handlers: `src/routes/concepts/components/event-handlers.mdx`
- Memos: `src/routes/concepts/derived-values/memos.mdx`
- List rendering: `src/routes/concepts/control-flow/list-rendering.mdx`
- Conditional rendering: `src/routes/concepts/control-flow/conditional-rendering.mdx`
- Stores: `src/routes/concepts/stores.mdx`
