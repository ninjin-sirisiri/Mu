use crate::utils::normalize_url;
use tauri::Manager;

/// Navigates the content WebView to the specified URL
/// This command works with the tab system - the frontend should update
/// the active tab's URL after successful navigation
#[tauri::command]
pub fn navigate(app_handle: tauri::AppHandle, url: String) -> Result<(), String> {
  let url = normalize_url(&url);

  if url.parse::<tauri::Url>().is_err() {
    return Err(format!("Invalid URL: {}", url));
  }

  if let Some(webview) = app_handle.get_webview("content") {
    webview
      .eval(format!("window.location.assign('{}')", url))
      .map_err(|e| format!("Failed to navigate: {}", e))?;
    Ok(())
  } else {
    Err("Content webview not found".to_string())
  }
}

#[tauri::command]
pub fn go_back(app_handle: tauri::AppHandle) {
  if let Some(webview) = app_handle.get_webview("content") {
    let _ = webview.eval("window.history.back()");
  }
}

#[tauri::command]
pub fn go_forward(app_handle: tauri::AppHandle) {
  if let Some(webview) = app_handle.get_webview("content") {
    let _ = webview.eval("window.history.forward()");
  }
}

#[tauri::command]
pub fn reload(app_handle: tauri::AppHandle) {
  if let Some(webview) = app_handle.get_webview("content") {
    let _ = webview.eval("window.location.reload()");
  }
}
