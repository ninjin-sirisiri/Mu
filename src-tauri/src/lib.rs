use serde::{Deserialize, Serialize};
use tauri::Emitter;
use tauri::Manager;
use tauri::WebviewUrl;
use uuid::Uuid;

// AppState removed - UI overlay is now always full screen

/// Information about the current tab/page state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TabInfo {
  pub url: String,
  pub title: String,
  pub is_loading: bool,
}

/// Event payload for page load events
/// Emitted when a page starts or finishes loading
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PageLoadEvent {
  pub url: String,
  pub is_loading: bool,
}

/// Event payload for navigation events
/// Emitted when the URL changes
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NavigationEvent {
  pub url: String,
}

/// Creates a new tab and returns its unique ID
/// The actual tab state is managed in the frontend store
#[tauri::command]
fn create_tab() -> String {
  Uuid::new_v4().to_string()
}

/// Switches to a tab by navigating the content WebView to the specified URL
#[tauri::command]
fn switch_tab(app_handle: tauri::AppHandle, url: String) -> Result<(), String> {
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
fn close_tab(_tab_id: String) -> Result<(), String> {
  // In the current single-WebView implementation, closing a tab
  // is handled entirely by the frontend store.
  // This command is a placeholder for future multi-WebView support
  // where we would need to destroy the associated WebView.
  Ok(())
}

/// Retrieves information about the current page in the content WebView
#[tauri::command]
async fn get_tab_info(app_handle: tauri::AppHandle) -> Result<TabInfo, String> {
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

/// Normalizes a URL by adding https:// prefix if needed
fn normalize_url(url: &str) -> String {
  if url.starts_with("http://") || url.starts_with("https://") {
    url.to_string()
  } else {
    format!("https://{}", url)
  }
}

// set_ui_height removed - UI overlay is now always full screen

/// Navigates the content WebView to the specified URL
/// This command works with the tab system - the frontend should update
/// the active tab's URL after successful navigation
#[tauri::command]
fn navigate(app_handle: tauri::AppHandle, url: String) -> Result<(), String> {
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
fn go_back(app_handle: tauri::AppHandle) {
  if let Some(webview) = app_handle.get_webview("content") {
    let _ = webview.eval("window.history.back()");
  }
}

#[tauri::command]
fn go_forward(app_handle: tauri::AppHandle) {
  if let Some(webview) = app_handle.get_webview("content") {
    let _ = webview.eval("window.history.forward()");
  }
}

#[tauri::command]
fn reload(app_handle: tauri::AppHandle) {
  if let Some(webview) = app_handle.get_webview("content") {
    let _ = webview.eval("window.location.reload()");
  }
}

/// Sets the content webview position and size to accommodate UI elements
/// This allows the content to be visible while UI overlays are shown
#[tauri::command]
fn set_content_bounds(
  app_handle: tauri::AppHandle,
  x: f64,
  y: f64,
  width: f64,
  height: f64,
) -> Result<(), String> {
  if let Some(webview) = app_handle.get_webview("content") {
    webview
      .set_position(tauri::LogicalPosition::new(x, y))
      .map_err(|e| format!("Failed to set position: {}", e))?;
    webview
      .set_size(tauri::LogicalSize::new(width, height))
      .map_err(|e| format!("Failed to set size: {}", e))?;
    Ok(())
  } else {
    Err("Content webview not found".to_string())
  }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      navigate,
      go_back,
      go_forward,
      reload,
      create_tab,
      switch_tab,
      close_tab,
      get_tab_info,
      set_content_bounds
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      let window = tauri::window::WindowBuilder::new(app, "main")
        .title("Mu")
        .inner_size(800.0, 600.0)
        .min_inner_size(280.0, 280.0)
        .maximized(true)
        .decorations(false)
        .resizable(true)
        .shadow(true)
        .build()?;

      let size = window.inner_size()?;

      // Trigger zone sizes
      let trigger_left: u32 = 16; // Left sidebar trigger
      let trigger_top: u32 = 8; // Top nav trigger

      // App Webview (UI - added first, will be at bottom layer)
      let _app_webview = window.add_child(
        tauri::webview::WebviewBuilder::new("app", tauri::WebviewUrl::App("index.html".into()))
          .auto_resize(),
        tauri::LogicalPosition::new(0, 0),
        tauri::Size::Physical(size),
      )?;

      // Content Webview (Web content - added second, on top but offset for trigger zones)
      let content_webview = window.add_child(
        tauri::webview::WebviewBuilder::new(
          "content",
          WebviewUrl::External("https://google.com".parse().unwrap()),
        )
        .on_page_load(|webview, payload| {
          use tauri::webview::PageLoadEvent as TauriPageLoadEvent;

          let url = payload.url().to_string();

          match payload.event() {
            TauriPageLoadEvent::Started => {
              let event = PageLoadEvent {
                url: url.clone(),
                is_loading: true,
              };
              let _ = webview.emit_to("app", "page_load_started", event);
              let nav_event = NavigationEvent { url };
              let _ = webview.emit_to("app", "navigation", nav_event);
            }
            TauriPageLoadEvent::Finished => {
              let event = PageLoadEvent {
                url,
                is_loading: false,
              };
              let _ = webview.emit_to("app", "page_load_finished", event);
            }
          }
        }),
        tauri::LogicalPosition::new(trigger_left as f64, trigger_top as f64),
        tauri::Size::Physical(tauri::PhysicalSize::new(
          size.width.saturating_sub(trigger_left),
          size.height.saturating_sub(trigger_top),
        )),
      )?;

      let content_webview_handle = content_webview.clone();

      window.on_window_event(move |event| {
        if let tauri::WindowEvent::Resized(size) = event {
          // Content webview is offset by trigger zones
          let _ = content_webview_handle.set_position(tauri::LogicalPosition::new(
            trigger_left as f64,
            trigger_top as f64,
          ));
          let _ = content_webview_handle.set_size(tauri::Size::Physical(tauri::PhysicalSize::new(
            size.width.saturating_sub(trigger_left),
            size.height.saturating_sub(trigger_top),
          )));
        }
      });

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
