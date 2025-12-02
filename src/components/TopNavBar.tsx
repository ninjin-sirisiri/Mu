import { useState, useCallback, useRef, useEffect } from 'react';
import { NavigationControls } from './NavigationControls';

export type TopNavBarProps = {
  hideDelay?: number;
  triggerZoneHeight?: number;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onVisibilityChange?: (visible: boolean) => void;
};

/**
 * Top navigation bar with auto-hide functionality
 * Shows when mouse moves to top of screen
 */
export function TopNavBar({
  hideDelay = 300,
  triggerZoneHeight = 8,
  onMouseEnter,
  onMouseLeave,
  onVisibilityChange
}: TopNavBarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mouseYRef = useRef<number>(0);

  // Track mouse Y position globally to detect when mouse is in trigger zone
  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      mouseYRef.current = e.clientY;
    }
    globalThis.addEventListener('mousemove', handleMouseMove);
    return () => globalThis.removeEventListener('mousemove', handleMouseMove);
  }, []);

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
      // Check if mouse is still in trigger zone before hiding
      if (mouseYRef.current < triggerZoneHeight) {
        // Mouse is in trigger zone, don't hide
        return;
      }
      setIsVisible(false);
      onVisibilityChange?.(false);
    }, hideDelay);
  }, [hideDelay, clearHideTimeout, onVisibilityChange, triggerZoneHeight]);

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
    <>
      {/* Trigger Zone - always rendered, behind nav bar */}
      <div
        data-testid="topnav-trigger-zone"
        className="fixed top-0 left-0 right-0 z-40 pointer-events-auto"
        style={{ height: triggerZoneHeight }}
        onMouseEnter={() => {
          onMouseEnter?.();
          handleTriggerZoneEnter();
        }}
        onMouseLeave={onMouseLeave}
      />

      {/* Navigation Bar */}
      <div
        data-testid="topnav-bar"
        data-visible={isVisible}
        className={`
          fixed top-0 left-0 right-0 z-50
          bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950
          border-b border-gray-700/50 backdrop-blur-sm
          transition-transform duration-300 ease-out
          ${isVisible ? 'shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)]' : ''}
        `}
        style={{
          transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
          pointerEvents: isVisible ? 'auto' : 'none'
        }}
        onMouseEnter={() => {
          onMouseEnter?.();
          handleNavBarEnter();
        }}
        onMouseLeave={() => {
          onMouseLeave?.();
          handleNavBarLeave();
        }}>
        <NavigationControls />
      </div>
    </>
  );
}
