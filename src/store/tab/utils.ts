import {
  type Tab,
  type TabState,
  type ValidationResult,
  DEFAULT_TAB_URL,
  DEFAULT_TAB_TITLE
} from './types';

/**
 * Generate a unique tab ID
 */
export function generateTabId(): string {
  return `tab-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Create a new tab with default values
 */
export function createNewTab(url?: string): Tab {
  return {
    id: generateTabId(),
    url: url ?? DEFAULT_TAB_URL,
    title: DEFAULT_TAB_TITLE,
    favicon: null,
    isLoading: false,
    createdAt: Date.now()
  };
}

/**
 * Validate tab state for consistency
 * Checks for: duplicate IDs, active tab exists, no null references
 * Requirements: 7.5
 */
export function validateState(state: TabState): ValidationResult {
  const errors: string[] = [];

  // Check for duplicate IDs
  const ids = state.tabs.map(t => t.id);
  const uniqueIds = new Set(ids);
  if (uniqueIds.size !== ids.length) {
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    errors.push(`Duplicate tab IDs found: ${duplicates.join(', ')}`);
  }

  // Check that active tab exists in the list (if there are tabs)
  if (state.tabs.length > 0) {
    if (state.activeTabId === null) {
      errors.push('No active tab set but tabs exist');
    } else {
      const activeTabExists = state.tabs.some(t => t.id === state.activeTabId);
      if (!activeTabExists) {
        errors.push(`Active tab ID "${state.activeTabId}" does not exist in tab list`);
      }
    }
  }

  // Check for null/undefined tab properties
  for (const tab of state.tabs) {
    if (!tab.id) {
      errors.push('Tab found with missing ID');
    }
    if (tab.url === undefined || tab.url === null) {
      errors.push(`Tab "${tab.id}" has null/undefined URL`);
    }
    if (tab.title === undefined || tab.title === null) {
      errors.push(`Tab "${tab.id}" has null/undefined title`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Repair corrupted state by fixing common issues
 * Requirements: 7.5
 */
export function repairState(state: TabState): TabState {
  let repairedTabs = [...state.tabs];

  // Remove tabs with duplicate IDs (keep first occurrence)
  const seenIds = new Set<string>();
  repairedTabs = repairedTabs.filter(tab => {
    if (seenIds.has(tab.id)) {
      return false;
    }
    seenIds.add(tab.id);
    return true;
  });

  // Fix tabs with missing properties
  repairedTabs = repairedTabs.map(tab => ({
    ...tab,
    id: tab.id || generateTabId(),
    url: tab.url ?? DEFAULT_TAB_URL,
    title: tab.title ?? DEFAULT_TAB_TITLE,
    favicon: tab.favicon ?? null,
    isLoading: tab.isLoading ?? false,
    createdAt: tab.createdAt ?? Date.now()
  }));

  // If no tabs, create a default one
  if (repairedTabs.length === 0) {
    const newTab = createNewTab();
    return {
      tabs: [newTab],
      activeTabId: newTab.id
    };
  }

  // Fix active tab if it doesn't exist
  let activeTabId = state.activeTabId;
  const activeTabExists = repairedTabs.some(t => t.id === activeTabId);
  if (!activeTabExists) {
    activeTabId = repairedTabs[0].id;
  }

  return {
    tabs: repairedTabs,
    activeTabId
  };
}
