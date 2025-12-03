//! Types for the ad blocker module

/// Block rule types for matching URLs
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub enum BlockRule {
  /// Exact domain match (e.g., "ads.example.com")
  Domain(String),
  /// Domain suffix match - matches domain and all subdomains (e.g., "||example.com^")
  DomainSuffix(String),
}

/// Result of evaluating a request against block rules
#[allow(dead_code)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum BlockDecision {
  /// Request is allowed to proceed
  Allow,
  /// Request is blocked by a rule
  Block,
  /// Request is allowed because domain is in allowlist
  Allowlisted,
}

/// Error types for filter parsing
#[allow(dead_code)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum FilterParseError {
  /// The filter list content is empty
  EmptyContent,
  /// A specific line could not be parsed
  InvalidLine { line_number: usize, content: String },
}

impl std::fmt::Display for FilterParseError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      FilterParseError::EmptyContent => write!(f, "Filter list content is empty"),
      FilterParseError::InvalidLine {
        line_number,
        content,
      } => {
        write!(f, "Invalid filter at line {}: {}", line_number, content)
      }
    }
  }
}

impl std::error::Error for FilterParseError {}
