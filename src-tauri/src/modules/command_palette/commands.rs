//! Command Palette Tauri commands

use crate::modules::command_palette::models::CommandPaletteState;
use tauri::{AppHandle, LogicalSize, Manager, State};

/// Opens the command palette
#[tauri::command]
pub fn open_command_palette(
    app: AppHandle,
    state: State<'_, CommandPaletteState>,
) -> Result<(), String> {
    // WebView を表示
    if let (Some(webview), Some(window)) = (
        app.get_webview("command-palette"),
        app.get_window("main"),
    ) {
        // 現在のウィンドウサイズを取得してWebViewのサイズを更新
        if let Ok(size) = window.inner_size() {
            let scale_factor = window.scale_factor().unwrap_or(1.0);
            let width = size.width as f64 / scale_factor;
            let height = size.height as f64 / scale_factor;
            let _ = webview.set_size(LogicalSize::new(width, height));
        }

        webview.show().map_err(|e| e.to_string())?;
        // WebViewにフォーカスを設定
        webview.set_focus().map_err(|e| e.to_string())?;

        // JavaScriptを実行してinput要素に直接フォーカス
        let _ = webview.eval("setTimeout(() => { const input = document.querySelector('input'); if (input) input.focus(); }, 100);");

        state.set_visible(true);
        Ok(())
    } else {
        Err("Command palette webview not found".to_string())
    }
}

/// Closes the command palette
#[tauri::command]
pub fn close_command_palette(
    app: AppHandle,
    state: State<'_, CommandPaletteState>,
) -> Result<(), String> {
    // WebView を非表示
    if let Some(webview) = app.get_webview("command-palette") {
        // 先にフォーカスを移動してから非表示にする
        // メインウィンドウにフォーカスを戻す
        if let Some(window) = app.get_window("main") {
            window.set_focus().map_err(|e| e.to_string())?;
        }

        // WebViewを非表示
        webview.hide().map_err(|e| e.to_string())?;
        state.set_visible(false);

        Ok(())
    } else {
        Err("Command palette webview not found".to_string())
    }
}

/// Toggles the command palette visibility
#[tauri::command]
pub fn toggle_command_palette(
    app: AppHandle,
    state: State<'_, CommandPaletteState>,
) -> Result<(), String> {
    if state.is_visible() {
        close_command_palette(app, state)
    } else {
        open_command_palette(app, state)
    }
}
