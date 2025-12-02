import { describe, it, expect, beforeEach } from 'bun:test';
import * as fc from 'fast-check';
import {
  tabStore,
  createTab,
  resetTabStore,
  reorderTabs,
  setActiveTab,
  type Tab
} from './tabStore';

// Clean up before each test
beforeEach(() => {
  resetTabStore();
});

/**
 * Helper to create a specific number of tabs and return them
 */
function createMultipleTabs(count: number): Tab[] {
  const tabs: Tab[] = [];
  for (let i = 0; i < count; i++) {
    tabs.push(createTab(`https://example.com/page${i}`));
  }
  return tabs;
}

describe('Tab Store Reorder Property Tests', () => {
  /**
   * Feature: tab-management, Property 16: Reordering updates tab positions
   * Validates: Requirements 6.1, 6.2
   */
  describe('Property 16: Reordering updates tab positions', () => {
    it('should move tab from fromIndex to toIndex', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 10 }),
          fc.integer({ min: 0, max: 9 }),
          fc.integer({ min: 0, max: 9 }),
          (numTabs, fromIdx, toIdx) => {
            resetTabStore();

            // Create tabs
            createMultipleTabs(numTabs);

            const stateBefore = tabStore.get();
            // Ensure indices are valid for the actual tab count
            const fromIndex = fromIdx % stateBefore.tabs.length;
            const toIndex = toIdx % stateBefore.tabs.length;

            // Skip if same index (no-op)
            if (fromIndex === toIndex) return;

            const tabToMove = stateBefore.tabs[fromIndex];

            // Perform reorder
            reorderTabs(fromIndex, toIndex);

            const stateAfter = tabStore.get();

            // Property: The moved tab should be at toIndex
            expect(stateAfter.tabs[toIndex].id).toBe(tabToMove.id);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve all tabs after reordering (no tabs lost or duplicated)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 10 }),
          fc.integer({ min: 0, max: 9 }),
          fc.integer({ min: 0, max: 9 }),
          (numTabs, fromIdx, toIdx) => {
            resetTabStore();

            createMultipleTabs(numTabs);

            const stateBefore = tabStore.get();
            const fromIndex = fromIdx % stateBefore.tabs.length;
            const toIndex = toIdx % stateBefore.tabs.length;

            const tabIdsBefore = stateBefore.tabs.map(t => t.id).sort();

            // Perform reorder
            reorderTabs(fromIndex, toIndex);

            const stateAfter = tabStore.get();
            const tabIdsAfter = stateAfter.tabs.map(t => t.id).sort();

            // Property: Same tabs should exist before and after (sorted IDs match)
            expect(tabIdsAfter).toEqual(tabIdsBefore);

            // Property: Tab count should remain the same
            expect(stateAfter.tabs.length).toBe(stateBefore.tabs.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not change state for invalid indices', () => {
      fc.assert(
        fc.property(fc.integer({ min: 2, max: 5 }), numTabs => {
          resetTabStore();

          createMultipleTabs(numTabs);

          const stateBefore = tabStore.get();
          const tabsBefore = [...stateBefore.tabs];

          // Test with invalid fromIndex (negative)
          reorderTabs(-1, 0);
          expect(tabStore.get().tabs).toEqual(tabsBefore);

          // Test with invalid toIndex (out of bounds)
          reorderTabs(0, stateBefore.tabs.length + 5);
          expect(tabStore.get().tabs).toEqual(tabsBefore);

          // Test with same index (no-op)
          reorderTabs(0, 0);
          expect(tabStore.get().tabs).toEqual(tabsBefore);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: tab-management, Property 15: Reordering preserves tab properties
   * Validates: Requirements 6.4
   */
  describe('Property 15: Reordering preserves tab properties', () => {
    it('should preserve all tab properties after reordering', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 10 }),
          fc.integer({ min: 0, max: 9 }),
          fc.integer({ min: 0, max: 9 }),
          (numTabs, fromIdx, toIdx) => {
            resetTabStore();

            createMultipleTabs(numTabs);

            const stateBefore = tabStore.get();
            const fromIndex = fromIdx % stateBefore.tabs.length;
            const toIndex = toIdx % stateBefore.tabs.length;

            // Store all tab properties before reorder
            const tabPropertiesBefore = new Map<string, Tab>();
            for (const tab of stateBefore.tabs) {
              tabPropertiesBefore.set(tab.id, { ...tab });
            }

            // Perform reorder
            reorderTabs(fromIndex, toIndex);

            const stateAfter = tabStore.get();

            // Property: All tab properties should be preserved
            for (const tab of stateAfter.tabs) {
              const originalTab = tabPropertiesBefore.get(tab.id);
              expect(originalTab).toBeDefined();

              // Check all properties are preserved
              expect(tab.id).toBe(originalTab!.id);
              expect(tab.url).toBe(originalTab!.url);
              expect(tab.title).toBe(originalTab!.title);
              expect(tab.favicon).toBe(originalTab!.favicon);
              expect(tab.isLoading).toBe(originalTab!.isLoading);
              expect(tab.createdAt).toBe(originalTab!.createdAt);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: tab-management, Property 17: Reordering maintains active tab
   * Validates: Requirements 6.5
   */
  describe('Property 17: Reordering maintains active tab', () => {
    it('should keep the same tab active after reordering', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 10 }),
          fc.integer({ min: 0, max: 9 }),
          fc.integer({ min: 0, max: 9 }),
          fc.integer({ min: 0, max: 9 }),
          (numTabs, activeIdx, fromIdx, toIdx) => {
            resetTabStore();

            createMultipleTabs(numTabs);

            const stateBefore = tabStore.get();
            const activeIndex = activeIdx % stateBefore.tabs.length;
            const fromIndex = fromIdx % stateBefore.tabs.length;
            const toIndex = toIdx % stateBefore.tabs.length;

            // Set a specific tab as active
            const activeTab = stateBefore.tabs[activeIndex];
            setActiveTab(activeTab.id);

            // Verify active tab is set
            expect(tabStore.get().activeTabId).toBe(activeTab.id);

            // Perform reorder
            reorderTabs(fromIndex, toIndex);

            const stateAfter = tabStore.get();

            // Property: The same tab should still be active (by ID)
            expect(stateAfter.activeTabId).toBe(activeTab.id);

            // Property: The active tab should still exist in the list
            const activeTabExists = stateAfter.tabs.some(t => t.id === activeTab.id);
            expect(activeTabExists).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain active tab even when the active tab itself is moved', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 8 }),
          fc.integer({ min: 0, max: 7 }),
          (numTabs, toIdx) => {
            resetTabStore();

            createMultipleTabs(numTabs);

            const stateBefore = tabStore.get();
            const toIndex = toIdx % stateBefore.tabs.length;

            // Make the first tab active and move it
            const activeTab = stateBefore.tabs[0];
            setActiveTab(activeTab.id);

            // Move the active tab to a different position
            if (toIndex !== 0) {
              reorderTabs(0, toIndex);
            }

            const stateAfter = tabStore.get();

            // Property: The moved tab should still be active
            expect(stateAfter.activeTabId).toBe(activeTab.id);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
