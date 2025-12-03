use crate::events::PageInfoEvent;
use crate::settings::{
  SettingsDb, SidebarSettings, get_sidebar_settings as db_get_sidebar_settings,
  save_sidebar_settings as db_save_sidebar_settings,
};
use std::sync::Arc;
use tauri::Emitter;
use tauri::Manager;

/// Shows the settings WebView
#[tauri::command]
pub fn show_settings(app_handle: tauri::AppHandle) -> Result<(), String> {
  if let Some(webview) = app_handle.get_webview("settings") {
    if let Some(window) = app_handle.get_window("main") {
      let size = window.inner_size().map_err(|e| e.to_string())?;
      webview
        .set_position(tauri::LogicalPosition::new(0.0, 0.0))
        .map_err(|e| format!("Failed to set settings position: {}", e))?;
      webview
        .set_size(tauri::PhysicalSize::new(size.width, size.height))
        .map_err(|e| format!("Failed to show settings: {}", e))?;
      let _ = webview.set_focus();
    }
    Ok(())
  } else {
    Err("Settings webview not found".to_string())
  }
}

/// Hides the settings WebView
#[tauri::command]
pub fn hide_settings(app_handle: tauri::AppHandle) -> Result<(), String> {
  if let Some(webview) = app_handle.get_webview("settings") {
    webview
      .set_size(tauri::LogicalSize::new(0.0, 0.0))
      .map_err(|e| format!("Failed to hide settings: {}", e))?;
    Ok(())
  } else {
    Err("Settings webview not found".to_string())
  }
}

/// Retrieves sidebar settings from the database
#[tauri::command]
pub fn get_sidebar_settings(
  state: tauri::State<'_, Arc<SettingsDb>>,
) -> Result<SidebarSettings, String> {
  Ok(db_get_sidebar_settings(&state))
}

/// Saves sidebar settings to the database and notifies sidebar WebView
#[tauri::command]
pub fn save_sidebar_settings(
  app_handle: tauri::AppHandle,
  state: tauri::State<'_, Arc<SettingsDb>>,
  settings_data: SidebarSettings,
) -> Result<(), String> {
  db_save_sidebar_settings(&state, &settings_data)?;
  // Notify sidebar WebView of settings change
  let _ = app_handle.emit_to("sidebar", "settings_changed", &settings_data);
  Ok(())
}

/// Fetches the page title using platform-specific APIs
#[tauri::command]
pub fn fetch_page_title(app_handle: tauri::AppHandle) {
  if let Some(webview) = app_handle.get_webview("content") {
    let url = webview.url().map(|u| u.to_string()).unwrap_or_default();

    // Get favicon from URL
    let favicon_url = url.parse::<tauri::Url>().ok().and_then(|parsed| {
      parsed
        .host_str()
        .map(|host| format!("https://www.google.com/s2/favicons?domain={}&sz=32", host))
    });

    let app_handle_clone = app_handle.clone();

    // Windows: Use WebView2 native API
    #[cfg(target_os = "windows")]
    {
      let favicon_url_clone = favicon_url.clone();
      let app_handle_win = app_handle_clone.clone();
      let _ = webview.with_webview(move |wv| {
        use windows::core::PWSTR;

        let controller = wv.controller();
        let core = unsafe { controller.CoreWebView2().unwrap() };

        let mut title_ptr = PWSTR::null();
        unsafe {
          let _ = core.DocumentTitle(&mut title_ptr);
          if !title_ptr.is_null() {
            let title_str = title_ptr.to_string().unwrap_or_default();
            if !title_str.is_empty() {
              let page_info = PageInfoEvent {
                title: title_str,
                favicon: favicon_url_clone.clone(),
              };
              let _ = app_handle_win.emit_to("app", "page_info", page_info);
            }
          }
        }
      });
    }

    // macOS: Use WKWebView native API via objc2
    #[cfg(target_os = "macos")]
    {
      let favicon_url_clone = favicon_url.clone();
      let app_handle_mac = app_handle_clone.clone();
      let _ = webview.with_webview(move |wv| {
        use objc2::runtime::AnyObject;
        use objc2_foundation::NSString;

        let wkwebview = wv.inner();

        unsafe {
          let wkwebview_ptr: *const AnyObject = std::ptr::from_ref(&*wkwebview).cast();
          let title_ns: *const NSString = objc2::msg_send![wkwebview_ptr, title];
          if !title_ns.is_null() {
            let title_str = (*title_ns).to_string();
            if !title_str.is_empty() {
              let page_info = PageInfoEvent {
                title: title_str,
                favicon: favicon_url_clone.clone(),
              };
              let _ = app_handle_mac.emit_to("app", "page_info", page_info);
            }
          }
        }
      });
    }

    // Linux: Use JavaScript fallback (WebKitGTK doesn't expose title directly via wry)
    #[cfg(target_os = "linux")]
    {
      use tauri::WebviewExt;

      // Use JavaScript to get title, then use IPC callback
      let favicon_url_clone = favicon_url.clone();
      let app_handle_linux = app_handle_clone.clone();

      // For Linux, we'll use a simpler approach: extract title from URL or use host
      // since WebKitGTK's with_webview doesn't provide easy title access
      let title = url
        .parse::<tauri::Url>()
        .ok()
        .and_then(|u| u.host_str().map(|s| s.to_string()))
        .unwrap_or_else(|| url.clone());

      let page_info = PageInfoEvent {
        title,
        favicon: favicon_url_clone,
      };
      let _ = app_handle_linux.emit_to("app", "page_info", page_info);
    }
  }
}
