import axios, { AxiosError, AxiosInstance, AxiosResponseHeaders, RawAxiosResponseHeaders } from 'axios';
import { NativeModules } from 'react-native';
import { CONFIG } from '@/constants';
import { logger } from '@/utils';
import type { ApiError } from '@/services/api';

/**
 * Axios instance for the Jubilujah identity API (api.jubilujah.com). Cookie-based:
 * the native networking layer stores & sends the HttpOnly `jv_session` cookie and
 * the readable `jv_csrf` cookie automatically. For CSRF (double-submit) we must
 * echo `jv_csrf` back in the `X-CSRF-Token` header on every mutation.
 *
 * Reading the cookie value is the catch: React Native keeps cookies in a NATIVE
 * jar and does NOT expose `Set-Cookie` to JS — so the value must be read from the
 * native store via @react-native-cookies/cookies (primary). The Set-Cookie header
 * parse is kept only as a best-effort fallback for platforms that do expose it.
 */
const BASE = CONFIG.ACCOUNT_BASE_URL.replace(/\/+$/, '');

// Lazily/guardedly load the native cookie manager — importing it eagerly throws
// at module eval if it isn't linked (old build), which would crash app startup.
type CookieManagerLike = {
  get: (url: string) => Promise<Record<string, { value?: string } | undefined>>;
};
let cookieManager: CookieManagerLike | null = null;
let cookieManagerResolved = false;
function getCookieManager(): CookieManagerLike | null {
  if (!cookieManagerResolved) {
    cookieManagerResolved = true;
    // Only require the package when its native module is actually linked —
    // requiring it otherwise throws at load (it reports "Add RNCookieManagerIOS…")
    // and surfaces as an uncaught error. Checking NativeModules first keeps the
    // app fully functional on builds that don't include the module yet.
    const linked = !!(NativeModules.RNCookieManagerIOS || NativeModules.RNCookieManagerAndroid);
    if (linked) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        cookieManager = require('@react-native-cookies/cookies').default as CookieManagerLike;
      } catch (e) {
        logger.warn('Cookie manager failed to load', e);
      }
    } else {
      logger.warn('Native cookie module not linked — CSRF needs a dev-client rebuild');
    }
  }
  return cookieManager;
}

export const accountClient: AxiosInstance = axios.create({
  baseURL: BASE,
  timeout: CONFIG.API_TIMEOUT_MS,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

/** Fallback CSRF token scraped from a Set-Cookie header (rarely populated in RN). */
let csrfFromHeader: string | null = null;

function captureCsrf(headers?: RawAxiosResponseHeaders | AxiosResponseHeaders): void {
  const raw = (headers as Record<string, unknown> | undefined)?.['set-cookie'];
  if (!raw) return;
  const list = Array.isArray(raw) ? raw : [String(raw)];
  for (const cookie of list) {
    const m = /jv_csrf=([^;,\s]+)/.exec(cookie);
    if (m) {
      csrfFromHeader = m[1];
      return;
    }
  }
}

/** Read jv_csrf from the native cookie store (primary), else the header fallback. */
async function readCsrf(): Promise<string | null> {
  const manager = getCookieManager();
  if (manager) {
    try {
      const cookies = await manager.get(BASE);
      const value = cookies?.jv_csrf?.value;
      if (value) return value;
    } catch (e) {
      logger.warn('accountClient: readCsrf via cookie store failed', e);
    }
  }
  return csrfFromHeader;
}

const toApiError = (error: AxiosError): ApiError => {
  const data = error.response?.data as { message?: string; error?: string } | undefined;
  return {
    status: error.response?.status ?? 0,
    message: data?.message ?? data?.error ?? error.message ?? 'Network request failed',
    raw: error.response?.data,
  };
};

accountClient.interceptors.response.use(
  (response) => {
    captureCsrf(response.headers);
    return response;
  },
  (error: AxiosError) => {
    if (error.response) captureCsrf(error.response.headers);
    const apiError = toApiError(error);
    logger.error('ACCOUNT ✗', apiError.status, apiError.message);
    return Promise.reject(apiError);
  },
);

accountClient.interceptors.request.use(async (config) => {
  const method = (config.method ?? 'get').toLowerCase();
  if (method !== 'get') {
    let csrf = await readCsrf();
    if (!csrf) {
      // No token yet — prime the cookie jar with a GET so the server issues
      // jv_csrf (stored natively), then read it back.
      try {
        await accountClient.get('/api/auth/me');
      } catch {
        // /me works unauthenticated; we only need the cookie it sets
      }
      csrf = await readCsrf();
    }
    if (csrf) config.headers['X-CSRF-Token'] = csrf;
  }
  logger.debug('ACCOUNT →', config.method?.toUpperCase(), config.url);
  return config;
});
