import { store } from '@simplestack/store';

/**
 * Tab type representing a browser tab
 */
export type Tab = {
  id: string;
  url: string;
  title: string;
  favicon: string | null;
  isLoading: boolean;
  createdAt: number;
};

/**
 * Tab state type
 */
export type TabState = {
  tabs: Tab[];
  activeTabId: string | null;
};

/**
 * Validation result type
 */
export type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

/**
 * Tab operation error class
 */
export class TabOperationError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'TabOperationError';
  }
}

/**
 * Default URL for new tabs
 */
export const DEFAULT_TAB_URL = 'https://www.google.com';

/**
 * Default title for new tabs
 */
export const DEFAULT_TAB_TITLE = 'New Tab';

/**
 * Error callback type for user-facing errors
 */
type ErrorCallback = (error: TabOperationError) => void;

/**
 * Error callback for displaying user-facing errors (e.g., toast notifications)
 */
let onErrorCallback: ErrorCallback | null = null;

/**
 * Set the error callback for user-facing error notifications
 */
// eslint-disable-next-line promise/prefer-await-to-callbacks
export function setErrorCallback(callback: ErrorCallback | null): void {
  onErrorCallback = callback;
}

/**
 * Log an error for debugging
 */
function logError(operation: string, error: unknown): void {
  // eslint-disable-next-line no-console
  console.error(`[TabStore] Error in ${operation}:`, error);
}

/**
 * Notify user of an error via callback
 */
function notifyError(error: TabOperationError): void {
  if (onErrorCallback) {
    onErrorCallback(error);
  }
}

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

/**
 * Initial tab state with one default tab
 */
const initialTab = createNewTab();
const initialState: TabState = {
  tabs: [initialTab],
  activeTabId: initialTab.id
};

/**
 * Tab store using @simplestack/store
 */
export const tabStore = store(initialState);

// ============ Actions ============

/**
 * Create a new tab and set it as active
 * Requirements: 7.5 - Error handling
 */
export function createTab(url?: string): Tab {
  try {
    const newTab = createNewTab(url);

    tabStore.set(state => ({
      tabs: [...state.tabs, newTab],
      activeTabId: newTab.id
    }));

    // Validate state after operation
    const newState = tabStore.get();
    const validation = validateState(newState);
    if (!validation.isValid) {
      logError('createTab', `State validation failed: ${validation.errors.join(', ')}`);
      const repairedState = repairState(newState);
      tabStore.set(repairedState);
    }

    return newTab;
  } catch (error) {
    logError('createTab', error);
    const opError = new TabOperationError('Failed to create new tab', 'createTab', error);
    notifyError(opError);
    // Return a fallback tab without modifying state
    return createNewTab(url);
  }
}

/**
 * Close a tab by ID
 * If closing the active tab, activates the next or previous tab
 * If closing the last tab, creates a new blank tab
 * Requirements: 7.5 - Error handling
 */
export function closeTab(id: string): void {
  try {
    const state = tabStore.get();
    const tabIndex = state.tabs.findIndex(tab => tab.id === id);

    if (tabIndex === -1) {
      logError('closeTab', `Tab with ID "${id}" not found`);
      return;
    }

    const newTabs = state.tabs.filter(tab => tab.id !== id);

    // If no tabs left, create a new blank tab
    if (newTabs.length === 0) {
      const newTab = createNewTab();
      tabStore.set({
        tabs: [newTab],
        activeTabId: newTab.id
      });
      return;
    }

    // If closing the active tab, select a new active tab
    let newActiveTabId = state.activeTabId;
    if (state.activeTabId === id) {
      // Try to select the next tab, or the previous if closing the last one
      if (tabIndex < newTabs.length) {
        newActiveTabId = newTabs[tabIndex].id;
      } else {
        newActiveTabId = newTabs[tabIndex - 1].id;
      }
    }

    tabStore.set({
      tabs: newTabs,
      activeTabId: newActiveTabId
    });

    // Validate state after operation
    const newState = tabStore.get();
    const validation = validateState(newState);
    if (!validation.isValid) {
      logError('closeTab', `State validation failed: ${validation.errors.join(', ')}`);
      const repairedState = repairState(newState);
      tabStore.set(repairedState);
    }
  } catch (error) {
    logError('closeTab', error);
    const opError = new TabOperationError('Failed to close tab', 'closeTab', error);
    notifyError(opError);
    // Attempt state recovery
    const currentState = tabStore.get();
    const validation = validateState(currentState);
    if (!validation.isValid) {
      const repairedState = repairState(currentState);
      tabStore.set(repairedState);
    }
  }
}

/**
 * Set a tab as active by ID
 * Requirements: 7.5 - Error handling
 */
export function setActiveTab(id: string): void {
  try {
    const state = tabStore.get();
    const tab = state.tabs.find(t => t.id === id);

    if (!tab) {
      logError('setActiveTab', `Tab with ID "${id}" not found`);
      return;
    }

    tabStore.set(s => ({ ...s, activeTabId: id }));

    // Validate state after operation
    const newState = tabStore.get();
    const validation = validateState(newState);
    if (!validation.isValid) {
      logError('setActiveTab', `State validation failed: ${validation.errors.join(', ')}`);
      const repairedState = repairState(newState);
      tabStore.set(repairedState);
    }
  } catch (error) {
    logError('setActiveTab', error);
    const opError = new TabOperationError('Failed to set active tab', 'setActiveTab', error);
    notifyError(opError);
  }
}

/**
 * Update a tab's properties
 * Requirements: 7.5 - Error handling
 */
export function updateTab(id: string, updates: Partial<Omit<Tab, 'id' | 'createdAt'>>): void {
  try {
    const state = tabStore.get();
    const tabExists = state.tabs.some(t => t.id === id);

    if (!tabExists) {
      logError('updateTab', `Tab with ID "${id}" not found`);
      return;
    }

    tabStore.set(currentState => ({
      ...currentState,
      tabs: currentState.tabs.map(tab => (tab.id === id ? { ...tab, ...updates } : tab))
    }));

    // Validate state after operation
    const newState = tabStore.get();
    const validation = validateState(newState);
    if (!validation.isValid) {
      logError('updateTab', `State validation failed: ${validation.errors.join(', ')}`);
      const repairedState = repairState(newState);
      tabStore.set(repairedState);
    }
  } catch (error) {
    logError('updateTab', error);
    const opError = new TabOperationError('Failed to update tab', 'updateTab', error);
    notifyError(opError);
  }
}

/**
 * Reorder tabs by moving a tab from one index to another
 * Requirements: 7.5 - Error handling
 */
export function reorderTabs(fromIndex: number, toIndex: number): void {
  try {
    const state = tabStore.get();

    if (
      fromIndex < 0 ||
      fromIndex >= state.tabs.length ||
      toIndex < 0 ||
      toIndex >= state.tabs.length ||
      fromIndex === toIndex
    ) {
      return;
    }

    const newTabs = [...state.tabs];
    const [movedTab] = newTabs.splice(fromIndex, 1);
    newTabs.splice(toIndex, 0, movedTab);

    tabStore.set(s => ({ ...s, tabs: newTabs }));

    // Validate state after operation
    const newState = tabStore.get();
    const validation = validateState(newState);
    if (!validation.isValid) {
      logError('reorderTabs', `State validation failed: ${validation.errors.join(', ')}`);
      const repairedState = repairState(newState);
      tabStore.set(repairedState);
    }
  } catch (error) {
    logError('reorderTabs', error);
    const opError = new TabOperationError('Failed to reorder tabs', 'reorderTabs', error);
    notifyError(opError);
  }
}

// ============ Selectors ============

/**
 * Get the currently active tab
 */
export function getActiveTab(): Tab | null {
  try {
    const state = tabStore.get();
    return state.tabs.find(tab => tab.id === state.activeTabId) ?? null;
  } catch (error) {
    logError('getActiveTab', error);
    return null;
  }
}

/**
 * Get a tab by ID
 */
export function getTabById(id: string): Tab | null {
  try {
    const state = tabStore.get();
    return state.tabs.find(tab => tab.id === id) ?? null;
  } catch (error) {
    logError('getTabById', error);
    return null;
  }
}

/**
 * Get the total number of tabs
 */
export function getTabCount(): number {
  try {
    return tabStore.get().tabs.length;
  } catch (error) {
    logError('getTabCount', error);
    return 0;
  }
}

/**
 * Activate the next tab in the list (cycles to first if at end)
 * Requirements: 2.2, 7.5
 */
export function activateNextTab(): void {
  try {
    const state = tabStore.get();
    if (state.tabs.length === 0) return;

    const currentIndex = state.tabs.findIndex(tab => tab.id === state.activeTabId);
    const nextIndex = (currentIndex + 1) % state.tabs.length;

    tabStore.set(s => ({ ...s, activeTabId: state.tabs[nextIndex].id }));

    // Validate state after operation
    const newState = tabStore.get();
    const validation = validateState(newState);
    if (!validation.isValid) {
      logError('activateNextTab', `State validation failed: ${validation.errors.join(', ')}`);
      const repairedState = repairState(newState);
      tabStore.set(repairedState);
    }
  } catch (error) {
    logError('activateNextTab', error);
    const opError = new TabOperationError('Failed to activate next tab', 'activateNextTab', error);
    notifyError(opError);
  }
}

/**
 * Activate the previous tab in the list (cycles to last if at beginning)
 * Requirements: 2.3, 7.5
 */
export function activatePreviousTab(): void {
  try {
    const state = tabStore.get();
    if (state.tabs.length === 0) return;

    const currentIndex = state.tabs.findIndex(tab => tab.id === state.activeTabId);
    const prevIndex = (currentIndex - 1 + state.tabs.length) % state.tabs.length;

    tabStore.set(s => ({ ...s, activeTabId: state.tabs[prevIndex].id }));

    // Validate state after operation
    const newState = tabStore.get();
    const validation = validateState(newState);
    if (!validation.isValid) {
      logError('activatePreviousTab', `State validation failed: ${validation.errors.join(', ')}`);
      const repairedState = repairState(newState);
      tabStore.set(repairedState);
    }
  } catch (error) {
    logError('activatePreviousTab', error);
    const opError = new TabOperationError(
      'Failed to activate previous tab',
      'activatePreviousTab',
      error
    );
    notifyError(opError);
  }
}

/**
 * Reset the store to initial state (useful for testing)
 */
export function resetTabStore(): void {
  try {
    const newTab = createNewTab();
    tabStore.set({
      tabs: [newTab],
      activeTabId: newTab.id
    });
  } catch (error) {
    logError('resetTabStore', error);
  }
}

/**
 * Validate and repair the current state if needed
 * Returns true if state was valid, false if repair was needed
 * Requirements: 7.5
 */
export function validateAndRepairState(): boolean {
  try {
    const state = tabStore.get();
    const validation = validateState(state);

    if (!validation.isValid) {
      logError(
        'validateAndRepairState',
        `State validation failed: ${validation.errors.join(', ')}`
      );
      const repairedState = repairState(state);
      tabStore.set(repairedState);
      return false;
    }

    return true;
  } catch (error) {
    logError('validateAndRepairState', error);
    // Reset to safe state on critical error
    resetTabStore();
    return false;
  }
}
