//! WebView data models

use std::sync::atomic::{AtomicBool, Ordering};

/// Shared state for navigation bar visibility
#[derive(Debug, Default)]
pub struct NavBarState {
    /// Whether the navigation bar is currently visible
    visible: AtomicBool,
}

impl NavBarState {
    pub fn new() -> Self {
        Self {
            visible: AtomicBool::new(false),
        }
    }

    pub fn is_visible(&self) -> bool {
        self.visible.load(Ordering::SeqCst)
    }

    pub fn set_visible(&self, visible: bool) {
        self.visible.store(visible, Ordering::SeqCst);
    }
}

/// Represents the current state of a WebView
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WebViewState {
    /// Current URL of the WebView
    pub current_url: String,
    /// Title of the current page
    pub title: String,
    /// Whether the page is currently loading
    pub is_loading: bool,
    /// Whether navigation back is possible
    pub can_go_back: bool,
    /// Whether navigation forward is possible
    pub can_go_forward: bool,
}

impl Default for WebViewState {
    fn default() -> Self {
        Self {
            current_url: String::new(),
            title: String::new(),
            is_loading: false,
            can_go_back: false,
            can_go_forward: false,
        }
    }
}
