use directories::ProjectDirs;
use rusqlite::{Connection, Result as SqliteResult};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Mutex;

/// Sidebar position setting
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "lowercase")]
pub enum SidebarPosition {
  #[default]
  Left,
  Right,
}

impl SidebarPosition {
  fn as_str(&self) -> &'static str {
    match self {
      SidebarPosition::Left => "left",
      SidebarPosition::Right => "right",
    }
  }

  fn from_str(s: &str) -> Self {
    match s {
      "right" => SidebarPosition::Right,
      _ => SidebarPosition::Left,
    }
  }
}

/// Sidebar display mode setting
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "kebab-case")]
pub enum SidebarMode {
  Fixed,
  #[default]
  AutoHide,
}

impl SidebarMode {
  fn as_str(&self) -> &'static str {
    match self {
      SidebarMode::Fixed => "fixed",
      SidebarMode::AutoHide => "auto-hide",
    }
  }

  fn from_str(s: &str) -> Self {
    match s {
      "fixed" => SidebarMode::Fixed,
      _ => SidebarMode::AutoHide,
    }
  }
}

/// Sidebar settings structure
#[derive(Debug, Clone, Serialize, Deserialize, Default, PartialEq)]
pub struct SidebarSettings {
  pub position: SidebarPosition,
  pub mode: SidebarMode,
}

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
}
