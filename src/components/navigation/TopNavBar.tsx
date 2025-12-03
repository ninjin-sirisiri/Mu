import { useState, useCallback, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { NavigationControls } from './NavigationControls';

export type TopNavBarProps = {
  hideDelay?: number;
  triggerZoneHeight?: number;
  expandedHeight?: number;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onVisibilityChange?: (visible: boolean) => void;
};

/**
 * Top navigation bar with auto-hide functionality
 * Shows when mouse moves to top of screen
 * Controls its own WebView height via Tauri commands
 */
export function TopNavBar({
  hideDelay = 300,
  triggerZoneHeight = 8,
  expandedHeight = 56,
  onMouseEnter,
  onMouseLeave,
  onVisibilityChange
}: TopNavBarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update WebView height when visibility changes
  useEffect(() => {
    (async function updateHeight() {
      const height = isVisible ? expandedHeight : triggerZoneHeight;
      try {
        await invoke('set_topnav_height', { height });
      } catch {
        // Ignore errors (e.g., when running in browser)
      }
    })();
  }, [isVisible, expandedHeight, triggerZoneHeight]);

  const clearHideTimeout = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const showNavBar = useCallback(() => {
    clearHideTimeout();
    setIsVisible(true);
    onVisibilityChange?.(true);
  }, [clearHideTimeout, onVisibilityChange]);

  const hideNavBarWithDelay = useCallback(() => {
    clearHideTimeout();
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
      onVisibilityChange?.(false);
    }, hideDelay);
  }, [hideDelay, clearHideTimeout, onVisibilityChange]);

  const handleTriggerZoneEnter = useCallback(() => {
    showNavBar();
  }, [showNavBar]);

  const handleNavBarEnter = useCallback(() => {
    clearHideTimeout();
  }, [clearHideTimeout]);

  const handleNavBarLeave = useCallback(() => {
    hideNavBarWithDelay();
  }, [hideNavBarWithDelay]);

  return (
    <div
      className="w-full h-full"
      onMouseEnter={() => {
        onMouseEnter?.();
        handleTriggerZoneEnter();
      }}
      onMouseLeave={() => {
        onMouseLeave?.();
        handleNavBarLeave();
      }}>
      {/* Navigation Bar - slides in from top */}
      <div
        data-testid="topnav-bar"
        data-visible={isVisible}
        className={`
          w-full z-50 overflow-hidden
          bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950
          border-b border-gray-700/50 backdrop-blur-sm
          transition-[transform,opacity] duration-300 ease-out
          ${isVisible ? 'shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)]' : 'pointer-events-none'}
        `}
        style={{
          height: expandedHeight,
          transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
          opacity: isVisible ? 1 : 0
        }}
        onMouseEnter={handleNavBarEnter}>
        <NavigationControls />
      </div>
    </div>
  );
}
