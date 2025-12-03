import { describe, it, expect } from 'bun:test';
import { getPreventedShortcuts, wouldPreventDefault } from './useShortcutPrevention';

/**
 * Tests for useShortcutPrevention hook
 *
 * **Feature: keyboard-shortcuts, Property 6: Shortcut prevents default behavior**
 * **Validates: Requirements 6.3**
 */
describe('useShortcutPrevention', () => {
  describe('getPreventedShortcuts', () => {
    it('should return a list of shortcuts to prevent', () => {
      const shortcuts = getPreventedShortcuts();
      expect(shortcuts.length).toBeGreaterThan(0);
    });

    it('should include navigation shortcuts', () => {
      const shortcuts = getPreventedShortcuts();
      const hasGoBack = shortcuts.some(s => s.key === 'ArrowLeft' && s.alt);
      const hasGoForward = shortcuts.some(s => s.key === 'ArrowRight' && s.alt);
      const hasReload = shortcuts.some(s => s.key === 'r' && s.ctrl);

      expect(hasGoBack).toBe(true);
      expect(hasGoForward).toBe(true);
      expect(hasReload).toBe(true);
    });

    it('should include tab shortcuts', () => {
      const shortcuts = getPreventedShortcuts();
      const hasNewTab = shortcuts.some(s => s.key === 't' && s.ctrl);
      const hasCloseTab = shortcuts.some(s => s.key === 'w' && s.ctrl);
      const hasNextTab = shortcuts.some(s => s.key === 'Tab' && s.ctrl && !s.shift);
      const hasPrevTab = shortcuts.some(s => s.key === 'Tab' && s.ctrl && s.shift);

      expect(hasNewTab).toBe(true);
      expect(hasCloseTab).toBe(true);
      expect(hasNextTab).toBe(true);
      expect(hasPrevTab).toBe(true);
    });

    it('should include UI shortcuts', () => {
      const shortcuts = getPreventedShortcuts();
      const hasToggleSidebar = shortcuts.some(s => s.key === 'b' && s.ctrl);
      const hasCommandPalette = shortcuts.some(s => s.key === 'k' && s.ctrl);
      const hasHelp = shortcuts.some(s => s.key === '/' && s.ctrl);

      expect(hasToggleSidebar).toBe(true);
      expect(hasCommandPalette).toBe(true);
      expect(hasHelp).toBe(true);
    });

    it('should include page shortcuts', () => {
      const shortcuts = getPreventedShortcuts();
      const hasZoomIn = shortcuts.some(s => s.key === '=' && s.ctrl);
      const hasZoomOut = shortcuts.some(s => s.key === '-' && s.ctrl);
      const hasZoomReset = shortcuts.some(s => s.key === '0' && s.ctrl);
      const hasFindInPage = shortcuts.some(s => s.key === 'f' && s.ctrl);

      expect(hasZoomIn).toBe(true);
      expect(hasZoomOut).toBe(true);
      expect(hasZoomReset).toBe(true);
      expect(hasFindInPage).toBe(true);
    });
  });

  describe('wouldPreventDefault', () => {
    /**
     * Helper to create a mock KeyboardEvent
     */
    function createKeyboardEvent(
      key: string,
      options: { ctrlKey?: boolean; altKey?: boolean; shiftKey?: boolean; metaKey?: boolean } = {}
    ): KeyboardEvent {
      return {
        key,
        ctrlKey: options.ctrlKey ?? false,
        altKey: options.altKey ?? false,
        shiftKey: options.shiftKey ?? false,
        metaKey: options.metaKey ?? false
      } as KeyboardEvent;
    }

    it('should return true for Ctrl+T (new tab)', () => {
      const event = createKeyboardEvent('t', { ctrlKey: true });
      expect(wouldPreventDefault(event)).toBe(true);
    });

    it('should return true for Ctrl+W (close tab)', () => {
      const event = createKeyboardEvent('w', { ctrlKey: true });
      expect(wouldPreventDefault(event)).toBe(true);
    });

    it('should return true for Ctrl+F (find in page)', () => {
      const event = createKeyboardEvent('f', { ctrlKey: true });
      expect(wouldPreventDefault(event)).toBe(true);
    });

    it('should return true for Ctrl+R (reload)', () => {
      const event = createKeyboardEvent('r', { ctrlKey: true });
      expect(wouldPreventDefault(event)).toBe(true);
    });

    it('should return true for Alt+ArrowLeft (go back)', () => {
      const event = createKeyboardEvent('ArrowLeft', { altKey: true });
      expect(wouldPreventDefault(event)).toBe(true);
    });

    it('should return true for Alt+ArrowRight (go forward)', () => {
      const event = createKeyboardEvent('ArrowRight', { altKey: true });
      expect(wouldPreventDefault(event)).toBe(true);
    });

    it('should return true for F5 (reload)', () => {
      const event = createKeyboardEvent('F5');
      expect(wouldPreventDefault(event)).toBe(true);
    });

    it('should return true for F11 (fullscreen)', () => {
      const event = createKeyboardEvent('F11');
      expect(wouldPreventDefault(event)).toBe(true);
    });

    it('should return true for F1 (help)', () => {
      const event = createKeyboardEvent('F1');
      expect(wouldPreventDefault(event)).toBe(true);
    });

    it('should return true for Ctrl+Tab (next tab)', () => {
      const event = createKeyboardEvent('Tab', { ctrlKey: true });
      expect(wouldPreventDefault(event)).toBe(true);
    });

    it('should return true for Ctrl+Shift+Tab (previous tab)', () => {
      const event = createKeyboardEvent('Tab', { ctrlKey: true, shiftKey: true });
      expect(wouldPreventDefault(event)).toBe(true);
    });

    it('should return true for Ctrl+1 through Ctrl+9 (tab switching)', () => {
      for (let i = 1; i <= 9; i++) {
        const event = createKeyboardEvent(String(i), { ctrlKey: true });
        expect(wouldPreventDefault(event)).toBe(true);
      }
    });

    it('should return false for unregistered shortcuts', () => {
      const event = createKeyboardEvent('a', { ctrlKey: true });
      expect(wouldPreventDefault(event)).toBe(false);
    });

    it('should return false for keys without modifiers that are not registered', () => {
      const event = createKeyboardEvent('a');
      expect(wouldPreventDefault(event)).toBe(false);
    });

    it('should be case-insensitive for letter keys', () => {
      const eventLower = createKeyboardEvent('t', { ctrlKey: true });
      const eventUpper = createKeyboardEvent('T', { ctrlKey: true });

      expect(wouldPreventDefault(eventLower)).toBe(true);
      expect(wouldPreventDefault(eventUpper)).toBe(true);
    });

    it('should handle metaKey (Cmd on macOS) as equivalent to ctrlKey', () => {
      const event = createKeyboardEvent('t', { metaKey: true });
      expect(wouldPreventDefault(event)).toBe(true);
    });
  });
});
