import { useEffect, useRef } from 'react';

import type { Command } from '../types';

interface CommandListProps {
  results: Command[];
  selectedIndex: number;
  onSelectedIndexChange: (index: number) => void;
  onSelect: (commandId: string) => void;
}

export function CommandList({
  results,
  selectedIndex,
  onSelectedIndexChange,
  onSelect,
}: CommandListProps) {
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    itemRefs.current[selectedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex, results.length]);

  if (results.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        コマンドが見つかりません
      </div>
    );
  }

  return (
    <div className="max-h-96 overflow-y-auto" role="listbox">
      {results.map((command, index) => (
        <button
          key={command.id}
          ref={(element) => {
            itemRefs.current[index] = element;
          }}
          className={`w-full px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${
            index === selectedIndex
              ? 'bg-blue-50 text-blue-900 dark:bg-blue-900/30 dark:text-blue-100'
              : 'text-gray-900 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-gray-800'
          }`}
          role="option"
          aria-selected={index === selectedIndex}
          onClick={() => onSelect(command.id)}
          onMouseEnter={() => onSelectedIndexChange(index)}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="font-medium">{command.label}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{command.description}</div>
            </div>
            {command.shortcut && (
              <div className="ml-4 rounded bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                {command.shortcut}
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
