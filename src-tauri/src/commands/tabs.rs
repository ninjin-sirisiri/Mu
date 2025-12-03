use crate::events::TabInfo;
use crate::utils::normalize_url;
use tauri::Manager;
use uuid::Uuid;

/// Creates a new tab and returns its unique ID
/// The actual tab state is managed in the frontend store
#[tauri::command]
pub fn create_tab() -> String {
  Uuid::new_v4().to_string()
}

/// Switches to a tab by navigating the content WebView to the specified URL
#[tauri::command]
pub fn switch_tab(app_handle: tauri::AppHandle, url: String) -> Result<(), String> {
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

/// Closes a tab (placeholder for future multi-WebView support)
/// Currently, tab state is managed entirely in the frontend
#[tauri::command]
pub fn close_tab(_tab_id: String) -> Result<(), String> {
  // In the current single-WebView implementation, closing a tab
  // is handled entirely by the frontend store.
  // This command is a placeholder for future multi-WebView support
  // where we would need to destroy the associated WebView.
  Ok(())
}

/// Retrieves information about the current page in the content WebView
#[tauri::command]
pub async fn get_tab_info(app_handle: tauri::AppHandle) -> Result<TabInfo, String> {
  if let Some(webview) = app_handle.get_webview("content") {
    // Return basic info - the actual title/URL updates
    // come through the on_page_load event
    Ok(TabInfo {
      url: webview.url().map(|u| u.to_string()).unwrap_or_default(),
      title: String::new(), // Title is obtained via page load events
      is_loading: false,
    })
  } else {
    Err("Content webview not found".to_string())
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_create_tab_returns_valid_uuid() {
    let tab_id = create_tab();
    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    assert_eq!(tab_id.len(), 36);
    assert!(uuid::Uuid::parse_str(&tab_id).is_ok());
  }

  #[test]
  fn test_create_tab_returns_unique_ids() {
    let id1 = create_tab();
    let id2 = create_tab();
    assert_ne!(id1, id2);
  }

  #[test]
  fn test_close_tab_always_succeeds() {
    // close_tab is a placeholder that always returns Ok
    let result = close_tab("any-id".to_string());
    assert!(result.is_ok());
  }
}
