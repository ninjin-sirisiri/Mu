import { store } from '@simplestack/store';
import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';

/**
 * Shortcut state type
 * Requirements: 4.1, 7.1
 */
export type ShortcutState = {
  isHelpVisible: boolean;
  isSidebarVisible: boolean;
  zoomLevel: number;
};

/**
 * Initial shortcut state
 */
const initialState: ShortcutState = {
  isHelpVisible: false,
  isSidebarVisible: true, // Sidebar starts visible
  zoomLevel: 1 // 100% zoom
};

/**
 * Shortcut store using @simplestack/store
 * Tracks UI state related to keyboard shortcuts
 * Requirements: 4.1, 7.1
 */
export const shortcutStore = store(initialState);

// ============ Actions ============

/**
 * Toggle help overlay visibility
 * Requirements: 7.1
 */
export function toggleHelpVisibility(): void {
  shortcutStore.set(state => ({
    ...state,
    isHelpVisible: !state.isHelpVisible
  }));
}

/**
 * Set help overlay visibility
 * Requirements: 7.1
 */
export function setHelpVisible(visible: boolean): void {
  shortcutStore.set(state => ({
    ...state,
    isHelpVisible: visible
  }));
}

/**
 * Show help overlay
 * Requirements: 7.1
 */
export async function showHelp(): Promise<void> {
  try {
    await invoke('show_help');
    setHelpVisible(true);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to show help:', error);
  }
}

/**
 * Hide help overlay
 * Requirements: 7.3
 */
export async function hideHelp(): Promise<void> {
  try {
    await invoke('hide_help');
    setHelpVisible(false);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to hide help:', error);
  }
}

/**
 * Toggle sidebar visibility
 * Requirements: 4.1
 */
export function toggleSidebarVisibility(): void {
  shortcutStore.set(state => ({
    ...state,
    isSidebarVisible: !state.isSidebarVisible
  }));
}

/**
 * Set sidebar visibility
 * Requirements: 4.1
 */
export function setSidebarVisible(visible: boolean): void {
  shortcutStore.set(state => ({
    ...state,
    isSidebarVisible: visible
  }));
}

/**
 * Toggle sidebar via Rust command
 * Requirements: 4.1
 */
export async function toggleSidebar(): Promise<boolean> {
  try {
    const newVisible = await invoke<boolean>('toggle_sidebar');
    setSidebarVisible(newVisible);
    return newVisible;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to toggle sidebar:', error);
    // Fallback: toggle locally
    toggleSidebarVisibility();
    return shortcutStore.get().isSidebarVisible;
  }
}

/**
 * Set zoom level
 */
export function setZoomLevel(level: number): void {
  shortcutStore.set(state => ({
    ...state,
    zoomLevel: level
  }));
}

// ============ Selectors ============

/**
 * Get current help visibility state
 */
export function getHelpVisible(): boolean {
  return shortcutStore.get().isHelpVisible;
}

/**
 * Get current sidebar visibility state
 */
export function getSidebarVisible(): boolean {
  return shortcutStore.get().isSidebarVisible;
}

/**
 * Get current zoom level
 */
export function getZoomLevel(): number {
  return shortcutStore.get().zoomLevel;
}

// ============ Event Listeners ============

/**
 * Set up listeners for shortcut-related events from Rust
 * Returns an unlisten function to clean up listeners
 * Requirements: 4.1, 7.1
 */
export async function setupShortcutEventListeners(): Promise<UnlistenFn> {
  const unlisteners: UnlistenFn[] = [];

  // Listen for sidebar toggle events
  const unlistenSidebarToggled = await listen<boolean>('sidebar_toggled', event => {
    setSidebarVisible(event.payload);
  });
  unlisteners.push(unlistenSidebarToggled);

  // Listen for zoom change events
  const unlistenZoomChanged = await listen<number>('zoom_changed', event => {
    setZoomLevel(event.payload);
  });
  unlisteners.push(unlistenZoomChanged);

  // Return combined unlisten function
  return () => {
    for (const unlisten of unlisteners) {
      unlisten();
    }
  };
}

/**
 * Reset the store to initial state (useful for testing)
 */
export function resetShortcutStore(): void {
  shortcutStore.set(initialState);
}
