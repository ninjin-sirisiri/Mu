use crate::settings::SidebarPosition;
use std::sync::Mutex;

/// Default zoom level (100%)
pub const DEFAULT_ZOOM_LEVEL: f64 = 1.0;
/// Minimum zoom level (25%)
pub const MIN_ZOOM_LEVEL: f64 = 0.25;
/// Maximum zoom level (500%)
pub const MAX_ZOOM_LEVEL: f64 = 5.0;
/// Zoom step for each zoom in/out operation (10%)
pub const ZOOM_STEP: f64 = 0.1;

/// Application state for tracking sidebar position and visibility
pub struct AppState {
  pub sidebar_position: Mutex<SidebarPosition>,
  /// Whether the sidebar is currently visible (for toggle shortcut)
  pub sidebar_visible: Mutex<bool>,
  /// Current zoom level for the content WebView (1.0 = 100%)
  pub zoom_level: Mutex<f64>,
}
