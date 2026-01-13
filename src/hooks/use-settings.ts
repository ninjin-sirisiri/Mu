import { useState, useCallback } from 'react';
import type { Settings, SidebarSettings } from '../types/settings';
import { DEFAULT_SETTINGS } from '../types/settings';

export interface SettingsControls {
  updateSidebar: (settings: Partial<SidebarSettings>) => void;
}

/**
 * 設定管理hook
 * 将来的にはlocalStorageやTauriの設定ファイルに永続化する
 */
export const useSettings = (): [Settings, SettingsControls] => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  const updateSidebar = useCallback((newSettings: Partial<SidebarSettings>) => {
    setSettings((prev) => ({
      ...prev,
      sidebar: {
        ...prev.sidebar,
        ...newSettings,
      },
    }));
  }, []);

  return [settings, { updateSidebar }];
};
