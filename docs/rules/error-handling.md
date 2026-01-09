# エラーハンドリングガイドライン

このドキュメントはMuプロジェクトにおけるエラーハンドリングの標準を定義します。

## 基本原則

- **ユーザー体験優先**: エラーメッセージは一般ユーザーにわかりやすく簡潔に
- **開発者への情報**: 技術詳細はコンソールログに記録し、デバッグを容易に
- **最小限の中断**: ミニマリストの哲学に沿い、トースト通知で控えめに表示
- **型安全性**: TypeScript/Rustの型システムを最大限活用

## フロントエンド (TypeScript/React)

### 1. 非同期処理のエラーハンドリング

**原則**: すべての非同期処理は `try-catch` で囲む

```typescript
// ✅ 良い例
async function fetchData() {
  try {
    const response = await fetch('/api/data');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch data:', error);
    showToast('データの取得に失敗しました');
    throw error; // 必要に応じて再スロー
  }
}

// ❌ 悪い例
async function fetchData() {
  const response = await fetch('/api/data'); // エラーハンドリングなし
  return await response.json();
}
```

### 2. Error Boundaryの使用

**原則**: アプリケーションの主要部分をError Boundaryで保護する

```typescript
// ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-fallback">
          <h2>問題が発生しました</h2>
          <button onClick={() => this.setState({ hasError: false })}>
            再試行
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

**使用例**:

```typescript
// App.tsx
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <MainContent />
    </ErrorBoundary>
  );
}
```

### 3. Tauriコマンドのエラーハンドリング

**原則**: すべての `invoke` 呼び出しをtry-catchで囲み、失敗時はトースト通知を表示

```typescript
import { invoke } from '@tauri-apps/api/core';

// ✅ 良い例
async function callTauriCommand() {
  try {
    const result = await invoke<string>('greet', { name: 'User' });
    return result;
  } catch (error) {
    console.error('Tauri command failed:', error);
    showToast('操作に失敗しました');
    throw error;
  }
}

// より良い: 共通のinvokeラッパーを作成
async function safeInvoke<T>(
  command: string,
  args?: Record<string, unknown>,
  errorMessage?: string
): Promise<T> {
  try {
    return await invoke<T>(command, args);
  } catch (error) {
    console.error(`Tauri command '${command}' failed:`, error);
    showToast(errorMessage || '操作に失敗しました');
    throw error;
  }
}

// 使用例
const result = await safeInvoke<string>(
  'greet',
  { name: 'User' },
  '挨拶の取得に失敗しました'
);
```

### 4. トースト通知の実装

**原則**: エラーは控えめなトースト通知で表示し、自動的に消える

```typescript
// toast.ts
type ToastType = 'error' | 'success' | 'info';

interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number; // ミリ秒
}

export function showToast(
  message: string,
  type: ToastType = 'error',
  duration: number = 3000
) {
  // トースト表示ロジックをここに実装
  // 既存のライブラリを使用する場合:
  // - react-hot-toast
  // - sonner
  // など

  console.log(`[${type.toUpperCase()}] ${message}`);

  // TODO: 実際のトーストUI実装
}

// 使用例
showToast('ファイルの保存に失敗しました', 'error');
showToast('設定を保存しました', 'success');
```

### 5. カスタムエラークラス

**原則**: 必要に応じてカスタムエラークラスを定義

```typescript
// errors.ts
export class NetworkError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// 使用例
function validateInput(input: string) {
  if (!input.trim()) {
    throw new ValidationError('入力が空です', 'inputField');
  }
}

async function fetchData() {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) {
      throw new NetworkError(
        'サーバーエラー',
        response.status
      );
    }
  } catch (error) {
    if (error instanceof NetworkError) {
      showToast(`ネットワークエラー (${error.statusCode})`);
    } else if (error instanceof ValidationError) {
      showToast(`入力エラー: ${error.message}`);
    } else {
      showToast('予期しないエラーが発生しました');
    }
    console.error(error);
  }
}
```

## バックエンド (Rust/Tauri)

### 1. カスタムエラー型の定義

**原則**: アプリケーション固有のエラー型を定義し、`Result` 型で返す

```rust
// src-tauri/src/error.rs
use std::fmt;

#[derive(Debug)]
pub enum MuError {
    Io(std::io::Error),
    Parse(String),
    Network(String),
    NotFound(String),
    InvalidInput(String),
}

impl fmt::Display for MuError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            MuError::Io(err) => write!(f, "IO error: {}", err),
            MuError::Parse(msg) => write!(f, "Parse error: {}", msg),
            MuError::Network(msg) => write!(f, "Network error: {}", msg),
            MuError::NotFound(msg) => write!(f, "Not found: {}", msg),
            MuError::InvalidInput(msg) => write!(f, "Invalid input: {}", msg),
        }
    }
}

impl std::error::Error for MuError {}

// 他のエラー型からの変換
impl From<std::io::Error> for MuError {
    fn from(err: std::io::Error) -> Self {
        MuError::Io(err)
    }
}

// Tauriで使用するためのSerialize実装
impl serde::Serialize for MuError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

pub type MuResult<T> = Result<T, MuError>;
```

### 2. Tauriコマンドでのエラーハンドリング

**原則**: すべてのコマンドは `Result` 型を返し、適切なエラーメッセージを提供

```rust
// src-tauri/src/lib.rs
use crate::error::{MuError, MuResult};

#[tauri::command]
fn greet(name: &str) -> MuResult<String> {
    if name.is_empty() {
        return Err(MuError::InvalidInput(
            "Name cannot be empty".to_string()
        ));
    }
    Ok(format!("Hello, {}!", name))
}

#[tauri::command]
fn read_config(path: &str) -> MuResult<String> {
    // ?演算子でエラーを自動伝播
    let content = std::fs::read_to_string(path)?;
    Ok(content)
}

#[tauri::command]
async fn fetch_url(url: &str) -> MuResult<String> {
    let response = reqwest::get(url)
        .await
        .map_err(|e| MuError::Network(e.to_string()))?;

    let body = response
        .text()
        .await
        .map_err(|e| MuError::Parse(e.to_string()))?;

    Ok(body)
}
```

### 3. エラーの伝播とコンテキスト追加

**原則**: `?` 演算子でエラーを伝播し、必要に応じてコンテキストを追加

```rust
use std::fs;
use std::path::Path;

fn process_file(path: &str) -> MuResult<String> {
    // ?演算子で簡潔にエラー伝播
    let content = fs::read_to_string(path)?;

    let processed = parse_content(&content)
        .map_err(|e| MuError::Parse(
            format!("Failed to parse file {}: {}", path, e)
        ))?;

    Ok(processed)
}

fn parse_content(content: &str) -> MuResult<String> {
    if content.is_empty() {
        return Err(MuError::InvalidInput(
            "Content is empty".to_string()
        ));
    }

    // 処理ロジック
    Ok(content.to_uppercase())
}
```

### 4. ロギング

**原則**: 開発時はコンソールログを使用し、エラーの詳細を記録

```rust
#[tauri::command]
fn complex_operation(param: &str) -> MuResult<String> {
    println!("Starting complex_operation with param: {}", param);

    match perform_step_1(param) {
        Ok(result) => {
            println!("Step 1 completed successfully");
            perform_step_2(&result)
        }
        Err(e) => {
            eprintln!("Step 1 failed: {}", e);
            Err(e)
        }
    }
}

fn perform_step_1(param: &str) -> MuResult<String> {
    // 実装
    Ok(param.to_string())
}

fn perform_step_2(param: &str) -> MuResult<String> {
    // 実装
    Ok(param.to_string())
}
```

## ベストプラクティス

### 1. エラーメッセージの書き方

**ユーザー向けメッセージ (トースト)**:
- ✅ 「ファイルの保存に失敗しました」
- ✅ 「ネットワーク接続を確認してください」
- ✅ 「入力内容を確認してください」
- ❌ 「Error: ENOENT: no such file or directory」
- ❌ 「Failed to invoke command: greet」

**開発者向けメッセージ (コンソール)**:
- ✅ 詳細なスタックトレース
- ✅ エラーコード、ファイルパス、行番号
- ✅ エラーが発生した関数名とパラメータ

### 2. エラー回復の試み

```typescript
async function fetchWithRetry(
  url: string,
  maxRetries: number = 3
): Promise<Response> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetch(url);
    } catch (error) {
      lastError = error as Error;
      console.warn(`Retry ${i + 1}/${maxRetries} failed:`, error);

      if (i < maxRetries - 1) {
        await new Promise(resolve =>
          setTimeout(resolve, 1000 * Math.pow(2, i))
        );
      }
    }
  }

  showToast('接続に失敗しました');
  throw lastError!;
}
```

### 3. グローバルエラーハンドラ

```typescript
// main.tsx
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  showToast('予期しないエラーが発生しました');
});

window.addEventListener('error', (event) => {
  console.error('Unhandled error:', event.error);
  showToast('予期しないエラーが発生しました');
});
```

### 4. 開発環境 vs 本番環境

```typescript
const isDev = import.meta.env.DEV;

function handleError(error: Error) {
  console.error(error);

  if (isDev) {
    // 開発環境: 詳細情報を表示
    showToast(`${error.name}: ${error.message}`, 'error', 10000);
  } else {
    // 本番環境: ユーザーフレンドリーなメッセージ
    showToast('操作に失敗しました', 'error', 3000);
  }
}
```

## チェックリスト

新しい機能を実装する際は、以下を確認してください:

- [ ] すべての非同期処理に `try-catch` が適用されている
- [ ] すべてのTauri invokeに適切なエラーハンドリングがある
- [ ] エラー発生時にユーザーフレンドリーなメッセージが表示される
- [ ] エラーの詳細がコンソールに記録される
- [ ] Rustコマンドが `Result` 型を返している
- [ ] カスタムエラー型が適切に使用されている
- [ ] Error Boundaryで保護された重要なコンポーネント
- [ ] エラーメッセージがミニマリストの哲学に沿っている（控えめ、簡潔）

## 今後の拡張

現在はコンソールログのみですが、将来的に以下を検討できます:

- ファイルへのログ出力（リリースビルド用）
- エラーレポート機能（ユーザーの同意を得て）
- エラー統計の収集（匿名化）
- より詳細なエラー分類とハンドリング

---

このガイドラインは、Muの開発が進むにつれて更新されます。
