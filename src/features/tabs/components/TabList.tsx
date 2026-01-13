import type { Tab } from '../types';
import { TabItem } from './TabItem';

interface TabListProps {
  tabs: Tab[];
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
}

export function TabList({ tabs, onSelect, onClose }: TabListProps) {
  if (tabs.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
        タブがありません
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 p-2">
      {tabs.map((tab) => (
        <TabItem key={tab.id} tab={tab} onSelect={onSelect} onClose={onClose} />
      ))}
    </div>
  );
}
