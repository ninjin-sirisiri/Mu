use crate::settings::SidebarPosition;
use crate::shortcuts::{ShortcutAction, execute_action};
use crate::state::{AppState, DEFAULT_ZOOM_LEVEL, MAX_ZOOM_LEVEL, MIN_ZOOM_LEVEL, ZOOM_STEP};
use tauri::{Emitter, Manager, Window};

/// Default sidebar width when visible
const SIDEBAR_WIDTH: u32 = 260;
/// Trigger zone width when sidebar is hidden
const SIDEBAR_TRIGGER_WIDTH: u32 = 16;

/// Toggle sidebar visibility
/// Requirements: 4.1
#[tauri::command]
pub fn toggle_sidebar(
  app_handle: tauri::AppHandle,
  state: tauri::State<'_, AppState>,
) -> Result<bool, String> {
  // Toggle the visibility state
  let new_visible = {
    let mut visible = state
      .sidebar_visible
      .lock()
      .map_err(|e| format!("Failed to lock state: {}", e))?;
    *visible = !*visible;
    *visible
  };

  // Get sidebar position for proper positioning
  let position = {
    let pos = state
      .sidebar_position
      .lock()
      .map_err(|e| format!("Failed to lock state: {}", e))?;
    pos.clone()
  };

  // Update sidebar WebView size
  if let Some(webview) = app_handle.get_webview("sidebar")
    && let Some(window) = app_handle.get_window("main")
  {
    let window_size = window.inner_size().map_err(|e| e.to_string())?;
    let scale_factor = window.scale_factor().unwrap_or(1.0);

    let target_width = if new_visible {
      (SIDEBAR_WIDTH as f64 * scale_factor).round() as u32
    } else {
      (SIDEBAR_TRIGGER_WIDTH as f64 * scale_factor).round() as u32
    };

    // Set the new size
    webview
      .set_size(tauri::PhysicalSize::new(target_width, window_size.height))
      .map_err(|e| format!("Failed to set sidebar size: {}", e))?;

    // If sidebar is on the right, update position
    if position == SidebarPosition::Right {
      let x_position = window_size.width.saturating_sub(target_width);
      webview
        .set_position(tauri::PhysicalPosition::new(x_position, 0))
        .map_err(|e| format!("Failed to set sidebar position: {}", e))?;
    }

    log::info!(
      "[Shortcuts] Sidebar toggled: visible={}, width={}",
      new_visible,
      target_width
    );
  }

  // Emit event to frontend
  let _ = app_handle.emit("sidebar_toggled", new_visible);

  Ok(new_visible)
}

/// Toggle fullscreen mode
/// Requirements: 4.2, 4.3
#[tauri::command]
pub fn toggle_fullscreen(window: Window) -> Result<bool, String> {
  let is_fullscreen = window.is_fullscreen().map_err(|e| e.to_string())?;
  let new_fullscreen = !is_fullscreen;

  window
    .set_fullscreen(new_fullscreen)
    .map_err(|e| format!("Failed to toggle fullscreen: {}", e))?;

  log::info!("[Shortcuts] Fullscreen toggled: {}", new_fullscreen);

  Ok(new_fullscreen)
}

/// Apply zoom level to the content WebView via JavaScript injection
fn apply_zoom_to_webview(app_handle: &tauri::AppHandle, zoom_level: f64) -> Result<(), String> {
  if let Some(webview) = app_handle.get_webview("content") {
    let js = format!("document.body.style.zoom = '{}';", zoom_level);
    webview
      .eval(&js)
      .map_err(|e| format!("Failed to apply zoom: {}", e))?;
    log::info!(
      "[Shortcuts] Applied zoom level: {}%",
      (zoom_level * 100.0).round()
    );
    Ok(())
  } else {
    Err("Content webview not found".to_string())
  }
}

/// Zoom in the current page
/// Requirements: 5.2
#[tauri::command]
pub fn zoom_in(
  app_handle: tauri::AppHandle,
  state: tauri::State<'_, AppState>,
) -> Result<f64, String> {
  let new_zoom = {
    let mut zoom = state
      .zoom_level
      .lock()
      .map_err(|e| format!("Failed to lock state: {}", e))?;

    // Calculate new zoom level, capped at MAX_ZOOM_LEVEL
    let new_level = (*zoom + ZOOM_STEP).min(MAX_ZOOM_LEVEL);
    *zoom = new_level;
    new_level
  };

  apply_zoom_to_webview(&app_handle, new_zoom)?;

  // Emit event to frontend
  let _ = app_handle.emit("zoom_changed", new_zoom);

  Ok(new_zoom)
}

/// Zoom out the current page
/// Requirements: 5.3
#[tauri::command]
pub fn zoom_out(
  app_handle: tauri::AppHandle,
  state: tauri::State<'_, AppState>,
) -> Result<f64, String> {
  let new_zoom = {
    let mut zoom = state
      .zoom_level
      .lock()
      .map_err(|e| format!("Failed to lock state: {}", e))?;

    // Calculate new zoom level, capped at MIN_ZOOM_LEVEL
    let new_level = (*zoom - ZOOM_STEP).max(MIN_ZOOM_LEVEL);
    *zoom = new_level;
    new_level
  };

  apply_zoom_to_webview(&app_handle, new_zoom)?;

  // Emit event to frontend
  let _ = app_handle.emit("zoom_changed", new_zoom);

  Ok(new_zoom)
}

/// Reset zoom to 100%
/// Requirements: 5.4
#[tauri::command]
pub fn zoom_reset(
  app_handle: tauri::AppHandle,
  state: tauri::State<'_, AppState>,
) -> Result<f64, String> {
  {
    let mut zoom = state
      .zoom_level
      .lock()
      .map_err(|e| format!("Failed to lock state: {}", e))?;
    *zoom = DEFAULT_ZOOM_LEVEL;
  }

  apply_zoom_to_webview(&app_handle, DEFAULT_ZOOM_LEVEL)?;

  // Emit event to frontend
  let _ = app_handle.emit("zoom_changed", DEFAULT_ZOOM_LEVEL);

  Ok(DEFAULT_ZOOM_LEVEL)
}

/// Get current zoom level
#[tauri::command]
pub fn get_zoom_level(state: tauri::State<'_, AppState>) -> Result<f64, String> {
  let zoom = state
    .zoom_level
    .lock()
    .map_err(|e| format!("Failed to lock state: {}", e))?;
  Ok(*zoom)
}

/// Open find in page functionality
/// Requirements: 5.1
#[tauri::command]
pub fn find_in_page(app_handle: tauri::AppHandle) -> Result<(), String> {
  if let Some(webview) = app_handle.get_webview("content") {
    // Trigger the browser's native find functionality
    // Note: This uses window.find() which opens the browser's find dialog
    // For a more custom solution, we could implement our own find UI
    let js = r#"
      (function() {
        // Try to use the native find functionality
        if (window.find) {
          window.find('', false, false, true, false, false, false);
        }
      })();
    "#;
    webview
      .eval(js)
      .map_err(|e| format!("Failed to open find in page: {}", e))?;
    log::info!("[Shortcuts] Opened find in page");
    Ok(())
  } else {
    Err("Content webview not found".to_string())
  }
}

/// Show the help overlay WebView
/// Requirements: 7.1
#[tauri::command]
pub fn show_help(app_handle: tauri::AppHandle) -> Result<(), String> {
  if let Some(webview) = app_handle.get_webview("help") {
    if let Some(window) = app_handle.get_window("main") {
      let size = window.inner_size().map_err(|e| e.to_string())?;
      // Reset position to (0,0) and set size to full window
      webview
        .set_position(tauri::LogicalPosition::new(0.0, 0.0))
        .map_err(|e| format!("Failed to set help position: {}", e))?;
      webview
        .set_size(tauri::PhysicalSize::new(size.width, size.height))
        .map_err(|e| format!("Failed to show help: {}", e))?;
      // Set focus to the help WebView
      let _ = webview.set_focus();
      log::info!("[Shortcuts] Showed help overlay");
    }
    Ok(())
  } else {
    Err("Help webview not found".to_string())
  }
}

/// Hide the help overlay WebView and return focus to content
/// Requirements: 7.3
#[tauri::command]
pub fn hide_help(app_handle: tauri::AppHandle) -> Result<(), String> {
  if let Some(webview) = app_handle.get_webview("help") {
    webview
      .set_size(tauri::LogicalSize::new(0.0, 0.0))
      .map_err(|e| format!("Failed to hide help: {}", e))?;

    // Return focus to content WebView
    if let Some(content) = app_handle.get_webview("content") {
      let _ = content.set_focus();
    }

    log::info!("[Shortcuts] Hid help overlay");
    Ok(())
  } else {
    Err("Help webview not found".to_string())
  }
}

/// Get all registered shortcuts grouped by category
/// Requirements: 7.2
#[tauri::command]
pub fn get_shortcut_list() -> Vec<crate::shortcuts::ShortcutInfo> {
  use crate::shortcuts::{ShortcutInfo, get_all_shortcuts};

  get_all_shortcuts().iter().map(ShortcutInfo::from).collect()
}

/// Execute a shortcut action from the frontend
/// This replaces global shortcuts with app-scoped shortcuts
#[tauri::command]
pub fn execute_shortcut_action(app_handle: tauri::AppHandle, action: String) -> Result<(), String> {
  let shortcut_action = match action.as_str() {
    "go_back" => ShortcutAction::GoBack,
    "go_forward" => ShortcutAction::GoForward,
    "reload" => ShortcutAction::Reload,
    "stop_loading" => ShortcutAction::StopLoading,
    "new_tab" => ShortcutAction::NewTab,
    "close_tab" => ShortcutAction::CloseTab,
    "next_tab" => ShortcutAction::NextTab,
    "previous_tab" => ShortcutAction::PreviousTab,
    "toggle_sidebar" => ShortcutAction::ToggleSidebar,
    "toggle_fullscreen" => ShortcutAction::ToggleFullscreen,
    "open_command_palette" => ShortcutAction::OpenCommandPalette,
    "zoom_in" => ShortcutAction::ZoomIn,
    "zoom_out" => ShortcutAction::ZoomOut,
    "zoom_reset" => ShortcutAction::ZoomReset,
    "find_in_page" => ShortcutAction::FindInPage,
    "show_help" => ShortcutAction::ShowHelp,
    "add_bookmark" => ShortcutAction::AddBookmark,
    "toggle_bookmark_panel" => ShortcutAction::ToggleBookmarkPanel,
    s if s.starts_with("switch_to_tab_") => {
      let index: u8 = s
        .strip_prefix("switch_to_tab_")
        .and_then(|n| n.parse().ok())
        .ok_or_else(|| format!("Invalid tab index in action: {}", action))?;
      ShortcutAction::SwitchToTab(index)
    }
    _ => return Err(format!("Unknown shortcut action: {}", action)),
  };

  execute_action(&app_handle, &shortcut_action);
  Ok(())
}
