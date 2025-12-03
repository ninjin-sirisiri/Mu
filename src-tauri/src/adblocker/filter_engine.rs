//! Filter engine for evaluating URLs against block rules

use std::collections::HashSet;
use std::fmt;

use super::types::{BlockRule, FilterParseError};

/// Filter engine that manages block rules and evaluates URLs
#[allow(dead_code)]
pub struct FilterEngine {
  /// Domain-based block rules for O(1) lookup
  domain_rules: HashSet<String>,
  /// Suffix-based rules for subdomain matching
  suffix_rules: Vec<String>,
}

#[allow(dead_code)]
impl FilterEngine {
  /// Create a new empty filter engine
  pub fn new() -> Self {
    Self {
      domain_rules: HashSet::new(),
      suffix_rules: Vec::new(),
    }
  }

  /// Get the total number of rules loaded
  pub fn rule_count(&self) -> usize {
    self.domain_rules.len() + self.suffix_rules.len()
  }

  /// Load rules from a filter list string
  ///
  /// Returns the number of rules successfully loaded
  pub fn load_from_str(&mut self, content: &str) -> Result<usize, FilterParseError> {
    let mut loaded = 0;

    for line in content.lines() {
      let trimmed = line.trim();

      // Skip empty lines and comments
      if trimmed.is_empty() || trimmed.starts_with('#') {
        continue;
      }

      // Parse the rule
      if let Some(rule) = self.parse_rule(trimmed) {
        match rule {
          BlockRule::Domain(domain) => {
            self.domain_rules.insert(domain);
          }
          BlockRule::DomainSuffix(suffix) => {
            self.suffix_rules.push(suffix);
          }
        }
        loaded += 1;
      }
      // Invalid entries are skipped gracefully per Requirements 3.4
    }

    Ok(loaded)
  }

  /// Parse a single rule line into a BlockRule
  fn parse_rule(&self, line: &str) -> Option<BlockRule> {
    let trimmed = line.trim();

    // Handle domain suffix pattern: ||domain.com^
    if trimmed.starts_with("||") && trimmed.ends_with('^') {
      let domain = trimmed
        .trim_start_matches("||")
        .trim_end_matches('^')
        .to_lowercase();
      if !domain.is_empty() && self.is_valid_domain(&domain) {
        return Some(BlockRule::DomainSuffix(domain));
      }
      return None;
    }

    // Handle plain domain
    let domain = trimmed.to_lowercase();
    if self.is_valid_domain(&domain) {
      return Some(BlockRule::Domain(domain));
    }

    None
  }

  /// Check if a string is a valid domain
  fn is_valid_domain(&self, domain: &str) -> bool {
    if domain.is_empty() {
      return false;
    }

    // Basic domain validation
    domain
      .chars()
      .all(|c| c.is_alphanumeric() || c == '.' || c == '-')
      && domain.contains('.')
      && !domain.starts_with('.')
      && !domain.ends_with('.')
      && !domain.contains("..")
  }

  /// Check if a URL should be blocked
  pub fn should_block(&self, url: &str) -> bool {
    let domain = match self.extract_domain(url) {
      Some(d) => d.to_lowercase(),
      None => return false, // Malformed URLs are allowed (fail-open)
    };

    // Check exact domain match
    if self.domain_rules.contains(&domain) {
      return true;
    }

    // Check suffix rules
    for suffix in &self.suffix_rules {
      if domain == *suffix || domain.ends_with(&format!(".{}", suffix)) {
        return true;
      }
    }

    false
  }

  /// Extract domain from a URL
  fn extract_domain<'a>(&self, url: &'a str) -> Option<&'a str> {
    let url = url.trim();

    // Remove protocol
    let without_protocol = if let Some(pos) = url.find("://") {
      &url[pos + 3..]
    } else {
      url
    };

    // Get the host part (before any path, query, or port)
    let host = without_protocol
      .split('/')
      .next()?
      .split('?')
      .next()?
      .split('#')
      .next()?;

    // Remove port if present
    let domain = if let Some(pos) = host.rfind(':') {
      // Check if this is an IPv6 address
      if host.starts_with('[') {
        host
      } else {
        &host[..pos]
      }
    } else {
      host
    };

    if domain.is_empty() {
      None
    } else {
      Some(domain)
    }
  }

  /// Get all rules as BlockRule enum variants
  pub fn get_rules(&self) -> Vec<BlockRule> {
    let mut rules = Vec::new();

    for domain in &self.domain_rules {
      rules.push(BlockRule::Domain(domain.clone()));
    }

    for suffix in &self.suffix_rules {
      rules.push(BlockRule::DomainSuffix(suffix.clone()));
    }

    rules
  }
}

impl Default for FilterEngine {
  fn default() -> Self {
    Self::new()
  }
}

impl fmt::Display for FilterEngine {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    let mut lines = Vec::new();

    // Add domain rules
    for domain in &self.domain_rules {
      lines.push(domain.clone());
    }

    // Add suffix rules
    for suffix in &self.suffix_rules {
      lines.push(format!("||{}^", suffix));
    }

    lines.sort();
    write!(f, "{}", lines.join("\n"))
  }
}
