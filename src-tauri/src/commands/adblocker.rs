/// Ad blocker Tauri commands
///
/// This module provides commands for controlling the ad blocker from the frontend.
use crate::adblocker::AdBlockerState;
use crate::settings::{
  AdBlockerSettings, SettingsDb, get_adblocker_settings as db_get_adblocker_settings,
  save_adblocker_settings as db_save_adblocker_settings,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::State;

/// Block statistics returned to the frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockStats {
  /// Total number of blocked requests (persisted)
  pub total_blocked: u64,
  /// Number of blocked requests in current session
  pub session_blocked: u64,
}

/// Sets the ad blocker enabled state
///
/// Requirements: 2.1, 2.2, 2.4
#[tauri::command]
pub fn set_adblocker_enabled(
  enabled: bool,
  adblocker_state: State<'_, Arc<AdBlockerState>>,
  db: State<'_, Arc<SettingsDb>>,
) -> Result<(), String> {
  // Update in-memory state
  adblocker_state.set_enabled(enabled);

  // Persist to database
  let mut settings = db_get_adblocker_settings(&db);
  settings.enabled = enabled;
  db_save_adblocker_settings(&db, &settings)?;

  log::info!("Ad blocker enabled state set to: {}", enabled);
  Ok(())
}

/// Gets the current ad blocker settings
///
/// Requirements: 2.1, 2.2, 2.5
#[tauri::command]
pub fn get_adblocker_settings(
  adblocker_state: State<'_, Arc<AdBlockerState>>,
  db: State<'_, Arc<SettingsDb>>,
) -> Result<AdBlockerSettings, String> {
  // Get persisted settings from database
  let mut settings = db_get_adblocker_settings(&db);

  // Update with current in-memory state (for real-time accuracy)
  settings.enabled = adblocker_state.is_enabled();
  settings.allowlist = adblocker_state.get_allowlist();
  settings.block_count = adblocker_state.get_block_count();

  Ok(settings)
}

/// Adds a domain to the allowlist
///
/// Requirements: 4.1, 4.4
#[tauri::command]
pub fn add_to_allowlist(
  domain: String,
  adblocker_state: State<'_, Arc<AdBlockerState>>,
  db: State<'_, Arc<SettingsDb>>,
) -> Result<(), String> {
  // Update in-memory state
  adblocker_state.add_to_allowlist(&domain);

  // Persist to database
  let mut settings = db_get_adblocker_settings(&db);
  let domain_lower = domain.to_lowercase();
  if !settings.allowlist.contains(&domain_lower) {
    settings.allowlist.push(domain_lower);
  }
  db_save_adblocker_settings(&db, &settings)?;

  log::info!("Added domain to allowlist: {}", domain);
  Ok(())
}

/// Removes a domain from the allowlist
///
/// Requirements: 4.2, 4.4
#[tauri::command]
pub fn remove_from_allowlist(
  domain: String,
  adblocker_state: State<'_, Arc<AdBlockerState>>,
  db: State<'_, Arc<SettingsDb>>,
) -> Result<(), String> {
  // Update in-memory state
  adblocker_state.remove_from_allowlist(&domain);

  // Persist to database
  let mut settings = db_get_adblocker_settings(&db);
  let domain_lower = domain.to_lowercase();
  settings.allowlist.retain(|d| d != &domain_lower);
  db_save_adblocker_settings(&db, &settings)?;

  log::info!("Removed domain from allowlist: {}", domain);
  Ok(())
}

/// Gets the current allowlist
///
/// Requirements: 4.5
#[tauri::command]
pub fn get_allowlist(
  adblocker_state: State<'_, Arc<AdBlockerState>>,
) -> Result<Vec<String>, String> {
  Ok(adblocker_state.get_allowlist())
}

/// Gets block statistics
///
/// Requirements: 5.2
#[tauri::command]
pub fn get_block_stats(
  adblocker_state: State<'_, Arc<AdBlockerState>>,
  db: State<'_, Arc<SettingsDb>>,
) -> Result<BlockStats, String> {
  // Get persisted total from database
  let persisted_settings = db_get_adblocker_settings(&db);

  // Get current session count from in-memory state
  let session_blocked = adblocker_state.get_block_count();

  Ok(BlockStats {
    total_blocked: persisted_settings.block_count + session_blocked,
    session_blocked,
  })
}

/// Persists the current block count to the database
/// Called periodically or on app shutdown
#[tauri::command]
pub fn persist_block_count(
  adblocker_state: State<'_, Arc<AdBlockerState>>,
  db: State<'_, Arc<SettingsDb>>,
) -> Result<(), String> {
  let mut settings = db_get_adblocker_settings(&db);
  let session_count = adblocker_state.get_block_count();

  // Add session count to persisted total
  settings.block_count += session_count;
  db_save_adblocker_settings(&db, &settings)?;

  // Reset session counter
  adblocker_state.set_block_count(0);

  log::info!("Persisted block count: {}", settings.block_count);
  Ok(())
}
