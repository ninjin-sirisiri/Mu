//! Ad blocker state management

use std::collections::HashSet;
use std::sync::RwLock;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};

use super::filter_engine::FilterEngine;
use super::types::BlockDecision;

/// Ad blocker state containing all runtime data
#[allow(dead_code)]
pub struct AdBlockerState {
  /// Whether the ad blocker is enabled
  pub enabled: AtomicBool,
  /// The filter engine containing block rules
  pub filter_engine: RwLock<FilterEngine>,
  /// Domains that are excluded from blocking
  pub allowlist: RwLock<HashSet<String>>,
  /// Counter for blocked requests
  pub block_count: AtomicU64,
}

#[allow(dead_code)]
impl AdBlockerState {
  /// Create a new ad blocker state with default values
  pub fn new() -> Self {
    Self {
      enabled: AtomicBool::new(true),
      filter_engine: RwLock::new(FilterEngine::new()),
      allowlist: RwLock::new(HashSet::new()),
      block_count: AtomicU64::new(0),
    }
  }

  /// Evaluate a request URL and return the block decision
  pub fn evaluate_request(&self, url: &str) -> BlockDecision {
    // If disabled, allow all requests
    if !self.enabled.load(Ordering::Relaxed) {
      return BlockDecision::Allow;
    }

    // Extract domain from URL for allowlist check
    let domain = self.extract_domain(url);

    // Check allowlist first
    if let Some(domain) = domain {
      let allowlist = self.allowlist.read().unwrap();
      if allowlist.contains(&domain.to_lowercase()) {
        return BlockDecision::Allowlisted;
      }
    }

    // Check against filter engine
    let filter_engine = self.filter_engine.read().unwrap();
    if filter_engine.should_block(url) {
      BlockDecision::Block
    } else {
      BlockDecision::Allow
    }
  }

  /// Extract domain from URL
  fn extract_domain(&self, url: &str) -> Option<String> {
    let url = url.trim();

    // Remove protocol
    let without_protocol = if let Some(pos) = url.find("://") {
      &url[pos + 3..]
    } else {
      url
    };

    // Get the host part
    let host = without_protocol
      .split('/')
      .next()?
      .split('?')
      .next()?
      .split('#')
      .next()?;

    // Remove port if present
    let domain = if let Some(pos) = host.rfind(':') {
      if host.starts_with('[') {
        host.to_string()
      } else {
        host[..pos].to_string()
      }
    } else {
      host.to_string()
    };

    if domain.is_empty() {
      None
    } else {
      Some(domain.to_lowercase())
    }
  }

  /// Increment the block counter
  pub fn increment_block_count(&self) {
    self.block_count.fetch_add(1, Ordering::Relaxed);
  }

  /// Get the current block count
  pub fn get_block_count(&self) -> u64 {
    self.block_count.load(Ordering::Relaxed)
  }

  /// Add a domain to the allowlist
  pub fn add_to_allowlist(&self, domain: &str) {
    let mut allowlist = self.allowlist.write().unwrap();
    allowlist.insert(domain.to_lowercase());
  }

  /// Remove a domain from the allowlist
  pub fn remove_from_allowlist(&self, domain: &str) {
    let mut allowlist = self.allowlist.write().unwrap();
    allowlist.remove(&domain.to_lowercase());
  }

  /// Check if a domain is in the allowlist
  pub fn is_in_allowlist(&self, domain: &str) -> bool {
    let allowlist = self.allowlist.read().unwrap();
    allowlist.contains(&domain.to_lowercase())
  }

  /// Set the enabled state
  pub fn set_enabled(&self, enabled: bool) {
    self.enabled.store(enabled, Ordering::Relaxed);
  }

  /// Get the enabled state
  pub fn is_enabled(&self) -> bool {
    self.enabled.load(Ordering::Relaxed)
  }

  /// Set the block count (for restoring from persistence)
  pub fn set_block_count(&self, count: u64) {
    self.block_count.store(count, Ordering::Relaxed);
  }

  /// Get the allowlist as a vector
  pub fn get_allowlist(&self) -> Vec<String> {
    let allowlist = self.allowlist.read().unwrap();
    allowlist.iter().cloned().collect()
  }

  /// Set the allowlist from a vector (for restoring from persistence)
  pub fn set_allowlist(&self, domains: Vec<String>) {
    let mut allowlist = self.allowlist.write().unwrap();
    allowlist.clear();
    for domain in domains {
      allowlist.insert(domain.to_lowercase());
    }
  }
}

impl Default for AdBlockerState {
  fn default() -> Self {
    Self::new()
  }
}
