//! Command Palette state management

use std::sync::atomic::{AtomicBool, Ordering};

/// Manages the visibility state of the command palette
pub struct CommandPaletteState {
    is_visible: AtomicBool,
}

impl CommandPaletteState {
    /// Creates a new CommandPaletteState with the palette hidden
    pub fn new() -> Self {
        Self {
            is_visible: AtomicBool::new(false),
        }
    }

    /// Returns whether the command palette is currently visible
    pub fn is_visible(&self) -> bool {
        self.is_visible.load(Ordering::Relaxed)
    }

    /// Sets the visibility state of the command palette
    pub fn set_visible(&self, visible: bool) {
        self.is_visible.store(visible, Ordering::Relaxed);
    }
}

impl Default for CommandPaletteState {
    fn default() -> Self {
        Self::new()
    }
}
