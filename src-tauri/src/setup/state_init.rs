use std::sync::{Arc, Mutex};
use tauri::Manager;

use crate::adblocker::AdBlockerState;
use crate::settings::{
  SettingsDb, get_adblocker_settings as db_get_adblocker_settings, get_sidebar_settings,
  init_database,
};
use crate::state::{AppState, DEFAULT_ZOOM_LEVEL};

/// Initialize the application state including database, settings, and ad blocker
pub fn initialize_app_state(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
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
  let initial_settings = get_sidebar_settings(&settings_db);
  let app_state = AppState {
    sidebar_position: Mutex::new(initial_settings.position),
    sidebar_visible: Mutex::new(true),
    zoom_level: Mutex::new(DEFAULT_ZOOM_LEVEL),
  };
  app.manage(app_state);

  // Initialize ad blocker state
  let adblocker_settings = db_get_adblocker_settings(&settings_db);
  let adblocker_state = Arc::new(AdBlockerState::new());

  // Restore ad blocker state from persisted settings
  adblocker_state.set_enabled(adblocker_settings.enabled);
  adblocker_state.set_allowlist(adblocker_settings.allowlist);

  // Load default filter list
  let default_filters = include_str!("../../resources/default_filters.txt");
  if let Ok(mut filter_engine) = adblocker_state.filter_engine.write() {
    match filter_engine.load_from_str(default_filters) {
      Ok(count) => log::info!("Loaded {} filter rules", count),
      Err(e) => log::warn!("Failed to load filter rules: {}", e),
    }
  }

  app.manage(adblocker_state);
  app.manage(settings_db);

  Ok(())
}
