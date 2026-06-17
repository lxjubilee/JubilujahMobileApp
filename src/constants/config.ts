import { ENV } from './env';

/**
 * Global feature/config flags. `USE_MOCK` is the single switch that decides
 * whether repositories read local mock JSON or call the live jubileeverse API.
 * Flip `useMock` in app.json `extra` (or override here) to swap data sources
 * with zero changes at any call site.
 */
export const CONFIG = {
  USE_MOCK: ENV.USE_MOCK,
  /** 'mock' | 'manifest' | 'api' — which data source repositories read from. */
  DATA_SOURCE: ENV.DATA_SOURCE,
  /** SSO auth API base URL (separate host from the catalog API). */
  AUTH_BASE_URL: ENV.AUTH_BASE_URL,
  AUTH_MOBILE_CLIENT_KEY: ENV.AUTH_MOBILE_CLIENT_KEY,
  /** Platform `source` sent on /api/auth/login (which user DB to authenticate against). */
  AUTH_SOURCE: ENV.AUTH_SOURCE,
  /** Cloudflare Turnstile site key for the sign-in CAPTCHA (empty = disabled). */
  TURNSTILE_SITE_KEY: ENV.TURNSTILE_SITE_KEY,
  /** Origin the Turnstile widget runs under (allow-listed for the site key). */
  TURNSTILE_BASE_URL: ENV.TURNSTILE_BASE_URL,
  /** Jubilujah identity API base URL (cookie-session: sign-up, forgot password). */
  ACCOUNT_BASE_URL: ENV.ACCOUNT_BASE_URL,
  API_TIMEOUT_MS: 15000,
  /** Simulated network latency for mock responses, to mimic real loading UX. */
  MOCK_LATENCY_MS: 350,
  RECENT_SEARCHES_LIMIT: 10,
} as const;
