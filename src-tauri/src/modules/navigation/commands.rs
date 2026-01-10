//! Navigation Tauri commands

use super::models::{NavigationHistory, DEFAULT_HOME_URL};
use crate::modules::webview::commands::{emit_navigation_update, navigate_to_internal};
use std::sync::Mutex;
use tauri::{AppHandle, Manager, State};
use url::Url;

/// Navigate to the previous page in history
#[tauri::command]
pub async fn go_back(
    app: AppHandle,
    history: State<'_, Mutex<NavigationHistory>>,
) -> Result<(), String> {
    // Get the previous URL from history
    let url_to_navigate = {
        let mut hist = history.lock().map_err(|e| format!("Failed to lock history: {}", e))?;
        hist.go_back()
            .ok_or("Cannot go back - no previous page in history")?
            .clone()
    };

    // Navigate to the previous URL
    if let Some(webview) = app.get_webview("content") {
        let parsed_url: Url = url_to_navigate
            .parse()
            .map_err(|e| format!("Invalid URL: {}", e))?;
        webview
            .navigate(parsed_url)
            .map_err(|e| format!("Navigation failed: {}", e))?;

        // Emit navigation update
        emit_navigation_update(&app, &history).await;

        Ok(())
    } else {
        Err("Content webview not found".to_string())
    }
}

/// Navigate to the next page in history
#[tauri::command]
pub async fn go_forward(
    app: AppHandle,
    history: State<'_, Mutex<NavigationHistory>>,
) -> Result<(), String> {
    // Get the next URL from history
    let url_to_navigate = {
        let mut hist = history.lock().map_err(|e| format!("Failed to lock history: {}", e))?;
        hist.go_forward()
            .ok_or("Cannot go forward - no next page in history")?
            .clone()
    };

    // Navigate to the next URL
    if let Some(webview) = app.get_webview("content") {
        let parsed_url: Url = url_to_navigate
            .parse()
            .map_err(|e| format!("Invalid URL: {}", e))?;
        webview
            .navigate(parsed_url)
            .map_err(|e| format!("Navigation failed: {}", e))?;

        // Emit navigation update
        emit_navigation_update(&app, &history).await;

        Ok(())
    } else {
        Err("Content webview not found".to_string())
    }
}

/// Reload the current page
#[tauri::command]
pub async fn reload(
    app: AppHandle,
    history: State<'_, Mutex<NavigationHistory>>,
) -> Result<(), String> {
    if let Some(webview) = app.get_webview("content") {
        // Use JavaScript to reload
        webview
            .eval("window.location.reload()")
            .map_err(|e| format!("Failed to reload: {}", e))?;

        // Emit navigation update
        emit_navigation_update(&app, &history).await;

        Ok(())
    } else {
        Err("Content webview not found".to_string())
    }
}

/// Navigate to the home page
#[tauri::command]
pub async fn go_home(
    app: AppHandle,
    history: State<'_, Mutex<NavigationHistory>>,
) -> Result<(), String> {
    navigate_to_internal(app, history, DEFAULT_HOME_URL.to_string()).await
}

/// Update history when URL changes (e.g., from clicking links in pages)
/// Only adds to history if the URL is different from the current one
#[tauri::command]
pub async fn update_history_if_changed(
    app: AppHandle,
    history: State<'_, Mutex<NavigationHistory>>,
    new_url: String,
) -> Result<(), String> {
    if new_url.is_empty() || new_url == "about:blank" {
        return Ok(());
    }

    let should_update = {
        let hist = history
            .lock()
            .map_err(|e| format!("Failed to lock history: {}", e))?;
        // Check if the new URL is different from the current one in history
        hist.current()
            .map(|current| current != &new_url)
            .unwrap_or(true)
    };

    if should_update {
        {
            let mut hist = history
                .lock()
                .map_err(|e| format!("Failed to lock history: {}", e))?;
            hist.push(new_url);
        } // hist is dropped here

        // Emit navigation update after the lock is released
        emit_navigation_update(&app, &history).await;
    }

    Ok(())
}
