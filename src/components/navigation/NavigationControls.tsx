import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  X,
  Minus,
  Square,
  Bookmark,
  BookmarkCheck
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useStoreValue } from '@simplestack/store/react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { addBookmark, deleteBookmark, bookmarkStore } from '../../store/bookmarkStore';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

async function showToast(
  message: string,
  type: 'success' | 'error' | 'info' | 'warning' = 'success'
) {
  try {
    await invoke('show_toast', { message, toastType: type });
  } catch {
    // Silently ignore if toast webview is not available
  }
}

function isValidUrl(input: string): boolean {
  const urlPattern = /^(https?:\/\/|www\.)|^[a-zA-Z0-9][-a-zA-Z0-9]*(\.[a-zA-Z]{2,})+/;
  return urlPattern.test(input.trim());
}

function formatUrl(input: string): string {
  const trimmed = input.trim();

  if (isValidUrl(trimmed)) {
    if (!/^https?:\/\//i.test(trimmed)) {
      return `https://${trimmed}`;
    }
    return trimmed;
  }

  const searchQuery = encodeURIComponent(trimmed);
  return `https://www.google.com/search?q=${searchQuery}`;
}

type PageInfoEvent = {
  title: string;
  favicon: string | null;
};

export function NavigationControls() {
  const [url, setUrl] = useState('');
  const [pageTitle, setPageTitle] = useState('');
  const [pageFavicon, setPageFavicon] = useState<string | null>(null);
  const appWindow = getCurrentWindow();
  const bookmarkState = useStoreValue(bookmarkStore);

  // Check if current URL is bookmarked and get the bookmark if it exists
  const currentBookmark = bookmarkState.bookmarks.find(b => b.url === url);
  const isBookmarked = !!currentBookmark;

  useEffect(() => {
    let unlistenNav: (() => void) | undefined;
    let unlistenTitle: (() => void) | undefined;
    let unlistenPageInfo: (() => void) | undefined;
    (async () => {
      unlistenNav = await listen<{ url: string }>('navigation', event => {
        setUrl(event.payload.url);
        // Reset page info when navigating to a new page
        setPageTitle('');
        setPageFavicon(null);
      });
      unlistenTitle = await listen<string>('content_title_changed', event => {
        setPageTitle(event.payload);
      });
      unlistenPageInfo = await listen<PageInfoEvent>('page_info', event => {
        setPageTitle(event.payload.title);
        setPageFavicon(event.payload.favicon);
      });
    })();

    return () => {
      if (unlistenNav) {
        unlistenNav();
      }
      if (unlistenTitle) {
        unlistenTitle();
      }
      if (unlistenPageInfo) {
        unlistenPageInfo();
      }
    };
  }, []);

  /**
   * Handle toggling bookmark for current page
   * Requirements: 1.1, 1.4
   */
  const handleToggleBookmark = useCallback(async () => {
    if (!url) return;
    if (currentBookmark) {
      const success = await deleteBookmark(currentBookmark.id);
      if (success) {
        showToast('Bookmark removed', 'error');
      }
    } else {
      const title = pageTitle || url;
      const bookmark = await addBookmark(url, title, pageFavicon ?? undefined);
      if (bookmark) {
        showToast('Bookmark added', 'success');
      }
    }
  }, [url, pageTitle, pageFavicon, currentBookmark]);

  // Listen for add-bookmark shortcut event (Ctrl+D)
  // Requirements: 8.1
  useEffect(() => {
    function handleBookmarkShortcut() {
      handleToggleBookmark();
    }

    globalThis.addEventListener('add-bookmark', handleBookmarkShortcut);
    return () => {
      globalThis.removeEventListener('add-bookmark', handleBookmarkShortcut);
    };
  }, [handleToggleBookmark]);

  async function handleBack() {
    await invoke('go_back');
  }

  async function handleForward() {
    await invoke('go_forward');
  }

  async function handleRefresh() {
    await invoke('reload');
  }

  async function handleNavigate(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      const input = e.currentTarget;
      const navigateUrl = formatUrl(url);
      await invoke('navigate', { url: navigateUrl });
      input.blur();
    }
  }

  async function handleMinimize() {
    await appWindow.minimize();
  }

  async function handleMaximize() {
    await appWindow.toggleMaximize();
  }

  async function handleClose() {
    await appWindow.close();
  }

  return (
    <div
      data-tauri-drag-region
      className="flex items-center gap-2 px-4 py-3.5 text-white w-full">
      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="text-gray-400 hover:text-gray-100 hover:bg-gray-700/50">
          <ArrowLeft size={18} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleForward}
          className="text-gray-400 hover:text-gray-100 hover:bg-gray-700/50">
          <ArrowRight size={18} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          className="text-gray-400 hover:text-gray-100 hover:bg-gray-700/50">
          <RotateCw size={18} />
        </Button>
        {/* Toggle Bookmark button - Requirements: 1.1, 1.4 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggleBookmark}
          disabled={!url}
          className={`transition-colors ${
            isBookmarked
              ? 'text-yellow-400 hover:text-yellow-300 hover:bg-gray-700/50'
              : 'text-gray-400 hover:text-gray-100 hover:bg-gray-700/50'
          }`}
          title={isBookmarked ? 'Remove bookmark (Ctrl+D)' : 'Add bookmark (Ctrl+D)'}
          aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
          data-testid="toggle-bookmark-button">
          {isBookmarked ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
        </Button>
      </div>

      <div className="flex-1 min-w-0">
        <Input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={handleNavigate}
          placeholder="Search or enter address"
          className="bg-gray-800/50 border-gray-700/50 text-gray-200 placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-blue-500/20"
        />
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleMinimize}
          className="text-gray-400 hover:text-gray-100 hover:bg-gray-700/50">
          <Minus size={18} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleMaximize}
          className="text-gray-400 hover:text-gray-100 hover:bg-gray-700/50">
          <Square size={18} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-100 hover:bg-red-600/80">
          <X size={18} />
        </Button>
      </div>
    </div>
  );
}
