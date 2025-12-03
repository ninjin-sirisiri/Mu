// Types
export type { Tab, TabState, ValidationResult, ErrorCallback } from './types';
export { TabOperationError, DEFAULT_TAB_URL, DEFAULT_TAB_TITLE } from './types';

// Store
export { tabStore } from './store';

// Utils
export { generateTabId, createNewTab, validateState, repairState } from './utils';

// Errors
export { setErrorCallback } from './errors';

// Actions
export {
  createTab,
  closeTab,
  setActiveTab,
  updateTab,
  reorderTabs,
  resetTabStore,
  validateAndRepairState
} from './actions';

// Selectors
export {
  getActiveTab,
  getTabById,
  getTabCount,
  activateNextTab,
  activatePreviousTab,
  activateTabByIndex
} from './selectors';
