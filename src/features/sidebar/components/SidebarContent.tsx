import { invoke } from '@tauri-apps/api/core';
import { useCallback } from 'react';

import type { Tab, TabControls } from '../../tabs';
import { TabList } from '../../tabs/components/TabList';
import type { NavigationControls, WebViewState } from '../../../types';

interface SidebarContentProps {
  tabs: Tab[];
  tabControls: TabControls;
  onNewTab: () => void;
  navState?: WebViewState;
  navControls?: NavigationControls;
}

export function SidebarContent({
  tabs,
  tabControls,
  onNewTab,
  navState,
  navControls,
}: SidebarContentProps) {
  const handleToggleSidebar = useCallback(async () => {
    try {
      await invoke('toggle_sidebar');
    } catch (error) {
      console.error('Failed to toggle sidebar:', error);
    }
  }, []);

  const iconButtonClass =
    'rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-300';

  return (
    <div className="flex h-full flex-col">
      {/* ヘッダー */}
      <div className="flex items-center justify-between border-b border-gray-200 px-2 py-2 dark:border-gray-800">
        {/* 左側: ナビゲーションボタン */}
        <div className="flex items-center gap-1">
          {navState && navControls && (
            <>
              <button
                type="button"
                onClick={navControls.goBack}
                disabled={!navState.canGoBack}
                className={iconButtonClass}
                aria-label="戻る"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={navControls.goForward}
                disabled={!navState.canGoForward}
                className={iconButtonClass}
                aria-label="進む"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={navControls.reload}
                disabled={navState.isLoading}
                className={iconButtonClass}
                aria-label="リロード"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={navControls.goHome}
                className={iconButtonClass}
                aria-label="ホーム"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
              </button>
            </>
          )}
        </div>
        {/* 右側: サイドバー閉じる + 新規タブ */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onNewTab}
            className={iconButtonClass}
            aria-label="新しいタブ"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleToggleSidebar}
            className={iconButtonClass}
            aria-label="サイドバーを閉じる"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* タブリスト */}
      <div className="flex-1 overflow-y-auto">
        <TabList tabs={tabs} onSelect={tabControls.switchTab} onClose={tabControls.closeTab} />
      </div>
    </div>
  );
}
