use tauri::Emitter;
use tauri::WebviewUrl;

use crate::events::{NavigationEvent, PageInfoEvent, PageLoadEvent};

/// UI dimensions
const TOPNAV_TRIGGER_HEIGHT: u32 = 8;
const SIDEBAR_TRIGGER_WIDTH: u32 = 16;

/// Webview handles returned from create_webviews
pub struct WebviewHandles {
  pub topnav: tauri::Webview,
  pub sidebar: tauri::Webview,
  pub dialog: tauri::Webview,
  pub settings: tauri::Webview,
  pub help: tauri::Webview,
}

/// Create all webviews for the application
pub fn create_webviews(
  window: &tauri::Window,
) -> Result<WebviewHandles, Box<dyn std::error::Error>> {
  let size = window.inner_size()?;

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

          let favicon_url = finished_url.parse::<tauri::Url>().ok().and_then(|parsed| {
            parsed
              .host_str()
              .map(|host| format!("https://www.google.com/s2/favicons?domain={}&sz=32", host))
          });

          let title = if let Ok(parsed) = finished_url.parse::<tauri::Url>() {
            parsed.host_str().unwrap_or("New Tab").to_string()
          } else {
            "New Tab".to_string()
          };

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

  // Top Navigation Webview
  let topnav_webview = window.add_child(
    tauri::webview::WebviewBuilder::new(
      "topnav",
      tauri::WebviewUrl::App("index.html?view=topnav".into()),
    )
    .transparent(true),
    tauri::LogicalPosition::new(0, 0),
    tauri::Size::Physical(tauri::PhysicalSize::new(size.width, TOPNAV_TRIGGER_HEIGHT)),
  )?;

  // Sidebar Webview
  let sidebar_webview = window.add_child(
    tauri::webview::WebviewBuilder::new(
      "sidebar",
      tauri::WebviewUrl::App("index.html?view=sidebar".into()),
    )
    .transparent(true),
    tauri::LogicalPosition::new(0, 0),
    tauri::Size::Physical(tauri::PhysicalSize::new(SIDEBAR_TRIGGER_WIDTH, size.height)),
  )?;

  // Dialog Webview (starts hidden)
  let dialog_webview = window.add_child(
    tauri::webview::WebviewBuilder::new(
      "dialog",
      tauri::WebviewUrl::App("index.html?view=dialog".into()),
    )
    .transparent(true),
    tauri::LogicalPosition::new(0, 0),
    tauri::Size::Physical(tauri::PhysicalSize::new(0, 0)),
  )?;

  // Settings Webview (starts hidden)
  let settings_webview = window.add_child(
    tauri::webview::WebviewBuilder::new(
      "settings",
      tauri::WebviewUrl::App("index.html?view=settings".into()),
    )
    .transparent(true),
    tauri::LogicalPosition::new(0, 0),
    tauri::Size::Physical(tauri::PhysicalSize::new(0, 0)),
  )?;

  // Help Webview (starts hidden)
  let help_webview = window.add_child(
    tauri::webview::WebviewBuilder::new(
      "help",
      tauri::WebviewUrl::App("index.html?view=help".into()),
    )
    .transparent(true),
    tauri::LogicalPosition::new(0, 0),
    tauri::Size::Physical(tauri::PhysicalSize::new(0, 0)),
  )?;

  Ok(WebviewHandles {
    topnav: topnav_webview,
    sidebar: sidebar_webview,
    dialog: dialog_webview,
    settings: settings_webview,
    help: help_webview,
  })
}
