import { Search, Globe, X } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

/**
 * Determine if input is a URL or search query
 */
function isUrl(input: string): boolean {
  const trimmed = input.trim();

  if (/^https?:\/\//i.test(trimmed)) return true;
  if (!trimmed.includes(' ') && /^[\w-]+(\.[\w-]+)+/.test(trimmed)) return true;
  if (/^localhost(:\d+)?/i.test(trimmed)) return true;

  return false;
}

/**
 * Convert input to a proper URL
 */
function toUrl(input: string): string {
  const trimmed = input.trim();

  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (isUrl(trimmed)) return `https://${trimmed}`;

  return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
}

/**
 * Hint text component
 */
function HintText({ input, inputIsUrl }: { input: string; inputIsUrl: boolean }) {
  const trimmed = input.trim();

  if (!trimmed) {
    return <span>Enter a URL or search term</span>;
  }

  if (inputIsUrl) {
    return (
      <span>
        Press Enter to go to <span className="text-gray-400">{toUrl(input)}</span>
      </span>
    );
  }

  return (
    <span>
      Press Enter to search Google for &ldquo;
      <span className="text-gray-400">{trimmed}</span>&rdquo;
    </span>
  );
}

/**
 * NewTabModal - Arc/Zen style centered modal for new tab creation
 * Rendered in its own WebView for proper centering
 */
export function NewTabModal() {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount and when dialog is shown
  useEffect(() => {
    // Initial focus
    setTimeout(() => inputRef.current?.focus(), 50);

    // Listen for dialog_shown event to refocus and reset input
    let unlisten: (() => void) | null = null;
    let mounted = true;

    (async () => {
      const fn = await listen('dialog_shown', () => {
        setInput('');
        setTimeout(() => inputRef.current?.focus(), 50);
      });
      if (mounted) {
        unlisten = fn;
      } else {
        fn();
      }
    })();

    return () => {
      mounted = false;
      unlisten?.();
    };
  }, []);

  const handleClose = useCallback(async () => {
    try {
      await invoke('hide_new_tab_dialog');
    } catch (error) {
      toast.error(`Failed to close dialog: ${String(error)}`);
    }
  }, []);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        handleClose();
      }
    }

    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const trimmed = input.trim();
      if (!trimmed) return;

      const url = toUrl(trimmed);

      try {
        await invoke('navigate_to', { url });
      } catch (error) {
        toast.error(`Failed to navigate: ${String(error)}`);
      }
    },
    [input]
  );

  const inputIsUrl = Boolean(input.trim()) && isUrl(input);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      onClick={handleClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-xl mx-4 animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}>
        <div className="bg-gray-900/95 border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700/50">
            <span className="text-sm font-medium text-gray-300">New Tab</span>
            <button
              type="button"
              onClick={handleClose}
              className="p-1 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-700/50 transition-colors"
              aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="p-4">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                {inputIsUrl ? <Globe className="w-5 h-5" /> : <Search className="w-5 h-5" />}
              </div>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Search or enter URL..."
                className="w-full pl-12 pr-4 py-4 bg-gray-800/50 border border-gray-700/50 rounded-xl text-gray-100 text-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            {/* Hint */}
            <div className="mt-3 px-1 text-xs text-gray-500">
              <HintText
                input={input}
                inputIsUrl={inputIsUrl}
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
