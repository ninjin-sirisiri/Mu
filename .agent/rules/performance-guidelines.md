# Performance Guidelines

## 概要

Muは「軽量でミニマリスト」なブラウザを目指しており、パフォーマンスは最優先事項です。このドキュメントでは、フロントエンドとバックエンドの両方におけるパフォーマンスのベストプラクティスを定義します。

**重視するパフォーマンス指標：**

- **起動時間**: アプリケーションの起動からインタラクティブになるまでの時間
- **メモリ使用量**: RAM フットプリントの最小化とメモリリークの防止
- **レンダリング速度**: UI 更新、タブ切り替え、スクロールなどの応答性
- **バンドルサイズ**: JavaScript バンドルサイズとロード/パース時間

## フロントエンド (React/TypeScript) のベストプラクティス

### 起動時間の最適化

**遅延読み込み (Lazy Loading)**

```typescript
// 推奨: 大きなコンポーネントは React.lazy で遅延読み込み
const SettingsPanel = React.lazy(() => import('./components/SettingsPanel'));

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <SettingsPanel />
    </Suspense>
  );
}
```

**初期レンダリングの最小化**

- 初期表示に不要なコンポーネントは遅延レンダリング
- 条件付きレンダリングを活用して、非表示時はレンダリングしない
- コマンドパレットなど、ユーザー操作後に表示される UI は遅延初期化

```typescript
// 推奨: 必要になるまでレンダリングしない
{isCommandPaletteOpen && <CommandPalette />}

// 非推奨: 常にレンダリング
<CommandPalette visible={isCommandPaletteOpen} />
```

### レンダリング速度の最適化

**不要な再レンダリングの防止**

```typescript
// React.memo で不要な再レンダリングを防ぐ
const TabItem = React.memo(({ tab, onSelect }: TabItemProps) => {
  return <div onClick={() => onSelect(tab.id)}>{tab.title}</div>;
});

// useCallback でコールバック関数を安定化
const handleTabSelect = useCallback((tabId: string) => {
  setActiveTab(tabId);
}, []); // 依存配列に注意

// useMemo で重い計算結果をキャッシュ
const filteredTabs = useMemo(() => {
  return tabs.filter(tab => tab.title.includes(searchQuery));
}, [tabs, searchQuery]);
```

**リストレンダリングの最適化**

```typescript
// 長いリスト（30+ アイテム）には仮想化を検討
import { FixedSizeList } from 'react-window';

// 適切な key を必ず指定
{tabs.map(tab => (
  <TabItem key={tab.id} tab={tab} /> // UUID や一意な ID を使用
))}
```

**状態更新のバッチ処理**

```typescript
// React 18 の自動バッチングを活用
// 複数の setState は自動的にバッチされる
const handleMultipleUpdates = async () => {
  setLoading(true);
  setError(null);
  const data = await fetchData(); // これらは自動的にバッチされる
  setData(data);
  setLoading(false);
};
```

### バンドルサイズの最適化

**コード分割 (Code Splitting)**

```typescript
// ルートベースのコード分割
const routes = [
  {
    path: '/settings',
    component: React.lazy(() => import('./pages/Settings')),
  },
];

// 機能ごとのコード分割
const AdBlocker = React.lazy(() => import('./features/AdBlocker'));
```

**依存関係の最小化**

```typescript
// 推奨: 必要なものだけインポート
import { useState, useEffect } from 'react';

// 非推奨: 全体をインポート
import * as React from 'react';

// 推奨: Tree-shaking 可能なライブラリを選択
import { format } from 'date-fns/format'; // date-fns は tree-shakable

// 検討: 大きな依存関係は本当に必要か？
// 例: lodash の代わりにネイティブ JS メソッドで十分な場合が多い
```

**動的インポート**

```typescript
// 条件付きで必要な機能は動的インポート
if (enableAdvancedFeatures) {
  const { AdvancedAnalytics } = await import('./advanced-analytics');
  AdvancedAnalytics.track();
}
```

### メモリリークの防止

**Effect のクリーンアップ**

```typescript
useEffect(() => {
  const subscription = eventBus.subscribe('tab-change', handleTabChange);

  // クリーンアップ関数で必ずリソースを解放
  return () => {
    subscription.unsubscribe();
  };
}, []);

// タイマーのクリーンアップ
useEffect(() => {
  const timerId = setInterval(updateTime, 1000);
  return () => clearInterval(timerId);
}, []);
```

**イベントリスナーの管理**

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // キーボードショートカット処理
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

**大きなオブジェクトの参照管理**

```typescript
// useRef で DOM 参照を保持する際は、不要になったらクリア
const videoRef = useRef<HTMLVideoElement>(null);

useEffect(() => {
  return () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = ''; // メモリ解放
      videoRef.current = null;
    }
  };
}, []);
```

## バックエンド (Rust/Tauri) のベストプラクティス

### コマンドの効率的な実装

**軽量なコマンドを優先**

```rust
// 推奨: 軽量で同期的なコマンド
#[tauri::command]
fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

// 重い処理は非同期コマンドに
#[tauri::command]
async fn fetch_bookmarks() -> Result<Vec<Bookmark>, String> {
    // DB アクセスなど
    tokio::task::spawn_blocking(|| {
        // 重い同期処理
    }).await.map_err(|e| e.to_string())
}
```

**データの効率的な受け渡し**

```rust
// 推奨: 必要最小限のデータを返す
#[tauri::command]
fn get_tab_titles() -> Vec<String> {
    get_tabs().iter().map(|t| t.title.clone()).collect()
}

// 非推奨: 不要なデータまで返す
#[tauri::command]
fn get_all_tab_data() -> Vec<CompleteTabData> {
    // レンダリングに不要な履歴データなども含まれる
}

// Serde での最適化
use serde::{Serialize, Deserialize};

#[derive(Serialize)]
struct TabSummary {
    id: String,
    title: String,
    // 必要なフィールドのみ
}
```

### メモリ管理

**リソースの適切な解放**

```rust
// Arc/Rc の循環参照を避ける
// Weak を使用して循環参照を断ち切る
use std::sync::{Arc, Weak};

struct Parent {
    children: Vec<Arc<Child>>,
}

struct Child {
    parent: Weak<Parent>, // Weak で循環参照を回避
}

// Drop trait で明示的なクリーンアップ
impl Drop for BrowserTab {
    fn drop(&mut self) {
        // タブクローズ時のクリーンアップ
        self.close_webview();
        self.clear_cache();
    }
}
```

**メモリ効率の良いコレクション**

```rust
// 推奨: 容量を事前に確保
let mut tabs = Vec::with_capacity(expected_count);

// String の再割り当てを避ける
let mut url = String::with_capacity(256);
url.push_str("https://");
url.push_str(&domain);

// 大きなデータは参照で渡す
fn process_tabs(tabs: &[Tab]) { // &[Tab] の方が効率的
    // ...
}
```

### 非同期処理の最適化

**適切な非同期ランタイムの使用**

```rust
// Tauri は tokio を使用
#[tauri::command]
async fn load_url(url: String) -> Result<String, String> {
    let response = reqwest::get(&url)
        .await
        .map_err(|e| e.to_string())?;

    response.text().await.map_err(|e| e.to_string())
}

// CPU バウンドな処理は spawn_blocking で
#[tauri::command]
async fn process_large_file(path: String) -> Result<(), String> {
    tokio::task::spawn_blocking(move || {
        // 重い CPU 処理
        std::fs::read_to_string(path)
    })
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}
```

**並行処理の活用**

```rust
use tokio::join;

#[tauri::command]
async fn initialize_app() -> Result<AppData, String> {
    // 複数の独立した非同期処理を並行実行
    let (bookmarks, history, settings) = join!(
        load_bookmarks(),
        load_history(),
        load_settings()
    );

    Ok(AppData {
        bookmarks: bookmarks?,
        history: history?,
        settings: settings?,
    })
}
```

### パフォーマンスクリティカルな箇所の最適化

**頻繁に呼ばれる処理の最適化**

```rust
// キャッシングの活用
use std::collections::HashMap;
use once_cell::sync::Lazy;

static FAVICON_CACHE: Lazy<Mutex<HashMap<String, Vec<u8>>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));

#[tauri::command]
async fn get_favicon(domain: String) -> Option<Vec<u8>> {
    let cache = FAVICON_CACHE.lock().unwrap();
    if let Some(icon) = cache.get(&domain) {
        return Some(icon.clone());
    }
    drop(cache);

    // キャッシュになければ取得
    let icon = fetch_favicon(&domain).await?;
    FAVICON_CACHE.lock().unwrap().insert(domain, icon.clone());
    Some(icon)
}
```

**デバウンス/スロットルの実装**

```rust
// 頻繁なイベントの抑制
use std::time::{Duration, Instant};

struct ThrottledEvent {
    last_execution: Option<Instant>,
    interval: Duration,
}

impl ThrottledEvent {
    fn should_execute(&mut self) -> bool {
        let now = Instant::now();
        match self.last_execution {
            Some(last) if now.duration_since(last) < self.interval => false,
            _ => {
                self.last_execution = Some(now);
                true
            }
        }
    }
}
```

## パフォーマンス測定とプロファイリング

### 推奨ツール

**フロントエンド**

- **React DevTools Profiler**: コンポーネントのレンダリング時間とボトルネックを特定
  - Commit ごとの時間を記録
  - Flamegraph で重いコンポーネントを可視化

- **Chrome/Edge DevTools Performance**:
  - Lighthouse で全体的なパフォーマンススコア測定
  - Performance タブでタイムライン分析
  - Memory タブでメモリリークを検出

**バックエンド**

- **Rust Profiling Tools**:
  - `cargo flamegraph` でボトルネックを可視化
  - `cargo build --release` でリリースビルドのパフォーマンス確認
  - `cargo bench` でベンチマーク（必要に応じて）

### プロファイリングのワークフロー

1. **ベースライン測定**: 変更前のパフォーマンスを測定
2. **最適化実装**: ベストプラクティスに基づいて改善
3. **効果測定**: 変更後のパフォーマンスを測定し、改善を確認
4. **回帰防止**: パフォーマンスが悪化していないか定期的にチェック

```bash
# フロントエンドバンドルサイズの確認
bun run build
# dist/ フォルダのサイズを確認

# Tauri のリリースビルドサイズ確認
bun run tauri build
# src-tauri/target/release/ のバイナリサイズを確認
```

## アンチパターン（避けるべきこと）

### フロントエンド

❌ **インラインオブジェクト/関数の生成**

```typescript
// 非推奨: 毎回新しいオブジェクトを生成
<TabList tabs={tabs} config={{ showIcons: true }} />

// 推奨: 定数として定義
const TAB_CONFIG = { showIcons: true };
<TabList tabs={tabs} config={TAB_CONFIG} />
```

❌ **useEffect 内での無限ループ**

```typescript
// 非推奨: 依存配列が不適切で無限ループ
useEffect(() => {
  setData({ ...data, updated: Date.now() }); // data が変わるとまた実行
}, [data]);

// 推奨: 依存配列を適切に設定
useEffect(() => {
  setData((prev) => ({ ...prev, updated: Date.now() }));
}, []); // 初回のみ実行
```

❌ **過度な Context 使用**

```typescript
// 非推奨: 巨大な Context で全てを管理
<AppContext.Provider value={{ tabs, bookmarks, history, settings, ... }}>

// 推奨: 必要に応じて Context を分割
<TabsContext.Provider>
  <SettingsContext.Provider>
```

### バックエンド

❌ **同期ブロッキング処理**

```rust
// 非推奨: 同期的なネットワーク処理
#[tauri::command]
fn fetch_data() -> String {
    std::thread::sleep(Duration::from_secs(5)); // UI をブロック！
    "data".to_string()
}

// 推奨: 非同期コマンドに
#[tauri::command]
async fn fetch_data() -> String {
    tokio::time::sleep(Duration::from_secs(5)).await;
    "data".to_string()
}
```

❌ **過度なクローン**

```rust
// 非推奨: 不要なクローン
fn process_tab(tab: Tab) -> String {
    let title = tab.title.clone();
    let url = tab.url.clone();
    format!("{}: {}", title, url)
}

// 推奨: 参照を使用
fn process_tab(tab: &Tab) -> String {
    format!("{}: {}", tab.title, tab.url)
}
```

❌ **メモリリーク**

```rust
// 非推奨: イベントリスナーの解除忘れ
fn setup_tab(tab: &Tab) {
    tab.webview.on_navigation(|url| {
        // この handler は解放されない
    });
}

// 推奨: 明示的なクリーンアップ
fn setup_tab(tab: &Tab) -> CleanupHandle {
    let handle = tab.webview.on_navigation(|url| { /* ... */ });
    CleanupHandle { handle }
}
```

## まとめ

Mu のパフォーマンス哲学：

- **測定可能**: 変更前後でパフォーマンスを測定する
- **最小限**: 不要なコードやライブラリを含めない
- **プロアクティブ**: パフォーマンス問題を事後修正ではなく事前予防する
- **ユーザー体験優先**: 数値目標よりも、実際のユーザー体験の快適さを重視

パフォーマンスは「後で最適化すればいい」ものではなく、設計段階から考慮すべき要素です。このガイドラインに従うことで、軽量で高速なブラウザ体験を維持できます。
