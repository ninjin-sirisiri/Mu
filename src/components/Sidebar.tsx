import { PanelLeft } from 'lucide-react';
import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
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
  const sidebarRef = useRef<HTMLDivElement>(null);

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

  // Handle mouse entering trigger zone
  const handleTriggerZoneEnter = useCallback(() => {
    if (mode === 'auto-hide') {
      showSidebar();
    }
  }, [mode, showSidebar]);

  // Handle mouse entering sidebar
  const handleSidebarEnter = useCallback(() => {
    clearHideTimeout();
  }, [clearHideTimeout]);

  // Handle mouse leaving sidebar
  const handleSidebarLeave = useCallback(() => {
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

  // Position styles
  const positionStyles = position === 'left' ? { left: 0 } : { right: 0 };

  const triggerZoneStyles = position === 'left' ? { left: 0 } : { right: 0 };

  // Calculate slide transform based on position and visibility
  function getSlideTransform(): string {
    if (!isVisible) {
      return position === 'left' ? 'translateX(-100%)' : 'translateX(100%)';
    }
    return 'translateX(0)';
  }

  const slideTransform = getSlideTransform();

  // Shadow direction based on position
  const shadowClass =
    position === 'left'
      ? 'shadow-[4px_0_24px_-4px_rgba(0,0,0,0.5)]'
      : 'shadow-[-4px_0_24px_-4px_rgba(0,0,0,0.5)]';

  return (
    <>
      {/* Trigger Zone - only shown in auto-hide mode when sidebar is hidden */}
      {mode === 'auto-hide' && !isVisible && (
        <div
          data-testid="sidebar-trigger-zone"
          className="fixed top-0 h-full z-40 pointer-events-auto bg-gradient-to-r from-gray-900/10 to-transparent hover:from-gray-900/20"
          style={{
            ...triggerZoneStyles,
            width: triggerZoneWidth
          }}
          onMouseEnter={() => {
            onMouseEnterProp?.();
            handleTriggerZoneEnter();
          }}
          onMouseLeave={onMouseLeaveProp}
        />
      )}

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        data-testid="sidebar"
        data-visible={isVisible}
        data-position={position}
        data-mode={mode}
        className={`
          fixed top-0 h-full z-50
          bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950
          border-gray-700/50 backdrop-blur-sm
          transition-transform duration-300 ease-out
          ${position === 'left' ? 'border-r' : 'border-l'}
          ${isVisible ? shadowClass : ''}
        `}
        style={{
          ...positionStyles,
          width,
          transform: slideTransform,
          pointerEvents: isVisible ? 'auto' : 'none'
        }}
        onMouseEnter={() => {
          onMouseEnterProp?.();
          handleSidebarEnter();
        }}
        onMouseLeave={() => {
          onMouseLeaveProp?.();
          handleSidebarLeave();
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
    </>
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
