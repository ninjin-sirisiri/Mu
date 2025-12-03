import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { updateTab, getActiveTab, createTab } from '../store/tabStore';

// Module-level debounce state for create_new_tab event
// This prevents duplicate tab creation in React StrictMode
let lastNewTabUrl = '';
let lastNewTabTime = 0;

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
 * Event payload for page info (title and favicon) from the Rust backend
 */
export type PageInfoEvent = {
  title: string;
  favicon: string | null;
};

/**
 * Hook to listen for WebView events and update the tab store
 *
 * This hook sets up listeners for:
 * - page_load_started: When a page starts loading (updates URL and sets isLoading=true)
 * - page_load_finished: When a page finishes loading (sets isLoading=false)
 * - navigation: When the URL changes
 *
 * @param viewType - The type of view ('topnav' | 'sidebar' | 'dialog' | 'full')
 * Requirements: 5.1, 5.2, 5.3, 5.5
 */
export function useWebViewEvents(viewType?: string): void {
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
        // Fetch page title after page load completes
        setTimeout(() => {
          invoke('fetch_page_title').catch(() => {
            // Silently ignore errors if fetch_page_title fails
          });
        }, 300);
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

      // Listen for page info events (title and favicon)
      // Requirements: 5.2, 5.3
      const unlistenPageInfo = await listen<PageInfoEvent>('page_info', event => {
        const activeTab = getActiveTab();
        if (activeTab) {
          updateTab(activeTab.id, {
            title: event.payload.title || activeTab.title,
            favicon: event.payload.favicon
          });
        }
      });
      unlisteners.push(unlistenPageInfo);

      // Listen for new tab creation events from dialog WebView (sidebar only)
      if (viewType === 'sidebar') {
        const unlistenNewTab = await listen<{ url: string }>('create_new_tab', event => {
          const now = Date.now();
          // Debounce: ignore duplicate events within 500ms for the same URL
          // Uses module-level variables to work across StrictMode double-mount
          if (event.payload.url === lastNewTabUrl && now - lastNewTabTime < 500) {
            return;
          }
          lastNewTabUrl = event.payload.url;
          lastNewTabTime = now;
          createTab(event.payload.url);
        });
        unlisteners.push(unlistenNewTab);
      }
    }

    setupListeners();

    // Cleanup listeners on unmount
    return () => {
      for (const unlisten of unlisteners) {
        unlisten();
      }
    };
  }, [viewType]);
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
