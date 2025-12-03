use super::actions::execute_action;
use super::defaults::{
  get_navigation_shortcuts, get_page_shortcuts, get_tab_shortcuts, get_ui_shortcuts,
};
use super::platform::to_platform_shortcut;
use super::types::{Modifier, ShortcutConfig};
use tauri::AppHandle;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

/// Convert a ShortcutConfig to a tauri Shortcut string
fn config_to_shortcut_string(config: &ShortcutConfig) -> String {
  let platform_config = to_platform_shortcut(config);
  let mut parts = Vec::new();

  for modifier in &platform_config.modifiers {
    match modifier {
      Modifier::Ctrl => parts.push("Control"),
      Modifier::Alt => parts.push("Alt"),
      Modifier::Shift => parts.push("Shift"),
      Modifier::Meta => parts.push("Super"),
    }
  }

  parts.push(&platform_config.key);
  parts.join("+")
}

/// Register shortcuts from a list of configs
fn register_shortcuts_from_configs(
  app_handle: &AppHandle,
  shortcuts: &[ShortcutConfig],
) -> Result<(), String> {
  for config in shortcuts {
    let shortcut_str = config_to_shortcut_string(config);
    let action = config.action.clone();
    let app = app_handle.clone();

    let shortcut: Shortcut = shortcut_str
      .parse()
      .map_err(|e| format!("Failed to parse shortcut '{}': {:?}", shortcut_str, e))?;

    app_handle
      .global_shortcut()
      .on_shortcut(shortcut, move |_app, _shortcut, event| {
        if event.state == ShortcutState::Pressed {
          execute_action(&app, &action);
        }
      })
      .map_err(|e| format!("Failed to register shortcut '{}': {}", shortcut_str, e))?;

    log::info!(
      "[Shortcuts] Registered: {} -> {}",
      shortcut_str,
      config.action
    );
  }

  Ok(())
}

/// Register all navigation shortcuts
pub fn register_navigation_shortcuts(app_handle: &AppHandle) -> Result<(), String> {
  let shortcuts = get_navigation_shortcuts();
  register_shortcuts_from_configs(app_handle, &shortcuts)
}

/// Register all tab management shortcuts
pub fn register_tab_shortcuts(app_handle: &AppHandle) -> Result<(), String> {
  let shortcuts = get_tab_shortcuts();
  register_shortcuts_from_configs(app_handle, &shortcuts)
}

/// Register all UI toggle shortcuts
pub fn register_ui_shortcuts(app_handle: &AppHandle) -> Result<(), String> {
  let shortcuts = get_ui_shortcuts();
  register_shortcuts_from_configs(app_handle, &shortcuts)
}

/// Register all page interaction shortcuts
pub fn register_page_shortcuts(app_handle: &AppHandle) -> Result<(), String> {
  let shortcuts = get_page_shortcuts();
  register_shortcuts_from_configs(app_handle, &shortcuts)
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::shortcuts::types::{ShortcutAction, ShortcutCategory};

  #[test]
  fn test_config_to_shortcut_string() {
    let config = ShortcutConfig::new(
      "test",
      "R",
      vec![Modifier::Ctrl],
      ShortcutAction::Reload,
      "Reload",
      ShortcutCategory::Navigation,
    );

    let shortcut_str = config_to_shortcut_string(&config);
    assert!(shortcut_str.contains("R"));
    assert!(shortcut_str.contains("+") || config.modifiers.is_empty());
  }

  #[test]
  fn test_config_to_shortcut_string_no_modifiers() {
    let config = ShortcutConfig::new(
      "test",
      "F5",
      vec![],
      ShortcutAction::Reload,
      "Reload",
      ShortcutCategory::Navigation,
    );

    let shortcut_str = config_to_shortcut_string(&config);
    assert_eq!(shortcut_str, "F5");
  }

  #[test]
  fn test_config_to_shortcut_string_alt_modifier() {
    let config = ShortcutConfig::new(
      "test",
      "ArrowLeft",
      vec![Modifier::Alt],
      ShortcutAction::GoBack,
      "Go Back",
      ShortcutCategory::Navigation,
    );

    let shortcut_str = config_to_shortcut_string(&config);
    assert_eq!(shortcut_str, "Alt+ArrowLeft");
  }

  #[test]
  fn test_config_to_shortcut_string_ctrl_shift() {
    let config = ShortcutConfig::new(
      "test",
      "Tab",
      vec![Modifier::Ctrl, Modifier::Shift],
      ShortcutAction::PreviousTab,
      "Previous Tab",
      ShortcutCategory::Tabs,
    );

    let shortcut_str = config_to_shortcut_string(&config);
    assert!(shortcut_str.contains("Tab"));
    assert!(shortcut_str.contains("Shift"));
  }
}
