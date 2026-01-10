//! Mu Browser - A minimalist web browser built with Tauri
//!
//! This is the main library entry point that configures and runs the Tauri application.

mod modules;

use modules::navigation::commands as nav_commands;
use modules::navigation::models::NavigationHistory;
use modules::webview::commands as webview_commands;
use modules::webview::models::NavBarState;
use std::sync::Mutex;
use tauri::{LogicalPosition, LogicalSize, Manager, WebviewUrl, WindowEvent};

/// Height of the hover trigger area when nav is hidden
const TRIGGER_HEIGHT: f64 = 8.0;
/// Height of the navigation bar when visible
const NAV_BAR_HEIGHT: f64 = 44.0;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(NavBarState::new())
        .manage(Mutex::new(NavigationHistory::new()))
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            // WebView commands
            webview_commands::navigate_to,
            webview_commands::get_current_url,
            webview_commands::get_loading_state,
            webview_commands::set_nav_visible,
            // Navigation commands
            nav_commands::go_back,
            nav_commands::go_forward,
            nav_commands::reload,
            nav_commands::go_home,
            nav_commands::update_history_if_changed,
        ])
        .setup(|app| {
            let width = 800.0;
            let height = 600.0;

            // Create the main window without a default webview
            let window = tauri::window::WindowBuilder::new(app, "main")
                .title("mu")
                .inner_size(width, height)
                .maximized(true)
                .decorations(false)
                .build()?;

            // Add the content webview first (full size, for browsing)
            // Content stays at fixed position (0, 0) and full size - never moves
            let _content_webview = window.add_child(
                tauri::webview::WebviewBuilder::new(
                    "content",
                    WebviewUrl::External("about:blank".parse().unwrap()),
                ),
                LogicalPosition::new(0.0, 0.0),
                LogicalSize::new(width, height),
            )?;

            // Add the UI webview on top (React app for navigation bar)
            // Initially only show trigger area, nav bar appears on hover
            let _ui_webview = window.add_child(
                tauri::webview::WebviewBuilder::new("ui", WebviewUrl::App(Default::default()))
                    .transparent(true),
                LogicalPosition::new(0.0, 0.0),
                LogicalSize::new(width, TRIGGER_HEIGHT),
            )?;

            // Handle window resize events
            let app_handle = app.handle().clone();
            window.on_window_event(move |event| {
                if let WindowEvent::Resized(size) = event {
                    let nav_state = app_handle.state::<NavBarState>();
                    let is_visible = nav_state.is_visible();

                    if let (Some(window), Some(ui_webview), Some(content_webview)) = (
                        app_handle.get_window("main"),
                        app_handle.get_webview("ui"),
                        app_handle.get_webview("content"),
                    ) {
                        let scale_factor = window.scale_factor().unwrap_or(1.0);
                        let width = size.width as f64 / scale_factor;
                        let height = size.height as f64 / scale_factor;

                        // Content webview always stays at (0,0) with full size - never moves
                        let _ = content_webview.set_position(LogicalPosition::new(0.0, 0.0));
                        let _ = content_webview.set_size(LogicalSize::new(width, height));

                        // Only UI webview size changes based on nav visibility
                        if is_visible {
                            // Nav bar visible
                            let _ = ui_webview.set_size(LogicalSize::new(width, NAV_BAR_HEIGHT));
                        } else {
                            // Nav bar hidden - show only trigger area
                            let _ = ui_webview.set_size(LogicalSize::new(width, TRIGGER_HEIGHT));
                        }
                    }
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
