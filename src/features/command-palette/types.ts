export interface Command {
  id: string;
  label: string;
  description: string;
  keywords: string[];
  action: () => void | Promise<void>;
  category?: 'navigation' | 'tab' | 'window' | 'other';
  shortcut?: string;
}

export type CommandCategory = 'navigation' | 'tab' | 'window' | 'other';
