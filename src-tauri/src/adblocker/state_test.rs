//! Unit tests for AdBlockerState

#[cfg(test)]
mod tests {
  use crate::adblocker::state::AdBlockerState;
  use crate::adblocker::types::BlockDecision;

  // ========================================
  // Basic state tests
  // ========================================

  #[test]
  fn test_new_state_defaults() {
    let state = AdBlockerState::new();

    assert!(state.is_enabled(), "Should be enabled by default");
    assert_eq!(state.get_block_count(), 0, "Block count should start at 0");
    assert!(
      state.get_allowlist().is_empty(),
      "Allowlist should be empty"
    );
  }

  #[test]
  fn test_set_enabled() {
    let state = AdBlockerState::new();

    state.set_enabled(false);
    assert!(!state.is_enabled());

    state.set_enabled(true);
    assert!(state.is_enabled());
  }

  // ========================================
  // Block counter tests
  // ========================================

  #[test]
  fn test_increment_block_count() {
    let state = AdBlockerState::new();

    state.increment_block_count();
    assert_eq!(state.get_block_count(), 1);

    state.increment_block_count();
    state.increment_block_count();
    assert_eq!(state.get_block_count(), 3);
  }

  #[test]
  fn test_set_block_count() {
    let state = AdBlockerState::new();

    state.set_block_count(100);
    assert_eq!(state.get_block_count(), 100);

    state.increment_block_count();
    assert_eq!(state.get_block_count(), 101);
  }

  // ========================================
  // Allowlist tests
  // ========================================

  #[test]
  fn test_add_to_allowlist() {
    let state = AdBlockerState::new();

    state.add_to_allowlist("example.com");
    assert!(state.is_in_allowlist("example.com"));
    assert!(!state.is_in_allowlist("other.com"));
  }

  #[test]
  fn test_allowlist_case_insensitive() {
    let state = AdBlockerState::new();

    state.add_to_allowlist("EXAMPLE.COM");
    assert!(state.is_in_allowlist("example.com"));
    assert!(state.is_in_allowlist("EXAMPLE.COM"));
    assert!(state.is_in_allowlist("Example.Com"));
  }

  #[test]
  fn test_remove_from_allowlist() {
    let state = AdBlockerState::new();

    state.add_to_allowlist("example.com");
    assert!(state.is_in_allowlist("example.com"));

    state.remove_from_allowlist("example.com");
    assert!(!state.is_in_allowlist("example.com"));
  }

  #[test]
  fn test_get_allowlist() {
    let state = AdBlockerState::new();

    state.add_to_allowlist("a.com");
    state.add_to_allowlist("b.com");
    state.add_to_allowlist("c.com");

    let list = state.get_allowlist();
    assert_eq!(list.len(), 3);
    assert!(list.contains(&"a.com".to_string()));
    assert!(list.contains(&"b.com".to_string()));
    assert!(list.contains(&"c.com".to_string()));
  }

  #[test]
  fn test_set_allowlist() {
    let state = AdBlockerState::new();

    state.add_to_allowlist("old.com");

    state.set_allowlist(vec!["new1.com".to_string(), "new2.com".to_string()]);

    assert!(!state.is_in_allowlist("old.com"));
    assert!(state.is_in_allowlist("new1.com"));
    assert!(state.is_in_allowlist("new2.com"));
  }

  // ========================================
  // Request evaluation tests
  // ========================================

  #[test]
  fn test_evaluate_request_when_disabled() {
    let state = AdBlockerState::new();

    // Load a blocking rule
    {
      let mut engine = state.filter_engine.write().unwrap();
      engine.load_from_str("ads.example.com").unwrap();
    }

    // Disable the blocker
    state.set_enabled(false);

    // Should allow even blocked domains when disabled
    let decision = state.evaluate_request("https://ads.example.com/ad.js");
    assert_eq!(decision, BlockDecision::Allow);
  }

  #[test]
  fn test_evaluate_request_blocked() {
    let state = AdBlockerState::new();

    // Load a blocking rule
    {
      let mut engine = state.filter_engine.write().unwrap();
      engine.load_from_str("ads.example.com").unwrap();
    }

    let decision = state.evaluate_request("https://ads.example.com/ad.js");
    assert_eq!(decision, BlockDecision::Block);
  }

  #[test]
  fn test_evaluate_request_allowed() {
    let state = AdBlockerState::new();

    // Load a blocking rule
    {
      let mut engine = state.filter_engine.write().unwrap();
      engine.load_from_str("ads.example.com").unwrap();
    }

    let decision = state.evaluate_request("https://safe.example.com/page");
    assert_eq!(decision, BlockDecision::Allow);
  }

  #[test]
  fn test_evaluate_request_allowlisted() {
    let state = AdBlockerState::new();

    // Load a blocking rule
    {
      let mut engine = state.filter_engine.write().unwrap();
      engine.load_from_str("ads.example.com").unwrap();
    }

    // Add to allowlist
    state.add_to_allowlist("ads.example.com");

    let decision = state.evaluate_request("https://ads.example.com/ad.js");
    assert_eq!(decision, BlockDecision::Allowlisted);
  }

  #[test]
  fn test_allowlist_takes_precedence_over_block_rules() {
    let state = AdBlockerState::new();

    // Load blocking rules
    {
      let mut engine = state.filter_engine.write().unwrap();
      engine.load_from_str("||example.com^").unwrap();
    }

    // Add specific subdomain to allowlist
    state.add_to_allowlist("trusted.example.com");

    // Blocked domain should be blocked
    let decision1 = state.evaluate_request("https://ads.example.com/ad.js");
    assert_eq!(decision1, BlockDecision::Block);

    // Allowlisted domain should be allowed
    let decision2 = state.evaluate_request("https://trusted.example.com/page");
    assert_eq!(decision2, BlockDecision::Allowlisted);
  }
}
