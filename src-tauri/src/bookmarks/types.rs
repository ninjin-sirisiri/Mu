use serde::{Deserialize, Serialize};

/// Bookmark data structure for persistence and IPC communication
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Bookmark {
  pub id: String,
  pub url: String,
  pub title: String,
  pub favicon: Option<String>,
  pub created_at: i64,
  pub updated_at: i64,
}

/// Data structure for creating a new bookmark
#[derive(Debug)]
pub struct NewBookmark {
  pub url: String,
  pub title: String,
  pub favicon: Option<String>,
}
