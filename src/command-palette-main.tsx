import './command-palette.css';

import { invoke } from '@tauri-apps/api/core';
import { StrictMode, useCallback, useMemo } from 'react';
import { createRoot } from 'react-dom/client';

import { CommandPalette, createDefaultCommands } from './features/command-palette';

function CommandPaletteApp() {
  // コマンドパレットを閉じる
  const handleClose = useCallback(async () => {
    try {
      await invoke('close_command_palette');
    } catch (error) {
      console.error('Failed to close command palette:', error);
    }
  }, []);

  // URLにナビゲート
  const handleNavigate = useCallback(async (url: string) => {
    try {
      await invoke('navigate_to', { url });
    } catch (error) {
      console.error('Failed to navigate:', error);
    }
  }, []);

  // デフォルトコマンドを作成（Tauriコマンド経由で実行）
  const commands = useMemo(
    () =>
      createDefaultCommands({
        goBack: async () => {
          try {
            await invoke('go_back');
          } catch (error) {
            console.error('Failed to go back:', error);
          }
        },
        goForward: async () => {
          try {
            await invoke('go_forward');
          } catch (error) {
            console.error('Failed to go forward:', error);
          }
        },
        reload: async () => {
          try {
            await invoke('reload');
          } catch (error) {
            console.error('Failed to reload:', error);
          }
        },
        goHome: async () => {
          try {
            await invoke('go_home');
          } catch (error) {
            console.error('Failed to go home:', error);
          }
        },
        createTab: async () => {
          try {
            await invoke('create_new_tab');
          } catch (error) {
            console.error('Failed to create tab:', error);
          }
        },
        closeTab: async () => {
          try {
            const activeTabId = await invoke<string>('get_active_tab_id');
            await invoke('close_tab', { id: activeTabId });
          } catch (error) {
            console.error('Failed to close tab:', error);
          }
        },
      }),
    []
  );

  return (
    <div
      className="relative h-screen w-screen"
      style={{ background: 'transparent', backgroundColor: 'transparent' }}
    >
      <CommandPalette
        isOpen={true}
        onClose={handleClose}
        commands={commands}
        onNavigate={handleNavigate}
      />
    </div>
  );
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <CommandPaletteApp />
  </StrictMode>
);
