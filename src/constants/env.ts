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
  /** Platform `source` sent on POST /api/auth/login — picks the user DB to auth against. */
  authSource: string;
  /** Cloudflare Turnstile site key for the sign-in CAPTCHA (empty = CAPTCHA off). */
  turnstileSiteKey: string;
  /** Origin the Turnstile widget runs under (must be allow-listed for the site key). */
  turnstileBaseUrl: string;
  /** Jubilujah identity API host (cookie-session based: sign-up, forgot password). */
  accountBaseUrl: string;
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
  // Which platform's user DB /api/auth/login should authenticate against.
  AUTH_SOURCE: extra.authSource ?? 'jubilujah',
  // Cloudflare Turnstile (sign-in CAPTCHA). Empty disables the widget.
  TURNSTILE_SITE_KEY: extra.turnstileSiteKey ?? '',
  TURNSTILE_BASE_URL: extra.turnstileBaseUrl ?? 'https://jubilujah.com',
  // Jubilujah identity API (cookie-session) — sign-up + forgot-password flows.
  ACCOUNT_BASE_URL: extra.accountBaseUrl ?? 'https://api.jubilujah.com',
} as const;
