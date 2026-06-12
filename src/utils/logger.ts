/* eslint-disable no-console */

/**
 * Thin logging wrapper. Centralizing log calls means we can later route to a
 * crash/analytics service (Sentry, etc.) without touching call sites.
 */
const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : true;

export const logger = {
  debug: (...args: unknown[]) => {
    if (isDev) console.log('[Jubilujah]', ...args);
  },
  info: (...args: unknown[]) => console.info('[Jubilujah]', ...args),
  warn: (...args: unknown[]) => console.warn('[Jubilujah]', ...args),
  error: (...args: unknown[]) => console.error('[Jubilujah]', ...args),
};
