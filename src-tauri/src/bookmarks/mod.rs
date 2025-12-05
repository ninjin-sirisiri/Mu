mod db;
mod types;

pub use db::{BookmarkDb, init_database};
pub use types::{Bookmark, NewBookmark};
