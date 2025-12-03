use crate::events::NewTabEvent;
use crate::utils::normalize_url;
use tauri::Emitter;
use tauri::Manager;

/// Shows the new tab dialog WebView
#[tauri::command]
pub fn show_new_tab_dialog(app_handle: tauri::AppHandle) -> Result<(), String> {
  if let Some(webview) = app_handle.get_webview("dialog") {
    if let Some(window) = app_handle.get_window("main") {
      let size = window.inner_size().map_err(|e| e.to_string())?;
      // Reset position to (0,0) and set size to full window
      webview
        .set_position(tauri::LogicalPosition::new(0.0, 0.0))
        .map_err(|e| format!("Failed to set dialog position: {}", e))?;
      webview
        .set_size(tauri::PhysicalSize::new(size.width, size.height))
        .map_err(|e| format!("Failed to show dialog: {}", e))?;
      // Set focus to the dialog WebView, clear and focus the input element
      let _ = webview.set_focus();
      let _ = webview.eval(
        "setTimeout(() => { const input = document.querySelector('input'); if (input) { input.value = ''; input.dispatchEvent(new Event('input', { bubbles: true })); input.focus(); } }, 100);"
      );
    }
    Ok(())
  } else {
    Err("Dialog webview not found".to_string())
  }
}

/// Hides the new tab dialog WebView
#[tauri::command]
pub fn hide_new_tab_dialog(app_handle: tauri::AppHandle) -> Result<(), String> {
  if let Some(webview) = app_handle.get_webview("dialog") {
    webview
      .set_size(tauri::LogicalSize::new(0.0, 0.0))
      .map_err(|e| format!("Failed to hide dialog: {}", e))?;
    Ok(())
  } else {
    Err("Dialog webview not found".to_string())
  }
}

/// Navigates to URL and hides dialog (called from dialog WebView)
/// Tab creation is handled by sidebar via create_new_tab event
#[tauri::command]
pub fn navigate_to(app_handle: tauri::AppHandle, url: String) -> Result<(), String> {
  let url = normalize_url(&url);

  if url.parse::<tauri::Url>().is_err() {
    return Err(format!("Invalid URL: {}", url));
  }

  // Hide dialog first
  if let Some(dialog) = app_handle.get_webview("dialog") {
    let _ = dialog.set_size(tauri::LogicalSize::new(0.0, 0.0));
  }

  // Emit event to sidebar to create new tab (only sidebar listens for this)
  let _ = app_handle.emit("create_new_tab", NewTabEvent { url: url.clone() });

  // Note: Navigation happens automatically when sidebar creates the tab
  // and sets it as active, triggering switch_tab

  Ok(())
}
