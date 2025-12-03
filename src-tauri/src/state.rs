use crate::settings::SidebarPosition;
use std::sync::Mutex;

/// Application state for tracking sidebar position
pub struct AppState {
  pub sidebar_position: Mutex<SidebarPosition>,
}
