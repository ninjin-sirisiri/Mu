//! Property-based tests for AdBlockerState
//!
//! Uses proptest to verify universal properties that should hold across all inputs.

#[cfg(test)]
mod tests {
  use crate::adblocker::state::AdBlockerState;
  use crate::adblocker::types::BlockDecision;
  use proptest::prelude::*;

  // ========================================
  // Generators
  // ========================================

  /// Generate a valid domain label
  fn domain_label_strategy() -> impl Strategy<Value = String> {
    "[a-z][a-z0-9-]{0,10}[a-z0-9]?".prop_filter("label must not be empty", |s| !s.is_empty())
  }

  /// Generate a valid domain name
  fn domain_strategy() -> impl Strategy<Value = String> {
    prop::collection::vec(domain_label_strategy(), 2..=4)
      .prop_map(|labels| labels.join("."))
      .prop_filter("domain must be valid", |d| {
        !d.is_empty() && !d.starts_with('.') && !d.ends_with('.') && !d.contains("..")
      })
  }

  /// Generate a URL from a domain
  fn url_from_domain(domain: &str) -> String {
    format!("https://{}/page", domain)
  }

  // ========================================
  // **Feature: ad-blocker, Property 2: Disabled State Allows All**
  // **Validates: Requirements 2.3**
  // ========================================

  proptest! {
      #![proptest_config(ProptestConfig::with_cases(100))]

      /// Property 2: Disabled State Allows All
      /// *For any* URL, when the Ad_Blocker is disabled, the system should allow
      /// the request regardless of whether it matches any Block_Rules.
      #[test]
      fn prop_disabled_state_allows_all(
          blocked_domain in domain_strategy(),
          test_domain in domain_strategy(),
      ) {
          let state = AdBlockerState::new();

          // Load blocking rules
          {
              let mut engine = state.filter_engine.write().unwrap();
              engine.load_from_str(&blocked_domain).unwrap();
          }

          // Disable the blocker
          state.set_enabled(false);

          // Any URL should be allowed when disabled
          let url = url_from_domain(&test_domain);
          let decision = state.evaluate_request(&url);

          prop_assert_eq!(decision, BlockDecision::Allow,
              "All requests should be allowed when ad blocker is disabled");
      }

      /// Property 2 (variant): Even blocked domains should be allowed when disabled
      #[test]
      fn prop_disabled_allows_blocked_domains(
          blocked_domain in domain_strategy(),
      ) {
          let state = AdBlockerState::new();

          // Load blocking rule for this specific domain
          {
              let mut engine = state.filter_engine.write().unwrap();
              engine.load_from_str(&blocked_domain).unwrap();
          }

          // Verify it would be blocked when enabled
          let url = url_from_domain(&blocked_domain);
          let decision_enabled = state.evaluate_request(&url);
          prop_assert_eq!(decision_enabled, BlockDecision::Block,
              "Domain should be blocked when enabled");

          // Disable and verify it's now allowed
          state.set_enabled(false);
          let decision_disabled = state.evaluate_request(&url);
          prop_assert_eq!(decision_disabled, BlockDecision::Allow,
              "Domain should be allowed when disabled");
      }
  }

  // ========================================
  // **Feature: ad-blocker, Property 5: Allowlist Exclusion**
  // **Validates: Requirements 4.1, 4.3**
  // ========================================

  proptest! {
      #![proptest_config(ProptestConfig::with_cases(100))]

      /// Property 5: Allowlist Exclusion
      /// *For any* URL whose domain is in the Allowlist, the Ad_Blocker should allow
      /// the request regardless of whether it matches any Block_Rules.
      #[test]
      fn prop_allowlist_exclusion(
          domain in domain_strategy(),
      ) {
          let state = AdBlockerState::new();

          // Load blocking rule for this domain
          {
              let mut engine = state.filter_engine.write().unwrap();
              engine.load_from_str(&domain).unwrap();
          }

          // Verify it would be blocked without allowlist
          let url = url_from_domain(&domain);
          let decision_blocked = state.evaluate_request(&url);
          prop_assert_eq!(decision_blocked, BlockDecision::Block,
              "Domain should be blocked without allowlist");

          // Add to allowlist
          state.add_to_allowlist(&domain);

          // Now it should be allowlisted
          let decision_allowed = state.evaluate_request(&url);
          prop_assert_eq!(decision_allowed, BlockDecision::Allowlisted,
              "Domain should be allowlisted after adding to allowlist");
      }

      /// Property 5 (variant): Allowlist is case-insensitive
      #[test]
      fn prop_allowlist_case_insensitive(
          domain in domain_strategy(),
      ) {
          let state = AdBlockerState::new();

          // Load blocking rule
          {
              let mut engine = state.filter_engine.write().unwrap();
              engine.load_from_str(&domain).unwrap();
          }

          // Add uppercase version to allowlist
          state.add_to_allowlist(&domain.to_uppercase());

          // Lowercase URL should still be allowlisted
          let url = url_from_domain(&domain.to_lowercase());
          let decision = state.evaluate_request(&url);

          prop_assert_eq!(decision, BlockDecision::Allowlisted,
              "Allowlist should be case-insensitive");
      }
  }

  // ========================================
  // **Feature: ad-blocker, Property 6: Allowlist Removal Resumes Blocking**
  // **Validates: Requirements 4.2**
  // ========================================

  proptest! {
      #![proptest_config(ProptestConfig::with_cases(100))]

      /// Property 6: Allowlist Removal Resumes Blocking
      /// *For any* domain that was in the Allowlist and is then removed, if that domain
      /// matches a Block_Rule, subsequent requests to that domain should be blocked.
      #[test]
      fn prop_allowlist_removal_resumes_blocking(
          domain in domain_strategy(),
      ) {
          let state = AdBlockerState::new();

          // Load blocking rule
          {
              let mut engine = state.filter_engine.write().unwrap();
              engine.load_from_str(&domain).unwrap();
          }

          let url = url_from_domain(&domain);

          // Initially blocked
          let decision1 = state.evaluate_request(&url);
          prop_assert_eq!(decision1, BlockDecision::Block, "Should be blocked initially");

          // Add to allowlist - now allowlisted
          state.add_to_allowlist(&domain);
          let decision2 = state.evaluate_request(&url);
          prop_assert_eq!(decision2, BlockDecision::Allowlisted, "Should be allowlisted");

          // Remove from allowlist - blocked again
          state.remove_from_allowlist(&domain);
          let decision3 = state.evaluate_request(&url);
          prop_assert_eq!(decision3, BlockDecision::Block, "Should be blocked after removal");
      }
  }

  // ========================================
  // **Feature: ad-blocker, Property 8: Block Counter Increment**
  // **Validates: Requirements 5.1**
  // ========================================

  proptest! {
      #![proptest_config(ProptestConfig::with_cases(100))]

      /// Property 8: Block Counter Increment
      /// *For any* sequence of blocked requests, the block counter should equal
      /// the number of requests that were blocked.
      #[test]
      fn prop_block_counter_increment(
          increment_count in 1usize..100,
      ) {
          let state = AdBlockerState::new();

          // Initial count should be 0
          prop_assert_eq!(state.get_block_count(), 0, "Initial count should be 0");

          // Increment the specified number of times
          for _ in 0..increment_count {
              state.increment_block_count();
          }

          // Count should match the number of increments
          prop_assert_eq!(state.get_block_count(), increment_count as u64,
              "Block count should equal number of increments");
      }

      /// Property 8 (variant): Counter persists across operations
      #[test]
      fn prop_block_counter_persists(
          initial_count in 0u64..1000,
          additional_increments in 0usize..50,
      ) {
          let state = AdBlockerState::new();

          // Set initial count (simulating restore from persistence)
          state.set_block_count(initial_count);
          prop_assert_eq!(state.get_block_count(), initial_count);

          // Add more increments
          for _ in 0..additional_increments {
              state.increment_block_count();
          }

          // Final count should be initial + additional
          let expected = initial_count + additional_increments as u64;
          prop_assert_eq!(state.get_block_count(), expected,
              "Count should be {} + {} = {}", initial_count, additional_increments, expected);
      }
  }
}
