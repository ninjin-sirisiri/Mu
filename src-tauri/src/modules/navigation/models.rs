//! Navigation data models

/// Default home page URL
pub const DEFAULT_HOME_URL: &str = "https://www.google.com";

/// Represents browser navigation history
#[derive(Debug, Clone, Default)]
pub struct NavigationHistory {
    /// List of visited URLs
    pub entries: Vec<String>,
    /// Current position in the history
    pub current_index: usize,
}

impl NavigationHistory {
    /// Creates a new empty navigation history
    pub fn new() -> Self {
        Self::default()
    }

    /// Adds a new URL to the history
    pub fn push(&mut self, url: String) {
        // Remove forward history when navigating to a new URL
        if self.current_index < self.entries.len().saturating_sub(1) {
            self.entries.truncate(self.current_index + 1);
        }
        self.entries.push(url);
        self.current_index = self.entries.len().saturating_sub(1);
    }

    /// Returns whether backward navigation is possible
    pub fn can_go_back(&self) -> bool {
        self.current_index > 0
    }

    /// Returns whether forward navigation is possible
    pub fn can_go_forward(&self) -> bool {
        self.current_index < self.entries.len().saturating_sub(1)
    }

    /// Moves back in history and returns the URL
    pub fn go_back(&mut self) -> Option<&String> {
        if self.can_go_back() {
            self.current_index -= 1;
            self.entries.get(self.current_index)
        } else {
            None
        }
    }

    /// Moves forward in history and returns the URL
    pub fn go_forward(&mut self) -> Option<&String> {
        if self.can_go_forward() {
            self.current_index += 1;
            self.entries.get(self.current_index)
        } else {
            None
        }
    }

    /// Returns the current URL
    pub fn current(&self) -> Option<&String> {
        self.entries.get(self.current_index)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_history() {
        let history = NavigationHistory::new();
        assert!(!history.can_go_back());
        assert!(!history.can_go_forward());
        assert!(history.current().is_none());
    }

    #[test]
    fn test_push_url() {
        let mut history = NavigationHistory::new();
        history.push("https://example.com".to_string());

        assert_eq!(history.current(), Some(&"https://example.com".to_string()));
        assert!(!history.can_go_back());
        assert!(!history.can_go_forward());
    }

    #[test]
    fn test_navigation() {
        let mut history = NavigationHistory::new();
        history.push("https://page1.com".to_string());
        history.push("https://page2.com".to_string());
        history.push("https://page3.com".to_string());

        assert!(history.can_go_back());
        assert!(!history.can_go_forward());

        let back = history.go_back();
        assert_eq!(back, Some(&"https://page2.com".to_string()));
        assert!(history.can_go_forward());

        let forward = history.go_forward();
        assert_eq!(forward, Some(&"https://page3.com".to_string()));
    }

    #[test]
    fn test_push_clears_forward_history() {
        let mut history = NavigationHistory::new();
        history.push("https://page1.com".to_string());
        history.push("https://page2.com".to_string());
        history.go_back();
        history.push("https://page3.com".to_string());

        assert!(!history.can_go_forward());
        assert_eq!(history.entries.len(), 2);
    }
}
