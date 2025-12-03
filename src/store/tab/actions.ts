import { logError, notifyError } from './errors';
import { tabStore } from './store';
import { type Tab, TabOperationError } from './types';
import { createNewTab, validateState, repairState } from './utils';

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
    resetTabStore();
    return false;
  }
}
