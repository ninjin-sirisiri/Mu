# Phase 1: 基盤構築

[← ロードマップ概要に戻る](./overview.md)

## 目標

ブラウザとして最低限機能する状態を実現します。ユーザーがURLを入力し、Webページを表示し、基本的なナビゲーション（戻る/進む/リロード）を行えるようにします。

このフェーズで構築する基盤は、Phase 2以降の全ての機能の土台となります。

## 成果物

- **WebViewが統合されたブラウザウィンドウ**
- **暫定的なアドレスバー**（Phase 2でコマンドパレットに置き換え）
- **ナビゲーション機能**（戻る/進む/リロード/ホーム）
- **v0.1.0リリース**: 基本的なWebページ表示とナビゲーション

## 実装タスク

### 1. バックエンド（Rust/Tauri）

#### 1.1 WebViewモジュールの作成

- [ ] `src-tauri/src/modules/webview/`ディレクトリを作成
- [ ] `mod.rs`: WebView管理の公開APIを定義
- [ ] `commands.rs`: WebView操作のTauriコマンドを実装
- [ ] `models.rs`: WebView状態のデータモデルを定義

**Tauriコマンド一覧**:

```rust
// commands.rs

/// 指定されたURLにナビゲート
#[tauri::command]
pub fn navigate_to(url: String) -> Result<(), String> {
    // 実装: WebViewでURLを開く
}

/// 現在のURLを取得
#[tauri::command]
pub fn get_current_url() -> Result<String, String> {
    // 実装: アクティブなWebViewの現在のURLを返す
}

/// ページの読み込み状態を取得
#[tauri::command]
pub fn get_loading_state() -> Result<bool, String> {
    // 実装: ページが読み込み中かどうかを返す
}
```

**データモデル**:

```rust
// models.rs

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct WebViewState {
    pub current_url: String,
    pub title: String,
    pub is_loading: bool,
    pub can_go_back: bool,
    pub can_go_forward: bool,
}
```

#### 1.2 ナビゲーションモジュールの作成

- [ ] `src-tauri/src/modules/navigation/`ディレクトリを作成
- [ ] `mod.rs`: ナビゲーション機能の公開API
- [ ] `commands.rs`: ナビゲーション操作のTauriコマンド
- [ ] `models.rs`: ナビゲーション履歴のデータモデル

**Tauriコマンド一覧**:

```rust
// commands.rs

/// 前のページに戻る
#[tauri::command]
pub fn go_back() -> Result<(), String> {
    // 実装: WebViewで戻る
}

/// 次のページに進む
#[tauri::command]
pub fn go_forward() -> Result<(), String> {
    // 実装: WebViewで進む
}

/// ページをリロード
#[tauri::command]
pub fn reload() -> Result<(), String> {
    // 実装: WebViewでリロード
}

/// ホームページに移動
#[tauri::command]
pub fn go_home() -> Result<(), String> {
    // 実装: 設定されたホームページURLに移動
}
```

**データモデル**:

```rust
// models.rs

#[derive(Debug, Clone)]
pub struct NavigationHistory {
    pub entries: Vec<String>,
    pub current_index: usize,
}

impl NavigationHistory {
    pub fn new() -> Self {
        Self {
            entries: Vec::new(),
            current_index: 0,
        }
    }

    pub fn can_go_back(&self) -> bool {
        self.current_index > 0
    }

    pub fn can_go_forward(&self) -> bool {
        self.current_index < self.entries.len().saturating_sub(1)
    }
}
```

#### 1.3 lib.rsへのコマンド登録

- [ ] `src-tauri/src/lib.rs`にモジュールを追加
- [ ] Tauriビルダーにコマンドを登録

```rust
// lib.rs

mod modules;

use modules::webview::commands as webview_commands;
use modules::navigation::commands as nav_commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            // WebViewコマンド
            webview_commands::navigate_to,
            webview_commands::get_current_url,
            webview_commands::get_loading_state,
            // ナビゲーションコマンド
            nav_commands::go_back,
            nav_commands::go_forward,
            nav_commands::reload,
            nav_commands::go_home,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 2. フロントエンド（React/TypeScript）

#### 2.1 型定義の作成

- [ ] `src/types/webview.d.ts`を作成

```typescript
// src/types/webview.d.ts

export interface WebViewState {
  currentUrl: string;
  title: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
}

export interface NavigationControls {
  goBack: () => Promise<void>;
  goForward: () => Promise<void>;
  reload: () => Promise<void>;
  goHome: () => Promise<void>;
  navigateTo: (url: string) => Promise<void>;
}
```

#### 2.2 WebView機能の実装

- [ ] `src/features/webview/`ディレクトリを作成
- [ ] `WebViewContainer.tsx`: WebView表示コンポーネント
- [ ] `hooks/use-navigation.ts`: ナビゲーション状態管理hook
- [ ] `index.ts`: 公開APIのエクスポート

**WebViewContainer.tsx**:

```typescript
// src/features/webview/WebViewContainer.tsx

import React from 'react';

interface WebViewContainerProps {
  url: string;
  onUrlChange?: (url: string) => void;
}

export const WebViewContainer: React.FC<WebViewContainerProps> = ({
  url,
  onUrlChange,
}) => {
  // Tauri WebViewの統合
  // 実装: WebViewの表示とイベントハンドリング

  return (
    <div className="flex-1 w-full h-full">
      {/* WebViewコンテナ */}
    </div>
  );
};
```

**use-navigation.ts**:

```typescript
// src/features/webview/hooks/use-navigation.ts

import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { WebViewState, NavigationControls } from '../../../types/webview';

export const useNavigation = (): [WebViewState, NavigationControls] => {
  const [state, setState] = useState<WebViewState>({
    currentUrl: '',
    title: '',
    isLoading: false,
    canGoBack: false,
    canGoForward: false,
  });

  const navigateTo = useCallback(async (url: string) => {
    await invoke('navigate_to', { url });
    // 状態を更新
  }, []);

  const goBack = useCallback(async () => {
    await invoke('go_back');
  }, []);

  const goForward = useCallback(async () => {
    await invoke('go_forward');
  }, []);

  const reload = useCallback(async () => {
    await invoke('reload');
  }, []);

  const goHome = useCallback(async () => {
    await invoke('go_home');
  }, []);

  return [
    state,
    {
      navigateTo,
      goBack,
      goForward,
      reload,
      goHome,
    },
  ];
};
```

#### 2.3 アドレスバー機能の実装（暫定）

- [ ] `src/features/address-bar/`ディレクトリを作成
- [ ] `AddressBar.tsx`: URLインプットコンポーネント
- [ ] `index.ts`: 公開APIのエクスポート

**AddressBar.tsx**:

```typescript
// src/features/address-bar/AddressBar.tsx

import React, { useState } from 'react';

interface AddressBarProps {
  currentUrl: string;
  onNavigate: (url: string) => void;
  disabled?: boolean;
}

export const AddressBar: React.FC<AddressBarProps> = ({
  currentUrl,
  onNavigate,
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState(currentUrl);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onNavigate(inputValue.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        disabled={disabled}
        placeholder="URLを入力..."
        className="w-full px-4 py-2 border rounded"
      />
    </form>
  );
};
```

**注意**: このアドレスバーはPhase 2でコマンドパレットに置き換えられます。現時点では最小限の実装に留めます。

#### 2.4 共通UIコンポーネントの作成

- [ ] `src/components/Button.tsx`: ナビゲーションボタン用
- [ ] `src/components/Input.tsx`: アドレスバー用

**Button.tsx**:

```typescript
// src/components/Button.tsx

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  const baseStyles = 'rounded transition-colors';
  const variantStyles = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    ghost: 'bg-transparent hover:bg-gray-100',
  };
  const sizeStyles = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
```

#### 2.5 App.tsxでレイアウト構築

- [ ] `src/App.tsx`を更新してブラウザUIを構築

```typescript
// src/App.tsx

import React from 'react';
import { WebViewContainer } from './features/webview/WebViewContainer';
import { AddressBar } from './features/address-bar/AddressBar';
import { Button } from './components/Button';
import { useNavigation } from './features/webview/hooks/use-navigation';

function App() {
  const [state, controls] = useNavigation();

  return (
    <div className="flex flex-col h-screen w-screen">
      {/* ナビゲーションバー */}
      <header className="flex items-center gap-2 p-2 border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={controls.goBack}
          disabled={!state.canGoBack}
        >
          ←
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={controls.goForward}
          disabled={!state.canGoForward}
        >
          →
        </Button>
        <Button variant="ghost" size="sm" onClick={controls.reload}>
          ⟳
        </Button>
        <Button variant="ghost" size="sm" onClick={controls.goHome}>
          ⌂
        </Button>
        <div className="flex-1">
          <AddressBar
            currentUrl={state.currentUrl}
            onNavigate={controls.navigateTo}
            disabled={state.isLoading}
          />
        </div>
      </header>

      {/* WebViewコンテナ */}
      <main className="flex-1 overflow-hidden">
        <WebViewContainer url={state.currentUrl} />
      </main>
    </div>
  );
}

export default App;
```

## 技術的課題と解決策

### 課題1: Tauri WebviewWindowの統合

**課題**: Tauri 2.xでのWebView統合とReactとの連携

**解決策**:
- Tauri v2の`WebviewWindow` APIを使用
- 各ページは独立したWebViewとして管理（Phase 2のタブ機能の基盤）
- `@tauri-apps/api`の`invoke`関数でRust側とやり取り

**参考ドキュメント**:
- [Tauri WebviewWindow API](https://v2.tauri.app/reference/javascript/api/namespacewebviewwindow/)
- [Tauri IPC (Inter-Process Communication)](https://v2.tauri.app/develop/inter-process-communication/)

### 課題2: ナビゲーション履歴の管理

**課題**: ブラウザの戻る/進むボタンの状態を正確に管理

**解決策**:
- Rust側で`NavigationHistory`構造体を使用した履歴スタックを実装
- `Vec<String>`でURL履歴を保持
- `current_index`で現在位置を追跡
- `can_go_back()`/`can_go_forward()`メソッドで状態を提供

**実装例**:
```rust
pub struct NavigationHistory {
    entries: Vec<String>,
    current_index: usize,
}
```

### 課題3: WebViewのセキュリティ

**課題**: ユーザーが入力したURLの安全性確保

**解決策**:
- URLのバリデーション（スキームチェック: http/https のみ許可）
- サニタイゼーション処理
- XSS対策（Tauriのデフォルトセキュリティ設定を活用）

**実装方針**:
```rust
fn validate_url(url: &str) -> Result<String, String> {
    if url.starts_with("http://") || url.starts_with("https://") {
        Ok(url.to_string())
    } else {
        Err("無効なURLです。http:// または https:// で始まる必要があります。".to_string())
    }
}
```

### 課題4: ローディング状態の管理

**課題**: ページ読み込み中の適切なフィードバック

**解決策**:
- WebViewの`onLoadStart`/`onLoadEnd`イベントをリッスン
- `is_loading`状態をReact側で管理
- ローディングインジケーターを表示（Phase 2で改善）

## 依存関係

**前提条件**: なし（初期フェーズ）

**後続フェーズへの影響**:
- Phase 2のタブ管理は、このWebView実装を基盤とします
- コマンドパレットは、このアドレスバーを置き換えます
- ナビゲーション機能は、Phase 2以降もそのまま使用されます

## 完了条件

このフェーズは以下の条件を満たした時点で完了とします。

- [ ] ユーザーがURLを入力し、Webページが正しく表示される
- [ ] 戻る/進む/リロード/ホームボタンが機能する
- [ ] ナビゲーション状態（戻る/進む可否）が正しく表示される
- [ ] URLが変更されたときにアドレスバーが更新される
- [ ] ページ読み込み中の状態が表示される
- [ ] `docs/rules/coding-guidelines.md`のガイドラインに準拠している
- [ ] `docs/rules/file-structure.md`のディレクトリ構造に準拠している

## テスト項目

実装完了後、以下の項目をテストしてください。

### 機能テスト

- [ ] URLを入力してEnterキーを押すと、ページが表示される
- [ ] 戻るボタンをクリックすると、前のページに戻る
- [ ] 進むボタンをクリックすると、次のページに進む
- [ ] リロードボタンをクリックすると、ページが再読み込みされる
- [ ] ホームボタンをクリックすると、ホームページに移動する
- [ ] ページ読み込み中は適切な状態が表示される

### エッジケース

- [ ] 無効なURLを入力した場合、エラーメッセージが表示される
- [ ] 履歴がない状態で戻るボタンを押しても何も起こらない
- [ ] ネットワークエラー時に適切なエラーが表示される

## 参照ドキュメント

実装時は以下のドキュメントを参照してください。

- [`docs/requirements.md`](../requirements.md) - 要件定義
- [`docs/rules/file-structure.md`](../rules/file-structure.md) - ディレクトリ構造
- [`docs/rules/coding-guidelines.md`](../rules/coding-guidelines.md) - コーディング規約
- [`docs/rules/error-handling.md`](../rules/error-handling.md) - エラー処理
- [Tauri公式ドキュメント](https://v2.tauri.app/) - Tauri API リファレンス

## 次のステップ

Phase 1が完了したら、[Phase 2: コア機能](./phase-2-core-features.md)に進みます。

Phase 2では、このフェーズで構築した基盤の上に、コマンドパレットとタブ管理機能を実装します。

---

[← ロードマップ概要に戻る](./overview.md) | [Phase 2: コア機能 →](./phase-2-core-features.md)
