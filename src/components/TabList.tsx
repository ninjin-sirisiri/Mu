import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useStoreValue } from '@simplestack/store/react';
import {
  tabStore,
  createTab,
  closeTab,
  setActiveTab,
  reorderTabs,
  type Tab
} from '../store/tabStore';
import { TabItem } from './TabItem';

export type TabListProps = {
  tabs: Tab[];
  activeTabId: string | null;
  onTabClick: (id: string) => void;
  onTabClose: (id: string) => void;
  onNewTab: () => void;
  onTabReorder?: (fromIndex: number, toIndex: number) => void;
};

/**
 * TabList component renders a vertical list of tabs
 * Requirements: 2.1, 3.1, 1.2, 6.1, 6.2, 6.3
 */
export function TabList({
  tabs,
  activeTabId,
  onTabClick,
  onTabClose,
  onNewTab,
  onTabReorder
}: TabListProps) {
  // Drag state tracking for visual feedback
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [dragOverTabId, setDragOverTabId] = useState<string | null>(null);

  function handleDragStart(e: React.DragEvent, tabId: string, index: number) {
    setDraggedTabId(tabId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  }

  function handleDragOver(e: React.DragEvent, tabId: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (tabId !== draggedTabId) {
      setDragOverTabId(tabId);
    }
  }

  function handleDrop(e: React.DragEvent, toIndex: number) {
    e.preventDefault();
    const fromIndex = Number.parseInt(e.dataTransfer.getData('text/plain'), 10);

    if (!Number.isNaN(fromIndex) && fromIndex !== toIndex && onTabReorder) {
      onTabReorder(fromIndex, toIndex);
    }

    setDraggedTabId(null);
    setDragOverTabId(null);
  }

  function handleDragEnd() {
    setDraggedTabId(null);
    setDragOverTabId(null);
  }

  return (
    <div
      className="flex flex-col gap-1.5 p-3 h-full overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent"
      role="tablist"
      aria-label="Open tabs"
      data-testid="tab-list">
      {/* Tab items */}
      <div className="flex flex-col gap-1">
        {tabs.map((tab, index) => (
          <TabItem
            key={tab.id}
            tab={tab}
            isActive={tab.id === activeTabId}
            onClick={() => onTabClick(tab.id)}
            onClose={() => onTabClose(tab.id)}
            onDragStart={e => handleDragStart(e, tab.id, index)}
            onDragOver={e => handleDragOver(e, tab.id)}
            onDrop={e => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            isDragOver={dragOverTabId === tab.id}
          />
        ))}
      </div>

      {/* New Tab button */}
      <button
        type="button"
        onClick={onNewTab}
        className="
          flex items-center gap-2.5 px-3 py-2.5 mt-1 rounded-lg
          text-gray-400 hover:text-gray-100 
          bg-transparent hover:bg-gray-700/50
          border border-dashed border-gray-700 hover:border-gray-500
          transition-all duration-200 ease-out
          focus:outline-none focus:ring-2 focus:ring-blue-500/50
        "
        aria-label="Create new tab"
        data-testid="new-tab-button">
        <Plus className="w-4 h-4" />
        <span className="text-sm font-medium">New Tab</span>
      </button>
    </div>
  );
}

/**
 * Connected TabList component that uses the tab store
 * This is the default export for use in the application
 */
export function ConnectedTabList() {
  const tabState = useStoreValue(tabStore);
  const tabs = tabState?.tabs;
  const activeTabId = tabState?.activeTabId ?? null;

  if (!tabs) {
    return null;
  }

  return (
    <TabList
      tabs={tabs}
      activeTabId={activeTabId}
      onTabClick={setActiveTab}
      onTabClose={closeTab}
      onNewTab={() => createTab()}
      onTabReorder={reorderTabs}
    />
  );
}
