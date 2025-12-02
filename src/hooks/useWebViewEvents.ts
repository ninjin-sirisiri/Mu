import { useEffect } from 'react';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { updateTab, getActiveTab } from '../store/tabStore';

/**
 * Event payload for page load events from the Rust backend
 */
export type PageLoadEvent = {
  url: string;
  is_loading: boolean;
};

/**
 * Event payload for navigation events from the Rust backend
 */
export type NavigationEvent = {
  url: string;
};

/**
 * Hook to listen for WebView events and update the tab store
 *
 * This hook sets up listeners for:
 * - page_load_started: When a page starts loading (updates URL and sets isLoading=true)
 * - page_load_finished: When a page finishes loading (sets isLoading=false)
 * - navigation: When the URL changes
 *
 * Requirements: 5.1, 5.2, 5.3, 5.5
 */
export function useWebViewEvents(): void {
  useEffect(() => {
    const unlisteners: UnlistenFn[] = [];

    async function setupListeners() {
      // Listen for page load started events
      // Updates the active tab's URL and sets loading state to true
      const unlistenLoadStarted = await listen<PageLoadEvent>('page_load_started', event => {
        const activeTab = getActiveTab();
        if (activeTab) {
          updateTab(activeTab.id, {
            url: event.payload.url,
            isLoading: true
          });
        }
      });
      unlisteners.push(unlistenLoadStarted);

      // Listen for page load finished events
      // Sets loading state to false when page finishes loading
      const unlistenLoadFinished = await listen<PageLoadEvent>('page_load_finished', event => {
        const activeTab = getActiveTab();
        if (activeTab) {
          updateTab(activeTab.id, {
            url: event.payload.url,
            isLoading: false
          });
        }
      });
      unlisteners.push(unlistenLoadFinished);

      // Listen for navigation events (URL changes)
      // Updates the active tab's URL
      const unlistenNavigation = await listen<NavigationEvent>('navigation', event => {
        const activeTab = getActiveTab();
        if (activeTab) {
          updateTab(activeTab.id, {
            url: event.payload.url
          });
        }
      });
      unlisteners.push(unlistenNavigation);

      // Listen for content_navigation events (legacy, for backward compatibility)
      const unlistenContentNavigation = await listen<string>('content_navigation', event => {
        const activeTab = getActiveTab();
        if (activeTab) {
          updateTab(activeTab.id, {
            url: event.payload
          });
        }
      });
      unlisteners.push(unlistenContentNavigation);
    }

    setupListeners();

    // Cleanup listeners on unmount
    return () => {
      for (const unlisten of unlisteners) {
        unlisten();
      }
    };
  }, []);
}

/**
 * Update the active tab's title
 * Called when the page title is obtained (e.g., from document.title)
 *
 * Requirements: 5.2
 */
export function updateActiveTabTitle(title: string): void {
  const activeTab = getActiveTab();
  if (activeTab) {
    updateTab(activeTab.id, { title });
  }
}

/**
 * Update the active tab's favicon
 * Called when a favicon is detected
 *
 * Requirements: 5.3
 */
export function updateActiveTabFavicon(favicon: string | null): void {
  const activeTab = getActiveTab();
  if (activeTab) {
    updateTab(activeTab.id, { favicon });
  }
}

/**
 * Set the active tab's loading state
 *
 * Requirements: 5.5
 */
export function setActiveTabLoading(isLoading: boolean): void {
  const activeTab = getActiveTab();
  if (activeTab) {
    updateTab(activeTab.id, { isLoading });
  }
}
