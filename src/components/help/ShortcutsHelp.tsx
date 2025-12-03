import { X, Keyboard } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { invoke } from '@tauri-apps/api/core';

/**
 * Shortcut category type matching Rust enum
 */
type ShortcutCategory = 'navigation' | 'tabs' | 'ui' | 'page';

/**
 * Shortcut info from Rust backend
 */
type ShortcutInfo = {
  key: string;
  description: string;
  category: ShortcutCategory;
};

/**
 * Category display configuration
 */
const categoryConfig: Record<ShortcutCategory, { title: string; order: number }> = {
  navigation: { title: 'Navigation', order: 1 },
  tabs: { title: 'Tabs', order: 2 },
  ui: { title: 'UI', order: 3 },
  page: { title: 'Page', order: 4 }
};

/**
 * Group shortcuts by category
 */
function groupByCategory(shortcuts: ShortcutInfo[]): Map<ShortcutCategory, ShortcutInfo[]> {
  const grouped = new Map<ShortcutCategory, ShortcutInfo[]>();

  for (const shortcut of shortcuts) {
    const existing = grouped.get(shortcut.category) || [];
    existing.push(shortcut);
    grouped.set(shortcut.category, existing);
  }

  return grouped;
}

/**
 * ShortcutsHelp - Keyboard shortcuts help overlay
 * Requirements: 7.1, 7.2
 */
export function ShortcutsHelp() {
  const [shortcuts, setShortcuts] = useState<ShortcutInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load shortcuts on mount
  useEffect(() => {
    async function loadShortcuts() {
      try {
        const list = await invoke<ShortcutInfo[]>('get_shortcut_list');
        setShortcuts(list);
      } catch (error) {
        toast.error(`Failed to load shortcuts: ${String(error)}`);
      } finally {
        setIsLoading(false);
      }
    }

    loadShortcuts();
  }, []);

  const handleClose = useCallback(async () => {
    try {
      await invoke('hide_help');
    } catch (error) {
      toast.error(`Failed to close help: ${String(error)}`);
    }
  }, []);

  // Handle escape key - Requirements: 7.3
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        handleClose();
      }
    }

    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  const groupedShortcuts = groupByCategory(shortcuts);
  const sortedCategories = [...groupedShortcuts.entries()].toSorted(
    ([a], [b]) => categoryConfig[a].order - categoryConfig[b].order
  );

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      onClick={handleClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-2xl mx-4 max-h-[80vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}>
        <div className="bg-gray-900/95 border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700/50 shrink-0">
            <div className="flex items-center gap-2">
              <Keyboard className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-300">Keyboard Shortcuts</span>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="p-1 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-700/50 transition-colors"
              aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 overflow-y-auto">
            {isLoading ? (
              <div className="text-center text-gray-500 py-8">Loading shortcuts...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sortedCategories.map(([category, categoryShortcuts]) => (
                  <div key={category}>
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                      {categoryConfig[category].title}
                    </h3>
                    <div className="space-y-2">
                      {categoryShortcuts.map((shortcut, index) => (
                        <div
                          key={`${shortcut.key}-${index}`}
                          className="flex items-center justify-between py-1.5">
                          <span className="text-sm text-gray-300">{shortcut.description}</span>
                          <kbd className="px-2 py-1 text-xs font-mono bg-gray-800 border border-gray-700 rounded text-gray-400">
                            {shortcut.key}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-gray-700/50 shrink-0">
            <p className="text-xs text-gray-500 text-center">
              Press{' '}
              <kbd className="px-1.5 py-0.5 text-xs font-mono bg-gray-800 border border-gray-700 rounded">
                Esc
              </kbd>{' '}
              to close
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
