import { useCallback, useEffect, useState } from 'react';

import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

import type { NavigationControls, WebViewState } from '../../../types';

interface NavigationUpdatePayload {
  url: string;
  canGoBack: boolean;
  canGoForward: boolean;
  title: string;
}

/** Custom hook for managing WebView navigation state and controls */
export const useNavigation = (): [WebViewState, NavigationControls] => {
  const [state, setState] = useState<WebViewState>({
    currentUrl: '',
    title: '',
    isLoading: false,
    canGoBack: false,
    canGoForward: false,
  });

  // Listen for navigation updates from content webview
  useEffect(() => {
    const unlisten = listen<NavigationUpdatePayload>('navigation-updated', (event) => {
      setState((prev) => ({
        ...prev,
        currentUrl: event.payload.url,
        title: event.payload.title,
        canGoBack: event.payload.canGoBack,
        canGoForward: event.payload.canGoForward,
        isLoading: false,
      }));
    });

    // Poll for URL changes to detect navigation from page links/redirects
    const pollInterval = setInterval(async () => {
      try {
        const currentUrl = await invoke<string>('get_current_url');
        setState((prev) => {
          // Only update if URL actually changed
          if (currentUrl && currentUrl !== prev.currentUrl && currentUrl !== 'about:blank') {
            // Update history when URL changes from page navigation (links, redirects, etc.)
            invoke('update_history_if_changed', { newUrl: currentUrl }).catch((error) => {
              console.error('Failed to update history:', error);
            });

            return {
              ...prev,
              currentUrl,
              isLoading: false,
              // Don't update canGoBack/canGoForward here - let the event listener handle it
            };
          }
          return prev;
        });
      } catch (error) {
        console.error('Failed to poll current URL:', error);
      }
    }, 500); // Poll every 500ms

    return () => {
      unlisten.then((fn) => fn());
      clearInterval(pollInterval);
    };
  }, []);

  const navigateTo = useCallback(async (url: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      await invoke('navigate_to', { url });
      // Navigation state will be updated by the 'navigation-updated' event
    } catch (error) {
      console.error('Navigation failed:', error);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const goBack = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      await invoke('go_back');
      // Navigation state will be updated by the 'navigation-updated' event
    } catch (error) {
      console.error('Go back failed:', error);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const goForward = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      await invoke('go_forward');
      // Navigation state will be updated by the 'navigation-updated' event
    } catch (error) {
      console.error('Go forward failed:', error);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const reload = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      await invoke('reload');
      // Navigation state will be updated by the 'navigation-updated' event
    } catch (error) {
      console.error('Reload failed:', error);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const goHome = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      await invoke('go_home');
      // Navigation state will be updated by the 'navigation-updated' event
    } catch (error) {
      console.error('Go home failed:', error);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  return [
    state,
    {
      navigateTo,
      goBack,
      goForward,
      reload,
      goHome,
    },
  ];
};
