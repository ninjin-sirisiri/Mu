import { PanelLeft, Settings, Bookmark } from 'lucide-react';
import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { addBookmark } from '../../store/bookmarkStore';
import { openSettingsPanel } from '../../store/settingsStore';
import { getActiveTab } from '../../store/tabStore';
import { ConnectedBookmarkList } from '../bookmarks';
import { ConnectedTabList } from '../tabs';

export type SidebarView = 'tabs' | 'bookmarks';

export type SidebarPosition = 'left' | 'right';
export type SidebarMode = 'fixed' | 'auto-hide';

export type SidebarProps = {
  position?: SidebarPosition;
  mode?: SidebarMode;
  width?: number;
  hideDelay?: number;
  triggerZoneWidth?: number;
  children?: ReactNode;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onVisibilityChange?: (visible: boolean) => void;
  onSettingsClick?: () => void;
};

/**
 * Sidebar component with auto-hide functionality
 * Controls its own WebView width via Tauri commands
 * Requirements: 8.1, 8.2, 8.4
 */
export function Sidebar({
  position = 'left',
  mode = 'auto-hide',
  width = 260,
  hideDelay = 300,
  triggerZoneWidth = 16,
  children,
  onMouseEnter: onMouseEnterProp,
  onMouseLeave: onMouseLeaveProp,
  onVisibilityChange,
  onSettingsClick
}: SidebarProps) {
  const [isVisible, setIsVisible] = useState(mode === 'fixed');
  const [activeView, setActiveView] = useState<SidebarView>('tabs');
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update WebView width when visibility changes
  useEffect(() => {
    (async function updateWidth() {
      const targetWidth = isVisible ? width : triggerZoneWidth;
      try {
        await invoke('set_sidebar_width', { width: targetWidth });
      } catch {
        // Ignore errors (e.g., when running in browser)
      }
    })();
  }, [isVisible, width, triggerZoneWidth]);

  // Clear any pending hide timeout
  const clearHideTimeout = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  // Show sidebar immediately
  const showSidebar = useCallback(() => {
    clearHideTimeout();
    setIsVisible(true);
    onVisibilityChange?.(true);
  }, [clearHideTimeout, onVisibilityChange]);

  // Hide sidebar after delay
  const hideSidebarWithDelay = useCallback(() => {
    if (mode === 'fixed') return;

    clearHideTimeout();
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
      onVisibilityChange?.(false);
    }, hideDelay);
  }, [mode, hideDelay, clearHideTimeout, onVisibilityChange]);

  // Handle mouse entering
  const handleMouseEnter = useCallback(() => {
    if (mode === 'auto-hide') {
      showSidebar();
    }
    clearHideTimeout();
  }, [mode, showSidebar, clearHideTimeout]);

  // Handle mouse leaving
  const handleMouseLeave = useCallback(() => {
    if (mode === 'auto-hide') {
      hideSidebarWithDelay();
    }
  }, [mode, hideSidebarWithDelay]);

  // Update visibility and content layout when mode changes
  useEffect(() => {
    if (mode === 'fixed') {
      setIsVisible(true);
      clearHideTimeout();
    }

    // Update content WebView layout
    (async function updateContentLayout() {
      try {
        await invoke('set_content_layout', {
          sidebarWidth: width,
          sidebarPosition: position,
          isFixed: mode === 'fixed'
        });
      } catch {
        // Ignore errors
      }
    })();
  }, [mode, position, width, clearHideTimeout]);

  // Update WebView position when position setting changes
  useEffect(() => {
    (async function updatePosition() {
      try {
        await invoke('set_sidebar_position', { position });
      } catch {
        // Ignore errors
      }
    })();
  }, [position]);

  // Cleanup timeout on unmount
  useEffect(
    () => () => {
      clearHideTimeout();
    },
    [clearHideTimeout]
  );

  // Listen for toggle sidebar shortcut event (Ctrl+B)
  useEffect(() => {
    function handleToggleSidebar() {
      setIsVisible(prev => {
        const newVisible = !prev;
        onVisibilityChange?.(newVisible);
        return newVisible;
      });
    }

    globalThis.addEventListener('toggle-sidebar', handleToggleSidebar);
    return () => {
      globalThis.removeEventListener('toggle-sidebar', handleToggleSidebar);
    };
  }, [onVisibilityChange]);

  // Listen for toggle bookmark panel shortcut event (Ctrl+Shift+B)
  // Requirements: 8.2
  useEffect(() => {
    function handleToggleBookmarkPanel() {
      // If sidebar is visible, toggle between tabs and bookmarks
      if (isVisible) {
        setActiveView(prev => (prev === 'bookmarks' ? 'tabs' : 'bookmarks'));
      } else {
        // If sidebar is hidden, show it and switch to bookmarks
        setIsVisible(true);
        onVisibilityChange?.(true);
        setActiveView('bookmarks');
      }
    }

    globalThis.addEventListener('toggle-bookmark-panel', handleToggleBookmarkPanel);
    return () => {
      globalThis.removeEventListener('toggle-bookmark-panel', handleToggleBookmarkPanel);
    };
  }, [isVisible, onVisibilityChange]);

  // Listen for add bookmark shortcut event (Ctrl+D)
  // Requirements: 8.1
  useEffect(() => {
    async function handleAddBookmark() {
      const activeTab = getActiveTab();
      if (activeTab?.url) {
        await addBookmark(
          activeTab.url,
          activeTab.title || activeTab.url,
          activeTab.favicon ?? undefined
        );
      }
    }

    globalThis.addEventListener('add-bookmark', handleAddBookmark);
    return () => {
      globalThis.removeEventListener('add-bookmark', handleAddBookmark);
    };
  }, []);

  // Shadow direction based on position
  const shadowClass =
    position === 'left'
      ? 'shadow-[4px_0_24px_-4px_rgba(0,0,0,0.5)]'
      : 'shadow-[-4px_0_24px_-4px_rgba(0,0,0,0.5)]';

  // Transform direction based on position and visibility
  const hiddenTransform = position === 'left' ? 'translateX(-100%)' : 'translateX(100%)';
  const sidebarTransform = isVisible ? 'translateX(0)' : hiddenTransform;

  return (
    <div
      className="w-full h-full relative"
      onMouseEnter={() => {
        onMouseEnterProp?.();
        handleMouseEnter();
      }}
      onMouseLeave={() => {
        onMouseLeaveProp?.();
        handleMouseLeave();
      }}>
      {/* Trigger zone for auto-hide mode */}
      {mode === 'auto-hide' && (
        <div
          data-testid="sidebar-trigger-zone"
          className="absolute top-0 h-full z-10"
          style={{
            width: triggerZoneWidth,
            [position]: 0
          }}
          onMouseEnter={handleMouseEnter}
        />
      )}
      {/* Sidebar - slides in from left or right based on position */}
      <div
        data-testid="sidebar"
        data-visible={isVisible}
        data-position={position}
        data-mode={mode}
        className={`
          absolute top-0 h-full z-50
          bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950
          border-gray-700/50 backdrop-blur-sm
          transition-[transform,opacity] duration-300 ease-out
          ${position === 'left' ? 'left-0 border-r' : 'left-0 border-l'}
          ${isVisible ? shadowClass : 'pointer-events-none'}
        `}
        style={{
          width,
          transform: sidebarTransform,
          opacity: isVisible ? 1 : 0
        }}>
        <div className="flex flex-col h-full">
          {/* Header with view tabs - Requirements: 2.1 */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-700/50 bg-gray-900/50">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveView('tabs')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeView === 'tabs'
                    ? 'bg-gray-700/70 text-gray-100'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/40'
                }`}
                aria-label="View tabs"
                data-testid="sidebar-tabs-button"
                title="Tabs">
                <PanelLeft className="w-4 h-4" />
                <span>Tabs</span>
              </button>
              <button
                onClick={() => setActiveView('bookmarks')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeView === 'bookmarks'
                    ? 'bg-gray-700/70 text-gray-100'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/40'
                }`}
                aria-label="View bookmarks"
                data-testid="sidebar-bookmarks-button"
                title="Bookmarks">
                <Bookmark className="w-4 h-4" />
                <span>Bookmarks</span>
              </button>
            </div>
            {onSettingsClick && (
              <button
                onClick={onSettingsClick}
                className="p-1.5 rounded hover:bg-gray-700/50 text-gray-400 hover:text-gray-200 transition-colors"
                aria-label="Open settings"
                data-testid="settings-button"
                title="Settings">
                <Settings className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Content area - either children or default view with footer */}
          {children || (
            <>
              {/* Content based on active view - Requirements: 2.1 */}
              <div className="flex-1 overflow-hidden">
                {activeView === 'tabs' ? <ConnectedTabList /> : <ConnectedBookmarkList />}
              </div>

              {/* Footer with subtle branding and settings button */}
              <div className="px-4 py-2 border-t border-gray-700/30 bg-gray-950/50 flex items-center justify-between">
                <span className="text-xs text-gray-600">Mu Browser</span>
                <button
                  onClick={() => openSettingsPanel()}
                  className="p-1.5 rounded hover:bg-gray-700/50 text-gray-500 hover:text-gray-300 transition-colors"
                  aria-label="Open settings"
                  data-testid="settings-button">
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to get sidebar visibility state for testing
 * This is a pure function that computes visibility based on mode
 */
export function computeSidebarVisibility(
  mode: SidebarMode,
  cursorInTriggerZone: boolean,
  cursorInSidebar: boolean,
  _currentlyVisible: boolean
): boolean {
  if (mode === 'fixed') {
    return true;
  }

  if (cursorInTriggerZone || cursorInSidebar) {
    return true;
  }

  return false;
}
