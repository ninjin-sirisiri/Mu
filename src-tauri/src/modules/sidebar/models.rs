//! Sidebar state models

use std::sync::{
    atomic::{AtomicBool, Ordering},
    Mutex,
};

/// Sidebar position
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[allow(dead_code)]
pub enum Position {
    Left,
    Right,
}

/// Manages the sidebar visibility state
pub struct SidebarState {
    visible: AtomicBool,
    position: Mutex<Position>,
}

impl SidebarState {
    pub fn new() -> Self {
        Self {
            visible: AtomicBool::new(true), // Sidebar is visible by default
            position: Mutex::new(Position::Left), // Default to left position
        }
    }

    pub fn is_visible(&self) -> bool {
        self.visible.load(Ordering::SeqCst)
    }

    pub fn set_visible(&self, visible: bool) {
        self.visible.store(visible, Ordering::SeqCst);
    }

    pub fn toggle(&self) -> bool {
        let current = self.visible.load(Ordering::SeqCst);
        let new_value = !current;
        self.visible.store(new_value, Ordering::SeqCst);
        new_value
    }

    pub fn get_position(&self) -> Position {
        *self.position.lock().unwrap()
    }

    #[allow(dead_code)]
    pub fn set_position(&self, position: Position) {
        *self.position.lock().unwrap() = position;
    }
}

impl Default for SidebarState {
    fn default() -> Self {
        Self::new()
    }
}
