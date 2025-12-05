use directories::ProjectDirs;
use rusqlite::{Connection, Result as SqliteResult, params};
use std::path::PathBuf;
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};
use uuid::Uuid;

use super::types::{Bookmark, NewBookmark};

/// Gets the path to the bookmarks database file
fn get_database_path() -> PathBuf {
  if let Some(proj_dirs) = ProjectDirs::from("com", "mu", "Mu") {
    let data_dir = proj_dirs.data_dir();
    std::fs::create_dir_all(data_dir).ok();
    data_dir.join("bookmarks.db")
  } else {
    // Fallback to current directory if project dirs not available
    PathBuf::from("bookmarks.db")
  }
}

/// Initializes the bookmark database and creates the table if it doesn't exist
pub fn init_database() -> SqliteResult<BookmarkDb> {
  let db_path = get_database_path();
  log::info!("Initializing bookmarks database at: {:?}", db_path);

  let conn = Connection::open(&db_path)?;
  let db = BookmarkDb::new(conn);

  // Initialize table (convert String error to rusqlite error)
  db.init_table().map_err(|_| rusqlite::Error::InvalidQuery)?;

  Ok(db)
}

/// Database wrapper for bookmark operations
pub struct BookmarkDb {
  conn: Mutex<Connection>,
}

impl BookmarkDb {
  /// Creates a new BookmarkDb instance with the given connection
  pub fn new(conn: Connection) -> Self {
    BookmarkDb {
      conn: Mutex::new(conn),
    }
  }

  /// Initializes the bookmarks table and indexes
  pub fn init_table(&self) -> Result<(), String> {
    let conn = self
      .conn
      .lock()
      .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    conn
      .execute(
        "CREATE TABLE IF NOT EXISTS bookmarks (
                id TEXT PRIMARY KEY,
                url TEXT NOT NULL UNIQUE,
                title TEXT NOT NULL,
                favicon TEXT,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            )",
        [],
      )
      .map_err(|e| format!("Failed to create bookmarks table: {}", e))?;

    conn
      .execute(
        "CREATE INDEX IF NOT EXISTS idx_bookmarks_url ON bookmarks(url)",
        [],
      )
      .map_err(|e| format!("Failed to create url index: {}", e))?;

    conn
      .execute(
        "CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON bookmarks(created_at DESC)",
        [],
      )
      .map_err(|e| format!("Failed to create created_at index: {}", e))?;

    log::info!("Bookmarks table initialized");
    Ok(())
  }

  /// Retrieves all bookmarks from the database, ordered by creation date (newest first)
  pub fn get_all(&self) -> Result<Vec<Bookmark>, String> {
    let conn = self
      .conn
      .lock()
      .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    let mut stmt = conn
            .prepare("SELECT id, url, title, favicon, created_at, updated_at FROM bookmarks ORDER BY created_at DESC")
            .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let bookmarks = stmt
      .query_map([], |row| {
        Ok(Bookmark {
          id: row.get(0)?,
          url: row.get(1)?,
          title: row.get(2)?,
          favicon: row.get(3)?,
          created_at: row.get(4)?,
          updated_at: row.get(5)?,
        })
      })
      .map_err(|e| format!("Failed to query bookmarks: {}", e))?
      .collect::<Result<Vec<_>, _>>()
      .map_err(|e| format!("Failed to collect bookmarks: {}", e))?;

    Ok(bookmarks)
  }

  /// Adds a new bookmark or updates existing one if URL already exists (upsert)
  pub fn add(&self, bookmark: &NewBookmark) -> Result<Bookmark, String> {
    let conn = self
      .conn
      .lock()
      .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    let now = current_timestamp();

    // Check if bookmark with this URL already exists
    if let Some(existing) = self.find_by_url_internal(&conn, &bookmark.url)? {
      // Update existing bookmark
      conn
        .execute(
          "UPDATE bookmarks SET title = ?1, favicon = ?2, updated_at = ?3 WHERE id = ?4",
          params![bookmark.title, bookmark.favicon, now, existing.id],
        )
        .map_err(|e| format!("Failed to update bookmark: {}", e))?;

      return Ok(Bookmark {
        id: existing.id,
        url: existing.url,
        title: bookmark.title.clone(),
        favicon: bookmark.favicon.clone(),
        created_at: existing.created_at,
        updated_at: now,
      });
    }

    // Create new bookmark
    let id = Uuid::new_v4().to_string();
    conn.execute(
            "INSERT INTO bookmarks (id, url, title, favicon, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![id, bookmark.url, bookmark.title, bookmark.favicon, now, now],
        )
        .map_err(|e| format!("Failed to insert bookmark: {}", e))?;

    Ok(Bookmark {
      id,
      url: bookmark.url.clone(),
      title: bookmark.title.clone(),
      favicon: bookmark.favicon.clone(),
      created_at: now,
      updated_at: now,
    })
  }

  /// Deletes a bookmark by ID
  pub fn delete(&self, id: &str) -> Result<(), String> {
    let conn = self
      .conn
      .lock()
      .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    let rows_affected = conn
      .execute("DELETE FROM bookmarks WHERE id = ?1", params![id])
      .map_err(|e| format!("Failed to delete bookmark: {}", e))?;

    if rows_affected == 0 {
      return Err(format!("Bookmark with id '{}' not found", id));
    }

    log::info!("Deleted bookmark: {}", id);
    Ok(())
  }

  /// Updates a bookmark's title
  pub fn update_title(&self, id: &str, title: &str) -> Result<Bookmark, String> {
    let conn = self
      .conn
      .lock()
      .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    let now = current_timestamp();

    let rows_affected = conn
      .execute(
        "UPDATE bookmarks SET title = ?1, updated_at = ?2 WHERE id = ?3",
        params![title, now, id],
      )
      .map_err(|e| format!("Failed to update bookmark title: {}", e))?;

    if rows_affected == 0 {
      return Err(format!("Bookmark with id '{}' not found", id));
    }

    // Fetch and return the updated bookmark
    let bookmark = conn
      .query_row(
        "SELECT id, url, title, favicon, created_at, updated_at FROM bookmarks WHERE id = ?1",
        params![id],
        |row| {
          Ok(Bookmark {
            id: row.get(0)?,
            url: row.get(1)?,
            title: row.get(2)?,
            favicon: row.get(3)?,
            created_at: row.get(4)?,
            updated_at: row.get(5)?,
          })
        },
      )
      .map_err(|e| format!("Failed to fetch updated bookmark: {}", e))?;

    log::info!("Updated bookmark title: {} -> {}", id, title);
    Ok(bookmark)
  }

  /// Finds a bookmark by URL
  pub fn find_by_url(&self, url: &str) -> Result<Option<Bookmark>, String> {
    let conn = self
      .conn
      .lock()
      .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    self.find_by_url_internal(&conn, url)
  }

  /// Internal helper to find bookmark by URL (requires lock to be held)
  fn find_by_url_internal(&self, conn: &Connection, url: &str) -> Result<Option<Bookmark>, String> {
    let result = conn.query_row(
      "SELECT id, url, title, favicon, created_at, updated_at FROM bookmarks WHERE url = ?1",
      params![url],
      |row| {
        Ok(Bookmark {
          id: row.get(0)?,
          url: row.get(1)?,
          title: row.get(2)?,
          favicon: row.get(3)?,
          created_at: row.get(4)?,
          updated_at: row.get(5)?,
        })
      },
    );

    match result {
      Ok(bookmark) => Ok(Some(bookmark)),
      Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
      Err(e) => Err(format!("Failed to find bookmark by URL: {}", e)),
    }
  }
}

/// Returns current Unix timestamp in milliseconds
fn current_timestamp() -> i64 {
  SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .map(|d| d.as_millis() as i64)
    .unwrap_or(0)
}

#[cfg(test)]
mod tests {
  use super::*;

  fn create_test_db() -> BookmarkDb {
    let conn = Connection::open_in_memory().unwrap();
    let db = BookmarkDb::new(conn);
    db.init_table().unwrap();
    db
  }

  #[test]
  fn test_init_table() {
    let db = create_test_db();
    // Should not panic and table should exist
    let bookmarks = db.get_all().unwrap();
    assert!(bookmarks.is_empty());
  }

  #[test]
  fn test_add_and_get_bookmark() {
    let db = create_test_db();
    let new_bookmark = NewBookmark {
      url: "https://example.com".to_string(),
      title: "Example".to_string(),
      favicon: Some("https://example.com/favicon.ico".to_string()),
    };

    let bookmark = db.add(&new_bookmark).unwrap();
    assert_eq!(bookmark.url, "https://example.com");
    assert_eq!(bookmark.title, "Example");
    assert!(bookmark.favicon.is_some());

    let all = db.get_all().unwrap();
    assert_eq!(all.len(), 1);
    assert_eq!(all[0].id, bookmark.id);
  }

  #[test]
  fn test_upsert_duplicate_url() {
    let db = create_test_db();

    let first = NewBookmark {
      url: "https://example.com".to_string(),
      title: "First Title".to_string(),
      favicon: None,
    };
    let bookmark1 = db.add(&first).unwrap();

    let second = NewBookmark {
      url: "https://example.com".to_string(),
      title: "Updated Title".to_string(),
      favicon: Some("favicon.ico".to_string()),
    };
    let bookmark2 = db.add(&second).unwrap();

    // Should be same ID (upsert)
    assert_eq!(bookmark1.id, bookmark2.id);
    assert_eq!(bookmark2.title, "Updated Title");

    // Should only have one bookmark
    let all = db.get_all().unwrap();
    assert_eq!(all.len(), 1);
  }

  #[test]
  fn test_delete_bookmark() {
    let db = create_test_db();
    let new_bookmark = NewBookmark {
      url: "https://example.com".to_string(),
      title: "Example".to_string(),
      favicon: None,
    };

    let bookmark = db.add(&new_bookmark).unwrap();
    assert_eq!(db.get_all().unwrap().len(), 1);

    db.delete(&bookmark.id).unwrap();
    assert_eq!(db.get_all().unwrap().len(), 0);
  }

  #[test]
  fn test_delete_nonexistent_bookmark() {
    let db = create_test_db();
    let result = db.delete("nonexistent-id");
    assert!(result.is_err());
  }

  #[test]
  fn test_update_title() {
    let db = create_test_db();
    let new_bookmark = NewBookmark {
      url: "https://example.com".to_string(),
      title: "Original Title".to_string(),
      favicon: None,
    };

    let bookmark = db.add(&new_bookmark).unwrap();
    let updated = db.update_title(&bookmark.id, "New Title").unwrap();

    assert_eq!(updated.id, bookmark.id);
    assert_eq!(updated.title, "New Title");
    assert_eq!(updated.url, bookmark.url);
    assert!(updated.updated_at >= bookmark.updated_at);
  }

  #[test]
  fn test_find_by_url() {
    let db = create_test_db();
    let new_bookmark = NewBookmark {
      url: "https://example.com".to_string(),
      title: "Example".to_string(),
      favicon: None,
    };

    db.add(&new_bookmark).unwrap();

    let found = db.find_by_url("https://example.com").unwrap();
    assert!(found.is_some());
    assert_eq!(found.unwrap().title, "Example");

    let not_found = db.find_by_url("https://notfound.com").unwrap();
    assert!(not_found.is_none());
  }
}
