use crate::bookmarks::{Bookmark, BookmarkDb, NewBookmark};
use std::sync::Arc;

/// Retrieves all bookmarks from the database
#[tauri::command]
pub async fn get_all_bookmarks(
  state: tauri::State<'_, Arc<BookmarkDb>>,
) -> Result<Vec<Bookmark>, String> {
  state.get_all()
}

/// Adds a new bookmark or updates existing one if URL already exists
#[tauri::command]
pub async fn add_bookmark(
  state: tauri::State<'_, Arc<BookmarkDb>>,
  url: String,
  title: String,
  favicon: Option<String>,
) -> Result<Bookmark, String> {
  let new_bookmark = NewBookmark {
    url,
    title,
    favicon,
  };
  state.add(&new_bookmark)
}

/// Deletes a bookmark by ID
#[tauri::command]
pub async fn delete_bookmark(
  state: tauri::State<'_, Arc<BookmarkDb>>,
  id: String,
) -> Result<(), String> {
  state.delete(&id)
}

/// Updates a bookmark's title
#[tauri::command]
pub async fn update_bookmark_title(
  state: tauri::State<'_, Arc<BookmarkDb>>,
  id: String,
  title: String,
) -> Result<Bookmark, String> {
  state.update_title(&id, &title)
}

/// Checks if a bookmark exists for the given URL
#[tauri::command]
pub async fn bookmark_exists(
  state: tauri::State<'_, Arc<BookmarkDb>>,
  url: String,
) -> Result<Option<Bookmark>, String> {
  state.find_by_url(&url)
}
