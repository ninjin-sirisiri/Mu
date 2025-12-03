import { useEffect } from 'react';

/**
 * Shortcut definition for prevention
 */
type ShortcutDef = {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
};

/**
 * List of shortcuts that should have their default browser behavior prevented.
 * These match the shortcuts registered in the Rust backend.
 *
 * Requirements: 6.3 - WHEN a shortcut is triggered THEN Mu SHALL prevent the default browser behavior
 */
const SHORTCUTS_TO_PREVENT: ShortcutDef[] = [
  // Navigation
  { key: 'ArrowLeft', alt: true }, // Go back
  { key: 'ArrowRight', alt: true }, // Go forward
  { key: 'r', ctrl: true }, // Reload
  { key: 'F5' }, // Reload
  // Note: Escape is not prevented as it may be needed for other UI interactions

  // Tabs
  { key: 't', ctrl: true }, // New tab
  { key: 'w', ctrl: true }, // Close tab
  { key: 'Tab', ctrl: true }, // Next tab
  { key: 'Tab', ctrl: true, shift: true }, // Previous tab
  { key: '1', ctrl: true }, // Switch to tab 1
  { key: '2', ctrl: true }, // Switch to tab 2
  { key: '3', ctrl: true }, // Switch to tab 3
  { key: '4', ctrl: true }, // Switch to tab 4
  { key: '5', ctrl: true }, // Switch to tab 5
  { key: '6', ctrl: true }, // Switch to tab 6
  { key: '7', ctrl: true }, // Switch to tab 7
  { key: '8', ctrl: true }, // Switch to tab 8
  { key: '9', ctrl: true }, // Switch to tab 9

  // UI
  { key: 'b', ctrl: true }, // Toggle sidebar
  { key: 'f', ctrl: true, shift: true }, // Toggle fullscreen
  { key: 'F11' }, // Toggle fullscreen
  { key: 'k', ctrl: true }, // Command palette
  { key: 'l', ctrl: true }, // Command palette
  { key: '/', ctrl: true }, // Show help
  { key: 'F1' }, // Show help

  // Page
  { key: '=', ctrl: true }, // Zoom in
  { key: '+', ctrl: true }, // Zoom in (numpad)
  { key: '-', ctrl: true }, // Zoom out
  { key: '0', ctrl: true }, // Zoom reset
  { key: 'f', ctrl: true } // Find in page
];

/**
 * Check if a keyboard event matches a shortcut definition
 */
function matchesShortcut(event: KeyboardEvent, shortcut: ShortcutDef): boolean {
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
 * Hook to prevent default browser behavior for registered shortcuts.
 *
 * This hook adds a keydown event listener that intercepts keyboard events
 * matching our registered shortcuts and calls preventDefault() to stop
 * the browser's default handling (e.g., Ctrl+F opening native find dialog).
 *
 * The actual shortcut actions are handled by Tauri's global shortcut plugin
 * at the OS level, so this hook only needs to prevent defaults.
 *
 * Requirements: 6.3 - WHEN a shortcut is triggered THEN Mu SHALL prevent
 * the default browser behavior for that key combination
 */
export function useShortcutPrevention(): void {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      // Check if this event matches any of our registered shortcuts
      for (const shortcut of SHORTCUTS_TO_PREVENT) {
        if (matchesShortcut(event, shortcut)) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
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
 * Get the list of shortcuts that are being prevented.
 * Useful for testing and debugging.
 */
export function getPreventedShortcuts(): ShortcutDef[] {
  return [...SHORTCUTS_TO_PREVENT];
}

/**
 * Check if a keyboard event would be prevented by this hook.
 * Useful for testing.
 */
export function wouldPreventDefault(event: KeyboardEvent): boolean {
  return SHORTCUTS_TO_PREVENT.some(shortcut => matchesShortcut(event, shortcut));
}
