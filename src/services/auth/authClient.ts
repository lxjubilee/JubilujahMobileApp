import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { CONFIG } from '@/constants';
import { logger } from '@/utils';
import type { ApiError } from '@/services/api';

/**
 * Dedicated axios instance for the SSO auth API (a different host than the
 * catalog API). Mirrors services/api/client.ts: an in-memory bearer token + a
 * normalized ApiError. Adds transparent single-flight refresh on 401.
 */
export const authClient: AxiosInstance = axios.create({
  baseURL: CONFIG.AUTH_BASE_URL,
  timeout: CONFIG.API_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

let accessToken: string | null = null;

/** Set/clear the bearer token used on every auth-client request. */
export const setAccessToken = (token: string | null): void => {
  accessToken = token;
};

// Injected by the auth wiring so this module stays free of redux/tokenStore imports.
interface SessionHandlers {
  getRefreshToken: () => string | null;
  persistAccessToken: (token: string, expiresAt?: string) => void;
  onAuthFailure: () => void;
}
let handlers: SessionHandlers | null = null;
export const configureAuthClient = (h: SessionHandlers): void => {
  handlers = h;
};

const toApiError = (error: AxiosError): ApiError => ({
  status: error.response?.status ?? 0,
  message:
    (error.response?.data as { message?: string; error?: string })?.message ??
    (error.response?.data as { error?: string })?.error ??
    error.message ??
    'Network request failed',
  raw: error.response?.data,
});

// Paths that must never trigger a refresh-retry (the auth handshake itself).
const REFRESH_EXEMPT = ['/api/auth/login', '/api/auth/refresh', '/api/auth/verify-login'];
const isExempt = (url?: string) => !!url && REFRESH_EXEMPT.some((p) => url.includes(p));

authClient.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  logger.debug('AUTH →', config.method?.toUpperCase(), config.url);
  return config;
});

// Single-flight refresh: concurrent 401s share one refresh round-trip.
let refreshPromise: Promise<string> | null = null;

async function runRefresh(): Promise<string> {
  const refreshToken = handlers?.getRefreshToken();
  if (!refreshToken) throw new Error('no refresh token');
  // Bare axios call (no interceptors) to avoid recursive refresh loops.
  const res = await axios.post<{ success: boolean; accessToken: string; expiresAt?: string }>(
    `${CONFIG.AUTH_BASE_URL}/api/auth/refresh`,
    { refreshToken },
    { timeout: CONFIG.API_TIMEOUT_MS, headers: { 'Content-Type': 'application/json' } },
  );
  const token = res.data.accessToken;
  setAccessToken(token);
  handlers?.persistAccessToken(token, res.data.expiresAt);
  return token;
}

authClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;

    if (status === 401 && original && !original._retry && !isExempt(original.url) && handlers) {
      original._retry = true;
      try {
        refreshPromise = refreshPromise ?? runRefresh();
        const newToken = await refreshPromise;
        refreshPromise = null;
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return authClient(original);
      } catch (refreshErr) {
        refreshPromise = null;
        logger.warn('AUTH refresh failed — signing out', refreshErr);
        handlers.onAuthFailure();
        return Promise.reject(toApiError(error));
      }
    }

    const apiError = toApiError(error);
    logger.error('AUTH ✗', apiError.status, apiError.message);
    return Promise.reject(apiError);
  },
);
