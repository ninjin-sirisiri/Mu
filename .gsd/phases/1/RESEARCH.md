---
phase: 1
level: 2
researched_at: 2026-01-26
---

# Phase 1 Research: WebView統合

## Questions Investigated
1. **Tauri v2 で Child WebView を作成・配置する方法は？**
   - `WebviewBuilder` を使用し、`window.add_child()` で特定の座標・サイズに配置できる。
2. **WebView のナビゲーション制御の実装詳細は？**
   - `navigate(url)` メソッドによる移動。
   - `eval("window.history.back()")` 等による履歴操作。
   - `on_navigation` でナビゲーションをインターセプトまたは監視可能。
3. **フロントエンド（SolidJS）との連携は？**
   - ウィンドウリサイズ時にフロントエンドからサイズを通知するか、Rust側でウィンドウイベントを監視して `webview.set_size()` を呼ぶ必要がある。

## Findings

### WebViewの生成と埋め込み (Rust)
Tauri v2 では、メインウィンドウ自身とは別に「Webview」を管理できる。
```rust
use tauri::{WebviewBuilder, WebviewUrl, LogicalPosition, LogicalSize};

// コマンド例
#[tauri::command]
fn create_browser_webview(window: tauri::Window) {
    let webview_builder = WebviewBuilder::new("browser_content", WebviewUrl::External("https://google.com".parse().unwrap()));
    
    // サイドバー(200px)を避けて配置
    let position = LogicalPosition::new(200.0, 0.0);
    let size = LogicalSize::new(window.inner_size().unwrap().width as f64 - 200.0, window.inner_size().unwrap().height as f64);
    
    window.add_child(webview_builder, position, size).unwrap();
}
```

### ナビゲーション操作
WebView オブジェクトを取得して操作する。
- **戻る**: `webview.eval("window.history.back()")`
- **進む**: `webview.eval("window.history.forward()")`
- **リロード**: `webview.eval("window.location.reload()")`
- **移動**: `webview.navigate(url)`

### リサイズ同期
メインウィンドウのサイズ変更に追従させるため、Rust 側で `WindowEvent::Resized` をハンドルするのが最もクリーン。
```rust
window.on_window_event(move |event| {
    if let WindowEvent::Resized(_) = event {
        // webview.set_size(...) などを呼ぶ
    }
});
```

## Decisions Made
| Decision           | Choice                     | Rationale                                |
| ------------------ | -------------------------- | ---------------------------------------- |
| WebView管理        | Rust側で保持・操作         | 低レイヤーのイベント処理が確実なため     |
| ナビゲーション操作 | JS Eval経由 (back/forward) | WebView標準の履歴APIを安全に叩くため     |
| リサイズ検知       | RustのWindowEvent監視      | フロントエンドを介さず直接同期できるため |

## Patterns to Follow
- **Unique Labels**: WebViewごとに一意なラベルを付ける（Phase 2を見据えて）。
- **Logical Units**: 座標指定には `LogicalPosition` / `LogicalSize` を使用し、OSのスケール設定に対応する。

## Anti-Patterns to Avoid
- **Hardcoded Sizes**: ウィンドウサイズを固定せず、常に動的に計算する。
- **Single Global WebView**: 将来のマルチタブ化（Phase 2）を考慮し、WebViewを動的に追加・削除できる構造にする。

## Dependencies Identified
| Package | Version | Purpose          |
| ------- | ------- | ---------------- |
| tauri   | v2      | Core Webview API |

## Risks
- **Coordinate Sync**: サイドバーの幅がフロントエンド(SolidJS)とRust側で不一致になると隙間ができる。共通定数またはフロントエンドからの通知が必要。
- **Focus Issues**: Child WebView にフォーカスが移った際、ショートカットキー（Ctrl+K等）が効かなくなる可能性がある（グローバルショートカットで回避可能か要確認）。

## Ready for Planning
- [x] Questions answered
- [x] Approach selected
- [x] Dependencies identified
