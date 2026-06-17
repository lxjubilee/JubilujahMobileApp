import * as SecureStore from 'expo-secure-store';
import { logger } from '@/utils';

/**
 * Stores the Jubilujah `jv_session` token (the value of the jv_session cookie set
 * at sign-in/sign-up). The app presents it as `Authorization: Bearer <token>` on
 * authenticated Jubilujah calls (the dual-carrier model — see AUTH_API.md §9.6),
 * which are CSRF-exempt. Kept in the OS secure store + an in-memory mirror so the
 * request interceptor can read it synchronously.
 */
const KEY = 'jubilujah.account.jvSession';

let memo: string | null = null;

export const accountSession = {
  /** In-memory accessor (sync) used by the account client's request interceptor. */
  get: (): string | null => memo,

  /** Load from secure storage into memory. Returns the token (or null). */
  async load(): Promise<string | null> {
    try {
      memo = (await SecureStore.getItemAsync(KEY)) ?? null;
    } catch (e) {
      logger.warn('accountSession.load failed', e);
    }
    return memo;
  },

  async set(token: string): Promise<void> {
    memo = token;
    try {
      await SecureStore.setItemAsync(KEY, token);
    } catch (e) {
      logger.warn('accountSession.set failed', e);
    }
  },

  async clear(): Promise<void> {
    memo = null;
    try {
      await SecureStore.deleteItemAsync(KEY);
    } catch (e) {
      logger.warn('accountSession.clear failed', e);
    }
  },
};
