import { useEffect, useState } from 'react';

import type { Tab } from '../types';

interface TabItemProps {
  tab: Tab;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
}

export function TabItem({ tab, onSelect, onClose }: TabItemProps) {
  const [faviconError, setFaviconError] = useState(false);

  // ファビコンが変更されたらエラー状態をリセット
  useEffect(() => {
    setFaviconError(false);
  }, [tab.favicon]);

  return (
    <button
      type="button"
      className={`flex w-full items-center gap-2 rounded-md px-4 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${
        tab.isActive
          ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
          : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-900'
      }`}
      onClick={() => onSelect(tab.id)}
    >
      {tab.favicon && !faviconError ? (
        <img
          src={tab.favicon}
          alt=""
          className="h-4 w-4 shrink-0"
          onError={() => setFaviconError(true)}
        />
      ) : (
        <svg
          className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      )}
      <span className="flex-1 truncate">{tab.title}</span>
      <span
        role="button"
        tabIndex={0}
        className={`shrink-0 rounded-md p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
          tab.isActive
            ? 'text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200'
            : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300'
        }`}
        onClick={(e) => {
          e.stopPropagation();
          onClose(tab.id);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            onClose(tab.id);
          }
        }}
        aria-label="タブを閉じる"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </span>
    </button>
  );
}
