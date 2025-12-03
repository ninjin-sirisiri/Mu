//! Property-based tests for FilterEngine
//!
//! Uses proptest to verify universal properties that should hold across all inputs.

#[cfg(test)]
mod tests {
  use crate::adblocker::filter_engine::FilterEngine;
  use crate::adblocker::types::BlockRule;
  use proptest::prelude::*;
  use std::collections::HashSet;

  // ========================================
  // Generators
  // ========================================

  /// Generate a valid domain label (part between dots)
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

  /// Generate a URL with the given domain
  fn url_with_domain(domain: String) -> impl Strategy<Value = String> {
    let d = domain.clone();
    prop::option::of("[a-z0-9/]{1,20}").prop_map(move |path| match path {
      Some(p) => format!("https://{}/{}", d, p),
      None => format!("https://{}/", d),
    })
  }

  /// Generate a filter list line (domain or suffix rule)
  fn filter_line_strategy() -> impl Strategy<Value = String> {
    prop_oneof![
      // Plain domain
      domain_strategy(),
      // Suffix rule
      domain_strategy().prop_map(|d| format!("||{}^", d)),
    ]
  }

  /// Generate a filter list with multiple rules
  fn filter_list_strategy() -> impl Strategy<Value = String> {
    prop::collection::vec(filter_line_strategy(), 1..=20).prop_map(|lines| lines.join("\n"))
  }

  /// Generate a BlockRule
  fn block_rule_strategy() -> impl Strategy<Value = BlockRule> {
    prop_oneof![
      domain_strategy().prop_map(BlockRule::Domain),
      domain_strategy().prop_map(BlockRule::DomainSuffix),
    ]
  }

  // ========================================
  // **Feature: ad-blocker, Property 1: URL Blocking Correctness**
  // **Validates: Requirements 1.1, 1.2, 1.3**
  // ========================================

  proptest! {
      #![proptest_config(ProptestConfig::with_cases(100))]

      /// Property 1: URL Blocking Correctness
      /// *For any* URL and set of Block_Rules, if the URL's domain matches any Block_Rule,
      /// the Filter_Engine should return Block; otherwise, it should return Allow.
      #[test]
      fn prop_url_blocking_correctness(
          blocked_domain in domain_strategy(),
          allowed_domain in domain_strategy().prop_filter("must be different", |d| d.len() > 3),
      ) {
          // Ensure domains are different
          prop_assume!(blocked_domain != allowed_domain);
          prop_assume!(!allowed_domain.ends_with(&format!(".{}", blocked_domain)));

          let mut engine = FilterEngine::new();
          engine.load_from_str(&blocked_domain).unwrap();

          // URL matching the blocked domain should be blocked
          let blocked_url = format!("https://{}/page", blocked_domain);
          prop_assert!(engine.should_block(&blocked_url),
              "URL {} should be blocked by rule {}", blocked_url, blocked_domain);

          // URL not matching any rule should be allowed
          let allowed_url = format!("https://{}/page", allowed_domain);
          prop_assert!(!engine.should_block(&allowed_url),
              "URL {} should NOT be blocked", allowed_url);
      }

      /// Property 1 (suffix variant): Suffix rules should match subdomains
      #[test]
      fn prop_suffix_rule_matches_subdomains(
          base_domain in domain_strategy(),
          subdomain_prefix in "[a-z]{2,6}",
      ) {
          let mut engine = FilterEngine::new();
          engine.load_from_str(&format!("||{}^", base_domain)).unwrap();

          // Exact domain should be blocked
          let exact_url = format!("https://{}/page", base_domain);
          prop_assert!(engine.should_block(&exact_url),
              "Exact domain {} should be blocked", base_domain);

          // Subdomain should also be blocked
          let subdomain = format!("{}.{}", subdomain_prefix, base_domain);
          let subdomain_url = format!("https://{}/page", subdomain);
          prop_assert!(engine.should_block(&subdomain_url),
              "Subdomain {} should be blocked by suffix rule", subdomain);
      }
  }

  // ========================================
  // **Feature: ad-blocker, Property 3: Filter List Parsing Correctness**
  // **Validates: Requirements 3.2, 3.3, 3.4**
  // ========================================

  proptest! {
      #![proptest_config(ProptestConfig::with_cases(100))]

      /// Property 3: Filter List Parsing Correctness
      /// *For any* valid filter list string containing domain patterns, the Filter_Engine
      /// should parse it into the correct number of Block_Rules, skipping empty lines
      /// and comments, and handling invalid entries gracefully.
      #[test]
      fn prop_filter_list_parsing(
          valid_lines in prop::collection::vec(filter_line_strategy(), 1..=10),
          comment_count in 0usize..5,
          empty_line_count in 0usize..5,
      ) {
          let mut content_lines: Vec<String> = Vec::new();

          // Add comments
          for i in 0..comment_count {
              content_lines.push(format!("# Comment {}", i));
          }

          // Add empty lines
          for _ in 0..empty_line_count {
              content_lines.push(String::new());
          }

          // Add valid rules
          content_lines.extend(valid_lines.clone());

          // Shuffle to mix content
          let content = content_lines.join("\n");

          let mut engine = FilterEngine::new();
          let result = engine.load_from_str(&content);

          prop_assert!(result.is_ok(), "Parsing should succeed");

          let loaded = result.unwrap();
          prop_assert_eq!(loaded, valid_lines.len(),
              "Should load exactly {} rules, got {}", valid_lines.len(), loaded);
      }

      /// Property 3 (invalid entries): Invalid entries should be skipped
      #[test]
      fn prop_invalid_entries_skipped(
          valid_domain in domain_strategy(),
      ) {
          let content = format!(
              "{}\n..invalid..\n|||bad|||\n.starts.with.dot\nends.with.dot.",
              valid_domain
          );

          let mut engine = FilterEngine::new();
          let result = engine.load_from_str(&content);

          prop_assert!(result.is_ok(), "Parsing should succeed even with invalid entries");
          prop_assert_eq!(result.unwrap(), 1, "Only valid entry should be loaded");
      }
  }

  // ========================================
  // **Feature: ad-blocker, Property 4: Filter List Round-Trip**
  // **Validates: Requirements 3.5**
  // ========================================

  proptest! {
      #![proptest_config(ProptestConfig::with_cases(100))]

      /// Property 4: Filter List Round-Trip
      /// *For any* set of valid Block_Rules, serializing them to filter list format
      /// and then parsing the result should produce an equivalent set of rules.
      #[test]
      fn prop_filter_list_round_trip(
          rules in prop::collection::vec(block_rule_strategy(), 1..=10),
      ) {
          // Create engine and add rules
          let mut engine1 = FilterEngine::new();

          // Build filter list from rules
          let filter_content: String = rules.iter().map(|rule| {
              match rule {
                  BlockRule::Domain(d) => d.clone(),
                  BlockRule::DomainSuffix(s) => format!("||{}^", s),
              }
          }).collect::<Vec<_>>().join("\n");

          engine1.load_from_str(&filter_content).unwrap();

          // Serialize to string
          let serialized = engine1.to_string();

          // Parse the serialized content
          let mut engine2 = FilterEngine::new();
          engine2.load_from_str(&serialized).unwrap();

          // Both engines should have the same rule count
          prop_assert_eq!(engine1.rule_count(), engine2.rule_count(),
              "Rule count should match after round-trip");

          // Get rules from both engines and compare
          let rules1: HashSet<_> = engine1.get_rules().into_iter().collect();
          let rules2: HashSet<_> = engine2.get_rules().into_iter().collect();

          prop_assert_eq!(rules1, rules2,
              "Rules should be equivalent after round-trip");
      }
  }
}
