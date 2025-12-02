import { X, Loader2, Globe } from 'lucide-react';
import { type Tab } from '../store/tabStore';

/**
 * Maximum length for tab title before truncation
 */
export const MAX_TITLE_LENGTH = 20;

/**
 * Truncate a title if it exceeds the maximum length
 */
export function truncateTitle(title: string, maxLength: number = MAX_TITLE_LENGTH): string {
  if (title.length <= maxLength) {
    return title;
  }
  return `${title.slice(0, maxLength)}...`;
}

export type TabItemProps = {
  tab: Tab;
  isActive: boolean;
  onClick: () => void;
  onClose: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  isDragOver?: boolean;
};

/**
 * TabItem component displays a single tab in the vertical tab list
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */
export function TabItem({
  tab,
  isActive,
  onClick,
  onClose,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragOver = false
}: TabItemProps) {
  const displayTitle = truncateTitle(tab.title);

  return (
    <div
      role="tab"
      aria-selected={isActive}
      data-testid={`tab-item-${tab.id}`}
      data-active={isActive}
      data-loading={tab.isLoading}
      data-drag-over={isDragOver}
      className={`
        relative flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer
        transition-all duration-200 ease-out group select-none
        ${
          isActive
            ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/20'
            : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/70 hover:text-gray-100'
        }
        ${isDragOver ? 'ring-2 ring-blue-400 ring-offset-1 ring-offset-gray-900' : ''}
        ${tab.isLoading ? 'animate-pulse' : ''}
      `}
      onClick={onClick}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}>
      {/* Active indicator bar */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-white/80 rounded-full" />
      )}

      {/* Favicon or Loading indicator */}
      <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
        {tab.isLoading && (
          <Loader2
            className="w-4 h-4 animate-spin text-blue-400"
            data-testid="loading-indicator"
          />
        )}
        {!tab.isLoading && tab.favicon && (
          <img
            src={tab.favicon}
            alt=""
            className="w-4 h-4 rounded-sm object-cover"
            data-testid="tab-favicon"
          />
        )}
        {!tab.isLoading && !tab.favicon && (
          <Globe
            className={`w-4 h-4 ${isActive ? 'text-white/70' : 'text-gray-500'}`}
            data-testid="favicon-placeholder"
          />
        )}
      </div>

      {/* Tab title */}
      <span
        className="flex-1 text-sm font-medium truncate"
        title={tab.title}
        data-testid="tab-title">
        {displayTitle}
      </span>

      {/* Close button */}
      <button
        type="button"
        onClick={e => {
          e.stopPropagation();
          onClose();
        }}
        className={`
          flex-shrink-0 p-1 rounded-md opacity-0 group-hover:opacity-100
          transition-all duration-150 ease-out
          focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-white/30
          ${
            isActive
              ? 'hover:bg-white/20 active:bg-white/30'
              : 'hover:bg-gray-600 active:bg-gray-500'
          }
        `}
        aria-label={`Close ${tab.title}`}
        data-testid="tab-close-button">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
