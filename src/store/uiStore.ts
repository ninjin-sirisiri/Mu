import { invoke } from '@tauri-apps/api/core';

/**
 * Opens the new tab dialog WebView
 */
export async function openNewTabModal(): Promise<void> {
  try {
    await invoke('show_new_tab_dialog');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to open new tab dialog:', error);
  }
}

/**
 * Closes the new tab dialog WebView
 */
export async function closeNewTabModal(): Promise<void> {
  try {
    await invoke('hide_new_tab_dialog');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to close new tab dialog:', error);
  }
}
