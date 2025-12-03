import { describe, it, expect, beforeEach, mock } from 'bun:test';
import * as fc from 'fast-check';
import { render, screen, cleanup } from '@testing-library/react';
import type { Tab } from '../../store/tabStore';
import { TabItem, truncateTitle, MAX_TITLE_LENGTH } from './TabItem';

// Clean up after each test
beforeEach(() => {
  cleanup();
});

// Arbitrary for generating valid Tab objects
const tabArbitrary = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  url: fc.webUrl(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  favicon: fc.option(fc.webUrl(), { nil: null }),
  isLoading: fc.boolean(),
  createdAt: fc.integer({ min: 0 })
});

describe('TabItem Property Tests', () => {
  /**
   * Feature: tab-management, Property 10: Tab information is displayed correctly
   * Validates: Requirements 4.1, 4.2
   */
  describe('Property 10: Tab information is displayed correctly', () => {
    it('should display tab title and favicon when available', () => {
      fc.assert(
        fc.property(tabArbitrary, fc.boolean(), (tab, isActive) => {
          cleanup();

          const onClick = mock(() => {});
          const onClose = mock(() => {});

          render(
            <TabItem
              tab={tab}
              isActive={isActive}
              onClick={onClick}
              onClose={onClose}
            />
          );

          // Property: Tab title should be displayed (possibly truncated)
          const titleElement = screen.getByTestId('tab-title');
          expect(titleElement).toBeDefined();

          // The displayed title should be the truncated version
          const expectedTitle = truncateTitle(tab.title);
          expect(titleElement.textContent).toBe(expectedTitle);

          // Property: If favicon is available, it should be displayed
          if (tab.favicon && !tab.isLoading) {
            const faviconElement = screen.getByTestId('tab-favicon');
            expect(faviconElement).toBeDefined();
            expect(faviconElement.getAttribute('src')).toBe(tab.favicon);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: tab-management, Property 11: Loading state is displayed correctly
   * Validates: Requirements 4.3
   */
  describe('Property 11: Loading state is displayed correctly', () => {
    it('should display loading indicator when tab is loading', () => {
      fc.assert(
        fc.property(tabArbitrary, fc.boolean(), (baseTab, isActive) => {
          cleanup();

          // Force isLoading to true for this test
          const tab: Tab = { ...baseTab, isLoading: true };

          const onClick = mock(() => {});
          const onClose = mock(() => {});

          render(
            <TabItem
              tab={tab}
              isActive={isActive}
              onClick={onClick}
              onClose={onClose}
            />
          );

          // Property: Loading indicator should be present when isLoading is true
          const loadingIndicator = screen.getByTestId('loading-indicator');
          expect(loadingIndicator).toBeDefined();
        }),
        { numRuns: 100 }
      );
    });

    it('should not display loading indicator when tab is not loading', () => {
      fc.assert(
        fc.property(tabArbitrary, fc.boolean(), (baseTab, isActive) => {
          cleanup();

          // Force isLoading to false for this test
          const tab: Tab = { ...baseTab, isLoading: false };

          const onClick = mock(() => {});
          const onClose = mock(() => {});

          render(
            <TabItem
              tab={tab}
              isActive={isActive}
              onClick={onClick}
              onClose={onClose}
            />
          );

          // Property: Loading indicator should NOT be present when isLoading is false
          const loadingIndicator = screen.queryByTestId('loading-indicator');
          expect(loadingIndicator).toBeNull();
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: tab-management, Property 12: Long titles are truncated
   * Validates: Requirements 4.5
   */
  describe('Property 12: Long titles are truncated', () => {
    it('should truncate titles longer than MAX_TITLE_LENGTH with ellipsis', () => {
      // Generate titles that are definitely longer than MAX_TITLE_LENGTH
      const longTitleArbitrary = fc.string({
        minLength: MAX_TITLE_LENGTH + 1,
        maxLength: 200
      });

      fc.assert(
        fc.property(longTitleArbitrary, longTitle => {
          const truncated = truncateTitle(longTitle);

          // Property: Truncated title should end with "..."
          expect(truncated.endsWith('...')).toBe(true);

          // Property: Truncated title should be MAX_TITLE_LENGTH + 3 (for "...")
          expect(truncated.length).toBe(MAX_TITLE_LENGTH + 3);

          // Property: The beginning of the truncated title should match the original
          expect(truncated.slice(0, MAX_TITLE_LENGTH)).toBe(longTitle.slice(0, MAX_TITLE_LENGTH));
        }),
        { numRuns: 100 }
      );
    });

    it('should not truncate titles shorter than or equal to MAX_TITLE_LENGTH', () => {
      const shortTitleArbitrary = fc.string({
        minLength: 1,
        maxLength: MAX_TITLE_LENGTH
      });

      fc.assert(
        fc.property(shortTitleArbitrary, shortTitle => {
          const result = truncateTitle(shortTitle);

          // Property: Short titles should remain unchanged
          expect(result).toBe(shortTitle);

          // Property: Result should not end with "..." (unless original did)
          if (!shortTitle.endsWith('...')) {
            expect(result.endsWith('...')).toBe(false);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should render truncated title in the component', () => {
      // Generate tabs with long titles
      const longTitleTabArbitrary = fc.record({
        id: fc.string({ minLength: 1, maxLength: 20 }),
        url: fc.webUrl(),
        title: fc.string({ minLength: MAX_TITLE_LENGTH + 1, maxLength: 100 }),
        favicon: fc.option(fc.webUrl(), { nil: null }),
        isLoading: fc.constant(false),
        createdAt: fc.integer({ min: 0 })
      });

      fc.assert(
        fc.property(longTitleTabArbitrary, fc.boolean(), (tab, isActive) => {
          cleanup();

          const onClick = mock(() => {});
          const onClose = mock(() => {});

          render(
            <TabItem
              tab={tab}
              isActive={isActive}
              onClick={onClick}
              onClose={onClose}
            />
          );

          const titleElement = screen.getByTestId('tab-title');
          const displayedTitle = titleElement.textContent || '';

          // Property: Displayed title should be truncated
          expect(displayedTitle.endsWith('...')).toBe(true);
          expect(displayedTitle.length).toBe(MAX_TITLE_LENGTH + 3);
        }),
        { numRuns: 100 }
      );
    });
  });
});
