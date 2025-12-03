mod commands;
mod events;
mod settings;
mod state;
mod utils;

use std::sync::{Arc, Mutex};
use tauri::Emitter;
use tauri::Manager;
use tauri::WebviewUrl;

use commands::{
  close_tab, create_tab, fetch_page_title, get_sidebar_settings, get_tab_info, go_back, go_forward,
  hide_new_tab_dialog, hide_settings, navigate, navigate_to, reload, save_sidebar_settings,
  set_content_layout, set_sidebar_position, set_sidebar_width, set_topnav_height,
  show_new_tab_dialog, show_settings, switch_tab,
};
use events::{NavigationEvent, PageInfoEvent, PageLoadEvent};
use settings::{SettingsDb, SidebarPosition, init_database};
use state::AppState;

// Re-export for external use
pub use settings::{SidebarSettings, get_sidebar_settings as db_get_sidebar_settings};
pub use utils::normalize_url;

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
      let settings_db = match init_database() {
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
