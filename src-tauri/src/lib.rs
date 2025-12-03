use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use tauri::Emitter;
use tauri::Manager;
use tauri::WebviewUrl;
use uuid::Uuid;

mod settings;
use settings::{SettingsDb, SidebarPosition, SidebarSettings};

/// Application state for tracking sidebar position
pub struct AppState {
  pub sidebar_position: Mutex<SidebarPosition>,
}

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

/// Event payload for page info (title and favicon)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PageInfoEvent {
  pub title: String,
  pub favicon: Option<String>,
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

/// Fetches the page title using WebView2 API on Windows
#[tauri::command]
fn fetch_page_title(app_handle: tauri::AppHandle) {
  if let Some(webview) = app_handle.get_webview("content") {
    let url = webview.url().map(|u| u.to_string()).unwrap_or_default();

    // Get favicon from URL
    let favicon_url = url.parse::<tauri::Url>().ok().and_then(|parsed| {
      parsed
        .host_str()
        .map(|host| format!("https://www.google.com/s2/favicons?domain={}&sz=32", host))
    });

    let app_handle_clone = app_handle.clone();

    // Use with_webview to access the underlying WebView2 and get title
    #[cfg(target_os = "windows")]
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
              favicon: favicon_url.clone(),
            };
            let _ = app_handle_clone.emit_to("app", "page_info", page_info);
          }
        }
      }
    });
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

/// Sets the top navigation bar height (for show/hide animation)
#[tauri::command]
fn set_topnav_height(app_handle: tauri::AppHandle, height: f64) -> Result<(), String> {
  if let Some(webview) = app_handle.get_webview("topnav") {
    if let Some(window) = app_handle.get_window("main") {
      let size = window.inner_size().map_err(|e| e.to_string())?;
      webview
        .set_size(tauri::LogicalSize::new(size.width as f64, height))
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
fn set_sidebar_width(
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
fn set_content_layout(
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
fn set_sidebar_position(
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

/// Shows the new tab dialog WebView
#[tauri::command]
fn show_new_tab_dialog(app_handle: tauri::AppHandle) -> Result<(), String> {
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
fn hide_new_tab_dialog(app_handle: tauri::AppHandle) -> Result<(), String> {
  if let Some(webview) = app_handle.get_webview("dialog") {
    webview
      .set_size(tauri::LogicalSize::new(0.0, 0.0))
      .map_err(|e| format!("Failed to hide dialog: {}", e))?;
    Ok(())
  } else {
    Err("Dialog webview not found".to_string())
  }
}

/// Shows the settings WebView
#[tauri::command]
fn show_settings(app_handle: tauri::AppHandle) -> Result<(), String> {
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
fn hide_settings(app_handle: tauri::AppHandle) -> Result<(), String> {
  if let Some(webview) = app_handle.get_webview("settings") {
    webview
      .set_size(tauri::LogicalSize::new(0.0, 0.0))
      .map_err(|e| format!("Failed to hide settings: {}", e))?;
    Ok(())
  } else {
    Err("Settings webview not found".to_string())
  }
}

/// Event payload for new tab creation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewTabEvent {
  pub url: String,
}

/// Navigates to URL and hides dialog (called from dialog WebView)
/// Tab creation is handled by sidebar via create_new_tab event
#[tauri::command]
fn navigate_to(app_handle: tauri::AppHandle, url: String) -> Result<(), String> {
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

/// Retrieves sidebar settings from the database
#[tauri::command]
fn get_sidebar_settings(
  state: tauri::State<'_, Arc<SettingsDb>>,
) -> Result<SidebarSettings, String> {
  Ok(settings::get_sidebar_settings(&state))
}

/// Saves sidebar settings to the database and notifies sidebar WebView
#[tauri::command]
fn save_sidebar_settings(
  app_handle: tauri::AppHandle,
  state: tauri::State<'_, Arc<SettingsDb>>,
  settings_data: SidebarSettings,
) -> Result<(), String> {
  settings::save_sidebar_settings(&state, &settings_data)?;
  // Notify sidebar WebView of settings change
  let _ = app_handle.emit_to("sidebar", "settings_changed", &settings_data);
  Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      navigate,
      navigate_to,
      go_back,
      go_forward,
      reload,
      create_tab,
      switch_tab,
      close_tab,
      get_tab_info,
      fetch_page_title,
      set_topnav_height,
      set_sidebar_width,
      set_sidebar_position,
      set_content_layout,
      show_new_tab_dialog,
      hide_new_tab_dialog,
      show_settings,
      hide_settings,
      get_sidebar_settings,
      save_sidebar_settings
    ])
    .setup(|app| {
      // Initialize settings database
      let settings_db = match settings::init_database() {
        Ok(db) => Arc::new(db),
        Err(e) => {
          log::error!("Failed to initialize settings database: {}", e);
          // Create an in-memory database as fallback
          let conn =
            rusqlite::Connection::open_in_memory().expect("Failed to create in-memory database");
          conn
            .execute(
              "CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)",
              [],
            )
            .expect("Failed to create settings table");
          Arc::new(SettingsDb::new(conn))
        }
      };

      // Load initial sidebar settings and create app state
      let initial_settings = settings::get_sidebar_settings(&settings_db);
      let app_state = AppState {
        sidebar_position: Mutex::new(initial_settings.position),
      };
      app.manage(app_state);
      app.manage(settings_db);
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

      // UI dimensions
      let topnav_trigger_height: u32 = 8; // Trigger zone height for top nav
      let sidebar_trigger_width: u32 = 16; // Trigger zone width for sidebar

      // Content Webview (Web content - full screen, at bottom layer)
      let _content_webview = window.add_child(
        tauri::webview::WebviewBuilder::new(
          "content",
          WebviewUrl::External("https://google.com".parse().unwrap()),
        )
        .auto_resize()
        .on_page_load(|webview, payload| {
          use tauri::webview::PageLoadEvent as TauriPageLoadEvent;

          let url = payload.url().to_string();

          match payload.event() {
            TauriPageLoadEvent::Started => {
              let event = PageLoadEvent {
                url: url.clone(),
                is_loading: true,
              };
              // Emit to both topnav and sidebar
              let _ = webview.emit_to("topnav", "page_load_started", event.clone());
              let _ = webview.emit_to("sidebar", "page_load_started", event);
              let nav_event = NavigationEvent { url };
              let _ = webview.emit_to("topnav", "navigation", nav_event.clone());
              let _ = webview.emit_to("sidebar", "navigation", nav_event);
            }
            TauriPageLoadEvent::Finished => {
              let finished_url = url.clone();
              let event = PageLoadEvent {
                url: url.clone(),
                is_loading: false,
              };
              let _ = webview.emit_to("topnav", "page_load_finished", event.clone());
              let _ = webview.emit_to("sidebar", "page_load_finished", event);

              // Extract favicon URL using Google's favicon service
              let favicon_url = finished_url.parse::<tauri::Url>().ok().and_then(|parsed| {
                parsed
                  .host_str()
                  .map(|host| format!("https://www.google.com/s2/favicons?domain={}&sz=32", host))
              });

              // Get title from URL host as fallback
              let title = if let Ok(parsed) = finished_url.parse::<tauri::Url>() {
                parsed.host_str().unwrap_or("New Tab").to_string()
              } else {
                "New Tab".to_string()
              };

              // Emit page info event with host-based title and favicon
              let page_info = PageInfoEvent {
                title,
                favicon: favicon_url,
              };
              let _ = webview.emit_to("topnav", "page_info", page_info.clone());
              let _ = webview.emit_to("sidebar", "page_info", page_info);
            }
          }
        }),
        tauri::LogicalPosition::new(0, 0),
        tauri::Size::Physical(size),
      )?;

      // Top Navigation Webview (overlay at top, starts with trigger zone height)
      let topnav_webview = window.add_child(
        tauri::webview::WebviewBuilder::new(
          "topnav",
          tauri::WebviewUrl::App("index.html?view=topnav".into()),
        )
        .transparent(true),
        tauri::LogicalPosition::new(0, 0),
        tauri::Size::Physical(tauri::PhysicalSize::new(size.width, topnav_trigger_height)),
      )?;

      // Sidebar Webview (overlay at left, starts with trigger zone width)
      let sidebar_webview = window.add_child(
        tauri::webview::WebviewBuilder::new(
          "sidebar",
          tauri::WebviewUrl::App("index.html?view=sidebar".into()),
        )
        .transparent(true),
        tauri::LogicalPosition::new(0, 0),
        tauri::Size::Physical(tauri::PhysicalSize::new(sidebar_trigger_width, size.height)),
      )?;

      // Dialog Webview (centered overlay for new tab dialog, starts hidden with 0x0 size)
      let dialog_webview = window.add_child(
        tauri::webview::WebviewBuilder::new(
          "dialog",
          tauri::WebviewUrl::App("index.html?view=dialog".into()),
        )
        .transparent(true),
        tauri::LogicalPosition::new(0, 0),
        tauri::Size::Physical(tauri::PhysicalSize::new(0, 0)),
      )?;

      // Settings Webview (centered overlay for settings, starts hidden with 0x0 size)
      let settings_webview = window.add_child(
        tauri::webview::WebviewBuilder::new(
          "settings",
          tauri::WebviewUrl::App("index.html?view=settings".into()),
        )
        .transparent(true),
        tauri::LogicalPosition::new(0, 0),
        tauri::Size::Physical(tauri::PhysicalSize::new(0, 0)),
      )?;

      // Handle window resize - update UI webview sizes
      let topnav_handle = topnav_webview.clone();
      let sidebar_handle = sidebar_webview.clone();
      let dialog_handle = dialog_webview.clone();
      let settings_handle = settings_webview.clone();
      let app_handle = app.handle().clone();

      window.on_window_event(move |event| {
        if let tauri::WindowEvent::Resized(size) = event {
          // Update topnav width to match window width
          if let Ok(current_size) = topnav_handle.size() {
            let _ = topnav_handle.set_size(tauri::Size::Physical(tauri::PhysicalSize::new(
              size.width,
              current_size.height,
            )));
          }
          // Update sidebar height and position based on current position setting
          if let Ok(current_size) = sidebar_handle.size() {
            let _ = sidebar_handle.set_size(tauri::Size::Physical(tauri::PhysicalSize::new(
              current_size.width,
              size.height,
            )));

            // Update sidebar position if it's on the right side
            if let Some(state) = app_handle.try_state::<AppState>()
              && let Ok(position) = state.sidebar_position.lock()
              && *position == SidebarPosition::Right
            {
              let x_position = size.width.saturating_sub(current_size.width);
              let _ = sidebar_handle.set_position(tauri::PhysicalPosition::new(x_position, 0));
            }
          }
          // Update dialog size if it's visible (non-zero size)
          if let Ok(current_size) = dialog_handle.size()
            && current_size.width > 0
            && current_size.height > 0
          {
            let _ = dialog_handle.set_size(tauri::Size::Physical(tauri::PhysicalSize::new(
              size.width,
              size.height,
            )));
          }
          // Update settings size if it's visible (non-zero size)
          if let Ok(current_size) = settings_handle.size()
            && current_size.width > 0
            && current_size.height > 0
          {
            let _ = settings_handle.set_size(tauri::Size::Physical(tauri::PhysicalSize::new(
              size.width,
              size.height,
            )));
          }
        }
      });

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
