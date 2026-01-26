# UI Design Guidelines

Muのミニマリスト哲学に基づくUIデザインガイドライン。全てのUI実装はこの原則に従うこと。

## デザイン哲学

**ミニマリズム・ファースト**

- 視覚的ノイズの徹底的な排除
- 情報密度を高めつつ、可読性を維持
- 装飾的要素を最小限に抑え、機能性を優先
- 「必要最小限」を常に問い続ける

**キーボード中心の設計**

- 全ての機能はキーボードで完結可能に
- マウス操作はオプション、キーボードが標準
- ショートカットキーを積極的に提供

**コンテンツへの集中**

- UIは黒子に徹する
- ユーザーの注意をコンテンツに向けさせる
- インターフェースが「消える」体験を目指す

## デザインシステム

### 基本方針

**Tailwind CSS デフォルト値の活用**

- カスタムデザイントークンは原則として定義しない
- Tailwind CSS 4の標準値を使用し、一貫性を保つ
- 必要最小限のカスタマイズに留める

### カラーシステム

**テーマ対応：ライト・ダーク両対応**

```typescript
// テーマの実装例
className = 'bg-white dark:bg-gray-900';
className = 'text-gray-900 dark:text-gray-100';
className = 'border-gray-200 dark:border-gray-800';
```

**カラーパレット（Tailwind標準を使用）**

- **プライマリ**: `gray-*`系を基調とする
- **アクセント**: 最小限の使用（リンク、フォーカス状態など）
- **セマンティックカラー**:
  - Success: `green-500`
  - Warning: `yellow-500`
  - Error: `red-500`
  - Info: `blue-500`

**コントラスト基準**

- WCAG 2.1 AA基準以上（4.5:1）を必須とする
- 小さいテキスト（18pt未満）: 4.5:1以上
- 大きいテキスト（18pt以上）: 3:1以上
- UIコンポーネント: 3:1以上

**テーマ切り替え**

- システム設定に追従（`prefers-color-scheme`）
- ユーザーが手動で切り替え可能
- 選択したテーマをローカルストレージに保存

### タイポグラフィ

**フォントファミリー**

- **システムフォント + Webフォント併用**
- プライマリ: Webフォント（Inter、Geist、または類似のモダンサンセリフ）
- フォールバック: システムフォントスタック
  ```css
  font-family:
    'InterVariable',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    Arial,
    sans-serif;
  ```

**タイポグラフィスケール（Tailwind標準）**

- `text-xs` (0.75rem / 12px): 補助的な情報、ラベル
- `text-sm` (0.875rem / 14px): 標準的なUI要素、ボディテキスト
- `text-base` (1rem / 16px): 主要なコンテンツ
- `text-lg` (1.125rem / 18px): 強調したいテキスト
- `text-xl` (1.25rem / 20px): セクション見出し
- `text-2xl` (1.5rem / 24px): ページタイトル

**基本スタイル**

- 行間: `leading-relaxed` (1.625) をデフォルトとする
- フォントウェイト:
  - Regular (400): 標準テキスト
  - Medium (500): 強調、ラベル
  - Semibold (600): 見出し
  - Bold (700): 最重要見出しのみ

**可読性の確保**

- 最小フォントサイズ: 12px (`text-xs`)
- 理想的な行長: 50-75文字（約600-800px）
- テキストとの余白を十分に確保

### スペーシング

**Tailwindスケール準拠（4px基本単位）**

- `space-1`: 4px - 密接した要素間
- `space-2`: 8px - 関連する要素間
- `space-3`: 12px - 小さなグループの区切り
- `space-4`: 16px - 標準的な要素間隔
- `space-6`: 24px - セクション内の区切り
- `space-8`: 32px - セクション間の区切り
- `space-12`: 48px - 大きなセクション区切り
- `space-16`: 64px - ページレベルの区切り

**パディングの基本方針**

- コンテナ内パディング: `p-4` または `p-6`
- ボタン内パディング: `px-4 py-2`
- カード内パディング: `p-6`

**マージンの使用**

- 基本的に親要素の `gap` または `space-y-*` を優先
- マージンは特定の理由がある場合のみ使用

### UI密度

**高密度・コンパクトレイアウト**

- 情報を効率的に表示
- スクロール量を最小限に抑える
- ホワイトスペースは意図的に使用し、無駄な余白は排除

**コンポーネントサイズ**

- ボタン: `h-9` (36px) - コンパクトながらクリック可能
- 入力フィールド: `h-9` (36px)
- アイコン: `w-5 h-5` (20px) または `w-4 h-4` (16px)
- チェックボックス/ラジオ: `w-4 h-4` (16px)

## コンポーネント設計

### 基本原則

**単一サイズの原則**

- 各コンポーネントは基本的に1つのサイズのみ
- サイズバリエーション（sm/md/lg）は原則として作らない
- 本当に必要な場合のみ、最小限のバリエーションを追加

**コンポーネントの再利用性**

- 小さく、単一責任のコンポーネントを作成
- Props経由でカスタマイズ可能に
- 合成可能な設計（Composition over Configuration）

**例: Buttonコンポーネント**

```typescript
// ❌ 複数サイズを避ける
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// ✅ 単一サイズ、必要に応じてバリアントのみ
<Button>Default</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="danger">Danger</Button>
```

### 視覚的階層

**フラットデザイン原則**

- シャドウは最小限（フォーカス状態、ドロップダウンなど必要な場合のみ）
- ボーダーで境界を明確化: `border border-gray-200 dark:border-gray-800`
- 背景色の微妙な違いで階層を表現

**推奨するシャドウ（必要最小限）**

```typescript
// モーダル、ドロップダウンなど、浮いている要素のみ
className = 'shadow-lg'; // 大きな浮遊要素
className = 'shadow-md'; // 中程度の浮遊要素
className = 'shadow-sm'; // 微妙な浮き上がり

// ホバー時の控えめなフィードバック
className = 'hover:shadow-sm transition-shadow';
```

**ボーダーの使用**

```typescript
// 標準的な境界線
className = 'border border-gray-200 dark:border-gray-800';

// 強調したい境界
className = 'border-2 border-gray-300 dark:border-gray-700';

// 微妙な区切り
className = 'border-t border-gray-100 dark:border-gray-900';
```

### アニメーションとトランジション

**最小限の使用原則**

- UX上必要な場合のみアニメーションを追加
- パフォーマンスを最優先
- ユーザーの操作を妨げない

**許可されるアニメーション**

```typescript
// ホバーフィードバック（推奨）
className = 'transition-colors hover:bg-gray-100 dark:hover:bg-gray-800';

// フォーカスリング（必須）
className = 'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2';

// トーストやモーダルの表示/非表示
className = 'transition-opacity duration-200 ease-in-out';

// ドロップダウンの展開/折りたたみ
className = 'transition-transform duration-150 ease-out';
```

**禁止事項**

- 不必要なローディングスピナー
- 装飾的なアニメーション（キラキラエフェクトなど）
- 長時間（300ms超）のアニメーション
- 複雑なキーフレームアニメーション

**アニメーション設定の推奨値**

- Duration: `150ms` - `200ms`（標準）
- Easing: `ease-in-out` または `ease-out`
- `prefers-reduced-motion` への対応を忘れずに

### アイコンシステム

**アイコンライブラリの使用**

- **推奨ライブラリ**: [Lucide React](https://lucide.dev/) または [Heroicons](https://heroicons.com/)
- 統一されたスタイルとサイズを保つ
- Tree-shakingが効くライブラリを選択

**アイコンの使用方針**

```typescript
import { Search, X, Menu } from 'lucide-react'

// 標準サイズ: 20px
<Search className="w-5 h-5" />

// 小さいアイコン: 16px
<X className="w-4 h-4" />

// テーマ対応
<Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
```

**アイコンの配置**

- テキストとアイコンの間隔: `gap-2` (8px)
- ボタン内のアイコン: 左揃えが基本
- アイコンのみのボタン: `p-2` で正方形に

**避けるべきこと**

- 異なるスタイルのアイコンの混在
- 過度な装飾的アイコン
- 意味のないアイコン（テキストで十分な場合）

## アクセシビリティ (a11y)

### キーボードナビゲーション（必須）

**基本要件**

- 全ての操作をキーボードで完結可能に
- 論理的なタブオーダーを保つ
- フォーカストラップを適切に実装（モーダルなど）

**標準キーボードショートカット**

- `Tab` / `Shift+Tab`: フォーカス移動
- `Enter` / `Space`: アクション実行
- `Escape`: モーダル/ドロップダウンを閉じる
- `Arrow Keys`: リスト内のナビゲーション
- `Home` / `End`: リストの先頭/末尾へ移動

**フォーカス表示（必須）**

```typescript
// 標準的なフォーカスリング
className =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900';

// ボタンのフォーカス
className = 'focus-visible:ring-2 focus-visible:ring-blue-500';

// インプットフィールドのフォーカス
className = 'focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50';
```

**インタラクティブ要素**

- クリック可能な要素は `<button>` または適切なセマンティック要素を使用
- `<div>` をボタンにしない（`role="button"` も避ける）
- disabled状態は視覚的に明確に: `disabled:opacity-50 disabled:cursor-not-allowed`

### ARIAラベル・ロール対応

**基本原則**

- セマンティックHTMLを最優先（ARIAは補完として使用）
- 必要な場合のみARIA属性を追加
- スクリーンリーダーでの動作を確認

**必須のARIA属性**

```typescript
// アイコンのみのボタン
<button aria-label="閉じる">
  <X className="w-5 h-5" />
</button>

// トグル状態
<button aria-pressed={isActive}>
  {isActive ? 'オン' : 'オフ'}
</button>

// 拡張可能な要素
<button aria-expanded={isOpen} aria-controls="dropdown-menu">
  メニュー
</button>

// ライブリージョン（トースト通知など）
<div role="status" aria-live="polite">
  保存しました
</div>
```

**セマンティックHTML優先**

```typescript
// ❌ 避ける
<div role="button" onClick={handleClick}>クリック</div>

// ✅ 推奨
<button onClick={handleClick}>クリック</button>

// ❌ 避ける
<div role="navigation">...</div>

// ✅ 推奨
<nav>...</nav>
```

### カラーコントラスト基準

**WCAG 2.1 AA準拠（必須）**

- 通常テキスト: 4.5:1以上
- 大きなテキスト: 3:1以上
- UIコンポーネント: 3:1以上

**推奨カラーコンビネーション（Tailwind）**

```typescript
// ライトモード
'text-gray-900 bg-white'; // 21:1 ✅
'text-gray-700 bg-gray-50'; // 10.7:1 ✅
'text-gray-600 bg-white'; // 7:1 ✅

// ダークモード
'text-gray-100 bg-gray-900'; // 17.4:1 ✅
'text-gray-300 bg-gray-900'; // 11.6:1 ✅
'text-gray-400 bg-gray-900'; // 8.1:1 ✅
```

**コントラストチェック**

- 開発時にブラウザの検証ツールでコントラストを確認
- WebAIMのContrast Checkerなどのツールを活用
- グレースケールで表示して判別可能かテスト

## レイアウト

### レスポンシブデザイン

**デスクトップ専用設計**

- 最小幅: `1024px` (Tailwindの `lg` ブレークポイント)
- それ以下の画面幅では「デスクトップでご利用ください」メッセージを表示
- タブレット・モバイルは正式サポート外

```typescript
// 最小幅の設定
className="min-w-[1024px]"

// 画面幅が狭い場合のメッセージ
<div className="lg:hidden flex items-center justify-center h-screen p-8">
  <p className="text-center">
    Muはデスクトップブラウザでの利用を推奨しています。<br />
    画面幅1024px以上でご利用ください。
  </p>
</div>
```

### グリッドとフレックスボックス

**Flexboxを優先**

- 1次元レイアウトには `flex` を使用
- 要素間の間隔は `gap` で統一

```typescript
// 横並び
className = 'flex items-center gap-4';

// 縦並び
className = 'flex flex-col gap-6';

// 中央揃え
className = 'flex items-center justify-center';
```

**Grid Layoutの使用**

- 2次元レイアウトが必要な場合のみ
- タブグリッドやカードレイアウトなど

```typescript
// 2カラムレイアウト
className = 'grid grid-cols-2 gap-4';

// 自動フィット
className = 'grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4';
```

## フィードバックとエラー表示

### トースト通知

**基本方針**

- 非破壊的なフィードバックに使用
- 画面右上または下に配置
- 自動消去（3-5秒）+ 手動クローズボタン

**実装ガイドライン**

```typescript
// トーストライブラリの推奨: sonner, react-hot-toast

// 成功メッセージ
toast.success('保存しました');

// エラーメッセージ
toast.error('保存に失敗しました');

// 情報メッセージ
toast.info('更新があります');
```

**トーストの種類**

- **Success**: 操作の成功（保存、削除など）
- **Error**: 操作の失敗、エラー
- **Warning**: 注意喚起
- **Info**: 情報提供

**スタイリング**

- ミニマルで控えめなデザイン
- フラットまたは微妙なシャドウ
- アイコン + テキスト（簡潔に）

### エラー状態

**インラインエラー（フォーム検証など）**

```typescript
// 入力フィールドのエラー状態
<input
  className={cn(
    "border-gray-300",
    error && "border-red-500 focus:border-red-500 focus:ring-red-500"
  )}
/>
{error && (
  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
    {error.message}
  </p>
)}
```

**エラーページ**

- 404、500などのエラーページはシンプルに
- エラーコード + 簡潔な説明 + ホームへのリンク

**ローディング状態**

- 最小限のスピナー
- 可能であればスケルトンスクリーンを使用
- 長時間ロード（3秒以上）の場合は進捗表示

## 具体的な実装パターン

### ボタン

```typescript
// プライマリボタン
<button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
  保存
</button>

// セカンダリボタン（Ghost）
<button className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md focus-visible:ring-2 focus-visible:ring-gray-500 transition-colors">
  キャンセル
</button>

// 危険なアクション
<button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-500 transition-colors">
  削除
</button>
```

### 入力フィールド

```typescript
<input
  type="text"
  className="h-9 px-3 w-full border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 placeholder:text-gray-400 dark:placeholder:text-gray-600"
  placeholder="テキストを入力"
/>
```

### カード

```typescript
<div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900">
  <h3 className="text-lg font-semibold mb-2">カードタイトル</h3>
  <p className="text-sm text-gray-600 dark:text-gray-400">
    カードの内容がここに入ります。
  </p>
</div>
```

### タブ（垂直タブバー）

```typescript
<div className="flex flex-col gap-1">
  <button
    className={cn(
      "px-4 py-2 text-left text-sm rounded-md transition-colors",
      isActive
        ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900"
    )}
  >
    タブ1
  </button>
</div>
```

### モーダル

```typescript
// Backdrop
<div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />

// Modal content
<div className="fixed inset-0 flex items-center justify-center p-4">
  <div className="w-full max-w-md p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg">
    <h2 className="text-xl font-semibold mb-4">モーダルタイトル</h2>
    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
      モーダルの内容
    </p>
    <div className="flex gap-3 justify-end">
      <button>キャンセル</button>
      <button>確認</button>
    </div>
  </div>
</div>
```

## チェックリスト

新しいUIコンポーネントを実装する前に、以下を確認すること：

**デザイン原則**

- [ ] ミニマリストの原則に沿っているか？
- [ ] 本当に必要な要素のみか？装飾的でないか？
- [ ] 高密度・コンパクトなレイアウトか？

**技術実装**

- [ ] Tailwindのデフォルト値を使用しているか？
- [ ] 単一サイズで実装されているか？（不要なバリエーションがないか）
- [ ] ライト・ダークモード両対応か？

**アクセシビリティ**

- [ ] キーボードで全ての操作が可能か？
- [ ] フォーカス表示が明確か？
- [ ] 適切なARIAラベル・ロールが設定されているか？
- [ ] カラーコントラストがWCAG AA基準を満たしているか？

**パフォーマンス**

- [ ] 不要なアニメーションがないか？
- [ ] アニメーションは200ms以内か？
- [ ] `prefers-reduced-motion` に対応しているか？

**一貫性**

- [ ] 既存のコンポーネントとスタイルが統一されているか？
- [ ] スペーシングはTailwindスケールに準拠しているか？
- [ ] アイコンのサイズとスタイルが統一されているか？

## 参考リソース

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Lucide Icons](https://lucide.dev/)
- [React ARIA](https://react-spectrum.adobe.com/react-aria/) - アクセシブルなコンポーネントのパターン

---

**最終更新**: 2026-01-09
**バージョン**: 1.0.0
