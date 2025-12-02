import { describe, it, expect, beforeEach } from 'bun:test';
import * as fc from 'fast-check';
import {
  tabStore,
  createTab,
  resetTabStore,
  setActiveTab,
  activateNextTab,
  activatePreviousTab,
  closeTab,
  updateTab,
  reorderTabs,
  validateState,
  repairState,
  DEFAULT_TAB_URL,
  type Tab,
  type TabState
} from './tabStore';

// Helper to reset store before each test
beforeEach(() => {
  resetTabStore();
});

// Arbitrary for generating optional URLs
const urlArbitrary = fc.option(fc.webUrl(), { nil: undefined });

describe('Tab Store Property Tests', () => {
  /**
   * Feature: tab-management, Property 1: Creating a tab adds it to the list and activates it
   * Validates: Requirements 1.1, 1.2
   */
  describe('Property 1: Creating a tab adds it to the list and activates it', () => {
    it('should add a new tab to the list and make it active', () => {
      fc.assert(
        fc.property(urlArbitrary, url => {
          // Reset to known state
          resetTabStore();
          const initialState = tabStore.get();
          const initialCount = initialState.tabs.length;

          // Create a new tab
          const newTab = createTab(url);
          const newState = tabStore.get();

          // Property: Tab list should have one more tab
          expect(newState.tabs.length).toBe(initialCount + 1);

          // Property: The new tab should be the active tab
          expect(newState.activeTabId).toBe(newTab.id);

          // Property: The new tab should exist in the list
          const foundTab = newState.tabs.find(t => t.id === newTab.id);
          expect(foundTab).toBeDefined();
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: tab-management, Property 2: New tabs have unique IDs
   * Validates: Requirements 1.4
   */
  describe('Property 2: New tabs have unique IDs', () => {
    it('should assign unique IDs to all created tabs', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 20 }), numTabs => {
          // Reset to known state
          resetTabStore();

          // Create multiple tabs
          const createdTabs: Tab[] = [];
          for (let i = 0; i < numTabs; i++) {
            createdTabs.push(createTab());
          }

          const state = tabStore.get();
          const allIds = state.tabs.map(t => t.id);
          const uniqueIds = new Set(allIds);

          // Property: All IDs should be unique (set size equals array length)
          expect(uniqueIds.size).toBe(allIds.length);

          // Property: Each created tab's ID should not match any other
          for (let i = 0; i < createdTabs.length; i++) {
            for (let j = i + 1; j < createdTabs.length; j++) {
              expect(createdTabs[i].id).not.toBe(createdTabs[j].id);
            }
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: tab-management, Property 3: New tabs are added to the end of the list
   * Validates: Requirements 1.5
   */
  describe('Property 3: New tabs are added to the end of the list', () => {
    it('should add new tabs at the end of the tab list', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 10 }), urlArbitrary, (numExistingTabs, url) => {
          // Reset to known state
          resetTabStore();

          // Create some existing tabs
          for (let i = 0; i < numExistingTabs; i++) {
            createTab();
          }

          const stateBefore = tabStore.get();
          const lengthBefore = stateBefore.tabs.length;

          // Create a new tab
          const newTab = createTab(url);
          const stateAfter = tabStore.get();

          // Property: New tab should be at the last index (lengthBefore)
          const newTabIndex = stateAfter.tabs.findIndex(t => t.id === newTab.id);
          expect(newTabIndex).toBe(lengthBefore);

          // Property: New tab should be the last element
          expect(stateAfter.tabs[stateAfter.tabs.length - 1].id).toBe(newTab.id);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: tab-management, Property 4: New tabs have default URL
   * Validates: Requirements 1.3
   */
  describe('Property 4: New tabs have default URL', () => {
    it('should initialize new tabs with default URL when no URL is provided', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 10 }), numTabs => {
          // Reset to known state
          resetTabStore();

          // Create tabs without specifying URL
          const createdTabs: Tab[] = [];
          for (let i = 0; i < numTabs; i++) {
            createdTabs.push(createTab());
          }

          // Property: All created tabs should have the default URL
          for (const tab of createdTabs) {
            expect(tab.url).toBe(DEFAULT_TAB_URL);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should use provided URL when specified', () => {
      fc.assert(
        fc.property(fc.webUrl(), url => {
          // Reset to known state
          resetTabStore();

          // Create tab with specific URL
          const newTab = createTab(url);

          // Property: Tab should have the provided URL
          expect(newTab.url).toBe(url);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: tab-management, Property 6: Keyboard navigation cycles through tabs correctly
   * Validates: Requirements 2.2, 2.3
   */
  describe('Property 6: Keyboard navigation cycles through tabs correctly', () => {
    it('should activate next tab and cycle to first when at end', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 10 }),
          fc.integer({ min: 0, max: 9 }),
          (numTabs, startIndex) => {
            // Reset to known state
            resetTabStore();

            // Create multiple tabs
            const createdTabs: Tab[] = [];
            for (let i = 0; i < numTabs; i++) {
              createdTabs.push(createTab());
            }

            const state = tabStore.get();
            const validStartIndex = startIndex % state.tabs.length;
            const startTab = state.tabs[validStartIndex];

            // Set the starting tab as active
            setActiveTab(startTab.id);

            // Calculate expected next index (with cycling)
            const expectedNextIndex = (validStartIndex + 1) % state.tabs.length;
            const expectedNextTab = state.tabs[expectedNextIndex];

            // Activate next tab
            activateNextTab();

            const newState = tabStore.get();

            // Property: The next tab should be active (with cycling)
            expect(newState.activeTabId).toBe(expectedNextTab.id);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should activate previous tab and cycle to last when at beginning', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 10 }),
          fc.integer({ min: 0, max: 9 }),
          (numTabs, startIndex) => {
            // Reset to known state
            resetTabStore();

            // Create multiple tabs
            const createdTabs: Tab[] = [];
            for (let i = 0; i < numTabs; i++) {
              createdTabs.push(createTab());
            }

            const state = tabStore.get();
            const validStartIndex = startIndex % state.tabs.length;
            const startTab = state.tabs[validStartIndex];

            // Set the starting tab as active
            setActiveTab(startTab.id);

            // Calculate expected previous index (with cycling)
            const expectedPrevIndex = (validStartIndex - 1 + state.tabs.length) % state.tabs.length;
            const expectedPrevTab = state.tabs[expectedPrevIndex];

            // Activate previous tab
            activatePreviousTab();

            const newState = tabStore.get();

            // Property: The previous tab should be active (with cycling)
            expect(newState.activeTabId).toBe(expectedPrevTab.id);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should cycle from last to first when pressing next', () => {
      fc.assert(
        fc.property(fc.integer({ min: 2, max: 10 }), numTabs => {
          // Reset to known state
          resetTabStore();

          // Create multiple tabs
          for (let i = 0; i < numTabs; i++) {
            createTab();
          }

          const state = tabStore.get();
          const lastTab = state.tabs[state.tabs.length - 1];
          const firstTab = state.tabs[0];

          // Set the last tab as active
          setActiveTab(lastTab.id);

          // Activate next tab (should cycle to first)
          activateNextTab();

          const newState = tabStore.get();

          // Property: Should cycle to first tab
          expect(newState.activeTabId).toBe(firstTab.id);
        }),
        { numRuns: 100 }
      );
    });

    it('should cycle from first to last when pressing previous', () => {
      fc.assert(
        fc.property(fc.integer({ min: 2, max: 10 }), numTabs => {
          // Reset to known state
          resetTabStore();

          // Create multiple tabs
          for (let i = 0; i < numTabs; i++) {
            createTab();
          }

          const state = tabStore.get();
          const firstTab = state.tabs[0];
          const lastTab = state.tabs[state.tabs.length - 1];

          // Set the first tab as active
          setActiveTab(firstTab.id);

          // Activate previous tab (should cycle to last)
          activatePreviousTab();

          const newState = tabStore.get();

          // Property: Should cycle to last tab
          expect(newState.activeTabId).toBe(lastTab.id);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: tab-management, Property 18: Error handling maintains state consistency
   * Validates: Requirements 7.5
   */
  describe('Property 18: Error handling maintains state consistency', () => {
    // Helper to check if state is valid (no duplicate IDs, active tab exists, no null references)
    const isValidState = (state: TabState): boolean => {
      const validation = validateState(state);
      return validation.isValid;
    };

    // Arbitrary for generating a valid tab
    const tabArbitrary = fc.record({
      id: fc.string({ minLength: 1, maxLength: 20 }),
      url: fc.webUrl(),
      title: fc.string({ minLength: 1, maxLength: 100 }),
      favicon: fc.option(fc.webUrl(), { nil: null }),
      isLoading: fc.boolean(),
      createdAt: fc.integer({ min: 0 })
    });

    // Arbitrary for generating a potentially corrupted state
    const corruptedStateArbitrary = fc.record({
      tabs: fc.array(tabArbitrary, { minLength: 0, maxLength: 10 }),
      activeTabId: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: null })
    });

    it('should maintain valid state after any sequence of tab operations', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.oneof(
              fc.constant({ type: 'create' as const, url: undefined }),
              fc.record({
                type: fc.constant('create' as const),
                url: fc.option(fc.webUrl(), { nil: undefined })
              }),
              fc.record({
                type: fc.constant('close' as const),
                index: fc.integer({ min: 0, max: 9 })
              }),
              fc.record({
                type: fc.constant('setActive' as const),
                index: fc.integer({ min: 0, max: 9 })
              }),
              fc.record({
                type: fc.constant('reorder' as const),
                fromIndex: fc.integer({ min: 0, max: 9 }),
                toIndex: fc.integer({ min: 0, max: 9 })
              }),
              fc.record({
                type: fc.constant('update' as const),
                index: fc.integer({ min: 0, max: 9 }),
                title: fc.string({ minLength: 1, maxLength: 50 })
              })
            ),
            { minLength: 1, maxLength: 20 }
          ),
          operations => {
            // Reset to known state
            resetTabStore();

            // Execute random sequence of operations
            for (const op of operations) {
              const state = tabStore.get();

              switch (op.type) {
                case 'create':
                  createTab(op.url);
                  break;
                case 'close':
                  if (state.tabs.length > 0) {
                    const idx = op.index % state.tabs.length;
                    closeTab(state.tabs[idx].id);
                  }
                  break;
                case 'setActive':
                  if (state.tabs.length > 0) {
                    const idx = op.index % state.tabs.length;
                    setActiveTab(state.tabs[idx].id);
                  }
                  break;
                case 'reorder':
                  if (state.tabs.length > 1) {
                    const from = op.fromIndex % state.tabs.length;
                    const to = op.toIndex % state.tabs.length;
                    reorderTabs(from, to);
                  }
                  break;
                case 'update':
                  if (state.tabs.length > 0) {
                    const idx = op.index % state.tabs.length;
                    updateTab(state.tabs[idx].id, { title: op.title });
                  }
                  break;
              }

              // Property: State should always be valid after any operation
              const newState = tabStore.get();
              expect(isValidState(newState)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should repair corrupted state with duplicate IDs', () => {
      fc.assert(
        fc.property(fc.array(tabArbitrary, { minLength: 2, maxLength: 5 }), tabs => {
          // Create corrupted state with duplicate IDs
          const duplicateId = 'duplicate-id';
          const corruptedTabs = tabs.map((tab, index) => ({
            ...tab,
            id: index < 2 ? duplicateId : tab.id // First two tabs have same ID
          }));

          const corruptedState: TabState = {
            tabs: corruptedTabs,
            activeTabId: duplicateId
          };

          // Validate should detect the corruption
          const validation = validateState(corruptedState);
          expect(validation.isValid).toBe(false);
          expect(validation.errors.some(e => e.includes('Duplicate'))).toBe(true);

          // Repair should fix the corruption
          const repairedState = repairState(corruptedState);
          const repairedValidation = validateState(repairedState);

          // Property: Repaired state should be valid
          expect(repairedValidation.isValid).toBe(true);

          // Property: No duplicate IDs after repair
          const ids = repairedState.tabs.map(t => t.id);
          const uniqueIds = new Set(ids);
          expect(uniqueIds.size).toBe(ids.length);
        }),
        { numRuns: 100 }
      );
    });

    it('should repair corrupted state with missing active tab', () => {
      fc.assert(
        fc.property(fc.array(tabArbitrary, { minLength: 1, maxLength: 5 }), tabs => {
          // Ensure unique IDs
          const uniqueTabs = tabs.map((tab, index) => ({
            ...tab,
            id: `tab-${index}-${tab.id}`
          }));

          // Create corrupted state with non-existent active tab
          const corruptedState: TabState = {
            tabs: uniqueTabs,
            activeTabId: 'non-existent-tab-id'
          };

          // Validate should detect the corruption
          const validation = validateState(corruptedState);
          expect(validation.isValid).toBe(false);
          expect(validation.errors.some(e => e.includes('does not exist'))).toBe(true);

          // Repair should fix the corruption
          const repairedState = repairState(corruptedState);
          const repairedValidation = validateState(repairedState);

          // Property: Repaired state should be valid
          expect(repairedValidation.isValid).toBe(true);

          // Property: Active tab should exist in the list
          const activeTabExists = repairedState.tabs.some(t => t.id === repairedState.activeTabId);
          expect(activeTabExists).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should repair empty tab list by creating default tab', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          // Create corrupted state with no tabs
          const corruptedState: TabState = {
            tabs: [],
            activeTabId: null
          };

          // Repair should create a default tab
          const repairedState = repairState(corruptedState);
          const repairedValidation = validateState(repairedState);

          // Property: Repaired state should be valid
          expect(repairedValidation.isValid).toBe(true);

          // Property: Should have at least one tab
          expect(repairedState.tabs.length).toBeGreaterThan(0);

          // Property: Active tab should be set
          expect(repairedState.activeTabId).not.toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it('should handle operations on non-existent tabs gracefully', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10, maxLength: 30 }), nonExistentId => {
          // Reset to known state
          resetTabStore();
          const stateBefore = tabStore.get();

          // Try to close non-existent tab
          closeTab(nonExistentId);

          // Property: State should remain valid
          const stateAfterClose = tabStore.get();
          expect(isValidState(stateAfterClose)).toBe(true);

          // Try to set non-existent tab as active
          setActiveTab(nonExistentId);

          // Property: State should remain valid
          const stateAfterSetActive = tabStore.get();
          expect(isValidState(stateAfterSetActive)).toBe(true);

          // Try to update non-existent tab
          updateTab(nonExistentId, { title: 'New Title' });

          // Property: State should remain valid
          const stateAfterUpdate = tabStore.get();
          expect(isValidState(stateAfterUpdate)).toBe(true);

          // Property: Tab count should not change for operations on non-existent tabs
          expect(stateAfterUpdate.tabs.length).toBe(stateBefore.tabs.length);
        }),
        { numRuns: 100 }
      );
    });
  });
});
