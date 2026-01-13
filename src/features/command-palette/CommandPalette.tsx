import { useCallback, useEffect, useState } from 'react';

import { CommandInput } from './components/CommandInput';
import { CommandList } from './components/CommandList';
import { useCommandSearch } from './hooks/use-command-search';
import type { Command } from './types';
import { parseInput } from './utils/input-parser';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: Command[];
  onNavigate?: (url: string) => void;
}

export function CommandPalette({ isOpen, onClose, commands, onNavigate }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { results, executeCommand } = useCommandSearch(query, commands);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    setSelectedIndex((index) => {
      if (results.length === 0) return 0;
      return Math.min(index, results.length - 1);
    });
  }, [results.length]);

  const moveSelection = useCallback(
    (delta: number) => {
      setSelectedIndex((index) => {
        const count = results.length;
        if (count === 0) return 0;
        return (index + delta + count) % count;
      });
    },
    [results.length]
  );

  const handleExecute = async () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      if (results.length === 0) return;
      const selectedCommand = results[selectedIndex] ?? results[0];
      await executeCommand(selectedCommand.id);
      setQuery('');
      onClose();
      return;
    }

    const { type, value } = parseInput(trimmedQuery);

    if (type === 'url' && onNavigate) {
      // URL入力の場合はナビゲート
      const url = value.startsWith('http') ? value : `https://${value}`;
      onNavigate(url);
      setQuery('');
      onClose();
    } else if (results.length > 0) {
      // コマンド実行
      const selectedCommand = results[selectedIndex] ?? results[0];
      await executeCommand(selectedCommand.id);
      setQuery('');
      onClose();
    } else if (type === 'search' && onNavigate) {
      // 検索の場合はGoogle検索
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(value)}`;
      onNavigate(searchUrl);
      setQuery('');
      onClose();
    }
  };

  const handleClose = () => {
    setQuery('');
    onClose();
  };

  const handleCommandSelect = async (commandId: string) => {
    await executeCommand(commandId);
    setQuery('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-start justify-center pt-20 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Close command palette"
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />
      <div className="relative z-10 w-full max-w-2xl rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900">
        <CommandInput
          value={query}
          onChange={setQuery}
          onExecute={handleExecute}
          onMoveSelection={moveSelection}
          onClose={handleClose}
          isOpen={isOpen}
        />
        <CommandList
          results={results}
          selectedIndex={selectedIndex}
          onSelectedIndexChange={setSelectedIndex}
          onSelect={handleCommandSelect}
        />
      </div>
    </div>
  );
}
