use serde::{Deserialize, Serialize};

/// Information about the current tab/page state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TabInfo {
  pub url: String,
  pub title: String,
  pub is_loading: bool,
}

/// Event payload for page load events
/// Emitted when a page starts or finishes loading
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PageLoadEvent {
  pub url: String,
  pub is_loading: bool,
}

/// Event payload for page info (title and favicon)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PageInfoEvent {
  pub title: String,
  pub favicon: Option<String>,
}

/// Event payload for navigation events
/// Emitted when the URL changes
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NavigationEvent {
  pub url: String,
}

/// Event payload for new tab creation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewTabEvent {
  pub url: String,
}

/// Event payload for toast notifications
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToastEvent {
  pub message: String,
  #[serde(rename = "type")]
  pub toast_type: String, // "success", "error", "info", "warning"
}
