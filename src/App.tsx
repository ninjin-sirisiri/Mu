import { useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useStoreValue } from '@simplestack/store/react';
import { invoke } from '@tauri-apps/api/core';
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
const ANIMATION_DURATION = 300;

// Easing function for smooth animation
function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

// Animate content bounds change
function animateContentBounds(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  onUpdate: (x: number, y: number) => void
) {
  const startTime = performance.now();
  const duration = ANIMATION_DURATION;

  function animate() {
    const elapsed = performance.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutCubic(progress);

    const currentX = fromX + (toX - fromX) * eased;
    const currentY = fromY + (toY - fromY) * eased;

    onUpdate(currentX, currentY);

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }

  requestAnimationFrame(animate);
}

/**
 * Main App component with integrated tab system
 *
 * The app uses a sidebar-based tab management system that replaces
 * the previous top header navigation. The sidebar can be configured
 * to auto-hide or remain fixed.
 *
 * Requirements: 2.1, 8.1, 8.2
 */
export default function App() {
  // Set up WebView event listeners to update tab state
  // Requirements: 5.1, 5.2, 5.3, 5.5
  useWebViewEvents();

  // Subscribe to tab store to react to active tab changes
  const tabState = useStoreValue(tabStore);
  const activeTabId = tabState?.activeTabId ?? null;

  // Navigate WebView when active tab changes
  // Requirements: 2.1 - Clicking a tab displays its content
  useEffect(() => {
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
  }, [activeTabId]);

  // Track UI visibility state
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [topNavVisible, setTopNavVisible] = useState(false);

  // Track current bounds for animation
  const currentBoundsRef = useRef({ x: TRIGGER_LEFT, y: TRIGGER_TOP });

  // Update content WebView bounds with animation when UI visibility changes
  useEffect(() => {
    const targetX = sidebarVisible ? SIDEBAR_WIDTH : TRIGGER_LEFT;
    // Always keep TRIGGER_TOP space for the trigger zone when nav is hidden
    const targetY = topNavVisible ? TOPNAV_HEIGHT : TRIGGER_TOP;
    const fromX = currentBoundsRef.current.x;
    const fromY = currentBoundsRef.current.y;

    // Skip animation if no change
    if (fromX === targetX && fromY === targetY) return;

    animateContentBounds(fromX, fromY, targetX, targetY, (x, y) => {
      currentBoundsRef.current = { x, y };
      const width = window.innerWidth - x;
      const height = window.innerHeight - y;
      invoke('set_content_bounds', { x, y, width, height });
    });
  }, [sidebarVisible, topNavVisible]);

  // Also update on window resize
  useEffect(() => {
    function handleResize() {
      const x = sidebarVisible ? SIDEBAR_WIDTH : TRIGGER_LEFT;
      // Always keep TRIGGER_TOP space for the trigger zone when nav is hidden
      const y = topNavVisible ? TOPNAV_HEIGHT : TRIGGER_TOP;
      const width = window.innerWidth - x;
      const height = window.innerHeight - y;
      invoke('set_content_bounds', { x, y, width, height });
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarVisible, topNavVisible]);

  const handleSidebarVisibilityChange = useCallback((visible: boolean) => {
    setSidebarVisible(visible);
  }, []);

  const handleTopNavVisibilityChange = useCallback((visible: boolean) => {
    setTopNavVisible(visible);
  }, []);

  return (
    <div className="relative w-full h-screen">
      <Toaster />

      {/* Top navigation bar - auto-hide mode */}
      <TopNavBar
        hideDelay={300}
        triggerZoneHeight={TRIGGER_TOP}
        onVisibilityChange={handleTopNavVisibilityChange}
      />

      {/* Sidebar with tab list - auto-hide mode by default */}
      {/* Requirements: 8.1, 8.2, 8.4 */}
      <Sidebar
        position="left"
        mode="auto-hide"
        width={SIDEBAR_WIDTH}
        hideDelay={300}
        triggerZoneWidth={TRIGGER_LEFT}
        onVisibilityChange={handleSidebarVisibilityChange}
      />
    </div>
  );
}
