# Backend Task: Navigation Logic

## 概要
UI（Frontend）からコンテンツWebviewを操作するためのRustコマンドを実装する。
「戻る」「進む」「リロード」「URL移動」などの基本動作を提供する。

## 要件
1.  **コマンド実装**:
    -   `navigate(url: String)`: 指定したURLをContent Webviewで開く。
    -   `go_back()`: 履歴を戻る。
    -   `go_forward()`: 履歴を進む。
    -   `reload()`: ページを再読み込み。
2.  **イベントハンドリング**:
    -   Content WebviewのURL変更やタイトル変更を検知し、UI側（Frontend）へイベントとして送信する（アドレスバー/コマンドパレットの表示更新用）。

## 実装ステップ
1.  `src-tauri/src/lib.rs` にコマンド関数を作成。
2.  Tauriの `WebviewWindow` ハンドルを使用して、Content Webviewに対して操作を行う。
3.  `tauri::generate_handler!` にコマンドを登録。
4.  Webviewのイベントリスナーを設定し、ナビゲーションイベントをFrontendにemitする。

## 完了条件
-   Frontendからコマンドを呼び出すことで、Content Webviewが指定URLに遷移できること。
-   戻る/進む動作が正常に機能すること。
