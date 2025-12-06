import { describe, expect, it } from 'bun:test';
import { getShortcuts, matchesShortcut, type ShortcutDef } from './useKeyboardShortcuts';

/**
 * Create a mock KeyboardEvent for testing
 */
function createKeyboardEvent(options: {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
}): KeyboardEvent {
  return {
    key: options.key,
    ctrlKey: options.ctrlKey ?? false,
    altKey: options.altKey ?? false,
    shiftKey: options.shiftKey ?? false,
    metaKey: options.metaKey ?? false
  } as KeyboardEvent;
}

describe('useKeyboardShortcuts', () => {
  describe('getShortcuts', () => {
    it('should return all registered shortcuts', () => {
      const shortcuts = getShortcuts();
      expect(shortcuts.length).toBeGreaterThan(0);
    });

    it('should include navigation shortcuts', () => {
      const shortcuts = getShortcuts();
      const actions = shortcuts.map(s => s.action);
      expect(actions).toContain('go_back');
      expect(actions).toContain('go_forward');
      expect(actions).toContain('reload');
      expect(actions).toContain('stop_loading');
    });

    it('should include tab shortcuts', () => {
      const shortcuts = getShortcuts();
      const actions = shortcuts.map(s => s.action);
      expect(actions).toContain('new_tab');
      expect(actions).toContain('close_tab');
      expect(actions).toContain('next_tab');
      expect(actions).toContain('previous_tab');
    });

    it('should include tab switch shortcuts 1-9', () => {
      const shortcuts = getShortcuts();
      const actions = shortcuts.map(s => s.action);
      for (let i = 1; i <= 9; i++) {
        expect(actions).toContain(`switch_to_tab_${i}`);
      }
    });

    it('should include UI shortcuts', () => {
      const shortcuts = getShortcuts();
      const actions = shortcuts.map(s => s.action);
      expect(actions).toContain('toggle_sidebar');
      expect(actions).toContain('toggle_fullscreen');
      expect(actions).toContain('open_command_palette');
      expect(actions).toContain('show_help');
    });

    it('should include page shortcuts', () => {
      const shortcuts = getShortcuts();
      const actions = shortcuts.map(s => s.action);
      expect(actions).toContain('zoom_in');
      expect(actions).toContain('zoom_out');
      expect(actions).toContain('zoom_reset');
      expect(actions).toContain('find_in_page');
    });

    it('should include bookmark shortcuts', () => {
      const shortcuts = getShortcuts();
      const actions = shortcuts.map(s => s.action);
      expect(actions).toContain('add_bookmark');
      expect(actions).toContain('toggle_bookmark_panel');
    });
  });

  describe('matchesShortcut', () => {
    it('should match simple key without modifiers', () => {
      const shortcut: ShortcutDef = { key: 'F5', action: 'reload' };
      const event = createKeyboardEvent({ key: 'F5' });
      expect(matchesShortcut(event, shortcut)).toBe(true);
    });

    it('should not match when key differs', () => {
      const shortcut: ShortcutDef = { key: 'F5', action: 'reload' };
      const event = createKeyboardEvent({ key: 'F6' });
      expect(matchesShortcut(event, shortcut)).toBe(false);
    });

    it('should match Ctrl+key shortcut', () => {
      const shortcut: ShortcutDef = { key: 'r', ctrl: true, action: 'reload' };
      const event = createKeyboardEvent({ key: 'r', ctrlKey: true });
      expect(matchesShortcut(event, shortcut)).toBe(true);
    });

    it('should match Meta+key shortcut (macOS Cmd)', () => {
      const shortcut: ShortcutDef = { key: 'r', ctrl: true, action: 'reload' };
      const event = createKeyboardEvent({ key: 'r', metaKey: true });
      expect(matchesShortcut(event, shortcut)).toBe(true);
    });

    it('should not match when Ctrl is expected but not pressed', () => {
      const shortcut: ShortcutDef = { key: 'r', ctrl: true, action: 'reload' };
      const event = createKeyboardEvent({ key: 'r' });
      expect(matchesShortcut(event, shortcut)).toBe(false);
    });

    it('should match Alt+key shortcut', () => {
      const shortcut: ShortcutDef = { key: 'ArrowLeft', alt: true, action: 'go_back' };
      const event = createKeyboardEvent({ key: 'ArrowLeft', altKey: true });
      expect(matchesShortcut(event, shortcut)).toBe(true);
    });

    it('should not match when Alt is expected but not pressed', () => {
      const shortcut: ShortcutDef = { key: 'ArrowLeft', alt: true, action: 'go_back' };
      const event = createKeyboardEvent({ key: 'ArrowLeft' });
      expect(matchesShortcut(event, shortcut)).toBe(false);
    });

    it('should match Ctrl+Shift+key shortcut', () => {
      const shortcut: ShortcutDef = { key: 'Tab', ctrl: true, shift: true, action: 'previous_tab' };
      const event = createKeyboardEvent({ key: 'Tab', ctrlKey: true, shiftKey: true });
      expect(matchesShortcut(event, shortcut)).toBe(true);
    });

    it('should not match Ctrl+Shift when only Ctrl is pressed', () => {
      const shortcut: ShortcutDef = { key: 'Tab', ctrl: true, shift: true, action: 'previous_tab' };
      const event = createKeyboardEvent({ key: 'Tab', ctrlKey: true });
      expect(matchesShortcut(event, shortcut)).toBe(false);
    });

    it('should be case-insensitive for letter keys', () => {
      const shortcut: ShortcutDef = { key: 'r', ctrl: true, action: 'reload' };
      const event = createKeyboardEvent({ key: 'R', ctrlKey: true });
      expect(matchesShortcut(event, shortcut)).toBe(true);
    });

    it('should not match when extra modifiers are pressed', () => {
      const shortcut: ShortcutDef = { key: 'r', ctrl: true, action: 'reload' };
      const event = createKeyboardEvent({ key: 'r', ctrlKey: true, shiftKey: true });
      expect(matchesShortcut(event, shortcut)).toBe(false);
    });
  });
});
