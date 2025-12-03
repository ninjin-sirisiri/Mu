import { logError, notifyError } from './errors';
import { tabStore } from './store';
import { type Tab, TabOperationError } from './types';
import { validateState, repairState } from './utils';

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
 * Activate a tab by its 1-based index
 * Index 9 always activates the last tab (regardless of tab count)
 * If index > tab count, no action is taken (except for index 9)
 * Requirements: 2.5, 7.5
 */
export function activateTabByIndex(index: number): void {
  try {
    const state = tabStore.get();
    if (state.tabs.length === 0) return;

    // Index 9 always means "last tab"
    if (index === 9) {
      const lastTab = state.tabs.at(-1);
      if (lastTab) {
        tabStore.set(s => ({ ...s, activeTabId: lastTab.id }));
      }
    } else {
      // Convert 1-based index to 0-based
      const zeroBasedIndex = index - 1;

      // If index is out of bounds, do nothing
      if (zeroBasedIndex < 0 || zeroBasedIndex >= state.tabs.length) {
        return;
      }

      const targetTab = state.tabs[zeroBasedIndex];
      tabStore.set(s => ({ ...s, activeTabId: targetTab.id }));
    }

    const newState = tabStore.get();
    const validation = validateState(newState);
    if (!validation.isValid) {
      logError('activateTabByIndex', `State validation failed: ${validation.errors.join(', ')}`);
      const repairedState = repairState(newState);
      tabStore.set(repairedState);
    }
  } catch (error) {
    logError('activateTabByIndex', error);
    const opError = new TabOperationError(
      'Failed to activate tab by index',
      'activateTabByIndex',
      error
    );
    notifyError(opError);
  }
}
