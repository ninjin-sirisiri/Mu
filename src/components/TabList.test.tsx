import { describe, it, expect, beforeEach, mock } from 'bun:test';
import * as fc from 'fast-check';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import {
  tabStore,
  createTab,
  closeTab,
  setActiveTab,
  resetTabStore,
  type Tab
} from '../store/tabStore';
import { TabList } from './TabList';

// Clean up after each test
beforeEach(() => {
  cleanup();
  resetTabStore();
});

// Arbitrary for generating valid alphanumeric IDs (no spaces or special chars)
const alphanumericId = fc.stringMatching(/^[a-zA-Z0-9]{1,10}$/);

// Arbitrary for generating valid Tab objects
const tabArbitrary = fc.record({
  id: alphanumericId,
  url: fc.webUrl(),
  title: fc.string({ minLength: 1, maxLength: 50 }),
  favicon: fc.option(fc.webUrl(), { nil: null }),
  isLoading: fc.boolean(),
  createdAt: fc.integer({ min: 0 })
});

// Arbitrary for generating a list of tabs with unique IDs
const tabListArbitrary = fc.array(tabArbitrary, { minLength: 1, maxLength: 10 }).map(tabs => {
  // Ensure unique IDs by prefixing with index
  return tabs.map((tab, index) => ({
    ...tab,
    id: `tab-${index}-${tab.id}`
  }));
});

describe('TabList Property Tests', () => {
  /**
   * Feature: tab-management, Property 5: Clicking a tab activates it
   * Validates: Requirements 2.1
   */
  describe('Property 5: Clicking a tab activates it', () => {
    it('should call onTabClick with the correct tab ID when a tab is clicked', () => {
      fc.assert(
        fc.property(tabListArbitrary, tabs => {
          cleanup();

          const clickedIds: string[] = [];
          const onTabClick = mock((id: string) => {
            clickedIds.push(id);
          });
          const onTabClose = mock(() => {});
          const onNewTab = mock(() => {});

          // Pick a random tab to be active (not the one we'll click)
          const activeTabId = tabs[0].id;

          render(
            <TabList
              tabs={tabs}
              activeTabId={activeTabId}
              onTabClick={onTabClick}
              onTabClose={onTabClose}
              onNewTab={onNewTab}
            />
          );

          // Click each tab and verify the callback is called with correct ID
          for (const tab of tabs) {
            const tabElement = screen.getByTestId(`tab-item-${tab.id}`);
            fireEvent.click(tabElement);
          }

          // Property: onTabClick should be called for each tab with correct ID
          expect(clickedIds.length).toBe(tabs.length);
          for (let i = 0; i < tabs.length; i++) {
            expect(clickedIds[i]).toBe(tabs[i].id);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should activate tab in store when setActiveTab is called', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          fc.integer({ min: 0, max: 4 }),
          (numTabs, targetIndex) => {
            resetTabStore();

            // Create multiple tabs
            const createdTabs: Tab[] = [];
            for (let i = 0; i < numTabs; i++) {
              createdTabs.push(createTab());
            }

            // Ensure targetIndex is valid
            const validIndex = targetIndex % createdTabs.length;
            const targetTab = createdTabs[validIndex];

            // Set the target tab as active
            setActiveTab(targetTab.id);

            const state = tabStore.get();

            // Property: The clicked tab should become the active tab
            expect(state.activeTabId).toBe(targetTab.id);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: tab-management, Property 7: Active tab has correct visual state
   * Validates: Requirements 2.4, 4.4
   */
  describe('Property 7: Active tab has correct visual state', () => {
    it('should mark exactly one tab as active and match activeTabId', () => {
      fc.assert(
        fc.property(tabListArbitrary, tabs => {
          cleanup();

          // Pick a random tab to be active
          const randomIndex = Math.floor(Math.random() * tabs.length);
          const activeTabId = tabs[randomIndex].id;

          const onTabClick = mock(() => {});
          const onTabClose = mock(() => {});
          const onNewTab = mock(() => {});

          render(
            <TabList
              tabs={tabs}
              activeTabId={activeTabId}
              onTabClick={onTabClick}
              onTabClose={onTabClose}
              onNewTab={onNewTab}
            />
          );

          // Count tabs with active state
          let activeCount = 0;
          let activeTabElement: HTMLElement | null = null;

          for (const tab of tabs) {
            const tabElement = screen.getByTestId(`tab-item-${tab.id}`);
            const isActive = tabElement.getAttribute('data-active') === 'true';

            if (isActive) {
              activeCount++;
              activeTabElement = tabElement;
            }
          }

          // Property: Exactly one tab should be active
          expect(activeCount).toBe(1);

          // Property: The active tab should match activeTabId
          expect(activeTabElement).not.toBeNull();
          expect(activeTabElement?.getAttribute('data-testid')).toBe(`tab-item-${activeTabId}`);
        }),
        { numRuns: 100 }
      );
    });

    it('should have aria-selected=true only for active tab', () => {
      fc.assert(
        fc.property(tabListArbitrary, tabs => {
          cleanup();

          const randomIndex = Math.floor(Math.random() * tabs.length);
          const activeTabId = tabs[randomIndex].id;

          const onTabClick = mock(() => {});
          const onTabClose = mock(() => {});
          const onNewTab = mock(() => {});

          render(
            <TabList
              tabs={tabs}
              activeTabId={activeTabId}
              onTabClick={onTabClick}
              onTabClose={onTabClose}
              onNewTab={onNewTab}
            />
          );

          for (const tab of tabs) {
            const tabElement = screen.getByTestId(`tab-item-${tab.id}`);
            const ariaSelected = tabElement.getAttribute('aria-selected');

            if (tab.id === activeTabId) {
              // Property: Active tab should have aria-selected=true
              expect(ariaSelected).toBe('true');
            } else {
              // Property: Inactive tabs should have aria-selected=false
              expect(ariaSelected).toBe('false');
            }
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: tab-management, Property 8: Closing a tab removes it from the list
   * Validates: Requirements 3.1, 3.2
   */
  describe('Property 8: Closing a tab removes it from the list', () => {
    it('should call onTabClose with correct ID when close button is clicked', () => {
      fc.assert(
        fc.property(tabListArbitrary, tabs => {
          cleanup();

          const closedIds: string[] = [];
          const onTabClick = mock(() => {});
          const onTabClose = mock((id: string) => {
            closedIds.push(id);
          });
          const onNewTab = mock(() => {});

          const activeTabId = tabs[0].id;

          render(
            <TabList
              tabs={tabs}
              activeTabId={activeTabId}
              onTabClick={onTabClick}
              onTabClose={onTabClose}
              onNewTab={onNewTab}
            />
          );

          // Click close button on each tab
          const closeButtons = screen.getAllByTestId('tab-close-button');
          for (const button of closeButtons) {
            fireEvent.click(button);
          }

          // Property: onTabClose should be called for each tab
          expect(closedIds.length).toBe(tabs.length);

          // Property: Each closed ID should match a tab ID
          for (const closedId of closedIds) {
            expect(tabs.some(t => t.id === closedId)).toBe(true);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should remove tab from store when closeTab is called', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 5 }),
          fc.integer({ min: 0, max: 4 }),
          (numTabs, targetIndex) => {
            resetTabStore();

            // Create multiple tabs
            const createdTabs: Tab[] = [];
            for (let i = 0; i < numTabs; i++) {
              createdTabs.push(createTab());
            }

            const state = tabStore.get();
            const validIndex = targetIndex % state.tabs.length;
            const tabToClose = state.tabs[validIndex];
            const tabCountBefore = state.tabs.length;

            // Close the tab
            closeTab(tabToClose.id);

            const newState = tabStore.get();

            // Property: Tab list should have one fewer tab
            expect(newState.tabs.length).toBe(tabCountBefore - 1);

            // Property: The closed tab should not be in the list
            const closedTabExists = newState.tabs.some(t => t.id === tabToClose.id);
            expect(closedTabExists).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: tab-management, Property 9: Closing active tab activates appropriate next tab
   * Validates: Requirements 3.3, 3.4
   */
  describe('Property 9: Closing active tab activates appropriate next tab', () => {
    it('should activate next tab when active tab is closed (not last)', () => {
      fc.assert(
        fc.property(fc.integer({ min: 3, max: 6 }), numTabs => {
          resetTabStore();

          // Create multiple tabs
          for (let i = 0; i < numTabs; i++) {
            createTab();
          }

          const state = tabStore.get();
          // Pick a tab that is NOT the last one
          const middleIndex = Math.floor(state.tabs.length / 2);
          const tabToClose = state.tabs[middleIndex];
          const nextTab = state.tabs[middleIndex + 1];

          // Set the middle tab as active
          setActiveTab(tabToClose.id);

          // Close the active tab
          closeTab(tabToClose.id);

          const newState = tabStore.get();

          // Property: The next tab should become active
          expect(newState.activeTabId).toBe(nextTab.id);
        }),
        { numRuns: 100 }
      );
    });

    it('should activate previous tab when last tab is closed', () => {
      fc.assert(
        fc.property(fc.integer({ min: 2, max: 6 }), numTabs => {
          resetTabStore();

          // Create multiple tabs
          for (let i = 0; i < numTabs; i++) {
            createTab();
          }

          const state = tabStore.get();
          const lastIndex = state.tabs.length - 1;
          const lastTab = state.tabs[lastIndex];
          const previousTab = state.tabs[lastIndex - 1];

          // Set the last tab as active
          setActiveTab(lastTab.id);

          // Close the last tab
          closeTab(lastTab.id);

          const newState = tabStore.get();

          // Property: The previous tab should become active
          expect(newState.activeTabId).toBe(previousTab.id);
        }),
        { numRuns: 100 }
      );
    });

    it('should create new tab when last remaining tab is closed', () => {
      resetTabStore();

      const state = tabStore.get();
      expect(state.tabs.length).toBe(1);

      const onlyTab = state.tabs[0];

      // Close the only tab
      closeTab(onlyTab.id);

      const newState = tabStore.get();

      // Property: A new tab should be created
      expect(newState.tabs.length).toBe(1);

      // Property: The new tab should be active
      expect(newState.activeTabId).toBe(newState.tabs[0].id);

      // Property: The new tab should be different from the closed one
      expect(newState.tabs[0].id).not.toBe(onlyTab.id);
    });
  });

  /**
   * Feature: tab-management, Property 21: All tabs are displayed when sidebar is visible
   * Validates: Requirements 8.3
   */
  describe('Property 21: All tabs are displayed when sidebar is visible', () => {
    it('should render all tabs in the list', () => {
      fc.assert(
        fc.property(tabListArbitrary, tabs => {
          cleanup();

          const activeTabId = tabs[0].id;
          const onTabClick = mock(() => {});
          const onTabClose = mock(() => {});
          const onNewTab = mock(() => {});

          render(
            <TabList
              tabs={tabs}
              activeTabId={activeTabId}
              onTabClick={onTabClick}
              onTabClose={onTabClose}
              onNewTab={onNewTab}
            />
          );

          // Property: All tabs should be rendered
          for (const tab of tabs) {
            const tabElement = screen.getByTestId(`tab-item-${tab.id}`);
            expect(tabElement).toBeDefined();
          }

          // Property: The number of rendered tabs should match the input
          const tabList = screen.getByTestId('tab-list');
          const renderedTabs = tabList.querySelectorAll('[role="tab"]');
          expect(renderedTabs.length).toBe(tabs.length);
        }),
        { numRuns: 100 }
      );
    });

    it('should display New Tab button', () => {
      fc.assert(
        fc.property(tabListArbitrary, tabs => {
          cleanup();

          const activeTabId = tabs[0].id;
          const onTabClick = mock(() => {});
          const onTabClose = mock(() => {});
          const onNewTab = mock(() => {});

          render(
            <TabList
              tabs={tabs}
              activeTabId={activeTabId}
              onTabClick={onTabClick}
              onTabClose={onTabClose}
              onNewTab={onNewTab}
            />
          );

          // Property: New Tab button should always be present
          const newTabButton = screen.getByTestId('new-tab-button');
          expect(newTabButton).toBeDefined();
        }),
        { numRuns: 100 }
      );
    });

    it('should call onNewTab when New Tab button is clicked', () => {
      fc.assert(
        fc.property(tabListArbitrary, tabs => {
          cleanup();

          let newTabCalled = false;
          const activeTabId = tabs[0].id;
          const onTabClick = mock(() => {});
          const onTabClose = mock(() => {});
          const onNewTab = mock(() => {
            newTabCalled = true;
          });

          render(
            <TabList
              tabs={tabs}
              activeTabId={activeTabId}
              onTabClick={onTabClick}
              onTabClose={onTabClose}
              onNewTab={onNewTab}
            />
          );

          const newTabButton = screen.getByTestId('new-tab-button');
          fireEvent.click(newTabButton);

          // Property: onNewTab should be called when button is clicked
          expect(newTabCalled).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });
});
