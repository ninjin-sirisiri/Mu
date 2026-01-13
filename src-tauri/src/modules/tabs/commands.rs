use super::models::{Tab, TabManager};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager, State};

/// 新しいタブを作成
#[tauri::command]
pub fn create_tab(
    url: String,
    app: AppHandle,
    state: State<Mutex<TabManager>>,
) -> Result<String, String> {
    let (tab_id, url_clone) = {
        let mut manager = state.lock().unwrap();
        let tab_id = manager.create_tab(url.clone());
        (tab_id, url)
    };

    // content webviewのURLを変更（新しいタブは自動的にアクティブになる）
    if let Some(webview) = app.get_webview("content") {
        let url_parsed = url_clone
            .parse()
            .map_err(|e| format!("Invalid URL: {}", e))?;
        webview
            .navigate(url_parsed)
            .map_err(|e| format!("Failed to navigate: {}", e))?;
    }

    // タブが作成されたことをサイドバーに通知
    app.emit("tab-created", &tab_id)
        .map_err(|e| format!("Failed to emit event: {}", e))?;

    Ok(tab_id)
}

/// タブを閉じる
#[tauri::command]
pub fn close_tab(
    id: String,
    app: AppHandle,
    state: State<Mutex<TabManager>>,
) -> Result<(), String> {
    let active_url = {
        let mut manager = state.lock().unwrap();
        manager.close_tab(&id)?;

        // 閉じた後のアクティブなタブのURLを取得
        manager
            .get_active_tab_id()
            .and_then(|active_id| {
                manager
                    .get_all_tabs()
                    .iter()
                    .find(|tab| tab.id == active_id)
                    .map(|tab| tab.url.clone())
            })
    };

    // アクティブなタブがある場合、そのURLに切り替え
    if let Some(url) = active_url {
        if let Some(webview) = app.get_webview("content") {
            let url_parsed = url
                .parse()
                .map_err(|e| format!("Invalid URL: {}", e))?;
            webview
                .navigate(url_parsed)
                .map_err(|e| format!("Failed to navigate: {}", e))?;
        }
    }

    // タブが閉じられたことをサイドバーに通知
    app.emit("tab-closed", &id)
        .map_err(|e| format!("Failed to emit event: {}", e))?;

    Ok(())
}

/// タブを切り替える
#[tauri::command]
pub fn switch_tab(
    id: String,
    app: AppHandle,
    state: State<Mutex<TabManager>>,
) -> Result<(), String> {
    let url = {
        let mut manager = state.lock().unwrap();
        manager.switch_tab(&id)?;
        // 切り替えたタブのURLを取得
        manager
            .get_all_tabs()
            .iter()
            .find(|tab| tab.id == id)
            .map(|tab| tab.url.clone())
            .ok_or_else(|| "タブが見つかりません".to_string())?
    };

    println!("Switching to tab {} with URL: {}", id, url);

    // content webviewのURLを変更
    if let Some(webview) = app.get_webview("content") {
        let url_parsed = url
            .parse()
            .map_err(|e| format!("Invalid URL: {}", e))?;
        webview
            .navigate(url_parsed)
            .map_err(|e| format!("Failed to navigate: {}", e))?;
        println!("Navigation successful");
    } else {
        println!("Warning: content webview not found");
    }

    Ok(())
}

/// 全てのタブを取得
#[tauri::command]
pub fn get_all_tabs(state: State<Mutex<TabManager>>) -> Result<Vec<Tab>, String> {
    let manager = state.lock().unwrap();
    Ok(manager.get_all_tabs())
}

/// アクティブなタブIDを取得
#[tauri::command]
pub fn get_active_tab_id(state: State<Mutex<TabManager>>) -> Result<String, String> {
    let manager = state.lock().unwrap();
    manager
        .get_active_tab_id()
        .ok_or_else(|| "アクティブなタブがありません".to_string())
}

/// タブのタイトルを更新
#[tauri::command]
pub fn update_tab_title(
    id: String,
    title: String,
    state: State<Mutex<TabManager>>,
) -> Result<(), String> {
    let mut manager = state.lock().unwrap();
    manager.update_tab_title(&id, title)?;
    Ok(())
}

/// タブのURLを更新
#[tauri::command]
pub fn update_tab_url(
    id: String,
    url: String,
    state: State<Mutex<TabManager>>,
) -> Result<(), String> {
    let mut manager = state.lock().unwrap();
    manager.update_tab_url(&id, url)?;
    Ok(())
}

/// 新しいタブを作成（デフォルトURL）
#[tauri::command]
pub fn create_new_tab(
    app: AppHandle,
    state: State<Mutex<TabManager>>,
) -> Result<String, String> {
    create_tab("https://google.com".to_string(), app, state)
}

/// 現在アクティブなタブを閉じる
#[tauri::command]
pub fn close_current_tab(
    app: AppHandle,
    state: State<Mutex<TabManager>>,
) -> Result<(), String> {
    let tab_id = {
        let manager = state.lock().unwrap();
        manager
            .get_active_tab_id()
            .ok_or_else(|| "アクティブなタブがありません".to_string())?
    };
    close_tab(tab_id, app, state)
}

/// WebViewのタイトル変更を処理
#[tauri::command]
pub fn handle_title_changed(
    title: String,
    app: AppHandle,
    state: State<Mutex<TabManager>>,
) -> Result<(), String> {
    // アクティブなタブのタイトルを更新
    {
        let mut manager = state.lock().unwrap();
        if let Some(active_id) = manager.get_active_tab_id() {
            manager.update_tab_title(&active_id, title)?;
        }
    }

    // サイドバーに通知してUIを更新
    app.emit("tab-updated", ())
        .map_err(|e| format!("Failed to emit event: {}", e))?;

    Ok(())
}

/// WebViewのファビコン変更を処理
#[tauri::command]
pub fn handle_favicon_changed(
    favicon: Option<String>,
    app: AppHandle,
    state: State<Mutex<TabManager>>,
) -> Result<(), String> {
    // アクティブなタブのファビコンを更新
    {
        let mut manager = state.lock().unwrap();
        if let Some(active_id) = manager.get_active_tab_id() {
            manager.update_tab_favicon(&active_id, favicon)?;
        }
    }

    // サイドバーに通知してUIを更新
    app.emit("tab-updated", ())
        .map_err(|e| format!("Failed to emit event: {}", e))?;

    Ok(())
}

/// 次のタブに切り替え
#[tauri::command]
pub fn switch_to_next_tab(
    app: AppHandle,
    state: State<Mutex<TabManager>>,
) -> Result<(), String> {
    let url = {
        let mut manager = state.lock().unwrap();
        let next_id = manager.switch_to_next_tab()?;

        // 切り替えたタブのURLを取得
        manager
            .get_all_tabs()
            .iter()
            .find(|tab| tab.id == next_id)
            .map(|tab| tab.url.clone())
            .ok_or_else(|| "タブが見つかりません".to_string())?
    };

    // content webviewのURLを変更
    if let Some(webview) = app.get_webview("content") {
        let url_parsed = url
            .parse()
            .map_err(|e| format!("Invalid URL: {}", e))?;
        webview
            .navigate(url_parsed)
            .map_err(|e| format!("Failed to navigate: {}", e))?;
    }

    Ok(())
}

/// 前のタブに切り替え
#[tauri::command]
pub fn switch_to_previous_tab(
    app: AppHandle,
    state: State<Mutex<TabManager>>,
) -> Result<(), String> {
    let url = {
        let mut manager = state.lock().unwrap();
        let previous_id = manager.switch_to_previous_tab()?;

        // 切り替えたタブのURLを取得
        manager
            .get_all_tabs()
            .iter()
            .find(|tab| tab.id == previous_id)
            .map(|tab| tab.url.clone())
            .ok_or_else(|| "タブが見つかりません".to_string())?
    };

    // content webviewのURLを変更
    if let Some(webview) = app.get_webview("content") {
        let url_parsed = url
            .parse()
            .map_err(|e| format!("Invalid URL: {}", e))?;
        webview
            .navigate(url_parsed)
            .map_err(|e| format!("Failed to navigate: {}", e))?;
    }

    Ok(())
}
