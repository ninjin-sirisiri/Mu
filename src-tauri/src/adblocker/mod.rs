//! Ad blocker module for Mu browser
//!
//! This module provides ad blocking functionality by intercepting network requests
//! and blocking those that match configured filter rules.

pub mod filter_engine;
pub mod state;
pub mod types;

#[cfg(test)]
mod filter_engine_props;
#[cfg(test)]
mod filter_engine_test;
#[cfg(test)]
mod state_props;
#[cfg(test)]
mod state_test;

// Re-export commonly used types
#[allow(unused_imports)]
pub use filter_engine::FilterEngine;
pub use state::AdBlockerState;
#[allow(unused_imports)]
pub use types::{BlockDecision, BlockRule, FilterParseError};
