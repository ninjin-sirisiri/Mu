/**
 * Ad Blocker TypeScript Types
 * Requirements: 2.1, 5.2
 */

/**
 * Ad blocker settings structure (matches Rust AdBlockerSettings)
 */
export type AdBlockerSettings = {
  enabled: boolean;
  allowlist: string[];
  blockCount: number;
};

/**
 * Block statistics structure (matches Rust BlockStats)
 */
export type BlockStats = {
  totalBlocked: number;
  sessionBlocked: number;
};

/**
 * Default ad blocker settings
 */
export const DEFAULT_ADBLOCKER_SETTINGS: AdBlockerSettings = {
  enabled: true,
  allowlist: [],
  blockCount: 0
};
