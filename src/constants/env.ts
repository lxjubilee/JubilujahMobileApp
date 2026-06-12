import Constants from 'expo-constants';

/**
 * Environment configuration sourced from `app.json` -> `expo.extra`.
 * Keeping this in one typed module means screens/services never reach into
 * `Constants.expoConfig` directly, and swapping environments is a config change.
 */
type AppExtra = {
  cdnBaseUrl: string;
  apiBaseUrl: string;
  useMock: boolean;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Partial<AppExtra>;

export const ENV = {
  CDN_BASE_URL: extra.cdnBaseUrl ?? 'https://cdn.jubileeverse.com',
  API_BASE_URL: extra.apiBaseUrl ?? 'https://api.jubileeverse.com/v1',
  USE_MOCK: extra.useMock ?? true,
} as const;
