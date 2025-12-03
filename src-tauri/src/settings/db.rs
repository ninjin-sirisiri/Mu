use directories::ProjectDirs;
use rusqlite::{Connection, Result as SqliteResult};
use std::path::PathBuf;
use std::sync::Mutex;

use super::types::{AdBlockerSettings, SidebarMode, SidebarPosition, SidebarSettings};

/// Global database connection wrapped in a Mutex for thread safety
pub struct SettingsDb {
  conn: Mutex<Connection>,
}

impl SettingsDb {
  /// Creates a new SettingsDb instance with the given connection
  pub fn new(conn: Connection) -> Self {
    SettingsDb {
      conn: Mutex::new(conn),
    }
  }
}

/// Gets the path to the settings database file
fn get_database_path() -> PathBuf {
  if let Some(proj_dirs) = ProjectDirs::from("com", "mu", "Mu") {
    let data_dir = proj_dirs.data_dir();
    std::fs::create_dir_all(data_dir).ok();
    data_dir.join("settings.db")
  } else {
    // Fallback to current directory if project dirs not available
    PathBuf::from("settings.db")
  }
}

/// Initializes the database and creates the settings table if it doesn't exist
pub fn init_database() -> SqliteResult<SettingsDb> {
  let db_path = get_database_path();
  log::info!("Initializing settings database at: {:?}", db_path);

  let conn = Connection::open(&db_path)?;

  conn.execute(
    "CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )",
    [],
  )?;

  Ok(SettingsDb::new(conn))
}

/// Retrieves sidebar settings from the database
/// Returns default settings if no settings are found or if data is corrupted
pub fn get_sidebar_settings(db: &SettingsDb) -> SidebarSettings {
  let conn = match db.conn.lock() {
    Ok(conn) => conn,
    Err(e) => {
      log::warn!("Failed to acquire database lock: {}", e);
      return SidebarSettings::default();
    }
  };

  let position = get_setting(&conn, "sidebar_position")
    .map(|s| SidebarPosition::from_str(&s))
    .unwrap_or_default();

  let mode = get_setting(&conn, "sidebar_mode")
    .map(|s| SidebarMode::from_str(&s))
    .unwrap_or_default();

  SidebarSettings { position, mode }
}

/// Helper function to get a single setting value from the database
fn get_setting(conn: &Connection, key: &str) -> Option<String> {
  conn
    .query_row("SELECT value FROM settings WHERE key = ?1", [key], |row| {
      row.get(0)
    })
    .ok()
}

/// Saves sidebar settings to the database
/// Returns Ok(()) on success, Err with message on failure
pub fn save_sidebar_settings(db: &SettingsDb, settings: &SidebarSettings) -> Result<(), String> {
  let conn = db
    .conn
    .lock()
    .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

  set_setting(&conn, "sidebar_position", settings.position.as_str())
    .map_err(|e| format!("Failed to save sidebar position: {}", e))?;

  set_setting(&conn, "sidebar_mode", settings.mode.as_str())
    .map_err(|e| format!("Failed to save sidebar mode: {}", e))?;

  log::info!("Saved sidebar settings: {:?}", settings);
  Ok(())
}

/// Helper function to set a single setting value in the database
fn set_setting(conn: &Connection, key: &str, value: &str) -> SqliteResult<()> {
  conn.execute(
    "INSERT OR REPLACE INTO settings (key, value) VALUES (?1, ?2)",
    [key, value],
  )?;
  Ok(())
}

// ============================================================================
// Ad Blocker Settings Persistence
// ============================================================================

/// Retrieves ad blocker settings from the database
/// Returns default settings if no settings are found or if data is corrupted
pub fn get_adblocker_settings(db: &SettingsDb) -> AdBlockerSettings {
  let conn = match db.conn.lock() {
    Ok(conn) => conn,
    Err(e) => {
      log::warn!("Failed to acquire database lock: {}", e);
      return AdBlockerSettings::default();
    }
  };

  let enabled = get_adblocker_enabled(&conn);
  let allowlist = get_adblocker_allowlist(&conn);
  let block_count = get_adblocker_block_count(&conn);

  AdBlockerSettings {
    enabled,
    allowlist,
    block_count,
  }
}

/// Saves ad blocker settings to the database
/// Returns Ok(()) on success, Err with message on failure
pub fn save_adblocker_settings(
  db: &SettingsDb,
  settings: &AdBlockerSettings,
) -> Result<(), String> {
  let conn = db
    .conn
    .lock()
    .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

  save_adblocker_enabled(&conn, settings.enabled)
    .map_err(|e| format!("Failed to save adblocker enabled: {}", e))?;

  save_adblocker_allowlist(&conn, &settings.allowlist)
    .map_err(|e| format!("Failed to save adblocker allowlist: {}", e))?;

  save_adblocker_block_count(&conn, settings.block_count)
    .map_err(|e| format!("Failed to save adblocker block count: {}", e))?;

  log::info!("Saved ad blocker settings: {:?}", settings);
  Ok(())
}

/// Get the ad blocker enabled state from the database
fn get_adblocker_enabled(conn: &Connection) -> bool {
  get_setting(conn, "adblocker_enabled")
    .map(|s| s == "true")
    .unwrap_or(true) // Default to enabled
}

/// Save the ad blocker enabled state to the database
fn save_adblocker_enabled(conn: &Connection, enabled: bool) -> SqliteResult<()> {
  set_setting(
    conn,
    "adblocker_enabled",
    if enabled { "true" } else { "false" },
  )
}

/// Get the ad blocker allowlist from the database as a JSON array
fn get_adblocker_allowlist(conn: &Connection) -> Vec<String> {
  get_setting(conn, "adblocker_allowlist")
    .and_then(|s| serde_json::from_str(&s).ok())
    .unwrap_or_default()
}

/// Save the ad blocker allowlist to the database as a JSON array
fn save_adblocker_allowlist(conn: &Connection, allowlist: &[String]) -> SqliteResult<()> {
  let json = serde_json::to_string(allowlist).unwrap_or_else(|_| "[]".to_string());
  set_setting(conn, "adblocker_allowlist", &json)
}

/// Get the ad blocker block count from the database
fn get_adblocker_block_count(conn: &Connection) -> u64 {
  get_setting(conn, "adblocker_block_count")
    .and_then(|s| s.parse().ok())
    .unwrap_or(0)
}

/// Save the ad blocker block count to the database
fn save_adblocker_block_count(conn: &Connection, count: u64) -> SqliteResult<()> {
  set_setting(conn, "adblocker_block_count", &count.to_string())
}

#[cfg(test)]
mod tests {
  use super::*;

  fn create_test_db() -> SettingsDb {
    let conn = Connection::open_in_memory().unwrap();
    conn
      .execute(
        "CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )",
        [],
      )
      .unwrap();
    SettingsDb::new(conn)
  }

  #[test]
  fn test_default_settings() {
    let db = create_test_db();
    let settings = get_sidebar_settings(&db);
    assert_eq!(settings.position, SidebarPosition::Left);
    assert_eq!(settings.mode, SidebarMode::AutoHide);
  }

  #[test]
  fn test_save_and_load_settings() {
    let db = create_test_db();
    let settings = SidebarSettings {
      position: SidebarPosition::Right,
      mode: SidebarMode::Fixed,
    };
    save_sidebar_settings(&db, &settings).unwrap();
    let loaded = get_sidebar_settings(&db);
    assert_eq!(loaded, settings);
  }

  // Ad Blocker Settings Tests

  #[test]
  fn test_default_adblocker_settings() {
    let db = create_test_db();
    let settings = get_adblocker_settings(&db);
    assert!(settings.enabled); // Default is enabled
    assert!(settings.allowlist.is_empty());
    assert_eq!(settings.block_count, 0);
  }

  #[test]
  fn test_save_and_load_adblocker_settings() {
    let db = create_test_db();
    let settings = AdBlockerSettings {
      enabled: false,
      allowlist: vec!["example.com".to_string(), "test.org".to_string()],
      block_count: 42,
    };
    save_adblocker_settings(&db, &settings).unwrap();
    let loaded = get_adblocker_settings(&db);
    assert_eq!(loaded, settings);
  }

  #[test]
  fn test_adblocker_enabled_toggle() {
    let db = create_test_db();

    // Initially enabled by default
    let settings = get_adblocker_settings(&db);
    assert!(settings.enabled);

    // Disable
    let disabled_settings = AdBlockerSettings {
      enabled: false,
      ..settings
    };
    save_adblocker_settings(&db, &disabled_settings).unwrap();
    let loaded = get_adblocker_settings(&db);
    assert!(!loaded.enabled);

    // Re-enable
    let enabled_settings = AdBlockerSettings {
      enabled: true,
      ..loaded
    };
    save_adblocker_settings(&db, &enabled_settings).unwrap();
    let loaded = get_adblocker_settings(&db);
    assert!(loaded.enabled);
  }

  #[test]
  fn test_adblocker_allowlist_persistence() {
    let db = create_test_db();

    let settings = AdBlockerSettings {
      enabled: true,
      allowlist: vec![
        "site1.com".to_string(),
        "site2.org".to_string(),
        "site3.net".to_string(),
      ],
      block_count: 0,
    };
    save_adblocker_settings(&db, &settings).unwrap();

    let loaded = get_adblocker_settings(&db);
    assert_eq!(loaded.allowlist.len(), 3);
    assert!(loaded.allowlist.contains(&"site1.com".to_string()));
    assert!(loaded.allowlist.contains(&"site2.org".to_string()));
    assert!(loaded.allowlist.contains(&"site3.net".to_string()));
  }

  #[test]
  fn test_adblocker_block_count_persistence() {
    let db = create_test_db();

    let settings = AdBlockerSettings {
      enabled: true,
      allowlist: vec![],
      block_count: 12345,
    };
    save_adblocker_settings(&db, &settings).unwrap();

    let loaded = get_adblocker_settings(&db);
    assert_eq!(loaded.block_count, 12345);
  }
}
