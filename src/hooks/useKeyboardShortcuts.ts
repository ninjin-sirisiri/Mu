import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

/**
 * Shortcut definition with action
 */
export type ShortcutDef = {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  action: string;
};

/**
 * List of keyboard shortcuts and their corresponding actions.
 * These are app-scoped shortcuts (only work when the app is focused).
 */
const SHORTCUTS: ShortcutDef[] = [
  // Navigation
  { key: 'ArrowLeft', alt: true, action: 'go_back' },
  { key: 'ArrowRight', alt: true, action: 'go_forward' },
  { key: 'r', ctrl: true, action: 'reload' },
  { key: 'F5', action: 'reload' },
  { key: 'Escape', action: 'stop_loading' },

  // Tabs
  { key: 't', ctrl: true, action: 'new_tab' },
  { key: 'w', ctrl: true, action: 'close_tab' },
  { key: 'Tab', ctrl: true, action: 'next_tab' },
  { key: 'Tab', ctrl: true, shift: true, action: 'previous_tab' },
  { key: '1', ctrl: true, action: 'switch_to_tab_1' },
  { key: '2', ctrl: true, action: 'switch_to_tab_2' },
  { key: '3', ctrl: true, action: 'switch_to_tab_3' },
  { key: '4', ctrl: true, action: 'switch_to_tab_4' },
  { key: '5', ctrl: true, action: 'switch_to_tab_5' },
  { key: '6', ctrl: true, action: 'switch_to_tab_6' },
  { key: '7', ctrl: true, action: 'switch_to_tab_7' },
  { key: '8', ctrl: true, action: 'switch_to_tab_8' },
  { key: '9', ctrl: true, action: 'switch_to_tab_9' },

  // UI
  { key: 'b', ctrl: true, action: 'toggle_sidebar' },
  { key: 'f', ctrl: true, shift: true, action: 'toggle_fullscreen' },
  { key: 'F11', action: 'toggle_fullscreen' },
  { key: 'k', ctrl: true, action: 'open_command_palette' },
  { key: 'l', ctrl: true, action: 'open_command_palette' },
  { key: '/', ctrl: true, action: 'show_help' },
  { key: 'F1', action: 'show_help' },

  // Page
  { key: '=', ctrl: true, action: 'zoom_in' },
  { key: '+', ctrl: true, action: 'zoom_in' },
  { key: '-', ctrl: true, action: 'zoom_out' },
  { key: '0', ctrl: true, action: 'zoom_reset' },
  { key: 'f', ctrl: true, action: 'find_in_page' },

  // Bookmarks
  { key: 'd', ctrl: true, action: 'add_bookmark' },
  { key: 'b', ctrl: true, shift: true, action: 'toggle_bookmark_panel' }
];

/**
 * Check if a keyboard event matches a shortcut definition
 * Exported for testing purposes.
 */
export function matchesShortcut(event: KeyboardEvent, shortcut: ShortcutDef): boolean {
  // Normalize key comparison (case-insensitive for letters)
  const eventKey = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  const shortcutKey = shortcut.key.length === 1 ? shortcut.key.toLowerCase() : shortcut.key;

  if (eventKey !== shortcutKey) {
    return false;
  }

  // Check modifiers - use ctrlKey or metaKey for cross-platform support
  // On macOS, Cmd key sets metaKey; on Windows/Linux, Ctrl sets ctrlKey
  const ctrlOrMeta = event.ctrlKey || event.metaKey;
  const expectCtrl = shortcut.ctrl ?? false;

  if (expectCtrl !== ctrlOrMeta) {
    return false;
  }

  if ((shortcut.alt ?? false) !== event.altKey) {
    return false;
  }

  if ((shortcut.shift ?? false) !== event.shiftKey) {
    return false;
  }

  return true;
}

/**
 * Hook to handle keyboard shortcuts within the app.
 *
 * This replaces global shortcuts with app-scoped shortcuts that only work
 * when the application window is focused.
 */
export function useKeyboardShortcuts(): void {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      // Find matching shortcut
      const matchedShortcut = SHORTCUTS.find(shortcut => matchesShortcut(event, shortcut));

      if (matchedShortcut) {
        event.preventDefault();
        event.stopPropagation();

        invoke('execute_shortcut_action', { action: matchedShortcut.action });
      }
    }

    // Add listener with capture phase to intercept before other handlers
    globalThis.addEventListener('keydown', handleKeyDown, { capture: true });

    return () => {
      globalThis.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, []);
}

/**
 * Get the list of shortcuts.
 * Useful for testing and debugging.
 */
export function getShortcuts(): ShortcutDef[] {
  return [...SHORTCUTS];
}
