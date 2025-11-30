# Backend Task: Core Webview Implementation

## 概要
Tauri v2のマルチWebview機能を活用し、UI用とコンテンツ閲覧用のWebviewを分離して実装する。
これにより、ブラウザとしての基本的な構造（UIとコンテンツの分離）を確立する。

## 要件
1.  **Multi-Webview構成の確立**:
    -   **App View (UI)**: サイドバー、コマンドパレット、タブ管理などを表示。常に最前面。
    -   **Content View (Browser)**: 実際のWebページを表示。
2.  **ウィンドウ設定**:
    -   メインウィンドウはフレームレス（`decorations: false`）を維持。
    -   リサイズ時に両方のWebviewが適切に追従すること。

## 実装ステップ
1.  `src-tauri/src/lib.rs` (または `main.rs`) を編集し、起動時に2つのWebviewを作成、または設定ファイルで定義する。
    -   *注: Tauri v2では `tauri.conf.json` で複数のWebviewを定義可能か確認、動的生成が望ましい場合はRust側で制御。*
2.  Content Viewは初期状態でホーム（または空白）を表示。
3.  UI ViewからContent Viewを制御するための基本的なIPCコマンドの準備（詳細はNavigationタスクで実装）。

## 完了条件
-   アプリ起動時にUIが表示され、その背後（または指定領域）に外部サイト（例: google.com）を表示可能な領域が存在すること。
