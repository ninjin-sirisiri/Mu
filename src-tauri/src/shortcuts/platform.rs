use super::types::{Modifier, ShortcutConfig};

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
