import { useCallback } from 'react';
import { useStoreValue } from '@simplestack/store/react';
import { invoke } from '@tauri-apps/api/core';
import {
  settingsStore,
  openSettingsPanel,
  closeSettingsPanel,
  setSidebarPosition,
  setSidebarMode,
  type SidebarPosition,
  type SidebarMode
} from '../../store/settingsStore';
import { SettingsPanel } from '../settings';
import { ConnectedTabList } from '../tabs';
import { Sidebar } from './Sidebar';

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
