import { configureAuthClient } from './authClient';
import { authEndpoints } from './authEndpoints';
import { isTwoFactor } from './authDto';
import { AuthUser, mapUser } from './authMappers';
import { tokenStore } from './tokenStore';
import { buildDeviceInfo } from './deviceInfo';

export type SignInResult =
  | { kind: 'authenticated'; user: AuthUser }
  | { kind: '2fa'; verificationGuid: string };

/**
 * Wires the auth client's refresh/failure hooks to the token store. `onAuthFailure`
 * is called when a refresh fails (session truly dead) — the app should sign out.
 * Call once at startup.
 */
export function initAuthClient(onAuthFailure: () => void): void {
  configureAuthClient({
    getRefreshToken: () => tokenStore.getRefreshToken(),
    persistAccessToken: (token, expiresAt) => {
      void tokenStore.updateAccessToken(token, expiresAt);
    },
    onAuthFailure,
  });
}

export const authService = {
  async signIn(email: string, password: string, rememberMe: boolean): Promise<SignInResult> {
    const deviceInfo = await buildDeviceInfo();
    const res = await authEndpoints.login({ email, password, rememberMe, deviceInfo });
    if (isTwoFactor(res)) {
      return { kind: '2fa', verificationGuid: res.verificationGuid };
    }
    await tokenStore.save({
      accessToken: res.tokens.accessToken,
      refreshToken: res.tokens.refreshToken,
      expiresAt: res.tokens.expiresAt,
    });
    return { kind: 'authenticated', user: mapUser(res.user) };
  },

  async verify2FA(
    code: string,
    verificationGuid: string,
    trustDevice: boolean,
  ): Promise<AuthUser> {
    const res = await authEndpoints.verifyLogin({ code, verificationGuid, trustDevice });
    await tokenStore.save({
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      expiresAt: res.expiresAt,
    });
    if (res.user) return mapUser(res.user);
    const me = await authEndpoints.me();
    return mapUser(me.user);
  },

  /** Restore a persisted session on cold start; null if none/invalid. */
  async restoreSession(): Promise<AuthUser | null> {
    const tokens = await tokenStore.load();
    if (!tokens) return null;
    try {
      const me = await authEndpoints.me(); // 401 → interceptor refreshes transparently
      return mapUser(me.user);
    } catch {
      await tokenStore.clear();
      return null;
    }
  },

  async signOut(): Promise<void> {
    try {
      await authEndpoints.logout();
    } catch {
      // best-effort; clear locally regardless
    }
    await tokenStore.clear();
  },
};
