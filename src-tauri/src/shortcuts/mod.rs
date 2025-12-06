pub mod actions;
mod defaults;
mod platform;
mod types;

// Re-export types
pub use types::ShortcutInfo;

// Re-export default shortcuts
pub use defaults::get_all_shortcuts;

// Re-export action execution for commands
pub use actions::execute_action;
pub use types::ShortcutAction;

#[cfg(test)]
mod tests {
  use super::defaults::*;
  use super::platform::*;
  use super::types::*;

  #[test]
  fn test_platform_detection() {
    let platform = Platform::current();
    assert!(matches!(
      platform,
      Platform::MacOS | Platform::Windows | Platform::Linux
    ));
  }

  #[test]
  fn test_modifier_display_string() {
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

    if Platform::is_macos() {
      assert!(platform_mods.contains(&Modifier::Meta));
      assert!(!platform_mods.contains(&Modifier::Ctrl));
    } else {
      assert!(platform_mods.contains(&Modifier::Ctrl));
    }
    assert!(platform_mods.contains(&Modifier::Shift));
  }

  #[test]
  fn test_get_navigation_shortcuts() {
    let shortcuts = get_navigation_shortcuts();
    assert_eq!(shortcuts.len(), 5);

    let actions: Vec<_> = shortcuts.iter().map(|s| &s.action).collect();
    assert!(actions.contains(&&ShortcutAction::GoBack));
    assert!(actions.contains(&&ShortcutAction::GoForward));
    assert!(actions.contains(&&ShortcutAction::Reload));
    assert!(actions.contains(&&ShortcutAction::StopLoading));
  }

  #[test]
  fn test_get_tab_shortcuts() {
    let shortcuts = get_tab_shortcuts();
    assert_eq!(shortcuts.len(), 13);

    let actions: Vec<_> = shortcuts.iter().map(|s| &s.action).collect();
    assert!(actions.contains(&&ShortcutAction::NewTab));
    assert!(actions.contains(&&ShortcutAction::CloseTab));
    assert!(actions.contains(&&ShortcutAction::NextTab));
    assert!(actions.contains(&&ShortcutAction::PreviousTab));

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
    let bookmark_shortcuts = get_bookmark_shortcuts();

    assert_eq!(
      all_shortcuts.len(),
      tab_shortcuts.len()
        + nav_shortcuts.len()
        + ui_shortcuts.len()
        + page_shortcuts.len()
        + bookmark_shortcuts.len()
    );

    let all_actions: Vec<_> = all_shortcuts.iter().map(|s| &s.action).collect();
    assert!(all_actions.contains(&&ShortcutAction::NewTab));
    assert!(all_actions.contains(&&ShortcutAction::CloseTab));
    assert!(all_actions.contains(&&ShortcutAction::AddBookmark));
    assert!(all_actions.contains(&&ShortcutAction::ToggleBookmarkPanel));
  }

  #[test]
  fn test_get_ui_shortcuts() {
    let shortcuts = get_ui_shortcuts();
    assert_eq!(shortcuts.len(), 7);

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

  #[test]
  fn test_get_bookmark_shortcuts() {
    let shortcuts = get_bookmark_shortcuts();
    assert_eq!(shortcuts.len(), 2);

    let actions: Vec<_> = shortcuts.iter().map(|s| &s.action).collect();
    assert!(actions.contains(&&ShortcutAction::AddBookmark));
    assert!(actions.contains(&&ShortcutAction::ToggleBookmarkPanel));
  }

  #[test]
  fn test_bookmark_shortcut_categories() {
    let shortcuts = get_bookmark_shortcuts();
    for shortcut in &shortcuts {
      assert_eq!(shortcut.category, ShortcutCategory::Bookmarks);
    }
  }

  #[test]
  fn test_bookmark_action_display() {
    assert_eq!(ShortcutAction::AddBookmark.to_string(), "Add Bookmark");
    assert_eq!(
      ShortcutAction::ToggleBookmarkPanel.to_string(),
      "Toggle Bookmark Panel"
    );
  }
}
