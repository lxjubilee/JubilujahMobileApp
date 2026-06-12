import { ENV } from './env';

/**
 * Global feature/config flags. `USE_MOCK` is the single switch that decides
 * whether repositories read local mock JSON or call the live jubileeverse API.
 * Flip `useMock` in app.json `extra` (or override here) to swap data sources
 * with zero changes at any call site.
 */
export const CONFIG = {
  USE_MOCK: ENV.USE_MOCK,
  API_TIMEOUT_MS: 15000,
  /** Simulated network latency for mock responses, to mimic real loading UX. */
  MOCK_LATENCY_MS: 350,
  RECENT_SEARCHES_LIMIT: 10,
} as const;
