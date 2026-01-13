import { useEffect } from 'react';

export type KeyboardShortcut = {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
};

export const useKeyboard = (shortcuts: KeyboardShortcut[]) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const matchesKey = event.key === shortcut.key;
        // 指定された修飾キーは押されている必要がある
        // 指定されていない修飾キーは押されていてはいけない
        const matchesCtrl = !!shortcut.ctrl === event.ctrlKey;
        const matchesShift = !!shortcut.shift === event.shiftKey;
        const matchesAlt = !!shortcut.alt === event.altKey;
        const matchesMeta = !!shortcut.meta === event.metaKey;

        if (matchesKey && matchesCtrl && matchesShift && matchesAlt && matchesMeta) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};
