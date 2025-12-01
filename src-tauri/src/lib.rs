use std::sync::Mutex;
use tauri::Manager;
use tauri::WebviewUrl;

struct AppState {
  height: Mutex<u32>,
}

#[tauri::command]
fn set_ui_height(height: u32, state: tauri::State<AppState>, app_handle: tauri::AppHandle) {
  *state.height.lock().unwrap() = height;
  if let Some(webview) = app_handle.get_webview("app") {
    let window = webview.window();
    if let Ok(size) = window.inner_size() {
      let _ = webview.set_size(tauri::Size::Physical(tauri::PhysicalSize {
        width: size.width,
        height,
      }));
    }
  }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .manage(AppState {
      height: Mutex::new(20),
    })
    .invoke_handler(tauri::generate_handler![set_ui_height])
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
        .inner_size(1600.0, 900.0)
        .maximized(true)
        .decorations(false)
        .build()?;

      let size = window.inner_size()?;

      // Content Webview (Below top bar)
      let content_webview = window.add_child(
        tauri::webview::WebviewBuilder::new(
          "content",
          WebviewUrl::External("https://google.com".parse().unwrap()),
        ),
        tauri::LogicalPosition::new(0, 0),
        tauri::Size::Physical(size),
      )?;

      // App Webview (UI Overlay)
      let app_size = tauri::PhysicalSize {
        width: size.width,
        height: 20, // Start with just the trigger zone height
      };

      let app_webview = window.add_child(
        tauri::webview::WebviewBuilder::new("app", tauri::WebviewUrl::App("index.html".into()))
          .transparent(true),
        tauri::LogicalPosition::new(0, 0),
        tauri::Size::Physical(app_size),
      )?;

      let content_webview_handle = content_webview.clone();
      let app_webview_handle = app_webview.clone();
      let app_handle = app.handle().clone();

      window.on_window_event(move |event| {
        if let tauri::WindowEvent::Resized(size) = event {
          let _ = content_webview_handle.set_size(tauri::Size::Physical(*size));

          // Resize app webview width but keep current height
          let state = app_handle.state::<AppState>();
          let height = *state.height.lock().unwrap();

          let _ = app_webview_handle.set_size(tauri::Size::Physical(tauri::PhysicalSize {
            width: size.width,
            height,
          }));
        }
      });

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
