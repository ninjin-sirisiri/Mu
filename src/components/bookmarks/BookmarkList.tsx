import { Search, BookmarkX } from 'lucide-react';
import { type Bookmark } from '../../types/bookmark';
import { BookmarkItem } from './BookmarkItem';

export type BookmarkListProps = {
  bookmarks: Bookmark[];
  searchQuery: string;
  editingBookmarkId: string | null;
  onBookmarkClick: (bookmark: Bookmark) => void;
  onBookmarkMiddleClick: (bookmark: Bookmark) => void;
  onBookmarkDelete: (id: string) => void;
  onBookmarkEditStart: (id: string) => void;
  onBookmarkEditConfirm: (id: string, title: string) => void;
  onBookmarkEditCancel: () => void;
  onSearchChange: (query: string) => void;
};

/**
 * BookmarkList component displays a searchable list of bookmarks
 * Requirements: 2.1, 2.4, 6.1, 6.3, 6.4
 */
export function BookmarkList({
  bookmarks,
  searchQuery,
  editingBookmarkId,
  onBookmarkClick,
  onBookmarkMiddleClick,
  onBookmarkDelete,
  onBookmarkEditStart,
  onBookmarkEditConfirm,
  onBookmarkEditCancel,
  onSearchChange
}: BookmarkListProps) {
  const hasBookmarks = bookmarks.length > 0;
  const hasSearchQuery = searchQuery.trim().length > 0;

  return (
    <div
      className="flex flex-col h-full"
      data-testid="bookmark-list">
      {/* Search input - Requirements: 6.1, 6.4 */}
      <div className="px-3 py-2 border-b border-gray-700/30">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search bookmarks..."
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-800/50 text-gray-200 placeholder-gray-500 rounded-md border border-gray-700/50 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-colors"
            data-testid="bookmark-search-input"
            aria-label="Search bookmarks"
          />
        </div>
      </div>

      {/* Bookmark list - Requirements: 2.1 */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {hasBookmarks ? (
          <div
            className="flex flex-col gap-1"
            role="list"
            data-testid="bookmark-items">
            {bookmarks.map(bookmark => (
              <BookmarkItem
                key={bookmark.id}
                bookmark={bookmark}
                isEditing={editingBookmarkId === bookmark.id}
                onClick={() => onBookmarkClick(bookmark)}
                onMiddleClick={() => onBookmarkMiddleClick(bookmark)}
                onDelete={() => onBookmarkDelete(bookmark.id)}
                onEditStart={() => onBookmarkEditStart(bookmark.id)}
                onEditConfirm={title => onBookmarkEditConfirm(bookmark.id, title)}
                onEditCancel={onBookmarkEditCancel}
              />
            ))}
          </div>
        ) : (
          /* Empty state - Requirements: 2.4, 6.3 */
          <div
            className="flex flex-col items-center justify-center h-full text-center px-4"
            data-testid="bookmark-empty-state">
            <BookmarkX className="w-10 h-10 text-gray-600 mb-3" />
            <p className="text-sm text-gray-400">
              {hasSearchQuery ? 'No bookmarks match your search' : 'No bookmarks yet'}
            </p>
            {!hasSearchQuery && (
              <p className="text-xs text-gray-500 mt-1">
                Press Ctrl+D to bookmark the current page
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
