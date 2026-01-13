export interface Tab {
  id: string;
  title: string;
  url: string;
  isActive: boolean;
  favicon?: string;
}

export interface TabControls {
  createTab: (url?: string) => Promise<string>;
  closeTab: (id: string) => Promise<void>;
  switchTab: (id: string) => Promise<void>;
  getAllTabs: () => Promise<Tab[]>;
  refreshTabs: () => Promise<void>;
}
