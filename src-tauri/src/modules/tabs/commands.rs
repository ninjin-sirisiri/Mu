use super::models::{Tab, TabManager};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, LogicalPosition, LogicalSize, Manager, State, WebviewUrl};

const STALE_TAB_RELOAD_MS: u64 = 10 * 60 * 1000;

pub fn build_content_init_script(tab_id: &str) -> String {
    format!(
        r#"
        // タイトルとファビコンの変更を検知してTauriイベントを発行
        const tabId = "{tab_id}";
        let lastTitle = document.title;
        let lastFavicon = null;

        function getFaviconUrl() {{
            // 優先順位順にファビコンを検索
            const selectors = [
                'link[rel="icon"]',
                'link[rel="shortcut icon"]',
                'link[rel="apple-touch-icon"]',
                'link[rel="apple-touch-icon-precomposed"]'
            ];

            for (const selector of selectors) {{
                const link = document.querySelector(selector);
                if (link && link.href) {{
                    return link.href;
                }}
            }}

            // デフォルトのfavicon.icoを返す
            try {{
                const url = new URL('/favicon.ico', window.location.origin);
                return url.href;
            }} catch (e) {{
                return null;
            }}
        }}

        function notifyTitleChange() {{
            const currentTitle = document.title;
            if (currentTitle !== lastTitle) {{
                lastTitle = currentTitle;
                window.__TAURI_INTERNALS__.invoke('handle_title_changed', {{
                    tabId,
                    title: currentTitle
                }}).catch(console.error);
            }}
        }}

        function notifyFaviconChange() {{
            const currentFavicon = getFaviconUrl();
            if (currentFavicon !== lastFavicon) {{
                lastFavicon = currentFavicon;
                window.__TAURI_INTERNALS__.invoke('handle_favicon_changed', {{
                    tabId,
                    favicon: currentFavicon
                }}).catch(console.error);
            }}
        }}

        function notifyChanges() {{
            notifyTitleChange();
            notifyFaviconChange();
        }}

        // MutationObserverでtitle要素とfavicon要素の変更を監視
        const observer = new MutationObserver(() => {{
            notifyTitleChange();
        }});

        // titleタグの変更を監視
        const titleElement = document.querySelector('title');
        if (titleElement) {{
            observer.observe(titleElement, {{
                childList: true,
                characterData: true,
                subtree: true
            }});
        }}

        // headの変更も監視（SPAでtitleタグやfaviconが動的に追加される場合）
        const headObserver = new MutationObserver(() => {{
            const newTitleElement = document.querySelector('title');
            if (newTitleElement && !titleElement) {{
                observer.observe(newTitleElement, {{
                    childList: true,
                    characterData: true,
                    subtree: true
                }});
            }}
            notifyChanges();
        }});

        if (document.head) {{
            headObserver.observe(document.head, {{
                childList: true,
                subtree: true
            }});
        }}

        // ページロード完了時にもチェック
        if (document.readyState === 'complete') {{
            notifyChanges();
        }} else {{
            window.addEventListener('load', () => {{
                notifyChanges();
            }});
        }}

        // DOMContentLoadedでもチェック
        if (document.readyState === 'loading') {{
            document.addEventListener('DOMContentLoaded', () => {{
                notifyChanges();
            }});
        }}
        "#
    )
}

/// 新しいタブを作成
#[tauri::command]
pub fn create_tab(
    url: String,
    app: AppHandle,
    state: State<Mutex<TabManager>>,
) -> Result<String, String> {
    let (tab_id, tab, previous_label) = {
        let mut manager = state.lock().map_err(|e| format!("Failed to lock tab manager: {}", e))?;
        let previous_label = manager.get_active_webview_label();
        let tab_id = manager.create_tab(url.clone());
        let tab = manager
            .get_tab(&tab_id)
            .ok_or_else(|| "タブが見つかりません".to_string())?;
        (tab_id, tab, previous_label)
    };

    let window = app
        .get_window("main")
        .ok_or_else(|| "Main window not found".to_string())?;
    let (width, height) = get_window_size(&window)?;

    let webview = window
        .add_child(
            tauri::webview::WebviewBuilder::new(
                tab.webview_label.clone(),
                WebviewUrl::External(
                    tab.url
                        .parse()
                        .map_err(|e| format!("Invalid URL: {}", e))?,
                ),
            )
            .initialization_script(build_content_init_script(&tab_id)),
            LogicalPosition::new(0.0, 0.0),
            LogicalSize::new(width, height),
        )
        .map_err(|e| format!("Failed to create tab webview: {}", e))?;

    if let Some(previous_label) = previous_label {
        if let Some(previous_webview) = app.get_webview(&previous_label) {
            let _ = previous_webview.hide();
        }
    }

    let _ = webview.show();

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
    let (closed_label, next_active, was_active, next_last_active_at) = {
        let mut manager = state.lock().map_err(|e| format!("Failed to lock tab manager: {}", e))?;
        let was_active = manager.get_active_tab_id().as_deref() == Some(&id);
        let next_active_id = manager.get_next_active_after_close(&id);
        let next_last_active_at = next_active_id
            .as_ref()
            .and_then(|next_id| manager.get_tab(next_id))
            .map(|tab| tab.last_active_at);
        let closed_label = manager
            .get_tab(&id)
            .ok_or_else(|| "タブが見つかりません".to_string())?
            .webview_label;
        manager.close_tab(&id)?;
        let next_active = manager.get_active_tab();
        (closed_label, next_active, was_active, next_last_active_at)
    };

    if let Some(webview) = app.get_webview(&closed_label) {
        let _ = webview.close();
    }

    if was_active {
        if let Some(tab) = next_active {
            if let Some(webview) = app.get_webview(&tab.webview_label) {
                let _ = webview.show();
                let should_reload = next_last_active_at
                    .map(|last| is_tab_stale(last))
                    .unwrap_or(false);
                if should_reload {
                    let url_parsed = tab
                        .url
                        .parse()
                        .map_err(|e| format!("Invalid URL: {}", e))?;
                    webview
                        .navigate(url_parsed)
                        .map_err(|e| format!("Failed to navigate: {}", e))?;
                }
            }
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
    let (tab, previous_label, last_active_at) = {
        let mut manager = state.lock().map_err(|e| format!("Failed to lock tab manager: {}", e))?;
        let previous_label = manager.get_active_webview_label();
        let last_active_at = manager
            .get_tab(&id)
            .map(|tab| tab.last_active_at)
            .ok_or_else(|| "タブが見つかりません".to_string())?;
        manager.switch_tab(&id)?;
        let tab = manager
            .get_tab(&id)
            .ok_or_else(|| "タブが見つかりません".to_string())?;
        (tab, previous_label, last_active_at)
    };

    if let Some(previous_label) = previous_label {
        if let Some(previous_webview) = app.get_webview(&previous_label) {
            let _ = previous_webview.hide();
        }
    }

    if let Some(webview) = app.get_webview(&tab.webview_label) {
        let _ = webview.show();
        if is_tab_stale(last_active_at) {
            let url_parsed = tab
                .url
                .parse()
                .map_err(|e| format!("Invalid URL: {}", e))?;
            webview
                .navigate(url_parsed)
                .map_err(|e| format!("Failed to navigate: {}", e))?;
        }
    }

    Ok(())
}

/// 全てのタブを取得
#[tauri::command]
pub fn get_all_tabs(state: State<Mutex<TabManager>>) -> Result<Vec<Tab>, String> {
    let manager = state.lock().map_err(|e| format!("Failed to lock tab manager: {}", e))?;
    Ok(manager.get_all_tabs())
}

/// アクティブなタブIDを取得
#[tauri::command]
pub fn get_active_tab_id(state: State<Mutex<TabManager>>) -> Result<String, String> {
    let manager = state.lock().map_err(|e| format!("Failed to lock tab manager: {}", e))?;
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
    let mut manager = state.lock().map_err(|e| format!("Failed to lock tab manager: {}", e))?;
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
    let mut manager = state.lock().map_err(|e| format!("Failed to lock tab manager: {}", e))?;
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
        let manager = state.lock().map_err(|e| format!("Failed to lock tab manager: {}", e))?;
        manager
            .get_active_tab_id()
            .ok_or_else(|| "アクティブなタブがありません".to_string())?
    };
    close_tab(tab_id, app, state)
}

/// WebViewのタイトル変更を処理
#[tauri::command]
pub fn handle_title_changed(
    tab_id: String,
    title: String,
    app: AppHandle,
    state: State<Mutex<TabManager>>,
) -> Result<(), String> {
    // アクティブなタブのタイトルを更新
    {
        let mut manager = state.lock().map_err(|e| format!("Failed to lock tab manager: {}", e))?;
        manager.update_tab_title(&tab_id, title)?;
    }

    // サイドバーに通知してUIを更新
    app.emit("tab-updated", ())
        .map_err(|e| format!("Failed to emit event: {}", e))?;

    Ok(())
}

/// WebViewのファビコン変更を処理
#[tauri::command]
pub fn handle_favicon_changed(
    tab_id: String,
    favicon: Option<String>,
    app: AppHandle,
    state: State<Mutex<TabManager>>,
) -> Result<(), String> {
    // アクティブなタブのファビコンを更新
    {
        let mut manager = state.lock().map_err(|e| format!("Failed to lock tab manager: {}", e))?;
        manager.update_tab_favicon(&tab_id, favicon)?;
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
    let (tab, previous_label, last_active_at) = {
        let mut manager = state.lock().map_err(|e| format!("Failed to lock tab manager: {}", e))?;
        let previous_label = manager.get_active_webview_label();
        let next_id = manager
            .get_next_tab_id()
            .ok_or_else(|| "次のタブが見つかりません".to_string())?;
        let last_active_at = manager
            .get_tab(&next_id)
            .map(|tab| tab.last_active_at)
            .ok_or_else(|| "タブが見つかりません".to_string())?;
        manager.switch_tab(&next_id)?;
        let tab = manager
            .get_tab(&next_id)
            .ok_or_else(|| "タブが見つかりません".to_string())?;
        (tab, previous_label, last_active_at)
    };

    if let Some(previous_label) = previous_label {
        if let Some(previous_webview) = app.get_webview(&previous_label) {
            let _ = previous_webview.hide();
        }
    }

    if let Some(webview) = app.get_webview(&tab.webview_label) {
        let _ = webview.show();
        if is_tab_stale(last_active_at) {
            let url_parsed = tab
                .url
                .parse()
                .map_err(|e| format!("Invalid URL: {}", e))?;
            webview
                .navigate(url_parsed)
                .map_err(|e| format!("Failed to navigate: {}", e))?;
        }
    }

    Ok(())
}

/// 前のタブに切り替え
#[tauri::command]
pub fn switch_to_previous_tab(
    app: AppHandle,
    state: State<Mutex<TabManager>>,
) -> Result<(), String> {
    let (tab, previous_label, last_active_at) = {
        let mut manager = state.lock().map_err(|e| format!("Failed to lock tab manager: {}", e))?;
        let previous_label = manager.get_active_webview_label();
        let previous_id = manager
            .get_previous_tab_id()
            .ok_or_else(|| "前のタブが見つかりません".to_string())?;
        let last_active_at = manager
            .get_tab(&previous_id)
            .map(|tab| tab.last_active_at)
            .ok_or_else(|| "タブが見つかりません".to_string())?;
        manager.switch_tab(&previous_id)?;
        let tab = manager
            .get_tab(&previous_id)
            .ok_or_else(|| "タブが見つかりません".to_string())?;
        (tab, previous_label, last_active_at)
    };

    if let Some(previous_label) = previous_label {
        if let Some(previous_webview) = app.get_webview(&previous_label) {
            let _ = previous_webview.hide();
        }
    }

    if let Some(webview) = app.get_webview(&tab.webview_label) {
        let _ = webview.show();
        if is_tab_stale(last_active_at) {
            let url_parsed = tab
                .url
                .parse()
                .map_err(|e| format!("Invalid URL: {}", e))?;
            webview
                .navigate(url_parsed)
                .map_err(|e| format!("Failed to navigate: {}", e))?;
        }
    }

    Ok(())
}

fn get_window_size(window: &tauri::Window) -> Result<(f64, f64), String> {
    let scale_factor = window
        .scale_factor()
        .map_err(|e| format!("Failed to get scale factor: {}", e))?;
    let size = window
        .inner_size()
        .map_err(|e| format!("Failed to get window size: {}", e))?;
    Ok((size.width as f64 / scale_factor, size.height as f64 / scale_factor))
}

fn is_tab_stale(last_active_at: u64) -> bool {
    use std::time::{SystemTime, UNIX_EPOCH};

    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis() as u64)
        .unwrap_or(0);
    now.saturating_sub(last_active_at) > STALE_TAB_RELOAD_MS
}
