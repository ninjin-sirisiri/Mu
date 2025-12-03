import { store } from '@simplestack/store';
import { type TabState } from './types';
import { createNewTab } from './utils';

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
