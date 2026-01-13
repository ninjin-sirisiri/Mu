import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { useCallback, useEffect, useState } from 'react';

import type { Tab, TabControls } from '../types';

export const useTabState = (): [Tab[], TabControls] => {
  const [tabs, setTabs] = useState<Tab[]>([]);

  const refreshTabs = useCallback(async () => {
    const allTabs = await invoke<Tab[]>('get_all_tabs');
    setTabs(allTabs);
  }, []);

  const createTab = useCallback(
    async (url = 'https://google.com') => {
      const tabId = await invoke<string>('create_tab', { url });
      await refreshTabs();
      return tabId;
    },
    [refreshTabs]
  );

  const closeTab = useCallback(
    async (id: string) => {
      await invoke('close_tab', { id });
      await refreshTabs();
    },
    [refreshTabs]
  );

  const switchTab = useCallback(
    async (id: string) => {
      console.log('switchTab called with id:', id);
      try {
        await invoke('switch_tab', { id });
        console.log('switch_tab command succeeded');
        await refreshTabs();
        console.log('refreshTabs completed');
      } catch (error) {
        console.error('Failed to switch tab:', error);
      }
    },
    [refreshTabs]
  );

  const getAllTabs = useCallback(async () => {
    return await invoke<Tab[]>('get_all_tabs');
  }, []);

  useEffect(() => {
    refreshTabs();

    // タブ更新イベントをリッスン
    const unlisten = listen('tab-updated', () => {
      refreshTabs();
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [refreshTabs]);

  return [
    tabs,
    {
      createTab,
      closeTab,
      switchTab,
      getAllTabs,
      refreshTabs,
    },
  ];
};
