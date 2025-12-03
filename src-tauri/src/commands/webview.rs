use crate::settings::SidebarPosition;
use crate::state::AppState;
use tauri::Manager;

/// Sets the top navigation bar height (for show/hide animation)
#[tauri::command]
pub fn set_topnav_height(app_handle: tauri::AppHandle, height: f64) -> Result<(), String> {
  if let Some(webview) = app_handle.get_webview("topnav") {
    if let Some(window) = app_handle.get_window("main") {
      let window_size = window.inner_size().map_err(|e| e.to_string())?;
      let scale_factor = window.scale_factor().unwrap_or(1.0);

      // Convert logical height to physical height
      let physical_height = (height * scale_factor).round() as u32;

      webview
        .set_size(tauri::PhysicalSize::new(window_size.width, physical_height))
        .map_err(|e| format!("Failed to set topnav size: {}", e))?;
    }
    Ok(())
  } else {
    Err("Topnav webview not found".to_string())
  }
}

/// Sets the sidebar width (for show/hide animation)
/// Also updates position if sidebar is on the right side
#[tauri::command]
pub fn set_sidebar_width(
  app_handle: tauri::AppHandle,
  state: tauri::State<'_, AppState>,
  width: f64,
) -> Result<(), String> {
  if let Some(webview) = app_handle.get_webview("sidebar") {
    if let Some(window) = app_handle.get_window("main") {
      let window_size = window.inner_size().map_err(|e| e.to_string())?;
      let scale_factor = window.scale_factor().unwrap_or(1.0);

      // Convert logical width to physical width
      let physical_width = (width * scale_factor).round() as u32;

      // Set the new size using PhysicalSize
      webview
        .set_size(tauri::PhysicalSize::new(physical_width, window_size.height))
        .map_err(|e| format!("Failed to set sidebar size: {}", e))?;

      // If sidebar is on the right, update position to keep it at the right edge
      let position = state.sidebar_position.lock().ok();
      if let Some(pos) = position
        && *pos == SidebarPosition::Right
      {
        let x_position = window_size.width.saturating_sub(physical_width);
        webview
          .set_position(tauri::PhysicalPosition::new(x_position, 0))
          .map_err(|e| format!("Failed to set sidebar position: {}", e))?;
      }
    }
    Ok(())
  } else {
    Err("Sidebar webview not found".to_string())
  }
}

/// Sets the content WebView layout to avoid overlapping with fixed sidebar
#[tauri::command]
pub fn set_content_layout(
  app_handle: tauri::AppHandle,
  sidebar_width: f64,
  sidebar_position: SidebarPosition,
  is_fixed: bool,
) -> Result<(), String> {
  if let Some(content) = app_handle.get_webview("content") {
    if let Some(window) = app_handle.get_window("main") {
      let window_size = window.inner_size().map_err(|e| e.to_string())?;
      let scale_factor = window.scale_factor().unwrap_or(1.0);

      if is_fixed {
        // Fixed mode: resize content to avoid sidebar
        let physical_sidebar_width = (sidebar_width * scale_factor).round() as u32;
        let content_width = window_size.width.saturating_sub(physical_sidebar_width);

        let x_position = match sidebar_position {
          SidebarPosition::Left => physical_sidebar_width,
          SidebarPosition::Right => 0,
        };

        content
          .set_position(tauri::PhysicalPosition::new(x_position, 0))
          .map_err(|e| format!("Failed to set content position: {}", e))?;
        content
          .set_size(tauri::PhysicalSize::new(content_width, window_size.height))
          .map_err(|e| format!("Failed to set content size: {}", e))?;
      } else {
        // Auto-hide mode: content takes full window
        content
          .set_position(tauri::PhysicalPosition::new(0, 0))
          .map_err(|e| format!("Failed to set content position: {}", e))?;
        content
          .set_size(tauri::PhysicalSize::new(
            window_size.width,
            window_size.height,
          ))
          .map_err(|e| format!("Failed to set content size: {}", e))?;
      }
    }
    Ok(())
  } else {
    Err("Content webview not found".to_string())
  }
}

/// Sets the sidebar position (left or right) by repositioning the WebView
#[tauri::command]
pub fn set_sidebar_position(
  app_handle: tauri::AppHandle,
  state: tauri::State<'_, AppState>,
  position: SidebarPosition,
) -> Result<(), String> {
  // Update the app state with the new position
  {
    let mut pos = state
      .sidebar_position
      .lock()
      .map_err(|e| format!("Failed to lock state: {}", e))?;
    *pos = position.clone();
  }

  if let Some(webview) = app_handle.get_webview("sidebar") {
    if let Some(window) = app_handle.get_window("main") {
      let window_size = window.inner_size().map_err(|e| e.to_string())?;
      let webview_size = webview.size().map_err(|e| e.to_string())?;

      let x_position = match position {
        SidebarPosition::Left => 0,
        SidebarPosition::Right => window_size.width.saturating_sub(webview_size.width),
      };

      webview
        .set_position(tauri::PhysicalPosition::new(x_position, 0))
        .map_err(|e| format!("Failed to set sidebar position: {}", e))?;

      log::info!(
        "Sidebar position set to {:?} at x={} (window={}, webview={})",
        position,
        x_position,
        window_size.width,
        webview_size.width
      );
    }
    Ok(())
  } else {
    Err("Sidebar webview not found".to_string())
  }
}
