import { Pencil, Trash2, Globe } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { type Bookmark } from '../../types/bookmark';

/**
 * Maximum length for bookmark title before truncation
 */
export const MAX_TITLE_LENGTH = 30;

/**
 * Truncate a title if it exceeds the maximum length
 */
export function truncateTitle(title: string, maxLength: number = MAX_TITLE_LENGTH): string {
  if (title.length <= maxLength) {
    return title;
  }
  return `${title.slice(0, maxLength)}...`;
}

export type BookmarkItemProps = {
  bookmark: Bookmark;
  isEditing: boolean;
  onClick: () => void;
  onMiddleClick: () => void;
  onDelete: () => void;
  onEditStart: () => void;
  onEditConfirm: (title: string) => void;
  onEditCancel: () => void;
};

/**
 * BookmarkItem component displays a single bookmark in the list
 * Requirements: 2.2, 3.1, 3.2, 5.1
 */
export function BookmarkItem({
  bookmark,
  isEditing,
  onClick,
  onMiddleClick,
  onDelete,
  onEditStart,
  onEditConfirm,
  onEditCancel
}: BookmarkItemProps) {
  const [editTitle, setEditTitle] = useState(bookmark.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const displayTitle = truncateTitle(bookmark.title);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Reset edit title when bookmark changes or edit mode starts
  useEffect(() => {
    setEditTitle(bookmark.title);
  }, [bookmark.title, isEditing]);

  /**
   * Handle click event - navigate to bookmark URL
   * Requirements: 3.1
   */
  function handleClick(e: React.MouseEvent) {
    if (isEditing) return;
    e.preventDefault();
    onClick();
  }

  /**
   * Handle mouse down for middle-click detection
   * Requirements: 3.2
   */
  function handleMouseDown(e: React.MouseEvent) {
    if (isEditing) return;
    // Middle click (button 1) or Ctrl+click
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      e.preventDefault();
      onMiddleClick();
    }
  }

  /**
   * Handle keyboard events in edit mode
   */
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmedTitle = editTitle.trim();
      if (trimmedTitle) {
        onEditConfirm(trimmedTitle);
      } else {
        onEditCancel();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onEditCancel();
    }
  }

  /**
   * Handle blur event - confirm edit
   */
  function handleBlur() {
    const trimmedTitle = editTitle.trim();
    if (trimmedTitle && trimmedTitle !== bookmark.title) {
      onEditConfirm(trimmedTitle);
    } else {
      onEditCancel();
    }
  }

  return (
    <div
      role="listitem"
      data-testid={`bookmark-item-${bookmark.id}`}
      data-editing={isEditing}
      className={`
        relative flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer
        transition-all duration-200 ease-out group select-none
        bg-gray-800/50 text-gray-300 hover:bg-gray-700/70 hover:text-gray-100
        ${isEditing ? 'ring-2 ring-blue-500/50' : ''}
      `}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onAuxClick={e => {
        // Prevent context menu on middle click
        if (e.button === 1) {
          e.preventDefault();
        }
      }}>
      {/* Favicon or placeholder */}
      <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
        {bookmark.favicon ? (
          <img
            src={bookmark.favicon}
            alt=""
            className="w-4 h-4 rounded-sm object-cover"
            data-testid="bookmark-favicon"
          />
        ) : (
          <Globe
            className="w-4 h-4 text-gray-500"
            data-testid="bookmark-favicon-placeholder"
          />
        )}
      </div>

      {/* Title - either display or edit mode */}
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editTitle}
          onChange={e => setEditTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="flex-1 text-sm bg-gray-700 text-gray-100 px-2 py-1 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
          data-testid="bookmark-edit-input"
          aria-label="Edit bookmark title"
        />
      ) : (
        <span
          className="flex-1 text-sm font-medium truncate"
          title={`${bookmark.title}\n${bookmark.url}`}
          data-testid="bookmark-title">
          {displayTitle}
        </span>
      )}

      {/* Action buttons - only show when not editing */}
      {!isEditing && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          {/* Edit button */}
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              onEditStart();
            }}
            className="p-1 rounded-md hover:bg-gray-600 active:bg-gray-500 transition-colors"
            aria-label={`Edit ${bookmark.title}`}
            data-testid="bookmark-edit-button">
            <Pencil className="w-3.5 h-3.5" />
          </button>

          {/* Delete button */}
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 rounded-md hover:bg-red-600/50 active:bg-red-600/70 text-gray-400 hover:text-red-300 transition-colors"
            aria-label={`Delete ${bookmark.title}`}
            data-testid="bookmark-delete-button">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
