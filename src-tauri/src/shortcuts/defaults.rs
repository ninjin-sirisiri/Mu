use super::types::{Modifier, ShortcutAction, ShortcutCategory, ShortcutConfig};

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

/// Get the default bookmark shortcuts
/// Requirements: 8.1, 8.2
pub fn get_bookmark_shortcuts() -> Vec<ShortcutConfig> {
  vec![
    ShortcutConfig::new(
      "add_bookmark",
      "D",
      vec![Modifier::Ctrl],
      ShortcutAction::AddBookmark,
      "Add current page to bookmarks",
      ShortcutCategory::Bookmarks,
    ),
    ShortcutConfig::new(
      "toggle_bookmark_panel",
      "B",
      vec![Modifier::Ctrl, Modifier::Shift],
      ShortcutAction::ToggleBookmarkPanel,
      "Toggle bookmark panel",
      ShortcutCategory::Bookmarks,
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
  shortcuts.extend(get_bookmark_shortcuts());
  shortcuts
}
