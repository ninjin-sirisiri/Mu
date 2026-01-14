//! WebView Tauri commands

use super::models::{NavBarState, WebViewState};
use crate::modules::navigation::models::NavigationHistory;
use crate::modules::tabs::models::TabManager;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, LogicalSize, Manager, State};
use url::Url;

/// Height of the navigation bar in pixels
const NAV_BAR_HEIGHT: f64 = 44.0;
/// Height of the hover trigger area when nav is hidden
const TRIGGER_HEIGHT: f64 = 8.0;

/// Helper function to emit navigation state update to UI webview
pub async fn emit_navigation_update(
    app: &AppHandle,
    history: &State<'_, Mutex<NavigationHistory>>,
    tab_manager: &State<'_, Mutex<TabManager>>,
) {
    let active_label = tab_manager
        .lock()
        .ok()
        .and_then(|manager| manager.get_active_webview_label());

    if let (Some(active_label), Some(ui_webview)) = (active_label, app.get_webview("ui")) {
        if let Some(content_webview) = app.get_webview(&active_label) {
            // Get current URL from webview
            let current_url = content_webview
                .url()
                .map(|u| u.to_string())
                .unwrap_or_default();

            // Get navigation state from history
            let (can_go_back, can_go_forward) = if let Ok(hist) = history.lock() {
                (hist.can_go_back(), hist.can_go_forward())
            } else {
                (false, false)
            };

            // Create WebView state
            let state = WebViewState {
                current_url,
                title: String::new(),
                is_loading: false,
                can_go_back,
                can_go_forward,
            };

            // Emit event to UI webview with the navigation state
            let _ = ui_webview.emit("navigation-updated", state);
        }
    }
}

/// Validates a URL string and ensures it has a proper scheme
fn validate_and_normalize_url(url: &str) -> Result<String, String> {
    let trimmed = url.trim();

    if trimmed.is_empty() {
        return Err("URL cannot be empty".to_string());
    }

    // If URL already has a valid scheme, validate it
    if trimmed.starts_with("http://") || trimmed.starts_with("https://") {
        return Ok(trimmed.to_string());
    }

    // Add https:// as default scheme
    Ok(format!("https://{}", trimmed))
}

/// Internal helper function for navigation with history tracking
pub async fn navigate_to_internal(
    app: AppHandle,
    history: State<'_, Mutex<NavigationHistory>>,
    tab_manager: State<'_, Mutex<TabManager>>,
    url: String,
) -> Result<(), String> {
    let normalized_url = validate_and_normalize_url(&url)?;

    // Get the content webview (child webview of main window)
    let active_label = {
        let manager = tab_manager
            .lock()
            .map_err(|e| format!("Failed to lock tab manager: {}", e))?;
        manager
            .get_active_webview_label()
            .ok_or_else(|| "アクティブなタブがありません".to_string())?
    };

    if let Some(webview) = app.get_webview(&active_label) {
        let parsed_url: Url = normalized_url
            .parse()
            .map_err(|e| format!("Invalid URL: {}", e))?;
        webview
            .navigate(parsed_url)
            .map_err(|e| format!("Navigation failed: {}", e))?;

        // Add URL to history
        if let Ok(mut hist) = history.lock() {
            hist.push(normalized_url.clone());
        }

        // Emit navigation update
        emit_navigation_update(&app, &history, &tab_manager).await;

        Ok(())
    } else {
        Err("Content webview not found. Please restart the application.".to_string())
    }
}

/// Navigate to a specified URL in the content webview
#[tauri::command]
pub async fn navigate_to(
    app: AppHandle,
    url: String,
    history: State<'_, Mutex<NavigationHistory>>,
    tab_manager: State<'_, Mutex<TabManager>>,
) -> Result<(), String> {
    let normalized_url = validate_and_normalize_url(&url)?;

    // Update the active tab's URL
    if let Ok(mut manager) = tab_manager.lock() {
        if let Some(active_id) = manager.get_active_tab_id() {
            let _ = manager.update_tab_url(&active_id, normalized_url.clone());
        }
    }

    // Emit tab-updated event to notify sidebar
    let _ = app.emit("tab-updated", ());

    navigate_to_internal(app, history, tab_manager, url).await
}

/// Get the current URL of the content webview
#[tauri::command]
pub fn get_current_url(
    app: AppHandle,
    tab_manager: State<'_, Mutex<TabManager>>,
) -> Result<String, String> {
    let active_label = tab_manager
        .lock()
        .map_err(|e| format!("Failed to lock tab manager: {}", e))?
        .get_active_webview_label();

    if let Some(label) = active_label {
        if let Some(webview) = app.get_webview(&label) {
            return Ok(webview.url().map(|u| u.to_string()).unwrap_or_default());
        }
    }

    Ok(String::new())
}

/// Get the loading state of the content webview
#[tauri::command]
pub fn get_loading_state(_app: AppHandle) -> Result<bool, String> {
    // Note: Tauri 2 doesn't have a direct way to check loading state
    // This will be updated with event-based loading tracking
    Ok(false)
}

/// Set the navigation bar visibility and resize UI webview accordingly
/// Content webview position and size are adjusted based on nav bar visibility
#[tauri::command]
pub fn set_nav_visible(
    app: AppHandle,
    visible: bool,
    nav_state: State<'_, NavBarState>,
    tab_manager: State<'_, Mutex<TabManager>>,
) -> Result<(), String> {
    // Update shared state
    nav_state.set_visible(visible);

    let window = app.get_window("main").ok_or("Main window not found")?;

    let window_size = window
        .inner_size()
        .map_err(|e| format!("Failed to get window size: {}", e))?;

    let scale_factor = window
        .scale_factor()
        .map_err(|e| format!("Failed to get scale factor: {}", e))?;

    let width = window_size.width as f64 / scale_factor;
    let height = window_size.height as f64 / scale_factor;

    let ui_webview = app.get_webview("ui").ok_or("UI webview not found")?;

    if let Ok(manager) = tab_manager.lock() {
        for tab in manager.get_all_tabs() {
            if let Some(content_webview) = app.get_webview(&tab.webview_label) {
                let _ = content_webview.set_position(tauri::LogicalPosition::new(0.0, 0.0));
                let _ = content_webview.set_size(LogicalSize::new(width, height));
            }
        }
    }

    // Only UI webview size changes based on nav visibility
    if visible {
        // Nav bar visible: show full nav bar
        ui_webview
            .set_size(LogicalSize::new(width, NAV_BAR_HEIGHT))
            .map_err(|e| format!("Failed to resize UI webview: {}", e))?;
    } else {
        // Nav bar hidden: show only trigger area
        ui_webview
            .set_size(LogicalSize::new(width, TRIGGER_HEIGHT))
            .map_err(|e| format!("Failed to resize UI webview: {}", e))?;
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_url_with_https() {
        let result = validate_and_normalize_url("https://example.com");
        assert_eq!(result, Ok("https://example.com".to_string()));
    }

    #[test]
    fn test_validate_url_with_http() {
        let result = validate_and_normalize_url("http://example.com");
        assert_eq!(result, Ok("http://example.com".to_string()));
    }

    #[test]
    fn test_validate_url_without_scheme() {
        let result = validate_and_normalize_url("example.com");
        assert_eq!(result, Ok("https://example.com".to_string()));
    }

    #[test]
    fn test_validate_empty_url() {
        let result = validate_and_normalize_url("");
        assert!(result.is_err());
    }

    #[test]
    fn test_validate_url_with_whitespace() {
        let result = validate_and_normalize_url("  https://example.com  ");
        assert_eq!(result, Ok("https://example.com".to_string()));
    }
}
