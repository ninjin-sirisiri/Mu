import { PanelLeft, Settings } from 'lucide-react';
import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { useStoreValue } from '@simplestack/store/react';
import { invoke } from '@tauri-apps/api/core';
import {
  settingsStore,
  openSettingsPanel,
  closeSettingsPanel,
  setSidebarPosition,
  setSidebarMode
} from '../store/settingsStore';
import { SettingsPanel } from './SettingsPanel';
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
    // Note: Don't set isVisible to false for auto-hide mode here,
    // as it should remain visible until mouse leaves

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

  // Shadow direction based on position
  const shadowClass =
    position === 'left'
      ? 'shadow-[4px_0_24px_-4px_rgba(0,0,0,0.5)]'
      : 'shadow-[-4px_0_24px_-4px_rgba(0,0,0,0.5)]';

  // Transform direction based on position and visibility
  // Requirements: 1.1, 1.2, 5.1, 5.3
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
          absolute top-0 h-full
          bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950
          border-gray-700/50 backdrop-blur-sm
          transition-transform duration-300 ease-out
          ${position === 'left' ? 'left-0 border-r' : 'left-0 border-l'}
          ${isVisible ? shadowClass : ''}
        `}
        style={{
          width,
          transform: sidebarTransform
        }}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-700/50 bg-gray-900/50">
            <div className="flex items-center gap-2">
              <PanelLeft className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-semibold text-gray-200 tracking-wide">Tabs</span>
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

          {/* Content area - either children or default tab list with footer */}
          {children || (
            <>
              {/* Tab List */}
              <div className="flex-1 overflow-hidden">
                <ConnectedTabList />
              </div>

              {/* Footer with subtle branding and settings button (only shown when no children) */}
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

/**
 * Connected Sidebar component that reads settings from the store
 * Requirements: 4.3
 */
export function ConnectedSidebar() {
  const settingsState = useStoreValue(settingsStore);
  const position = settingsState?.sidebar?.position ?? 'left';
  const mode = settingsState?.sidebar?.mode ?? 'auto-hide';
  const isSettingsPanelOpen = settingsState?.isSettingsPanelOpen ?? false;

  return (
    <ConnectedSidebarInner
      position={position}
      mode={mode}
      isSettingsPanelOpen={isSettingsPanelOpen}
    />
  );
}

type ConnectedSidebarInnerProps = {
  position: SidebarPosition;
  mode: SidebarMode;
  isSettingsPanelOpen: boolean;
};

/**
 * Inner component to handle settings panel integration
 * Requirements: 4.1, 4.4
 */
function ConnectedSidebarInner({
  position,
  mode,
  isSettingsPanelOpen
}: ConnectedSidebarInnerProps) {
  const handleOpenSettings = useCallback(async () => {
    try {
      await invoke('show_settings');
    } catch {
      // Fallback to inline panel if WebView fails
      openSettingsPanel();
    }
  }, []);

  const handleCloseSettings = useCallback(() => {
    closeSettingsPanel();
  }, []);

  const handlePositionChange = useCallback((newPosition: SidebarPosition) => {
    setSidebarPosition(newPosition);
  }, []);

  const handleModeChange = useCallback((newMode: SidebarMode) => {
    setSidebarMode(newMode);
  }, []);

  return (
    <Sidebar
      position={position}
      mode={mode}
      onSettingsClick={handleOpenSettings}>
      <>
        {/* Tab List */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <ConnectedTabList />
        </div>

        {/* Settings Panel */}
        <div className="flex-shrink-0">
          <SettingsPanel
            isOpen={isSettingsPanelOpen}
            onClose={handleCloseSettings}
            position={position}
            mode={mode}
            onPositionChange={handlePositionChange}
            onModeChange={handleModeChange}
          />
        </div>
      </>
    </Sidebar>
  );
}
