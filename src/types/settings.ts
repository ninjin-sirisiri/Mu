// 設定システムの型定義

export interface SidebarSettings {
  position: 'left' | 'right';
  mode: 'fixed' | 'auto-hide';
  width: number;
}

export interface Settings {
  sidebar: SidebarSettings;
}

export const DEFAULT_SETTINGS: Settings = {
  sidebar: {
    position: 'left',
    mode: 'auto-hide',
    width: 256, // 64 * 4 = w-64 in Tailwind
  },
};
