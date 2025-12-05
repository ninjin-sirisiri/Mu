/**
 * Connected BookmarkList component that integrates with the bookmark store
 * Requirements: 2.1, 3.1, 3.2
 */

import { useEffect, useCallback } from 'react';
import { useStoreValue } from '@simplestack/store/react';
import { invoke } from '@tauri-apps/api/core';
import {
  bookmarkStore,
  loadBookmarks,
  deleteBookmark,
  updateBookmarkTitle,
  setSearchQuery,
  setEditingBookmarkId,
  filterBookmarks
} from '../../store/bookmarkStore';
import { tabStore, createTab } from '../../store/tabStore';
import { type Bookmark } from '../../types/bookmark';
import { BookmarkList } from './BookmarkList';

export function ConnectedBookmarkList() {
  const bookmarkState = useStoreValue(bookmarkStore);
  const tabState = useStoreValue(tabStore);

  // Load bookmarks on mount
  useEffect(() => {
    loadBookmarks();
  }, []);

  // Filter bookmarks based on search query
  const filteredBookmarks = filterBookmarks(bookmarkState.bookmarks, bookmarkState.searchQuery);

  /**
   * Handle bookmark click - navigate active tab to bookmark URL
   * Requirements: 3.1
   */
  const handleBookmarkClick = useCallback(
    async (bookmark: Bookmark) => {
      const activeTab = tabState.tabs.find(t => t.id === tabState.activeTabId);
      if (activeTab) {
        try {
          await invoke('navigate', { url: bookmark.url });
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Failed to navigate:', error);
        }
      }
    },
    [tabState.activeTabId, tabState.tabs]
  );

  /**
   * Handle bookmark middle-click - open in new tab
   * Requirements: 3.2
   */
  const handleBookmarkMiddleClick = useCallback((bookmark: Bookmark) => {
    try {
      createTab(bookmark.url);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to open bookmark in new tab:', error);
    }
  }, []);

  /**
   * Handle bookmark delete
   * Requirements: 4.1
   */
  const handleBookmarkDelete = useCallback(async (id: string) => {
    await deleteBookmark(id);
  }, []);

  /**
   * Handle edit start
   */
  const handleEditStart = useCallback((id: string) => {
    setEditingBookmarkId(id);
  }, []);

  /**
   * Handle edit confirm
   * Requirements: 5.2
   */
  const handleEditConfirm = useCallback(async (id: string, title: string) => {
    await updateBookmarkTitle(id, title);
  }, []);

  /**
   * Handle edit cancel
   */
  const handleEditCancel = useCallback(() => {
    setEditingBookmarkId(null);
  }, []);

  /**
   * Handle search query change
   * Requirements: 6.1
   */
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  return (
    <BookmarkList
      bookmarks={filteredBookmarks}
      searchQuery={bookmarkState.searchQuery}
      editingBookmarkId={bookmarkState.editingBookmarkId}
      onBookmarkClick={handleBookmarkClick}
      onBookmarkMiddleClick={handleBookmarkMiddleClick}
      onBookmarkDelete={handleBookmarkDelete}
      onBookmarkEditStart={handleEditStart}
      onBookmarkEditConfirm={handleEditConfirm}
      onBookmarkEditCancel={handleEditCancel}
      onSearchChange={handleSearchChange}
    />
  );
}
