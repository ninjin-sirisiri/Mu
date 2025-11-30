# Backend Task: Settings Persistence

## 概要
ユーザー設定（サイドバーの位置、表示モード、テーマなど）を永続化するためのバックエンド機能を実装する。
Frontendの `simple-stack/store` と連携、またはRust側でファイル保存を行う。

## 要件
1.  **設定ファイル管理**:
    -   設定ファイル（例: `settings.json`）の保存場所を決定（OS標準のConfigディレクトリ）。
    -   読み込み・保存・初期化のロジック実装。
2.  **コマンド実装**:
    -   `load_settings()`: 設定を読み込んで返す。
    -   `save_settings(settings: Json)`: 設定を保存する。
3.  **型定義**:
    -   Rust側で設定データの構造体（Struct）を定義。

## 実装ステップ
1.  `serde`, `serde_json` を使用して設定データの構造体を定義。
2.  `tauri::path::AppConfigDir` 等を使用して保存パスを解決。
3.  ファイルI/O処理を実装。
4.  Frontendから呼び出し可能なコマンドとして公開。

## 完了条件
-   アプリ再起動後も、変更した設定（例: サイドバーの位置）が保持されていること。
