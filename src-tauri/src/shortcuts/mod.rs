use serde::{Deserialize, Serialize};
use std::fmt;
use tauri::AppHandle;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

/// Actions that can be triggered by keyboard shortcuts
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum ShortcutAction {
  // Navigation
  GoBack,
  GoForward,
  Reload,
  StopLoading,

  // Tabs
  NewTab,
  CloseTab,
  NextTab,
  PreviousTab,
  SwitchToTab(u8),

  // UI
  ToggleSidebar,
  ToggleFullscreen,
  OpenCommandPalette,
  ShowHelp,

  // Page
  ZoomIn,
  ZoomOut,
  ZoomReset,
  FindInPage,
}

impl fmt::Display for ShortcutAction {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    match self {
      ShortcutAction::GoBack => write!(f, "Go Back"),
      ShortcutAction::GoForward => write!(f, "Go Forward"),
      ShortcutAction::Reload => write!(f, "Reload"),
      ShortcutAction::StopLoading => write!(f, "Stop Loading"),
      ShortcutAction::NewTab => write!(f, "New Tab"),
      ShortcutAction::CloseTab => write!(f, "Close Tab"),
      ShortcutAction::NextTab => write!(f, "Next Tab"),
      ShortcutAction::PreviousTab => write!(f, "Previous Tab"),
      ShortcutAction::SwitchToTab(n) => write!(f, "Switch to Tab {}", n),
      ShortcutAction::ToggleSidebar => write!(f, "Toggle Sidebar"),
      ShortcutAction::ToggleFullscreen => write!(f, "Toggle Fullscreen"),
      ShortcutAction::OpenCommandPalette => write!(f, "Open Command Palette"),
      ShortcutAction::ShowHelp => write!(f, "Show Help"),
      ShortcutAction::ZoomIn => write!(f, "Zoom In"),
      ShortcutAction::ZoomOut => write!(f, "Zoom Out"),
      ShortcutAction::ZoomReset => write!(f, "Zoom Reset"),
      ShortcutAction::FindInPage => write!(f, "Find in Page"),
    }
  }
}

/// Modifier keys for shortcuts
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum Modifier {
  /// Ctrl on Windows/Linux, Cmd on macOS
  Ctrl,
  /// Alt key (Option on macOS)
  Alt,
  /// Shift key
  Shift,
  /// Meta key (Windows key on Windows, Cmd on macOS)
  Meta,
}

impl Modifier {
  /// Get the platform-appropriate modifier string for display
  pub fn display_string(&self) -> &'static str {
    match self {
      Modifier::Ctrl => {
        if cfg!(target_os = "macos") {
          "⌘"
        } else {
          "Ctrl"
        }
      }
      Modifier::Alt => {
        if cfg!(target_os = "macos") {
          "⌥"
        } else {
          "Alt"
        }
      }
      Modifier::Shift => {
        if cfg!(target_os = "macos") {
          "⇧"
        } else {
          "Shift"
        }
      }
      Modifier::Meta => {
        if cfg!(target_os = "macos") {
          "⌘"
        } else {
          "Win"
        }
      }
    }
  }
}

/// Shortcut category for grouping in help overlay
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ShortcutCategory {
  Navigation,
  Tabs,
  Ui,
  Page,
}

impl fmt::Display for ShortcutCategory {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    match self {
      ShortcutCategory::Navigation => write!(f, "Navigation"),
      ShortcutCategory::Tabs => write!(f, "Tabs"),
      ShortcutCategory::Ui => write!(f, "UI"),
      ShortcutCategory::Page => write!(f, "Page"),
    }
  }
}

/// Configuration for a single shortcut
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShortcutConfig {
  /// Unique identifier for the shortcut
  pub id: String,
  /// The key name (e.g., "k", "Tab", "F5")
  pub key: String,
  /// Modifier keys required
  pub modifiers: Vec<Modifier>,
  /// Action to execute
  pub action: ShortcutAction,
  /// User-facing description
  pub description: String,
  /// Category for grouping
  pub category: ShortcutCategory,
}

impl ShortcutConfig {
  /// Create a new shortcut configuration
  pub fn new(
    id: impl Into<String>,
    key: impl Into<String>,
    modifiers: Vec<Modifier>,
    action: ShortcutAction,
    description: impl Into<String>,
    category: ShortcutCategory,
  ) -> Self {
    Self {
      id: id.into(),
      key: key.into(),
      modifiers,
      action,
      description: description.into(),
      category,
    }
  }

  /// Get the display string for this shortcut (e.g., "Ctrl+K")
  pub fn display_string(&self) -> String {
    let mut parts: Vec<String> = self
      .modifiers
      .iter()
      .map(|m| m.display_string().to_string())
      .collect();
    parts.push(self.key.clone());
    parts.join("+")
  }
}

/// Information about a shortcut for display in the help overlay
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShortcutInfo {
  pub key: String,
  pub description: String,
  pub category: ShortcutCategory,
}

impl From<&ShortcutConfig> for ShortcutInfo {
  fn from(config: &ShortcutConfig) -> Self {
    Self {
      key: config.display_string(),
      description: config.description.clone(),
      category: config.category,
    }
  }
}

/// Platform detection for modifier key mapping
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Platform {
  MacOS,
  Windows,
  Linux,
}

impl Platform {
  /// Detect the current platform at runtime
  pub fn current() -> Self {
    if cfg!(target_os = "macos") {
      Platform::MacOS
    } else if cfg!(target_os = "windows") {
      Platform::Windows
    } else {
      Platform::Linux
    }
  }

  /// Check if the current platform is macOS
  pub fn is_macos() -> bool {
    Self::current() == Platform::MacOS
  }
}

/// Convert a Ctrl modifier to the platform-appropriate modifier
/// On macOS, Ctrl becomes Cmd (Meta)
/// On Windows/Linux, Ctrl remains Ctrl
pub fn platform_modifier(modifier: Modifier) -> Modifier {
  match modifier {
    Modifier::Ctrl if Platform::is_macos() => Modifier::Meta,
    other => other,
  }
}

/// Convert modifiers to platform-appropriate modifiers
pub fn platform_modifiers(modifiers: &[Modifier]) -> Vec<Modifier> {
  modifiers.iter().map(|m| platform_modifier(*m)).collect()
}

/// Convert a shortcut config to use platform-appropriate modifiers
pub fn to_platform_shortcut(config: &ShortcutConfig) -> ShortcutConfig {
  ShortcutConfig {
    id: config.id.clone(),
    key: config.key.clone(),
    modifiers: platform_modifiers(&config.modifiers),
    action: config.action.clone(),
    description: config.description.clone(),
    category: config.category,
  }
}

/// Get the default navigation shortcuts
pub fn get_navigation_shortcuts() -> Vec<ShortcutConfig> {
  vec![
    ShortcutConfig::new(
      "go_back",
      "ArrowLeft",
      vec![Modifier::Alt],
      ShortcutAction::GoBack,
      "Go back to previous page",
      ShortcutCategory::Navigation,
    ),
    ShortcutConfig::new(
      "go_forward",
      "ArrowRight",
      vec![Modifier::Alt],
      ShortcutAction::GoForward,
      "Go forward to next page",
      ShortcutCategory::Navigation,
    ),
    ShortcutConfig::new(
      "reload",
      "R",
      vec![Modifier::Ctrl],
      ShortcutAction::Reload,
      "Reload current page",
      ShortcutCategory::Navigation,
    ),
    ShortcutConfig::new(
      "reload_f5",
      "F5",
      vec![],
      ShortcutAction::Reload,
      "Reload current page",
      ShortcutCategory::Navigation,
    ),
    ShortcutConfig::new(
      "stop_loading",
      "Escape",
      vec![],
      ShortcutAction::StopLoading,
      "Stop loading page",
      ShortcutCategory::Navigation,
    ),
  ]
}

/// Get the default tab management shortcuts
pub fn get_tab_shortcuts() -> Vec<ShortcutConfig> {
  let mut shortcuts = vec![
    ShortcutConfig::new(
      "new_tab",
      "T",
      vec![Modifier::Ctrl],
      ShortcutAction::NewTab,
      "Open new tab",
      ShortcutCategory::Tabs,
    ),
    ShortcutConfig::new(
      "close_tab",
      "W",
      vec![Modifier::Ctrl],
      ShortcutAction::CloseTab,
      "Close current tab",
      ShortcutCategory::Tabs,
    ),
    ShortcutConfig::new(
      "next_tab",
      "Tab",
      vec![Modifier::Ctrl],
      ShortcutAction::NextTab,
      "Switch to next tab",
      ShortcutCategory::Tabs,
    ),
    ShortcutConfig::new(
      "previous_tab",
      "Tab",
      vec![Modifier::Ctrl, Modifier::Shift],
      ShortcutAction::PreviousTab,
      "Switch to previous tab",
      ShortcutCategory::Tabs,
    ),
  ];

  // Add Ctrl+1 through Ctrl+9 for tab switching by index
  for i in 1..=9 {
    shortcuts.push(ShortcutConfig::new(
      format!("switch_to_tab_{}", i),
      format!("{}", i),
      vec![Modifier::Ctrl],
      ShortcutAction::SwitchToTab(i),
      if i == 9 {
        "Switch to last tab".to_string()
      } else {
        format!("Switch to tab {}", i)
      },
      ShortcutCategory::Tabs,
    ));
  }

  shortcuts
}

/// Get the default UI toggle shortcuts
pub fn get_ui_shortcuts() -> Vec<ShortcutConfig> {
  vec![
    ShortcutConfig::new(
      "toggle_sidebar",
      "B",
      vec![Modifier::Ctrl],
      ShortcutAction::ToggleSidebar,
      "Toggle sidebar visibility",
      ShortcutCategory::Ui,
    ),
    ShortcutConfig::new(
      "toggle_fullscreen",
      "F",
      vec![Modifier::Ctrl, Modifier::Shift],
      ShortcutAction::ToggleFullscreen,
      "Toggle fullscreen mode",
      ShortcutCategory::Ui,
    ),
    ShortcutConfig::new(
      "toggle_fullscreen_f11",
      "F11",
      vec![],
      ShortcutAction::ToggleFullscreen,
      "Toggle fullscreen mode",
      ShortcutCategory::Ui,
    ),
    ShortcutConfig::new(
      "command_palette_k",
      "K",
      vec![Modifier::Ctrl],
      ShortcutAction::OpenCommandPalette,
      "Open Command Palette",
      ShortcutCategory::Ui,
    ),
    ShortcutConfig::new(
      "command_palette_l",
      "L",
      vec![Modifier::Ctrl],
      ShortcutAction::OpenCommandPalette,
      "Open Command Palette",
      ShortcutCategory::Ui,
    ),
    ShortcutConfig::new(
      "show_help_slash",
      "/",
      vec![Modifier::Ctrl],
      ShortcutAction::ShowHelp,
      "Show keyboard shortcuts help",
      ShortcutCategory::Ui,
    ),
    ShortcutConfig::new(
      "show_help_f1",
      "F1",
      vec![],
      ShortcutAction::ShowHelp,
      "Show keyboard shortcuts help",
      ShortcutCategory::Ui,
    ),
  ]
}

/// Get the default page interaction shortcuts
pub fn get_page_shortcuts() -> Vec<ShortcutConfig> {
  vec![
    ShortcutConfig::new(
      "zoom_in_plus",
      "=",
      vec![Modifier::Ctrl],
      ShortcutAction::ZoomIn,
      "Zoom in",
      ShortcutCategory::Page,
    ),
    ShortcutConfig::new(
      "zoom_in_numpad",
      "NumpadAdd",
      vec![Modifier::Ctrl],
      ShortcutAction::ZoomIn,
      "Zoom in",
      ShortcutCategory::Page,
    ),
    ShortcutConfig::new(
      "zoom_out",
      "-",
      vec![Modifier::Ctrl],
      ShortcutAction::ZoomOut,
      "Zoom out",
      ShortcutCategory::Page,
    ),
    ShortcutConfig::new(
      "zoom_out_numpad",
      "NumpadSubtract",
      vec![Modifier::Ctrl],
      ShortcutAction::ZoomOut,
      "Zoom out",
      ShortcutCategory::Page,
    ),
    ShortcutConfig::new(
      "zoom_reset",
      "0",
      vec![Modifier::Ctrl],
      ShortcutAction::ZoomReset,
      "Reset zoom to 100%",
      ShortcutCategory::Page,
    ),
    ShortcutConfig::new(
      "find_in_page",
      "F",
      vec![Modifier::Ctrl],
      ShortcutAction::FindInPage,
      "Find in page",
      ShortcutCategory::Page,
    ),
  ]
}

/// Get all default shortcuts
pub fn get_all_shortcuts() -> Vec<ShortcutConfig> {
  let mut shortcuts = Vec::new();
  shortcuts.extend(get_navigation_shortcuts());
  shortcuts.extend(get_tab_shortcuts());
  shortcuts.extend(get_ui_shortcuts());
  shortcuts.extend(get_page_shortcuts());
  shortcuts
}

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

/// Execute the action associated with a shortcut
fn execute_action(app_handle: &AppHandle, action: &ShortcutAction) {
  use tauri::{Emitter, Manager};

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
      // Emit event to frontend to open new tab dialog
      let _ = app_handle.emit_to("sidebar", "shortcut_new_tab", ());
      let _ = app_handle.emit_to("dialog", "shortcut_new_tab", ());
      log::info!("[Shortcuts] Executed: New Tab");
    }
    ShortcutAction::CloseTab => {
      // Emit event to frontend to close current tab
      let _ = app_handle.emit_to("sidebar", "shortcut_close_tab", ());
      log::info!("[Shortcuts] Executed: Close Tab");
    }
    ShortcutAction::NextTab => {
      // Emit event to frontend to switch to next tab
      let _ = app_handle.emit_to("sidebar", "shortcut_next_tab", ());
      log::info!("[Shortcuts] Executed: Next Tab");
    }
    ShortcutAction::PreviousTab => {
      // Emit event to frontend to switch to previous tab
      let _ = app_handle.emit_to("sidebar", "shortcut_previous_tab", ());
      log::info!("[Shortcuts] Executed: Previous Tab");
    }
    ShortcutAction::SwitchToTab(index) => {
      // Emit event to frontend to switch to tab by index
      let _ = app_handle.emit_to("sidebar", "shortcut_switch_to_tab", *index);
      log::info!("[Shortcuts] Executed: Switch to Tab {}", index);
    }
    ShortcutAction::ToggleSidebar => {
      // Emit event to frontend to toggle sidebar
      let _ = app_handle.emit_to("sidebar", "shortcut_toggle_sidebar", ());
      log::info!("[Shortcuts] Executed: Toggle Sidebar");
    }
    ShortcutAction::ToggleFullscreen => {
      // Toggle fullscreen via window API
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
      // Show the new tab dialog (Command Palette)
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
      // Apply zoom in via state and JavaScript injection
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
      // Apply zoom out via state and JavaScript injection
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
      // Reset zoom to 100% via state and JavaScript injection
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
      // Trigger find in page via JavaScript
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
      // Show the help overlay WebView
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
  }
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

  #[test]
  fn test_platform_detection() {
    let platform = Platform::current();
    // Just verify it returns a valid platform
    assert!(matches!(
      platform,
      Platform::MacOS | Platform::Windows | Platform::Linux
    ));
  }

  #[test]
  fn test_modifier_display_string() {
    // Test that display strings are non-empty
    assert!(!Modifier::Ctrl.display_string().is_empty());
    assert!(!Modifier::Alt.display_string().is_empty());
    assert!(!Modifier::Shift.display_string().is_empty());
    assert!(!Modifier::Meta.display_string().is_empty());
  }

  #[test]
  fn test_shortcut_config_display_string() {
    let config = ShortcutConfig::new(
      "test",
      "K",
      vec![Modifier::Ctrl],
      ShortcutAction::OpenCommandPalette,
      "Test shortcut",
      ShortcutCategory::Ui,
    );

    let display = config.display_string();
    assert!(display.contains("K"));
  }

  #[test]
  fn test_shortcut_info_from_config() {
    let config = ShortcutConfig::new(
      "test",
      "T",
      vec![Modifier::Ctrl],
      ShortcutAction::NewTab,
      "New Tab",
      ShortcutCategory::Tabs,
    );

    let info = ShortcutInfo::from(&config);
    assert_eq!(info.description, "New Tab");
    assert_eq!(info.category, ShortcutCategory::Tabs);
  }

  #[test]
  fn test_platform_modifiers_on_current_platform() {
    let modifiers = vec![Modifier::Ctrl, Modifier::Shift];
    let platform_mods = platform_modifiers(&modifiers);

    // On macOS, Ctrl should become Meta
    // On Windows/Linux, Ctrl should remain Ctrl
    if Platform::is_macos() {
      assert!(platform_mods.contains(&Modifier::Meta));
      assert!(!platform_mods.contains(&Modifier::Ctrl));
    } else {
      assert!(platform_mods.contains(&Modifier::Ctrl));
    }
    // Shift should remain unchanged on all platforms
    assert!(platform_mods.contains(&Modifier::Shift));
  }

  #[test]
  fn test_get_navigation_shortcuts() {
    let shortcuts = get_navigation_shortcuts();
    assert_eq!(shortcuts.len(), 5);

    // Verify all navigation shortcuts are present
    let actions: Vec<_> = shortcuts.iter().map(|s| &s.action).collect();
    assert!(actions.contains(&&ShortcutAction::GoBack));
    assert!(actions.contains(&&ShortcutAction::GoForward));
    assert!(actions.contains(&&ShortcutAction::Reload));
    assert!(actions.contains(&&ShortcutAction::StopLoading));
  }

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
    // On Windows/Linux it should be "Control+R", on macOS "Super+R"
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
  fn test_get_tab_shortcuts() {
    let shortcuts = get_tab_shortcuts();
    // 4 basic shortcuts + 9 index shortcuts = 13 total
    assert_eq!(shortcuts.len(), 13);

    // Verify basic tab shortcuts are present
    let actions: Vec<_> = shortcuts.iter().map(|s| &s.action).collect();
    assert!(actions.contains(&&ShortcutAction::NewTab));
    assert!(actions.contains(&&ShortcutAction::CloseTab));
    assert!(actions.contains(&&ShortcutAction::NextTab));
    assert!(actions.contains(&&ShortcutAction::PreviousTab));

    // Verify index shortcuts 1-9 are present
    for i in 1..=9 {
      assert!(actions.contains(&&ShortcutAction::SwitchToTab(i)));
    }
  }

  #[test]
  fn test_tab_shortcut_categories() {
    let shortcuts = get_tab_shortcuts();
    for shortcut in &shortcuts {
      assert_eq!(shortcut.category, ShortcutCategory::Tabs);
    }
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
    // On Windows/Linux it should contain "Control" and "Shift"
    // On macOS it should contain "Super" and "Shift"
    assert!(shortcut_str.contains("Tab"));
    assert!(shortcut_str.contains("Shift"));
  }

  #[test]
  fn test_switch_to_tab_action_display() {
    assert_eq!(
      ShortcutAction::SwitchToTab(1).to_string(),
      "Switch to Tab 1"
    );
    assert_eq!(
      ShortcutAction::SwitchToTab(9).to_string(),
      "Switch to Tab 9"
    );
  }

  #[test]
  fn test_get_all_shortcuts_includes_tabs() {
    let all_shortcuts = get_all_shortcuts();
    let tab_shortcuts = get_tab_shortcuts();
    let nav_shortcuts = get_navigation_shortcuts();
    let ui_shortcuts = get_ui_shortcuts();
    let page_shortcuts = get_page_shortcuts();

    assert_eq!(
      all_shortcuts.len(),
      tab_shortcuts.len() + nav_shortcuts.len() + ui_shortcuts.len() + page_shortcuts.len()
    );

    // Verify tab shortcuts are included
    let all_actions: Vec<_> = all_shortcuts.iter().map(|s| &s.action).collect();
    assert!(all_actions.contains(&&ShortcutAction::NewTab));
    assert!(all_actions.contains(&&ShortcutAction::CloseTab));
  }

  #[test]
  fn test_get_ui_shortcuts() {
    let shortcuts = get_ui_shortcuts();
    assert_eq!(shortcuts.len(), 7);

    // Verify UI shortcuts are present
    let actions: Vec<_> = shortcuts.iter().map(|s| &s.action).collect();
    assert!(actions.contains(&&ShortcutAction::ToggleSidebar));
    assert!(actions.contains(&&ShortcutAction::ToggleFullscreen));
    assert!(actions.contains(&&ShortcutAction::OpenCommandPalette));
    assert!(actions.contains(&&ShortcutAction::ShowHelp));
  }

  #[test]
  fn test_ui_shortcut_categories() {
    let shortcuts = get_ui_shortcuts();
    for shortcut in &shortcuts {
      assert_eq!(shortcut.category, ShortcutCategory::Ui);
    }
  }

  #[test]
  fn test_get_page_shortcuts() {
    let shortcuts = get_page_shortcuts();
    assert_eq!(shortcuts.len(), 6);

    // Verify page shortcuts are present
    let actions: Vec<_> = shortcuts.iter().map(|s| &s.action).collect();
    assert!(actions.contains(&&ShortcutAction::ZoomIn));
    assert!(actions.contains(&&ShortcutAction::ZoomOut));
    assert!(actions.contains(&&ShortcutAction::ZoomReset));
    assert!(actions.contains(&&ShortcutAction::FindInPage));
  }

  #[test]
  fn test_page_shortcut_categories() {
    let shortcuts = get_page_shortcuts();
    for shortcut in &shortcuts {
      assert_eq!(shortcut.category, ShortcutCategory::Page);
    }
  }
}
