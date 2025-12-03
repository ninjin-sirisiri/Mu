import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import * as fc from 'fast-check';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { NewTabModal } from './NewTabModal';

// Mock Tauri API
const mockInvoke = mock((_cmd: string, _args?: unknown) => Promise.resolve());
const mockListen = mock((_event: string, _handler: unknown) => Promise.resolve(() => {}));

mock.module('@tauri-apps/api/core', () => ({
  invoke: mockInvoke
}));

mock.module('@tauri-apps/api/event', () => ({
  listen: mockListen
}));

// Clean up after each test
beforeEach(() => {
  cleanup();
  mockInvoke.mockClear();
  mockListen.mockClear();
});

afterEach(() => {
  cleanup();
});

describe('NewTabModal Property Tests', () => {
  /**
   * Property: Modal should render with correct structure
   */
  describe('Modal rendering', () => {
    it('should render modal with input field and close button', () => {
      render(<NewTabModal />);

      // Modal should have input field
      const input = screen.getByPlaceholderText('Search or enter URL...');
      expect(input).toBeDefined();

      // Modal should have close button
      const closeButton = screen.getByLabelText('Close');
      expect(closeButton).toBeDefined();

      // Modal should have title
      const title = screen.getByText('New Tab');
      expect(title).toBeDefined();
    });

    it('should render hint text when input is empty', () => {
      render(<NewTabModal />);

      const hint = screen.getByText('Enter a URL or search term');
      expect(hint).toBeDefined();
    });
  });

  /**
   * Property: Input field should update on user input
   */
  describe('Input handling', () => {
    it('should update input value when user types', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1, maxLength: 20 }), text => {
          cleanup();
          render(<NewTabModal />);

          const input = screen.getByPlaceholderText('Search or enter URL...') as HTMLInputElement;
          fireEvent.change(input, { target: { value: text } });

          expect(input.value).toBe(text);
        }),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property: Close button should invoke hide_new_tab_dialog
   */
  describe('Close functionality', () => {
    it('should call hide_new_tab_dialog when close button is clicked', async () => {
      render(<NewTabModal />);

      const closeButton = screen.getByLabelText('Close');
      fireEvent.click(closeButton);

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockInvoke).toHaveBeenCalledWith('hide_new_tab_dialog');
    });

    it('should call hide_new_tab_dialog when backdrop is clicked', async () => {
      render(<NewTabModal />);

      // Click on the backdrop (the outer div)
      const backdrop = document.querySelector('.fixed.inset-0');
      if (backdrop) {
        fireEvent.click(backdrop);
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockInvoke).toHaveBeenCalledWith('hide_new_tab_dialog');
    });
  });

  /**
   * Property: Form submission should navigate to URL or search
   */
  describe('Form submission', () => {
    it('should call navigate_to with URL when URL is entered', async () => {
      cleanup();
      mockInvoke.mockClear();
      render(<NewTabModal />);

      const input = screen.getByPlaceholderText('Search or enter URL...');
      const form = input.closest('form');

      fireEvent.change(input, { target: { value: 'https://example.com' } });
      if (form) {
        fireEvent.submit(form);
      }

      await new Promise(resolve => setTimeout(resolve, 50));

      const calls = mockInvoke.mock.calls as unknown as [string, unknown?][];
      const navigateCall = calls.find(call => call[0] === 'navigate_to');
      expect(navigateCall).toBeDefined();
    });

    it('should not submit when input is empty', async () => {
      cleanup();
      mockInvoke.mockClear();
      render(<NewTabModal />);

      const input = screen.getByPlaceholderText('Search or enter URL...');
      const form = input.closest('form');

      fireEvent.change(input, { target: { value: '' } });
      if (form) {
        fireEvent.submit(form);
      }

      await new Promise(resolve => setTimeout(resolve, 50));

      // navigate_to should not be called for empty input
      const calls = mockInvoke.mock.calls as unknown as [string, unknown?][];
      const navigateCall = calls.find(call => call[0] === 'navigate_to');
      expect(navigateCall).toBeUndefined();
    });
  });
});
