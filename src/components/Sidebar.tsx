import { PanelLeft } from 'lucide-react';
import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { ConnectedTabList } from './TabList';

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
  onVisibilityChange
}: SidebarProps) {
  const [isVisible, setIsVisible] = useState(mode === 'fixed');
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

  // Update visibility when mode changes
  useEffect(() => {
    if (mode === 'fixed') {
      setIsVisible(true);
      clearHideTimeout();
    }
  }, [mode, clearHideTimeout]);

  // Cleanup timeout on unmount
  useEffect(
    () => () => {
      clearHideTimeout();
    },
    [clearHideTimeout]
  );

  // Shadow direction based on position
  const shadowClass =
    position === 'left'
      ? 'shadow-[4px_0_24px_-4px_rgba(0,0,0,0.5)]'
      : 'shadow-[-4px_0_24px_-4px_rgba(0,0,0,0.5)]';

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
      {/* Sidebar - slides in from left */}
      <div
        data-testid="sidebar"
        data-visible={isVisible}
        data-position={position}
        data-mode={mode}
        className={`
          h-full
          bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950
          border-gray-700/50 backdrop-blur-sm
          transition-transform duration-300 ease-out
          ${position === 'left' ? 'border-r' : 'border-l'}
          ${isVisible ? shadowClass : ''}
        `}
        style={{
          width,
          transform: isVisible ? 'translateX(0)' : 'translateX(-100%)'
        }}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3.5 border-b border-gray-700/50 bg-gray-900/50">
            <PanelLeft className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-200 tracking-wide">Tabs</span>
          </div>

          {/* Tab List */}
          <div className="flex-1 overflow-hidden">{children ?? <ConnectedTabList />}</div>

          {/* Footer with subtle branding */}
          <div className="px-4 py-2 border-t border-gray-700/30 bg-gray-950/50">
            <span className="text-xs text-gray-600">Mu Browser</span>
          </div>
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
  // Fixed mode: always visible
  if (mode === 'fixed') {
    return true;
  }

  // Auto-hide mode
  if (cursorInTriggerZone || cursorInSidebar) {
    return true;
  }

  // If cursor left both zones, visibility depends on delay
  // (actual hiding happens after delay, but this returns the target state)
  return false;
}
