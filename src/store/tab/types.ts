/**
 * Tab type representing a browser tab
 */
export type Tab = {
  id: string;
  url: string;
  title: string;
  favicon: string | null;
  isLoading: boolean;
  createdAt: number;
};

/**
 * Tab state type
 */
export type TabState = {
  tabs: Tab[];
  activeTabId: string | null;
};

/**
 * Validation result type
 */
export type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

/**
 * Tab operation error class
 */
export class TabOperationError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'TabOperationError';
  }
}

/**
 * Default URL for new tabs
 */
export const DEFAULT_TAB_URL = 'https://www.google.com';

/**
 * Default title for new tabs
 */
export const DEFAULT_TAB_TITLE = 'New Tab';

/**
 * Error callback type for user-facing errors
 */
export type ErrorCallback = (error: TabOperationError) => void;
