//! Sidebar-related Tauri commands

use super::models::{Position, SidebarState};
use crate::modules::tabs::models::TabManager;
use std::sync::Mutex;
use crate::modules::webview::models::NavBarState;
use tauri::{LogicalPosition, LogicalSize, Manager, State};

/// Width of the sidebar
const SIDEBAR_WIDTH: f64 = 256.0;
/// Width of the peek area when sidebar is hidden
const PEEK_WIDTH: f64 = 8.0;
/// Height of the hover trigger area when nav is hidden
const TRIGGER_HEIGHT: f64 = 8.0;
/// Height of the navigation bar when visible
const NAV_BAR_HEIGHT: f64 = 44.0;

/// Toggle sidebar visibility and update webview layout
#[tauri::command]
pub fn toggle_sidebar(
    app_handle: tauri::AppHandle,
    sidebar_state: State<SidebarState>,
    nav_state: State<NavBarState>,
    tab_manager: State<'_, Mutex<TabManager>>,
) -> Result<bool, String> {
    let new_visible = sidebar_state.toggle();
    update_layout(&app_handle, new_visible, nav_state.is_visible(), &tab_manager)?;
    Ok(new_visible)
}

/// Get current sidebar visibility
#[tauri::command]
pub fn get_sidebar_visible(sidebar_state: State<SidebarState>) -> bool {
    sidebar_state.is_visible()
}

/// Set sidebar visibility explicitly
#[tauri::command]
pub fn set_sidebar_visible(
    app_handle: tauri::AppHandle,
    visible: bool,
    sidebar_state: State<SidebarState>,
    nav_state: State<NavBarState>,
    tab_manager: State<'_, Mutex<TabManager>>,
) -> Result<(), String> {
    sidebar_state.set_visible(visible);
    update_layout(&app_handle, visible, nav_state.is_visible(), &tab_manager)?;
    Ok(())
}

/// Update the layout of all webviews based on sidebar visibility
fn update_layout(
    app_handle: &tauri::AppHandle,
    sidebar_visible: bool,
    nav_visible: bool,
    tab_manager: &State<'_, Mutex<TabManager>>,
) -> Result<(), String> {
    let window = app_handle
        .get_window("main")
        .ok_or_else(|| "Main window not found".to_string())?;
    let ui_webview = app_handle
        .get_webview("ui")
        .ok_or_else(|| "UI webview not found".to_string())?;
    let sidebar_webview = app_handle
        .get_webview("sidebar")
        .ok_or_else(|| "Sidebar webview not found".to_string())?;

    let sidebar_state = app_handle.state::<SidebarState>();
    let position = sidebar_state.get_position();

    let scale_factor = window.scale_factor().unwrap_or(1.0);
    let size = window.inner_size().map_err(|e| e.to_string())?;
    let width = size.width as f64 / scale_factor;
    let height = size.height as f64 / scale_factor;

    if let Ok(manager) = tab_manager.lock() {
        for tab in manager.get_all_tabs() {
            if let Some(content_webview) = app_handle.get_webview(&tab.webview_label) {
                let _ = content_webview.set_position(LogicalPosition::new(0.0, 0.0));
                let _ = content_webview.set_size(LogicalSize::new(width, height));
            }
        }
    }

    // UI webview always full width
    ui_webview
        .set_position(LogicalPosition::new(0.0, 0.0))
        .map_err(|e| e.to_string())?;
    let ui_height = if nav_visible {
        NAV_BAR_HEIGHT
    } else {
        TRIGGER_HEIGHT
    };
    ui_webview
        .set_size(LogicalSize::new(width, ui_height))
        .map_err(|e| e.to_string())?;

    // Sidebar position and size based on visibility and position setting
    let sidebar_x = match position {
        Position::Left => {
            if sidebar_visible {
                0.0
            } else {
                -SIDEBAR_WIDTH + PEEK_WIDTH
            }
        }
        Position::Right => {
            if sidebar_visible {
                width - SIDEBAR_WIDTH
            } else {
                width - PEEK_WIDTH
            }
        }
    };

    sidebar_webview
        .set_position(LogicalPosition::new(sidebar_x, 0.0))
        .map_err(|e| e.to_string())?;
    sidebar_webview
        .set_size(LogicalSize::new(SIDEBAR_WIDTH, height))
        .map_err(|e| e.to_string())?;

    Ok(())
}
