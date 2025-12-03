//! Unit tests for FilterEngine
//!
//! Tests specific examples, edge cases, and error conditions.

#[cfg(test)]
mod tests {
  use crate::adblocker::filter_engine::FilterEngine;
  use crate::adblocker::types::BlockRule;

  // ========================================
  // Domain extraction tests
  // ========================================

  #[test]
  fn test_extract_domain_from_http_url() {
    let engine = FilterEngine::new();
    let url = "http://ads.example.com/banner.js";
    assert!(engine.should_block(url) == false); // No rules loaded yet
  }

  #[test]
  fn test_extract_domain_from_https_url() {
    let mut engine = FilterEngine::new();
    engine.load_from_str("ads.example.com").unwrap();
    assert!(engine.should_block("https://ads.example.com/tracker.js"));
  }

  #[test]
  fn test_extract_domain_with_port() {
    let mut engine = FilterEngine::new();
    engine.load_from_str("ads.example.com").unwrap();
    assert!(engine.should_block("https://ads.example.com:8080/ad.js"));
  }

  #[test]
  fn test_extract_domain_with_query_string() {
    let mut engine = FilterEngine::new();
    engine.load_from_str("ads.example.com").unwrap();
    assert!(engine.should_block("https://ads.example.com/ad?id=123"));
  }

  #[test]
  fn test_extract_domain_with_fragment() {
    let mut engine = FilterEngine::new();
    engine.load_from_str("ads.example.com").unwrap();
    assert!(engine.should_block("https://ads.example.com/page#section"));
  }

  // ========================================
  // Exact domain matching tests
  // ========================================

  #[test]
  fn test_exact_domain_match() {
    let mut engine = FilterEngine::new();
    engine.load_from_str("ads.example.com").unwrap();

    assert!(engine.should_block("https://ads.example.com/ad.js"));
    assert!(!engine.should_block("https://other.example.com/page"));
  }

  #[test]
  fn test_exact_domain_case_insensitive() {
    let mut engine = FilterEngine::new();
    engine.load_from_str("ADS.EXAMPLE.COM").unwrap();

    assert!(engine.should_block("https://ads.example.com/ad.js"));
    assert!(engine.should_block("https://ADS.EXAMPLE.COM/ad.js"));
  }

  #[test]
  fn test_exact_domain_no_subdomain_match() {
    let mut engine = FilterEngine::new();
    engine.load_from_str("example.com").unwrap();

    assert!(engine.should_block("https://example.com/page"));
    // Exact domain rule should NOT match subdomains
    assert!(!engine.should_block("https://sub.example.com/page"));
  }

  // ========================================
  // Suffix matching tests
  // ========================================

  #[test]
  fn test_suffix_rule_matches_exact_domain() {
    let mut engine = FilterEngine::new();
    engine.load_from_str("||example-ads.com^").unwrap();

    assert!(engine.should_block("https://example-ads.com/ad.js"));
  }

  #[test]
  fn test_suffix_rule_matches_subdomain() {
    let mut engine = FilterEngine::new();
    engine.load_from_str("||example-ads.com^").unwrap();

    assert!(engine.should_block("https://sub.example-ads.com/ad.js"));
    assert!(engine.should_block("https://deep.sub.example-ads.com/ad.js"));
  }

  #[test]
  fn test_suffix_rule_no_partial_match() {
    let mut engine = FilterEngine::new();
    engine.load_from_str("||ads.com^").unwrap();

    // Should not match domains that just end with the suffix string
    assert!(!engine.should_block("https://myads.com/page"));
    // Should match exact domain
    assert!(engine.should_block("https://ads.com/page"));
    // Should match subdomains
    assert!(engine.should_block("https://sub.ads.com/page"));
  }

  // ========================================
  // Edge cases
  // ========================================

  #[test]
  fn test_empty_url() {
    let mut engine = FilterEngine::new();
    engine.load_from_str("ads.example.com").unwrap();

    // Empty URL should be allowed (fail-open)
    assert!(!engine.should_block(""));
  }

  #[test]
  fn test_malformed_url() {
    let mut engine = FilterEngine::new();
    engine.load_from_str("ads.example.com").unwrap();

    // Malformed URLs should be allowed (fail-open)
    assert!(!engine.should_block("not-a-valid-url"));
  }

  #[test]
  fn test_url_without_protocol() {
    let mut engine = FilterEngine::new();
    engine.load_from_str("ads.example.com").unwrap();

    // URL without protocol should still work
    assert!(engine.should_block("ads.example.com/ad.js"));
  }

  // ========================================
  // Filter list parsing tests
  // ========================================

  #[test]
  fn test_parse_empty_content() {
    let mut engine = FilterEngine::new();
    let result = engine.load_from_str("");
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), 0);
    assert_eq!(engine.rule_count(), 0);
  }

  #[test]
  fn test_parse_comments_only() {
    let mut engine = FilterEngine::new();
    let content = "# This is a comment\n# Another comment";
    let result = engine.load_from_str(content);
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), 0);
  }

  #[test]
  fn test_parse_empty_lines() {
    let mut engine = FilterEngine::new();
    let content = "\n\n\n";
    let result = engine.load_from_str(content);
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), 0);
  }

  #[test]
  fn test_parse_mixed_content() {
    let mut engine = FilterEngine::new();
    let content = r#"
# Comment
ads.example.com

||tracking.com^
# Another comment
analytics.example.com
"#;
    let result = engine.load_from_str(content);
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), 3);
    assert_eq!(engine.rule_count(), 3);
  }

  #[test]
  fn test_parse_invalid_entries_skipped() {
    let mut engine = FilterEngine::new();
    let content = r#"
ads.example.com
..invalid..
valid.domain.com
|||invalid|||
"#;
    let result = engine.load_from_str(content);
    assert!(result.is_ok());
    // Only valid entries should be loaded
    assert_eq!(result.unwrap(), 2);
  }

  #[test]
  fn test_parse_whitespace_trimmed() {
    let mut engine = FilterEngine::new();
    let content = "  ads.example.com  \n  ||tracking.com^  ";
    let result = engine.load_from_str(content);
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), 2);
  }

  // ========================================
  // Serialization tests
  // ========================================

  #[test]
  fn test_to_string_empty() {
    let engine = FilterEngine::new();
    assert_eq!(engine.to_string(), "");
  }

  #[test]
  fn test_to_string_domain_rules() {
    let mut engine = FilterEngine::new();
    engine
      .load_from_str("ads.example.com\ntracking.example.com")
      .unwrap();

    let output = engine.to_string();
    assert!(output.contains("ads.example.com"));
    assert!(output.contains("tracking.example.com"));
  }

  #[test]
  fn test_to_string_suffix_rules() {
    let mut engine = FilterEngine::new();
    engine.load_from_str("||example-ads.com^").unwrap();

    let output = engine.to_string();
    assert!(output.contains("||example-ads.com^"));
  }

  // ========================================
  // get_rules tests
  // ========================================

  #[test]
  fn test_get_rules_empty() {
    let engine = FilterEngine::new();
    assert!(engine.get_rules().is_empty());
  }

  #[test]
  fn test_get_rules_returns_all() {
    let mut engine = FilterEngine::new();
    engine
      .load_from_str("ads.example.com\n||tracking.com^")
      .unwrap();

    let rules = engine.get_rules();
    assert_eq!(rules.len(), 2);

    let has_domain = rules
      .iter()
      .any(|r| matches!(r, BlockRule::Domain(d) if d == "ads.example.com"));
    let has_suffix = rules
      .iter()
      .any(|r| matches!(r, BlockRule::DomainSuffix(s) if s == "tracking.com"));

    assert!(has_domain);
    assert!(has_suffix);
  }
}
