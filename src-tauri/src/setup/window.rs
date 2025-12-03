use tauri::Manager;

use crate::settings::SidebarPosition;
use crate::state::AppState;

/// Create the main application window
pub fn create_main_window(app: &tauri::App) -> Result<tauri::Window, Box<dyn std::error::Error>> {
  let window = tauri::window::WindowBuilder::new(app, "main")
    .title("Mu")
    .inner_size(800.0, 600.0)
    .min_inner_size(280.0, 280.0)
    .maximized(true)
    .decorations(false)
    .resizable(true)
    .shadow(true)
    .build()?;

  Ok(window)
}

/// Set up the window resize handler to update UI webview sizes
pub fn setup_window_resize_handler(
  window: &tauri::Window,
  topnav_webview: tauri::Webview,
  sidebar_webview: tauri::Webview,
  dialog_webview: tauri::Webview,
  settings_webview: tauri::Webview,
  help_webview: tauri::Webview,
  app_handle: tauri::AppHandle,
) {
  let topnav_handle = topnav_webview;
  let sidebar_handle = sidebar_webview;
  let dialog_handle = dialog_webview;
  let settings_handle = settings_webview;
  let help_handle = help_webview;

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

      // Update help size if it's visible (non-zero size)
      if let Ok(current_size) = help_handle.size()
        && current_size.width > 0
        && current_size.height > 0
      {
        let _ = help_handle.set_size(tauri::Size::Physical(tauri::PhysicalSize::new(
          size.width,
          size.height,
        )));
      }
    }
  });
}
