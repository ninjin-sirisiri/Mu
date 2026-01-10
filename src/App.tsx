import './App.css';

import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useCallback, useEffect, useState } from 'react';

import { Button } from './components/Button';
import { WindowControls } from './components/WindowControls';
import { AddressBar } from './features/address-bar';
import { useNavigation, WebViewContainer } from './features/webview';

const appWindow = getCurrentWindow();

function App() {
  const [state, controls] = useNavigation();
  const [isNavVisible, setIsNavVisible] = useState(false);

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

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Navigation bar - animated on hover */}
      <header
        className="absolute left-0 right-0 top-0 z-10 flex w-full min-w-0 items-center border-b border-neutral-200 bg-white"
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
          <Button
            variant="ghost"
            size="sm"
            onClick={controls.goBack}
            disabled={!state.canGoBack}
            aria-label="Go back"
            onMouseDown={(e) => e.stopPropagation()}
          >
            &#8592;
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={controls.goForward}
            disabled={!state.canGoForward}
            aria-label="Go forward"
            onMouseDown={(e) => e.stopPropagation()}
          >
            &#8594;
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={controls.reload}
            disabled={state.isLoading}
            aria-label="Reload"
            onMouseDown={(e) => e.stopPropagation()}
          >
            &#8635;
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={controls.goHome}
            aria-label="Home"
            onMouseDown={(e) => e.stopPropagation()}
          >
            &#8962;
          </Button>
          <div className="min-w-0 flex-1" onMouseDown={(e) => e.stopPropagation()}>
            <AddressBar
              currentUrl={state.currentUrl}
              onNavigate={controls.navigateTo}
              disabled={state.isLoading}
            />
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
