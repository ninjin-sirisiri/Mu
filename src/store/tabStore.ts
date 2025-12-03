/**
 * Tab Store - Re-exports from modular structure
 *
 * This file maintains backward compatibility while the actual implementation
 * is split into smaller, more maintainable modules in the ./tab/ directory.
 */

// Re-export everything from the modular tab store
export type { Tab, TabState, ValidationResult, ErrorCallback } from './tab';
export {
  TabOperationError,
  DEFAULT_TAB_URL,
  DEFAULT_TAB_TITLE,
  tabStore,
  generateTabId,
  createNewTab,
  validateState,
  repairState,
  setErrorCallback,
  createTab,
  closeTab,
  setActiveTab,
  updateTab,
  reorderTabs,
  resetTabStore,
  validateAndRepairState,
  getActiveTab,
  getTabById,
  getTabCount,
  activateNextTab,
  activatePreviousTab,
  activateTabByIndex
} from './tab';
