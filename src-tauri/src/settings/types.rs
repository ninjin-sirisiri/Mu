use serde::{Deserialize, Serialize};

/// Sidebar position setting
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "lowercase")]
pub enum SidebarPosition {
  #[default]
  Left,
  Right,
}

impl SidebarPosition {
  pub fn as_str(&self) -> &'static str {
    match self {
      SidebarPosition::Left => "left",
      SidebarPosition::Right => "right",
    }
  }

  pub fn from_str(s: &str) -> Self {
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
  pub fn as_str(&self) -> &'static str {
    match self {
      SidebarMode::Fixed => "fixed",
      SidebarMode::AutoHide => "auto-hide",
    }
  }

  pub fn from_str(s: &str) -> Self {
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

/// Ad blocker settings structure for persistence
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AdBlockerSettings {
  pub enabled: bool,
  pub allowlist: Vec<String>,
  pub block_count: u64,
}

impl Default for AdBlockerSettings {
  fn default() -> Self {
    Self {
      enabled: true,
      allowlist: Vec::new(),
      block_count: 0,
    }
  }
}
