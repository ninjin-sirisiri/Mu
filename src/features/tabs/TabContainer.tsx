import { useTabState } from './hooks/use-tab-state';
import { TabList } from './components/TabList';

interface TabContainerProps {
  onTabSwitch?: (tabId: string) => void;
}

export function TabContainer({ onTabSwitch }: TabContainerProps) {
  const [tabs, { switchTab, closeTab }] = useTabState();

  const handleSelect = async (id: string) => {
    await switchTab(id);
    if (onTabSwitch) {
      onTabSwitch(id);
    }
  };

  return (
    <div className="w-64 border-r border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-900">
      <TabList tabs={tabs} onSelect={handleSelect} onClose={closeTab} />
    </div>
  );
}
