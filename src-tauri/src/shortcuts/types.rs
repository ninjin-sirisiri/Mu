use serde::{Deserialize, Serialize};
use std::fmt;

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

  // Bookmarks
  AddBookmark,
  ToggleBookmarkPanel,
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
      ShortcutAction::AddBookmark => write!(f, "Add Bookmark"),
      ShortcutAction::ToggleBookmarkPanel => write!(f, "Toggle Bookmark Panel"),
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
  Bookmarks,
}

impl fmt::Display for ShortcutCategory {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    match self {
      ShortcutCategory::Navigation => write!(f, "Navigation"),
      ShortcutCategory::Tabs => write!(f, "Tabs"),
      ShortcutCategory::Ui => write!(f, "UI"),
      ShortcutCategory::Page => write!(f, "Page"),
      ShortcutCategory::Bookmarks => write!(f, "Bookmarks"),
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
