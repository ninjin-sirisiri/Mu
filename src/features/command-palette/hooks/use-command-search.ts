import { useMemo } from 'react';

import type { Command } from '../types';
import { fuzzySearch } from '../utils/fuzzy-search';
import { parseInput } from '../utils/input-parser';

export function useCommandSearch(
  query: string,
  commands: Command[]
): {
  results: Command[];
  inputType: 'url' | 'search' | 'command';
  executeCommand: (commandId: string) => Promise<void>;
} {
  const normalizedQuery = query.trim();
  const { type: inputType } = parseInput(normalizedQuery);

  const results = useMemo(() => {
    if (!normalizedQuery) {
      return commands;
    }

    const searchResults = fuzzySearch(normalizedQuery, commands);
    return searchResults.map((result) => result.item);
  }, [normalizedQuery, commands]);

  const executeCommand = async (commandId: string) => {
    const command = commands.find((cmd) => cmd.id === commandId);
    if (command) {
      await command.action();
    }
  };

  return {
    results,
    inputType,
    executeCommand,
  };
}
