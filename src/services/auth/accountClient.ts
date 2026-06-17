import axios, { AxiosError, AxiosInstance, AxiosResponseHeaders, RawAxiosResponseHeaders } from 'axios';
import { NativeModules } from 'react-native';
import { CONFIG } from '@/constants';
import { logger } from '@/utils';
import type { ApiError } from '@/services/api';
import { accountSession } from './accountSession';

/**
 * Axios instance for the Jubilujah identity API (api.jubilujah.com), implementing
 * the dual-carrier auth model (AUTH_API.md §1, §9.6):
 *
 *  - **No session yet** (signup / signin / forgot / verify) → COOKIE carrier:
 *    these need CSRF, so we read `jv_csrf` and send `X-CSRF-Token`.
 *  - **Have a session** (after signin/verify) → BEARER carrier: send
 *    `Authorization: Bearer <jv_session>` with NO cookie → CSRF-exempt. This is
 *    how change-password / delete / me / logout authenticate.
 *
 * After a session-setting call we capture the `jv_session` value and CLEAR the
 * cookies, so subsequent requests are purely Bearer (a lingering session cookie
 * would otherwise be treated as the cookie carrier and re-demand CSRF).
 *
 * Reading `jv_csrf`/`jv_session` and clearing cookies needs the native cookie
 * store (@react-native-cookies/cookies); a Set-Cookie header parse is a fallback.
 */
const BASE = CONFIG.ACCOUNT_BASE_URL.replace(/\/+$/, '');

type CookieManagerLike = {
  get: (url: string) => Promise<Record<string, { value?: string } | undefined>>;
  clearByName?: (url: string, name: string) => Promise<boolean>;
};
let cookieManager: CookieManagerLike | null = null;
let cookieManagerResolved = false;
function getCookieManager(): CookieManagerLike | null {
  if (!cookieManagerResolved) {
    cookieManagerResolved = true;
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

// Fallback cookie values scraped from Set-Cookie headers (RN often won't expose them).
let csrfFromHeader: string | null = null;
let sessionFromHeader: string | null = null;

function captureCookiesFromHeader(headers?: RawAxiosResponseHeaders | AxiosResponseHeaders): void {
  const raw = (headers as Record<string, unknown> | undefined)?.['set-cookie'];
  if (!raw) return;
  const list = Array.isArray(raw) ? raw : [String(raw)];
  for (const cookie of list) {
    const csrf = /jv_csrf=([^;,\s]+)/.exec(cookie);
    if (csrf) csrfFromHeader = csrf[1];
    const sess = /jv_session=([^;,\s]+)/.exec(cookie);
    if (sess) sessionFromHeader = sess[1];
  }
}

/** Read a cookie value from the native store (primary) or the header fallback. */
async function readCookie(name: 'jv_csrf' | 'jv_session'): Promise<string | null> {
  const manager = getCookieManager();
  if (manager) {
    try {
      const cookies = await manager.get(BASE);
      const value = cookies?.[name]?.value;
      if (value) return value;
    } catch (e) {
      logger.warn('accountClient: readCookie failed', e);
    }
  }
  return name === 'jv_csrf' ? csrfFromHeader : sessionFromHeader;
}

/** Drop the session + csrf cookies so later requests are Bearer-only (CSRF-exempt). */
async function clearAccountCookies(): Promise<void> {
  const manager = getCookieManager();
  if (manager?.clearByName) {
    try {
      await manager.clearByName(BASE, 'jv_session');
      await manager.clearByName(BASE, 'jv_csrf');
    } catch (e) {
      logger.warn('accountClient: clearAccountCookies failed', e);
    }
  }
}

const SESSION_SETTING = ['/api/auth/signin', '/api/auth/verify-signup', '/api/auth/verify-login'];
const setsSession = (url?: string) => !!url && SESSION_SETTING.some((u) => url.includes(u));

const toApiError = (error: AxiosError): ApiError => {
  const data = error.response?.data as { message?: string; error?: string } | undefined;
  return {
    status: error.response?.status ?? 0,
    message: data?.message ?? data?.error ?? error.message ?? 'Network request failed',
    raw: error.response?.data,
  };
};

accountClient.interceptors.response.use(
  async (response) => {
    captureCookiesFromHeader(response.headers);
    // A successful sign-in/verify sets jv_session — capture it for the Bearer
    // carrier, then clear cookies so future calls don't re-trigger CSRF.
    if (setsSession(response.config.url)) {
      const session = await readCookie('jv_session');
      if (session) {
        await accountSession.set(session);
        await clearAccountCookies();
      }
    }
    return response;
  },
  (error: AxiosError) => {
    if (error.response) captureCookiesFromHeader(error.response.headers);
    const apiError = toApiError(error);
    logger.error('ACCOUNT ✗', apiError.status, apiError.message);
    return Promise.reject(apiError);
  },
);

accountClient.interceptors.request.use(async (config) => {
  const method = (config.method ?? 'get').toLowerCase();
  const token = accountSession.get();

  if (token) {
    // Bearer carrier — authenticated and CSRF-exempt (no cookie sent).
    config.headers.Authorization = `Bearer ${token}`;
  } else if (method !== 'get') {
    // Cookie carrier — establish/unauthenticated mutation needs CSRF.
    let csrf = await readCookie('jv_csrf');
    if (!csrf) {
      try {
        await accountClient.get('/api/auth/me'); // prime jv_csrf
      } catch {
        // /me works unauthenticated; we only need the cookie it sets
      }
      csrf = await readCookie('jv_csrf');
    }
    if (csrf) config.headers['X-CSRF-Token'] = csrf;
  }

  logger.debug('ACCOUNT →', config.method?.toUpperCase(), config.url);
  return config;
});
