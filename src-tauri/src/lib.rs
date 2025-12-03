mod adblocker;
mod commands;
mod events;
mod settings;
mod setup;
mod shortcuts;
mod state;
mod utils;

use commands::{
  add_to_allowlist, close_tab, create_tab, fetch_page_title, find_in_page, get_adblocker_settings,
  get_allowlist, get_block_stats, get_shortcut_list, get_sidebar_settings, get_tab_info,
  get_zoom_level, go_back, go_forward, hide_help, hide_new_tab_dialog, hide_settings, navigate,
  navigate_to, persist_block_count, reload, remove_from_allowlist, save_sidebar_settings,
  set_adblocker_enabled, set_content_layout, set_sidebar_position, set_sidebar_width,
  set_topnav_height, show_help, show_new_tab_dialog, show_settings, stop_loading, switch_tab,
  toggle_fullscreen, toggle_sidebar, zoom_in, zoom_out, zoom_reset,
};
use setup::{
  create_main_window, create_webviews, initialize_app_state, setup_window_resize_handler,
};

// Re-export for external use
pub use settings::{SidebarSettings, get_sidebar_settings as db_get_sidebar_settings};
pub use utils::normalize_url;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_global_shortcut::Builder::new().build())
    .invoke_handler(tauri::generate_handler![
      navigate,
      navigate_to,
      go_back,
      go_forward,
      reload,
      stop_loading,
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
      save_sidebar_settings,
      // Ad blocker commands
      set_adblocker_enabled,
      get_adblocker_settings,
      add_to_allowlist,
      remove_from_allowlist,
      get_allowlist,
      get_block_stats,
      persist_block_count,
      // Shortcut commands
      toggle_sidebar,
      toggle_fullscreen,
      // Zoom commands
      zoom_in,
      zoom_out,
      zoom_reset,
      get_zoom_level,
      // Find in page
      find_in_page,
      // Help overlay
      show_help,
      hide_help,
      get_shortcut_list
    ])
    .setup(|app| {
      // Initialize app state (database, settings, ad blocker)
      initialize_app_state(app)?;

      // Set up logging in debug mode
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // Create main window
      let window = create_main_window(app)?;

      // Create all webviews
      let webviews = create_webviews(&window)?;

      // Register keyboard shortcuts
      if let Err(e) = shortcuts::register_navigation_shortcuts(app.handle()) {
        log::error!("[Shortcuts] Failed to register navigation shortcuts: {}", e);
      }
      if let Err(e) = shortcuts::register_tab_shortcuts(app.handle()) {
        log::error!("[Shortcuts] Failed to register tab shortcuts: {}", e);
      }
      if let Err(e) = shortcuts::register_ui_shortcuts(app.handle()) {
        log::error!("[Shortcuts] Failed to register UI shortcuts: {}", e);
      }
      if let Err(e) = shortcuts::register_page_shortcuts(app.handle()) {
        log::error!("[Shortcuts] Failed to register page shortcuts: {}", e);
      }

      // Set up window resize handler
      setup_window_resize_handler(
        &window,
        webviews.topnav,
        webviews.sidebar,
        webviews.dialog,
        webviews.settings,
        webviews.help,
        app.handle().clone(),
      );

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
