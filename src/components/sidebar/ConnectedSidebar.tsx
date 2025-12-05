import { useCallback } from 'react';
import { useStoreValue } from '@simplestack/store/react';
import { invoke } from '@tauri-apps/api/core';
import {
  settingsStore,
  openSettingsPanel,
  type SidebarPosition,
  type SidebarMode
} from '../../store/settingsStore';
import { Sidebar } from './Sidebar';

/**
 * Connected Sidebar component that reads settings from the store
 * Requirements: 4.3
 */
export function ConnectedSidebar() {
  const settingsState = useStoreValue(settingsStore);
  const position = settingsState?.sidebar?.position ?? 'left';
  const mode = settingsState?.sidebar?.mode ?? 'auto-hide';

  return (
    <ConnectedSidebarInner
      position={position}
      mode={mode}
    />
  );
}

type ConnectedSidebarInnerProps = {
  position: SidebarPosition;
  mode: SidebarMode;
};

/**
 * Inner component to handle settings panel integration
 * Requirements: 4.1, 4.4, 2.1
 */
function ConnectedSidebarInner({ position, mode }: ConnectedSidebarInnerProps) {
  const handleOpenSettings = useCallback(async () => {
    try {
      await invoke('show_settings');
    } catch {
      // Fallback to inline panel if WebView fails
      openSettingsPanel();
    }
  }, []);

  // Let Sidebar handle the default content with tab/bookmark switching
  return (
    <Sidebar
      position={position}
      mode={mode}
      onSettingsClick={handleOpenSettings}
    />
  );
}
