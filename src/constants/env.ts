import Constants from 'expo-constants';

/**
 * Environment configuration sourced from `app.json` -> `expo.extra`.
 * Keeping this in one typed module means screens/services never reach into
 * `Constants.expoConfig` directly, and swapping environments is a config change.
 */
/** Which data source backs the repositories. See `repositories.ts`. */
export type DataSourceKind = 'mock' | 'manifest' | 'api';

type AppExtra = {
  cdnBaseUrl: string;
  apiBaseUrl: string;
  useMock: boolean;
  /** Explicit source selector; takes precedence over `useMock` when set. */
  dataSource: DataSourceKind;
  /** SSO auth API host (different service than the catalog API). */
  authBaseUrl: string;
  /** Prod-only: key for POST /api/auth/mobile/login to skip Turnstile CAPTCHA. */
  authMobileClientKey: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Partial<AppExtra>;

const useMock = extra.useMock ?? true;

export const ENV = {
  CDN_BASE_URL: extra.cdnBaseUrl ?? 'https://cdn.jubileeverse.com',
  API_BASE_URL: extra.apiBaseUrl ?? 'https://api.jubileeverse.com/v1',
  USE_MOCK: useMock,
  // Backward-compatible: fall back to the old boolean when `dataSource` is unset.
  DATA_SOURCE: (extra.dataSource ?? (useMock ? 'mock' : 'api')) as DataSourceKind,
  // Auth (SSO) — UAT by default; CAPTCHA is disabled there so /api/auth/login works directly.
  AUTH_BASE_URL: extra.authBaseUrl ?? 'https://uatapi.jubileeinspire.com',
  AUTH_MOBILE_CLIENT_KEY: extra.authMobileClientKey ?? '',
} as const;
