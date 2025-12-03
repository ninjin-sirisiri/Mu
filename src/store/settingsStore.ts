import { store } from '@simplestack/store';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { type AdBlockerSettings, DEFAULT_ADBLOCKER_SETTINGS } from '../types/adblocker';

/**
 * Sidebar position setting
 */
export type SidebarPosition = 'left' | 'right';

/**
 * Sidebar display mode setting
 */
export type SidebarMode = 'fixed' | 'auto-hide';

/**
 * Sidebar settings structure (matches Rust SidebarSettings)
 */
export type SidebarSettings = {
  position: SidebarPosition;
  mode: SidebarMode;
};

/**
 * Settings state type
 */
export type SettingsState = {
  sidebar: SidebarSettings;
  adBlocker: AdBlockerSettings;
  isLoading: boolean;
  isSettingsPanelOpen: boolean;
};

/**
 * Default sidebar settings
 * Requirements: 3.3
 */
export const DEFAULT_SIDEBAR_SETTINGS: SidebarSettings = {
  position: 'left',
  mode: 'auto-hide'
};

/**
 * Settings store instance
 */
export const settingsStore = store<SettingsState>({
  sidebar: DEFAULT_SIDEBAR_SETTINGS,
  adBlocker: DEFAULT_ADBLOCKER_SETTINGS,
  isLoading: true,
  isSettingsPanelOpen: false
});

// ============ Error Handling ============

/**
 * Log an error for debugging
 */
function logError(operation: string, error: unknown): void {
  // eslint-disable-next-line no-console
  console.error(`[SettingsStore] Error in ${operation}:`, error);
}

/**
 * Log a warning for debugging
 */
function logWarning(operation: string, message: string): void {
  // eslint-disable-next-line no-console
  console.warn(`[SettingsStore] Warning in ${operation}: ${message}`);
}

// ============ Actions ============

/**
 * Load settings from the backend on startup
 * Requirements: 3.2
 */
export async function loadSettings(): Promise<void> {
  try {
    settingsStore.set(s => ({ ...s, isLoading: true }));

    const settings = await invoke<SidebarSettings>('get_sidebar_settings');

    settingsStore.set(s => ({
      ...s,
      sidebar: settings,
      isLoading: false
    }));
  } catch (error) {
    logError('loadSettings', error);
    logWarning('loadSettings', 'Using default settings');
    settingsStore.set(s => ({
      ...s,
      sidebar: DEFAULT_SIDEBAR_SETTINGS,
      isLoading: false
    }));
  }
}

/**
 * Set sidebar position and save to backend
 * Requirements: 3.1, 4.3
 */
export async function setSidebarPosition(position: SidebarPosition): Promise<void> {
  const previousSettings = settingsStore.get().sidebar;

  // Update store immediately for responsive UI
  settingsStore.set(s => ({
    ...s,
    sidebar: { ...s.sidebar, position }
  }));

  try {
    const newSettings: SidebarSettings = { ...previousSettings, position };
    await invoke('save_sidebar_settings', { settingsData: newSettings });
  } catch (error) {
    logError('setSidebarPosition', error);
    // Revert on failure
    settingsStore.set(s => ({
      ...s,
      sidebar: previousSettings
    }));
  }
}

/**
 * Set sidebar mode and save to backend
 * Requirements: 3.1, 4.3
 */
export async function setSidebarMode(mode: SidebarMode): Promise<void> {
  const previousSettings = settingsStore.get().sidebar;

  // Update store immediately for responsive UI
  settingsStore.set(s => ({
    ...s,
    sidebar: { ...s.sidebar, mode }
  }));

  try {
    const newSettings: SidebarSettings = { ...previousSettings, mode };
    await invoke('save_sidebar_settings', { settingsData: newSettings });
  } catch (error) {
    logError('setSidebarMode', error);
    // Revert on failure
    settingsStore.set(s => ({
      ...s,
      sidebar: previousSettings
    }));
  }
}

/**
 * Open the settings panel
 * Requirements: 4.1
 */
export function openSettingsPanel(): void {
  settingsStore.set(s => ({ ...s, isSettingsPanelOpen: true }));
}

/**
 * Close the settings panel
 * Requirements: 4.4
 */
export function closeSettingsPanel(): void {
  settingsStore.set(s => ({ ...s, isSettingsPanelOpen: false }));
}

/**
 * Reset settings store to initial state (useful for testing)
 */
export function resetSettingsStore(): void {
  settingsStore.set({
    sidebar: DEFAULT_SIDEBAR_SETTINGS,
    adBlocker: DEFAULT_ADBLOCKER_SETTINGS,
    isLoading: true,
    isSettingsPanelOpen: false
  });
}

/**
 * Update settings from external source (e.g., settings WebView)
 */
export function updateSettings(settings: SidebarSettings): void {
  settingsStore.set(s => ({
    ...s,
    sidebar: settings
  }));
}

/**
 * Listen for settings changes from other WebViews
 */
export async function listenForSettingsChanges(): Promise<() => void> {
  const unlisten = await listen<SidebarSettings>('settings_changed', event => {
    updateSettings(event.payload);
  });
  return unlisten;
}

// ============ Ad Blocker Actions ============

/**
 * Load ad blocker settings from the backend
 * Requirements: 2.1, 2.5
 */
export async function loadAdBlockerSettings(): Promise<void> {
  try {
    const settings = await invoke<AdBlockerSettings>('get_adblocker_settings');
    settingsStore.set(s => ({
      ...s,
      adBlocker: settings
    }));
  } catch (error) {
    logError('loadAdBlockerSettings', error);
    logWarning('loadAdBlockerSettings', 'Using default ad blocker settings');
    settingsStore.set(s => ({
      ...s,
      adBlocker: DEFAULT_ADBLOCKER_SETTINGS
    }));
  }
}

/**
 * Set ad blocker enabled state and save to backend
 * Requirements: 2.1, 2.2, 2.4
 */
export async function setAdBlockerEnabled(enabled: boolean): Promise<void> {
  const previousSettings = settingsStore.get().adBlocker;

  // Update store immediately for responsive UI
  settingsStore.set(s => ({
    ...s,
    adBlocker: { ...s.adBlocker, enabled }
  }));

  try {
    await invoke('set_adblocker_enabled', { enabled });
  } catch (error) {
    logError('setAdBlockerEnabled', error);
    // Revert on failure
    settingsStore.set(s => ({
      ...s,
      adBlocker: previousSettings
    }));
  }
}

/**
 * Update ad blocker settings from external source
 */
export function updateAdBlockerSettings(settings: AdBlockerSettings): void {
  settingsStore.set(s => ({
    ...s,
    adBlocker: settings
  }));
}
