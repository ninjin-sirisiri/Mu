use super::types::ShortcutAction;
use tauri::{AppHandle, Emitter, Manager};

/// Execute the action associated with a shortcut
pub fn execute_action(app_handle: &AppHandle, action: &ShortcutAction) {
  match action {
    ShortcutAction::GoBack => {
      if let Some(webview) = app_handle.get_webview("content") {
        let _ = webview.eval("window.history.back()");
        log::info!("[Shortcuts] Executed: Go Back");
      }
    }
    ShortcutAction::GoForward => {
      if let Some(webview) = app_handle.get_webview("content") {
        let _ = webview.eval("window.history.forward()");
        log::info!("[Shortcuts] Executed: Go Forward");
      }
    }
    ShortcutAction::Reload => {
      if let Some(webview) = app_handle.get_webview("content") {
        let _ = webview.eval("window.location.reload()");
        log::info!("[Shortcuts] Executed: Reload");
      }
    }
    ShortcutAction::StopLoading => {
      if let Some(webview) = app_handle.get_webview("content") {
        let _ = webview.eval("window.stop()");
        log::info!("[Shortcuts] Executed: Stop Loading");
      }
    }
    ShortcutAction::NewTab => {
      let _ = app_handle.emit_to("sidebar", "shortcut_new_tab", ());
      let _ = app_handle.emit_to("dialog", "shortcut_new_tab", ());
      log::info!("[Shortcuts] Executed: New Tab");
    }
    ShortcutAction::CloseTab => {
      let _ = app_handle.emit_to("sidebar", "shortcut_close_tab", ());
      log::info!("[Shortcuts] Executed: Close Tab");
    }
    ShortcutAction::NextTab => {
      let _ = app_handle.emit_to("sidebar", "shortcut_next_tab", ());
      log::info!("[Shortcuts] Executed: Next Tab");
    }
    ShortcutAction::PreviousTab => {
      let _ = app_handle.emit_to("sidebar", "shortcut_previous_tab", ());
      log::info!("[Shortcuts] Executed: Previous Tab");
    }
    ShortcutAction::SwitchToTab(index) => {
      let _ = app_handle.emit_to("sidebar", "shortcut_switch_to_tab", *index);
      log::info!("[Shortcuts] Executed: Switch to Tab {}", index);
    }
    ShortcutAction::ToggleSidebar => {
      let _ = app_handle.emit_to("sidebar", "shortcut_toggle_sidebar", ());
      log::info!("[Shortcuts] Executed: Toggle Sidebar");
    }
    ShortcutAction::ToggleFullscreen => {
      if let Some(window) = app_handle.get_window("main")
        && let Ok(is_fullscreen) = window.is_fullscreen()
      {
        let _ = window.set_fullscreen(!is_fullscreen);
        log::info!(
          "[Shortcuts] Executed: Toggle Fullscreen -> {}",
          !is_fullscreen
        );
      }
    }
    ShortcutAction::OpenCommandPalette => {
      if let Some(webview) = app_handle.get_webview("dialog")
        && let Some(window) = app_handle.get_window("main")
        && let Ok(size) = window.inner_size()
      {
        let _ = webview.set_position(tauri::LogicalPosition::new(0.0, 0.0));
        let _ = webview.set_size(tauri::PhysicalSize::new(size.width, size.height));
        let _ = webview.set_focus();
        let _ = webview.eval(
          "setTimeout(() => { const input = document.querySelector('input'); if (input) { input.value = ''; input.dispatchEvent(new Event('input', { bubbles: true })); input.focus(); } }, 100);"
        );
        log::info!("[Shortcuts] Executed: Open Command Palette");
      }
    }
    ShortcutAction::ZoomIn => {
      use crate::state::{AppState, MAX_ZOOM_LEVEL, ZOOM_STEP};
      if let Some(state) = app_handle.try_state::<AppState>()
        && let Ok(mut zoom) = state.zoom_level.lock()
      {
        let new_level = (*zoom + ZOOM_STEP).min(MAX_ZOOM_LEVEL);
        *zoom = new_level;
        if let Some(webview) = app_handle.get_webview("content") {
          let js = format!("document.body.style.zoom = '{}';", new_level);
          let _ = webview.eval(&js);
          let _ = app_handle.emit("zoom_changed", new_level);
          log::info!(
            "[Shortcuts] Executed: Zoom In -> {}%",
            (new_level * 100.0).round()
          );
        }
      }
    }
    ShortcutAction::ZoomOut => {
      use crate::state::{AppState, MIN_ZOOM_LEVEL, ZOOM_STEP};
      if let Some(state) = app_handle.try_state::<AppState>()
        && let Ok(mut zoom) = state.zoom_level.lock()
      {
        let new_level = (*zoom - ZOOM_STEP).max(MIN_ZOOM_LEVEL);
        *zoom = new_level;
        if let Some(webview) = app_handle.get_webview("content") {
          let js = format!("document.body.style.zoom = '{}';", new_level);
          let _ = webview.eval(&js);
          let _ = app_handle.emit("zoom_changed", new_level);
          log::info!(
            "[Shortcuts] Executed: Zoom Out -> {}%",
            (new_level * 100.0).round()
          );
        }
      }
    }
    ShortcutAction::ZoomReset => {
      use crate::state::{AppState, DEFAULT_ZOOM_LEVEL};
      if let Some(state) = app_handle.try_state::<AppState>()
        && let Ok(mut zoom) = state.zoom_level.lock()
      {
        *zoom = DEFAULT_ZOOM_LEVEL;
        if let Some(webview) = app_handle.get_webview("content") {
          let js = format!("document.body.style.zoom = '{}';", DEFAULT_ZOOM_LEVEL);
          let _ = webview.eval(&js);
          let _ = app_handle.emit("zoom_changed", DEFAULT_ZOOM_LEVEL);
          log::info!("[Shortcuts] Executed: Zoom Reset -> 100%");
        }
      }
    }
    ShortcutAction::FindInPage => {
      if let Some(webview) = app_handle.get_webview("content") {
        let js = r#"
          (function() {
            if (window.find) {
              window.find('', false, false, true, false, false, false);
            }
          })();
        "#;
        let _ = webview.eval(js);
        log::info!("[Shortcuts] Executed: Find in Page");
      }
    }
    ShortcutAction::ShowHelp => {
      if let Some(webview) = app_handle.get_webview("help")
        && let Some(window) = app_handle.get_window("main")
        && let Ok(size) = window.inner_size()
      {
        let _ = webview.set_position(tauri::LogicalPosition::new(0.0, 0.0));
        let _ = webview.set_size(tauri::PhysicalSize::new(size.width, size.height));
        let _ = webview.set_focus();
        log::info!("[Shortcuts] Executed: Show Help");
      }
    }
    ShortcutAction::AddBookmark => {
      // Emit event to sidebar to add current page as bookmark
      // Requirements: 8.1
      let _ = app_handle.emit_to("sidebar", "shortcut_add_bookmark", ());
      log::info!("[Shortcuts] Executed: Add Bookmark");
    }
    ShortcutAction::ToggleBookmarkPanel => {
      // Emit event to sidebar to toggle bookmark panel visibility
      // Requirements: 8.2
      let _ = app_handle.emit_to("sidebar", "shortcut_toggle_bookmark_panel", ());
      log::info!("[Shortcuts] Executed: Toggle Bookmark Panel");
    }
  }
}
