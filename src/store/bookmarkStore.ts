/**
 * Bookmark Store
 * Requirements: 1.1, 2.3, 4.1, 5.2, 6.1
 */

import { store } from '@simplestack/store';
import { invoke } from '@tauri-apps/api/core';
import { type Bookmark } from '../types/bookmark';

/**
 * Bookmark state type
 */
export type BookmarkState = {
  bookmarks: Bookmark[];
  isLoading: boolean;
  searchQuery: string;
  editingBookmarkId: string | null;
};

/**
 * Bookmark store instance
 */
export const bookmarkStore = store<BookmarkState>({
  bookmarks: [],
  isLoading: false,
  searchQuery: '',
  editingBookmarkId: null
});

// ============ Error Handling ============

/**
 * Log an error for debugging
 */
function logError(operation: string, error: unknown): void {
  // eslint-disable-next-line no-console
  console.error(`[BookmarkStore] Error in ${operation}:`, error);
}

// ============ Actions ============

/**
 * Load all bookmarks from the backend
 * Requirements: 2.3
 */
export async function loadBookmarks(): Promise<void> {
  try {
    bookmarkStore.set(s => ({ ...s, isLoading: true }));
    const bookmarks = await invoke<Bookmark[]>('get_all_bookmarks');
    bookmarkStore.set(s => ({
      ...s,
      bookmarks,
      isLoading: false
    }));
  } catch (error) {
    logError('loadBookmarks', error);
    bookmarkStore.set(s => ({
      ...s,
      bookmarks: [],
      isLoading: false
    }));
  }
}

/**
 * Add a bookmark for the given URL and title
 * Requirements: 1.1
 */
export async function addBookmark(
  url: string,
  title: string,
  favicon?: string
): Promise<Bookmark | null> {
  try {
    const bookmark = await invoke<Bookmark>('add_bookmark', {
      url,
      title,
      favicon: favicon ?? null
    });

    // Update store: either add new or update existing (upsert behavior)
    bookmarkStore.set(s => {
      const existingIndex = s.bookmarks.findIndex(b => b.url === bookmark.url);
      if (existingIndex !== -1) {
        // Update existing bookmark
        const updated = [...s.bookmarks];
        updated[existingIndex] = bookmark;
        return { ...s, bookmarks: updated };
      }
      // Add new bookmark
      return { ...s, bookmarks: [bookmark, ...s.bookmarks] };
    });

    return bookmark;
  } catch (error) {
    logError('addBookmark', error);
    return null;
  }
}

/**
 * Delete a bookmark by ID
 * Requirements: 4.1
 */
export async function deleteBookmark(id: string): Promise<boolean> {
  const previousBookmarks = bookmarkStore.get().bookmarks;

  // Optimistic update
  bookmarkStore.set(s => ({
    ...s,
    bookmarks: s.bookmarks.filter(b => b.id !== id)
  }));

  try {
    await invoke('delete_bookmark', { id });
    return true;
  } catch (error) {
    logError('deleteBookmark', error);
    // Revert on failure
    bookmarkStore.set(s => ({
      ...s,
      bookmarks: previousBookmarks
    }));
    return false;
  }
}

/**
 * Update a bookmark's title
 * Requirements: 5.2
 */
export async function updateBookmarkTitle(id: string, title: string): Promise<Bookmark | null> {
  const previousBookmarks = bookmarkStore.get().bookmarks;

  // Optimistic update
  bookmarkStore.set(s => ({
    ...s,
    bookmarks: s.bookmarks.map(b => (b.id === id ? { ...b, title, updatedAt: Date.now() } : b)),
    editingBookmarkId: null
  }));

  try {
    const updated = await invoke<Bookmark>('update_bookmark_title', { id, title });

    // Update with actual server response
    bookmarkStore.set(s => ({
      ...s,
      bookmarks: s.bookmarks.map(b => (b.id === id ? updated : b))
    }));

    return updated;
  } catch (error) {
    logError('updateBookmarkTitle', error);
    // Revert on failure
    bookmarkStore.set(s => ({
      ...s,
      bookmarks: previousBookmarks
    }));
    return null;
  }
}

/**
 * Set the search query for filtering bookmarks
 * Requirements: 6.1
 */
export function setSearchQuery(query: string): void {
  bookmarkStore.set(s => ({ ...s, searchQuery: query }));
}

/**
 * Set the bookmark ID being edited
 */
export function setEditingBookmarkId(id: string | null): void {
  bookmarkStore.set(s => ({ ...s, editingBookmarkId: id }));
}

/**
 * Filter bookmarks by search query (title OR URL, case-insensitive)
 * Requirements: 6.1
 */
export function filterBookmarks(bookmarks: Bookmark[], query: string): Bookmark[] {
  if (!query.trim()) {
    return bookmarks;
  }
  const lowerQuery = query.toLowerCase();
  return bookmarks.filter(
    b => b.title.toLowerCase().includes(lowerQuery) || b.url.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Reset bookmark store to initial state (useful for testing)
 */
export function resetBookmarkStore(): void {
  bookmarkStore.set({
    bookmarks: [],
    isLoading: false,
    searchQuery: '',
    editingBookmarkId: null
  });
}
