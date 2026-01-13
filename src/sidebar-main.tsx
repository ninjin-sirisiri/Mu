import './App.css';

import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { StrictMode, useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { SidebarContent } from './features/sidebar/components/SidebarContent';
import { useTabState } from './features/tabs';
import type { NavigationControls, WebViewState } from './types';

interface NavigationUpdatePayload {
  url: string;
  canGoBack: boolean;
  canGoForward: boolean;
  title: string;
}

const SIDEBAR_WIDTH = 256;
const PEEK_WIDTH = 8;

function SidebarApp() {
  const [tabs, tabControls] = useTabState();
  const [isExpanded, setIsExpanded] = useState(true);
  const [navState, setNavState] = useState<WebViewState>({
    currentUrl: '',
    title: '',
    isLoading: false,
    canGoBack: false,
    canGoForward: false,
  });

  // ナビゲーション状態の同期
  useEffect(() => {
    const unlisten = listen<NavigationUpdatePayload>('navigation-updated', (event) => {
      setNavState((prev) => ({
        ...prev,
        currentUrl: event.payload.url,
        title: event.payload.title,
        canGoBack: event.payload.canGoBack,
        canGoForward: event.payload.canGoForward,
        isLoading: false,
      }));
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  // タブ作成イベントをリッスンしてタブリストを更新
  useEffect(() => {
    const unlisten = listen<string>('tab-created', async () => {
      // タブが作成されたら、タブリストを再取得
      await tabControls.refreshTabs();
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [tabControls]);

  // タブ更新イベントをリッスンしてタブリストを更新
  useEffect(() => {
    const unlisten = listen('tab-updated', async () => {
      // タブが更新されたら、タブリストを再取得
      await tabControls.refreshTabs();
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [tabControls]);

  // タブ閉じるイベントをリッスンしてタブリストを更新
  useEffect(() => {
    const unlisten = listen('tab-closed', async () => {
      // タブが閉じられたら、タブリストを再取得
      await tabControls.refreshTabs();
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [tabControls]);

  // ナビゲーションコントロール
  const navControls: NavigationControls = {
    navigateTo: async (url: string) => {
      setNavState((prev) => ({ ...prev, isLoading: true }));
      try {
        await invoke('navigate_to', { url });
      } catch (error) {
        console.error('Navigation failed:', error);
        setNavState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    goBack: async () => {
      setNavState((prev) => ({ ...prev, isLoading: true }));
      try {
        await invoke('go_back');
      } catch (error) {
        console.error('Go back failed:', error);
        setNavState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    goForward: async () => {
      setNavState((prev) => ({ ...prev, isLoading: true }));
      try {
        await invoke('go_forward');
      } catch (error) {
        console.error('Go forward failed:', error);
        setNavState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    reload: async () => {
      setNavState((prev) => ({ ...prev, isLoading: true }));
      try {
        await invoke('reload');
      } catch (error) {
        console.error('Reload failed:', error);
        setNavState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    goHome: async () => {
      setNavState((prev) => ({ ...prev, isLoading: true }));
      try {
        await invoke('go_home');
      } catch (error) {
        console.error('Go home failed:', error);
        setNavState((prev) => ({ ...prev, isLoading: false }));
      }
    },
  };

  // サイドバーの状態を取得
  useEffect(() => {
    const checkSidebarState = async () => {
      try {
        const visible = await invoke<boolean>('get_sidebar_visible');
        setIsExpanded(visible);
      } catch (error) {
        console.error('Failed to get sidebar state:', error);
      }
    };

    checkSidebarState();

    // 定期的に状態をチェック（Ctrl+Bなどで外部から変更された場合に対応）
    const interval = setInterval(checkSidebarState, 100);
    return () => clearInterval(interval);
  }, []);

  const handleNewTab = useCallback(async () => {
    try {
      await tabControls.createTab();
    } catch (error) {
      console.error('Failed to create tab:', error);
    }
  }, [tabControls]);

  // ホバー領域にマウスが入った時にサイドバーを開く
  const handleMouseEnter = useCallback(async () => {
    if (!isExpanded) {
      try {
        await invoke('set_sidebar_visible', { visible: true });
        setIsExpanded(true);
      } catch (error) {
        console.error('Failed to expand sidebar:', error);
      }
    }
  }, [isExpanded]);

  // マウスがサイドバーから離れた時にサイドバーを閉じる
  const handleMouseLeave = useCallback(async () => {
    if (isExpanded) {
      try {
        await invoke('set_sidebar_visible', { visible: false });
        setIsExpanded(false);
      } catch (error) {
        console.error('Failed to collapse sidebar:', error);
      }
    }
  }, [isExpanded]);

  return (
    <div
      className="relative h-screen w-full overflow-hidden bg-transparent"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* サイドバー本体 - ナビゲーションメニューと同様のアニメーション */}
      <div
        className="absolute left-0 top-0 h-full border-r border-neutral-300 bg-neutral-200"
        style={{
          width: `${SIDEBAR_WIDTH}px`,
          transform: isExpanded ? 'translateX(0)' : `translateX(-${SIDEBAR_WIDTH - PEEK_WIDTH}px)`,
          opacity: isExpanded ? 1 : 0.5,
          transition: 'transform 200ms ease-out, opacity 200ms ease-out',
        }}
      >
        <SidebarContent
          tabs={tabs}
          tabControls={tabControls}
          onNewTab={handleNewTab}
          navState={navState}
          navControls={navControls}
        />
      </div>
    </div>
  );
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <SidebarApp />
  </StrictMode>
);
