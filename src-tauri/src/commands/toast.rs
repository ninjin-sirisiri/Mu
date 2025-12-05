use tauri::{Emitter, Manager};

use crate::events::ToastEvent;

/// Show a toast notification
#[tauri::command]
pub fn show_toast(app_handle: tauri::AppHandle, message: String, toast_type: String) {
  let event = ToastEvent {
    message,
    toast_type,
  };
  if let Some(webview) = app_handle.get_webview("toast") {
    let _ = webview.emit("show_toast", event);
  }
}
