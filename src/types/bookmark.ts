/**
 * Bookmark TypeScript Types
 * Requirements: 7.3
 */

/**
 * Bookmark structure (matches Rust Bookmark)
 * Used for IPC communication with JSON serialization
 */
export type Bookmark = {
  id: string; // UUID v4
  url: string; // Bookmarked page URL
  title: string; // Page title (editable)
  favicon: string | null; // Favicon URL (optional)
  createdAt: number; // Creation timestamp (Unix ms)
  updatedAt: number; // Update timestamp (Unix ms)
};
