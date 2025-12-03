import { useEffect } from 'react';
import { toast } from 'sonner';
import { useStoreValue } from '@simplestack/store/react';
import { invoke } from '@tauri-apps/api/core';
import { NewTabModal } from './components/dialog';
import { TopNavBar } from './components/navigation';
import { SettingsView } from './components/settings';
import { ConnectedSidebar } from './components/sidebar';
import { Toaster } from './components/ui/sonner';
import { useWebViewEvents } from './hooks/useWebViewEvents';
import './index.css';
import { settingsStore, loadSettings, listenForSettingsChanges } from './store/settingsStore';
import { tabStore, getActiveTab } from './store/tabStore';

const TRIGGER_TOP = 8;
const TOPNAV_HEIGHT = 56;

// Get view type from URL parameter
function getViewType(): 'topnav' | 'sidebar' | 'dialog' | 'settings' | 'full' {
  const params = new URLSearchParams(globalThis.location.search);
  const view = params.get('view');
  if (view === 'topnav') return 'topnav';
  if (view === 'sidebar') return 'sidebar';
  if (view === 'dialog') return 'dialog';
  if (view === 'settings') return 'settings';
  return 'full';
}

/**
 * Main App component with integrated tab system
 *
 * The app uses separate WebViews for top navigation and sidebar.
 * Each WebView only covers its own area, allowing the content WebView
 * to receive mouse events in uncovered areas.
 *
 * Requirements: 2.1, 8.1, 8.2
 */
export default function App() {
  const viewType = getViewType();

  // Set up WebView event listeners to update tab state
  // Requirements: 5.1, 5.2, 5.3, 5.5
  useWebViewEvents(viewType);

  // Subscribe to tab store to react to active tab changes
  const tabState = useStoreValue(tabStore);
  const activeTabId = tabState?.activeTabId ?? null;

  // Subscribe to settings store for loading state
  // Requirements: 3.2
  const settingsState = useStoreValue(settingsStore);
  const isSettingsLoading = settingsState?.isLoading ?? true;

  // Load settings on app startup (only for sidebar view which uses settings)
  // Requirements: 3.2
  useEffect(() => {
    if (viewType !== 'sidebar') return;

    loadSettings();

    // Listen for settings changes from settings WebView
    let unlisten: (() => void) | null = null;
    let mounted = true;

    (async () => {
      const fn = await listenForSettingsChanges();
      if (mounted) {
        unlisten = fn;
      } else {
        fn();
      }
    })();

    return () => {
      mounted = false;
      unlisten?.();
    };
  }, [viewType]);

  // Navigate WebView when active tab changes (only in sidebar view which manages tabs)
  // Requirements: 2.1 - Clicking a tab displays its content
  useEffect(() => {
    if (viewType !== 'sidebar') return;

    async function navigateToActiveTab() {
      const activeTab = getActiveTab();
      if (!activeTab) return;

      // Only navigate if the tab has a valid URL (not about:blank for new tabs)
      if (activeTab.url && activeTab.url !== 'about:blank') {
        try {
          await invoke('switch_tab', { url: activeTab.url });
        } catch (error) {
          toast.error(`Failed to switch tab: ${String(error)}`);
        }
      }
    }

    navigateToActiveTab();
  }, [activeTabId, viewType]);

  // Render only the requested view
  if (viewType === 'topnav') {
    return (
      <div className="relative w-full h-screen">
        <Toaster />
        <TopNavBar
          hideDelay={300}
          triggerZoneHeight={TRIGGER_TOP}
          expandedHeight={TOPNAV_HEIGHT}
        />
      </div>
    );
  }

  if (viewType === 'sidebar') {
    // Show loading state while settings are being loaded
    // Requirements: 3.2
    if (isSettingsLoading) {
      return (
        <div className="relative w-full h-screen bg-gray-900">
          <Toaster />
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500 text-sm">Loading...</div>
          </div>
        </div>
      );
    }

    // Use ConnectedSidebar which reads settings from the store
    // Requirements: 4.3
    return (
      <div className="relative w-full h-screen">
        <Toaster />
        <ConnectedSidebar />
      </div>
    );
  }

  if (viewType === 'dialog') {
    return (
      <div className="relative w-full h-screen">
        <Toaster />
        <NewTabModal />
      </div>
    );
  }

  if (viewType === 'settings') {
    return (
      <div className="relative w-full h-screen">
        <Toaster />
        <SettingsView />
      </div>
    );
  }

  // Full view (fallback, not used in current architecture)
  return (
    <div className="relative w-full h-screen pointer-events-none">
      <Toaster />
      <TopNavBar
        hideDelay={300}
        triggerZoneHeight={TRIGGER_TOP}
        expandedHeight={TOPNAV_HEIGHT}
      />
      <ConnectedSidebar />
    </div>
  );
}
