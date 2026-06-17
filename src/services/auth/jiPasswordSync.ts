import axios from 'axios';
import { CONFIG } from '@/constants';
import { logger } from '@/utils';

/**
 * Cross-platform password sync: push a new password to the JubileeInspire (JI)
 * DB after it changes on Jubilujah, via JI's server-to-server admin endpoints.
 *
 * Two steps: mint a short-lived service token from client credentials, then call
 * /admin/set-password with that Bearer token. Uses a bare axios instance (no
 * interceptors / cookie jar) on the JI host (= AUTH_BASE_URL).
 *
 * NOTE: the client secret ships in the app per product decision — the robust
 * pattern is server-side (see `API docs/PASSWORD_SYNC.md`). Treat it as exposed.
 */
const JI_BASE = CONFIG.AUTH_BASE_URL.replace(/\/+$/, '');

const jiClient = axios.create({
  baseURL: JI_BASE,
  timeout: CONFIG.API_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

interface TokenCache {
  token: string;
  expiresAt: number; // epoch ms
}
let cache: TokenCache | null = null;

/** Mint (or reuse a cached) JI service token. */
async function getServiceToken(forceRefresh = false): Promise<string> {
  const now = Date.now();
  if (!forceRefresh && cache && cache.expiresAt > now + 30_000) return cache.token;

  const res = await jiClient.post<{ access_token: string; expires_in?: number }>(
    '/api/auth/service/token',
    {
      client_id: CONFIG.JI_SERVICE_CLIENT_ID,
      client_secret: CONFIG.JI_SERVICE_CLIENT_SECRET,
    },
  );
  const token = res.data.access_token;
  const ttlMs = (res.data.expires_in ?? 600) * 1000;
  cache = { token, expiresAt: now + ttlMs };
  return token;
}

/**
 * Set the user's password in the JubileeInspire DB. Retries once with a fresh
 * token if the cached one was rejected (401).
 */
export async function syncJiPassword(email: string, newPassword: string): Promise<void> {
  const attempt = async (force: boolean) => {
    const token = await getServiceToken(force);
    await jiClient.post(
      '/api/auth/admin/set-password',
      { email, newPassword },
      { headers: { Authorization: `Bearer ${token}` } },
    );
  };

  try {
    await attempt(false);
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.status === 401) {
      cache = null;
      await attempt(true); // token likely expired — retry once with a new one
      return;
    }
    throw e;
  }
}
