import './App.css';

import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useCallback, useEffect, useState } from 'react';

import { WindowControls } from './components/WindowControls';
import { useNavigation, WebViewContainer } from './features/webview';

const appWindow = getCurrentWindow();

function App() {
  const [state] = useNavigation();
  const [isNavVisible, setIsNavVisible] = useState(false);

  // コマンドパレットを開く
  const openCommandPalette = useCallback(async () => {
    try {
      await invoke('open_command_palette');
    } catch (error) {
      console.error('Failed to open command palette:', error);
    }
  }, []);

  // Notify Rust side when nav visibility changes
  const updateNavVisibility = useCallback(async (visible: boolean) => {
    setIsNavVisible(visible);
    try {
      await invoke('set_nav_visible', { visible });
    } catch (error) {
      console.error('Failed to update nav visibility:', error);
    }
  }, []);

  // Show nav on mouse enter
  const handleMouseEnter = useCallback(() => {
    if (!isNavVisible) {
      updateNavVisibility(true);
    }
  }, [isNavVisible, updateNavVisibility]);

  // Hide nav on mouse leave
  const handleMouseLeave = useCallback(() => {
    if (isNavVisible) {
      updateNavVisibility(false);
    }
  }, [isNavVisible, updateNavVisibility]);

  // Set initial state on mount
  useEffect(() => {
    // Start with nav hidden
    invoke('set_nav_visible', { visible: false }).catch(console.error);
  }, []);

  // グローバルショートカットのイベントリスナー
  useEffect(() => {
    const unlistenPromises = [
      listen('shortcut:toggle-command-palette', async () => {
        try {
          await invoke('toggle_command_palette');
        } catch (error) {
          console.error('Failed to toggle command palette:', error);
        }
      }),
      listen('shortcut:create-new-tab', async () => {
        try {
          await invoke('create_new_tab');
        } catch (error) {
          console.error('Failed to create new tab:', error);
        }
      }),
      listen('shortcut:close-current-tab', async () => {
        try {
          await invoke('close_current_tab');
        } catch (error) {
          console.error('Failed to close tab:', error);
        }
      }),
      listen('shortcut:toggle-sidebar', async () => {
        try {
          await invoke('toggle_sidebar');
        } catch (error) {
          console.error('Failed to toggle sidebar:', error);
        }
      }),
      listen('shortcut:go-back', async () => {
        try {
          await invoke('go_back');
        } catch (error) {
          console.error('Failed to go back:', error);
        }
      }),
      listen('shortcut:go-forward', async () => {
        try {
          await invoke('go_forward');
        } catch (error) {
          console.error('Failed to go forward:', error);
        }
      }),
      listen('shortcut:reload', async () => {
        try {
          await invoke('reload');
        } catch (error) {
          console.error('Failed to reload:', error);
        }
      }),
      listen('shortcut:next-tab', async () => {
        try {
          await invoke('switch_to_next_tab');
        } catch (error) {
          console.error('Failed to switch to next tab:', error);
        }
      }),
      listen('shortcut:previous-tab', async () => {
        try {
          await invoke('switch_to_previous_tab');
        } catch (error) {
          console.error('Failed to switch to previous tab:', error);
        }
      }),
    ];

    // Cleanup
    return () => {
      Promise.all(unlistenPromises).then((unlistenFns) => {
        unlistenFns.forEach((unlisten) => unlisten());
      });
    };
  }, []);

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Navigation bar - animated on hover */}
      <header
        className="absolute left-0 right-0 top-0 z-10 flex w-full min-w-0 items-center border-b border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-900"
        style={{
          transform: isNavVisible ? 'translateY(0)' : 'translateY(-100%)',
          opacity: isNavVisible ? 1 : 0,
          transition: 'transform 200ms ease-out, opacity 200ms ease-out',
        }}
      >
        {/* Draggable region */}
        <div
          className="flex min-w-0 flex-1 items-center gap-2 p-2"
          onMouseDown={() => appWindow.startDragging()}
        >
          <div
            className="min-w-0 flex-1 cursor-pointer rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-800"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={openCommandPalette}
          >
            {state.currentUrl || 'Ctrl+L でコマンドパレットを開く'}
          </div>
        </div>
        {/* Window controls */}
        <WindowControls />
      </header>

      {/* WebView container - transparent to allow content webview to show through */}
      <main className="flex-1 overflow-hidden">
        <WebViewContainer url={state.currentUrl} />
      </main>
    </div>
  );
}

export default App;
