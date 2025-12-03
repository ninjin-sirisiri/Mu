import { type ErrorCallback, type TabOperationError } from './types';

/**
 * Error callback for displaying user-facing errors (e.g., toast notifications)
 */
let onErrorCallback: ErrorCallback | null = null;

/**
 * Set the error callback for user-facing error notifications
 */
// eslint-disable-next-line promise/prefer-await-to-callbacks
export function setErrorCallback(callback: ErrorCallback | null): void {
  onErrorCallback = callback;
}

/**
 * Log an error for debugging
 */
export function logError(operation: string, error: unknown): void {
  // eslint-disable-next-line no-console
  console.error(`[TabStore] Error in ${operation}:`, error);
}

/**
 * Notify user of an error via callback
 */
export function notifyError(error: TabOperationError): void {
  if (onErrorCallback) {
    onErrorCallback(error);
  }
}
