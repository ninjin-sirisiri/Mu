import { useEffect } from 'react';
import { toast } from 'sonner';
import { useStoreValue } from '@simplestack/store/react';
import { invoke } from '@tauri-apps/api/core';
import { NewTabModal } from './components/NewTabModal';
import { Sidebar } from './components/Sidebar';
import { TopNavBar } from './components/TopNavBar';
import { Toaster } from './components/ui/sonner';
import { useWebViewEvents } from './hooks/useWebViewEvents';
import './index.css';
import { tabStore, getActiveTab } from './store/tabStore';

const TRIGGER_LEFT = 16;
const TRIGGER_TOP = 8;
const SIDEBAR_WIDTH = 280;
const TOPNAV_HEIGHT = 56;

// Get view type from URL parameter
function getViewType(): 'topnav' | 'sidebar' | 'dialog' | 'full' {
  const params = new URLSearchParams(globalThis.location.search);
  const view = params.get('view');
  if (view === 'topnav') return 'topnav';
  if (view === 'sidebar') return 'sidebar';
  if (view === 'dialog') return 'dialog';
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

  // Navigate WebView when active tab changes (only in sidebar view which manages tabs)
  // Requirements: 2.1 - Clicking a tab displays its content
  useEffect(() => {
    if (viewType !== 'sidebar') return;

    async function navigateToActiveTab() {
      const activeTab = getActiveTab();
      if (!activeTab) return;

      // Only navigate if the tab has a valid URL (not about:blank for new tabs)
      // The WebView will update the tab's URL via events when navigation completes
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
    return (
      <div className="relative w-full h-screen">
        <Toaster />
        <Sidebar
          position="left"
          mode="auto-hide"
          width={SIDEBAR_WIDTH}
          hideDelay={300}
          triggerZoneWidth={TRIGGER_LEFT}
        />
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

  // Full view (fallback, not used in current architecture)
  return (
    <div className="relative w-full h-screen pointer-events-none">
      <Toaster />
      <TopNavBar
        hideDelay={300}
        triggerZoneHeight={TRIGGER_TOP}
        expandedHeight={TOPNAV_HEIGHT}
      />
      <Sidebar
        position="left"
        mode="auto-hide"
        width={SIDEBAR_WIDTH}
        hideDelay={300}
        triggerZoneWidth={TRIGGER_LEFT}
      />
    </div>
  );
}
