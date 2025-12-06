// Keyboard shortcut handler for content WebView
// This script is injected into external web pages to capture keyboard shortcuts
// and forward them to the Tauri backend for processing.

(function () {
  'use strict';

  // Shortcut definitions matching the frontend useKeyboardShortcuts.ts
  const SHORTCUTS = [
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
   */
  function matchesShortcut(event, shortcut) {
    // Normalize key comparison (case-insensitive for letters)
    const eventKey = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    const shortcutKey = shortcut.key.length === 1 ? shortcut.key.toLowerCase() : shortcut.key;

    if (eventKey !== shortcutKey) {
      return false;
    }

    // Check modifiers - use ctrlKey or metaKey for cross-platform support
    const ctrlOrMeta = event.ctrlKey || event.metaKey;
    const expectCtrl = shortcut.ctrl || false;

    if (expectCtrl !== ctrlOrMeta) {
      return false;
    }

    if ((shortcut.alt || false) !== event.altKey) {
      return false;
    }

    if ((shortcut.shift || false) !== event.shiftKey) {
      return false;
    }

    return true;
  }

  /**
   * Handle keydown events and invoke Tauri command for matching shortcuts
   */
  function handleKeyDown(event) {
    for (const shortcut of SHORTCUTS) {
      if (matchesShortcut(event, shortcut)) {
        event.preventDefault();
        event.stopPropagation();

        // Use Tauri's IPC to invoke the shortcut action
        if (window.__TAURI_INTERNALS__) {
          window.__TAURI_INTERNALS__.invoke('execute_shortcut_action', { action: shortcut.action });
        }
        return;
      }
    }
  }

  // Add listener with capture phase to intercept before page handlers
  document.addEventListener('keydown', handleKeyDown, { capture: true });
})();
