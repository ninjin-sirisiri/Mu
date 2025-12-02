import { describe, it, expect, beforeEach } from 'bun:test';
import * as fc from 'fast-check';
import { tabStore, createTab, resetTabStore, updateTab, getTabById, type Tab } from './tabStore';

// Helper to reset store before each test
beforeEach(() => {
  resetTabStore();
});

// Arbitrary for generating valid URLs
const urlArbitrary = fc.webUrl();

// Arbitrary for generating tab titles
const titleArbitrary = fc.string({ minLength: 1, maxLength: 100 });

// Arbitrary for generating favicon URLs (nullable)
const faviconArbitrary = fc.option(fc.webUrl(), { nil: null });

describe('Tab Store State Update Property Tests', () => {
  /**
   * Feature: tab-management, Property 13: Tab state updates propagate correctly
   * Validates: Requirements 5.1, 5.2, 5.3
   *
   * For any tab, when a navigation event occurs with a new URL,
   * the tab's URL property should be updated to match the new URL.
   * Similarly for title and favicon updates.
   */
  describe('Property 13: Tab state updates propagate correctly', () => {
    it('should update tab URL when navigation event occurs', () => {
      fc.assert(
        fc.property(urlArbitrary, urlArbitrary, (initialUrl, newUrl) => {
          // Reset to known state
          resetTabStore();

          // Create a tab with initial URL
          const tab = createTab(initialUrl);

          // Simulate navigation event by updating the tab URL
          updateTab(tab.id, { url: newUrl });

          // Get the updated tab
          const updatedTab = getTabById(tab.id);

          // Property: Tab URL should be updated to the new URL
          expect(updatedTab).not.toBeNull();
          expect(updatedTab!.url).toBe(newUrl);
        }),
        { numRuns: 100 }
      );
    });

    it('should update tab title when page title changes', () => {
      fc.assert(
        fc.property(titleArbitrary, titleArbitrary, (initialTitle, newTitle) => {
          // Reset to known state
          resetTabStore();

          // Create a tab
          const tab = createTab();

          // Set initial title
          updateTab(tab.id, { title: initialTitle });

          // Simulate title change event
          updateTab(tab.id, { title: newTitle });

          // Get the updated tab
          const updatedTab = getTabById(tab.id);

          // Property: Tab title should be updated to the new title
          expect(updatedTab).not.toBeNull();
          expect(updatedTab!.title).toBe(newTitle);
        }),
        { numRuns: 100 }
      );
    });

    it('should update tab favicon when favicon loads', () => {
      fc.assert(
        fc.property(faviconArbitrary, faviconArbitrary, (initialFavicon, newFavicon) => {
          // Reset to known state
          resetTabStore();

          // Create a tab
          const tab = createTab();

          // Set initial favicon
          updateTab(tab.id, { favicon: initialFavicon });

          // Simulate favicon load event
          updateTab(tab.id, { favicon: newFavicon });

          // Get the updated tab
          const updatedTab = getTabById(tab.id);

          // Property: Tab favicon should be updated to the new favicon
          expect(updatedTab).not.toBeNull();
          expect(updatedTab!.favicon).toBe(newFavicon);
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve other tab properties when updating URL', () => {
      fc.assert(
        fc.property(
          urlArbitrary,
          titleArbitrary,
          faviconArbitrary,
          urlArbitrary,
          (initialUrl, title, favicon, newUrl) => {
            // Reset to known state
            resetTabStore();

            // Create a tab with initial URL
            const tab = createTab(initialUrl);
            const tabId = tab.id;
            const createdAt = tab.createdAt;

            // Set title and favicon
            updateTab(tabId, { title, favicon });

            // Update URL (simulating navigation)
            updateTab(tabId, { url: newUrl });

            // Get the updated tab
            const updatedTab = getTabById(tabId);

            // Property: Other properties should be preserved
            expect(updatedTab).not.toBeNull();
            expect(updatedTab!.id).toBe(tabId);
            expect(updatedTab!.title).toBe(title);
            expect(updatedTab!.favicon).toBe(favicon);
            expect(updatedTab!.createdAt).toBe(createdAt);
            expect(updatedTab!.url).toBe(newUrl);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should update multiple properties atomically', () => {
      fc.assert(
        fc.property(
          urlArbitrary,
          titleArbitrary,
          faviconArbitrary,
          (newUrl, newTitle, newFavicon) => {
            // Reset to known state
            resetTabStore();

            // Create a tab
            const tab = createTab();

            // Update multiple properties at once (simulating page load event)
            updateTab(tab.id, {
              url: newUrl,
              title: newTitle,
              favicon: newFavicon
            });

            // Get the updated tab
            const updatedTab = getTabById(tab.id);

            // Property: All properties should be updated correctly
            expect(updatedTab).not.toBeNull();
            expect(updatedTab!.url).toBe(newUrl);
            expect(updatedTab!.title).toBe(newTitle);
            expect(updatedTab!.favicon).toBe(newFavicon);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

describe('Tab Store Loading State Property Tests', () => {
  /**
   * Feature: tab-management, Property 14: Loading state updates are reflected immediately
   * Validates: Requirements 5.5
   *
   * For any tab, when the isLoading property changes,
   * the tab state should reflect the new loading state immediately.
   */
  describe('Property 14: Loading state updates are reflected immediately', () => {
    it('should update loading state from false to true', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 0, max: 9 }),
          (numTabs, tabIndex) => {
            // Reset to known state
            resetTabStore();

            // Create multiple tabs
            const createdTabs: Tab[] = [];
            for (let i = 0; i < numTabs; i++) {
              createdTabs.push(createTab());
            }

            // Select a valid tab index
            const validIndex = tabIndex % createdTabs.length;
            const targetTab = createdTabs[validIndex];

            // Ensure initial loading state is false
            updateTab(targetTab.id, { isLoading: false });

            // Verify initial state
            const beforeUpdate = getTabById(targetTab.id);
            expect(beforeUpdate!.isLoading).toBe(false);

            // Update loading state to true (simulating navigation start)
            updateTab(targetTab.id, { isLoading: true });

            // Get the updated tab
            const afterUpdate = getTabById(targetTab.id);

            // Property: Loading state should be immediately updated to true
            expect(afterUpdate).not.toBeNull();
            expect(afterUpdate!.isLoading).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should update loading state from true to false', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 0, max: 9 }),
          (numTabs, tabIndex) => {
            // Reset to known state
            resetTabStore();

            // Create multiple tabs
            const createdTabs: Tab[] = [];
            for (let i = 0; i < numTabs; i++) {
              createdTabs.push(createTab());
            }

            // Select a valid tab index
            const validIndex = tabIndex % createdTabs.length;
            const targetTab = createdTabs[validIndex];

            // Set initial loading state to true
            updateTab(targetTab.id, { isLoading: true });

            // Verify initial state
            const beforeUpdate = getTabById(targetTab.id);
            expect(beforeUpdate!.isLoading).toBe(true);

            // Update loading state to false (simulating navigation complete)
            updateTab(targetTab.id, { isLoading: false });

            // Get the updated tab
            const afterUpdate = getTabById(targetTab.id);

            // Property: Loading state should be immediately updated to false
            expect(afterUpdate).not.toBeNull();
            expect(afterUpdate!.isLoading).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve other properties when updating loading state', () => {
      fc.assert(
        fc.property(
          urlArbitrary,
          titleArbitrary,
          faviconArbitrary,
          fc.boolean(),
          (url, title, favicon, newLoadingState) => {
            // Reset to known state
            resetTabStore();

            // Create a tab with specific properties
            const tab = createTab(url);
            updateTab(tab.id, { title, favicon });

            const tabId = tab.id;
            const createdAt = tab.createdAt;

            // Update loading state
            updateTab(tabId, { isLoading: newLoadingState });

            // Get the updated tab
            const updatedTab = getTabById(tabId);

            // Property: Other properties should be preserved
            expect(updatedTab).not.toBeNull();
            expect(updatedTab!.id).toBe(tabId);
            expect(updatedTab!.url).toBe(url);
            expect(updatedTab!.title).toBe(title);
            expect(updatedTab!.favicon).toBe(favicon);
            expect(updatedTab!.createdAt).toBe(createdAt);
            expect(updatedTab!.isLoading).toBe(newLoadingState);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reflect loading state changes in store immediately', () => {
      fc.assert(
        fc.property(fc.array(fc.boolean(), { minLength: 1, maxLength: 10 }), loadingSequence => {
          // Reset to known state
          resetTabStore();

          // Create a tab
          const tab = createTab();

          // Apply a sequence of loading state changes
          for (const loadingState of loadingSequence) {
            updateTab(tab.id, { isLoading: loadingState });

            // Property: Each update should be immediately reflected
            const currentTab = getTabById(tab.id);
            expect(currentTab).not.toBeNull();
            expect(currentTab!.isLoading).toBe(loadingState);
          }
        }),
        { numRuns: 100 }
      );
    });
  });
});
