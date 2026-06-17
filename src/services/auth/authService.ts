import { CONFIG } from '@/constants';
import type { ApiError } from '@/services/api';
import { configureAuthClient } from './authClient';
import { authEndpoints } from './authEndpoints';
import { isTwoFactor } from './authDto';
import { AuthUser, mapUser } from './authMappers';
import { tokenStore } from './tokenStore';
import { buildDeviceInfo } from './deviceInfo';
import { accountApi, mapAccountUser } from './accountApi';

export type SignInResult =
  | { kind: 'authenticated'; user: AuthUser }
  | { kind: '2fa'; verificationGuid: string };

export interface SignupChallenge {
  verificationGuid: string;
  email: string;
}

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
  async signIn(
    email: string,
    password: string,
    rememberMe: boolean,
    cfTurnstileToken?: string,
  ): Promise<SignInResult> {
    const deviceInfo = await buildDeviceInfo();
    const res = await authEndpoints.login({
      email,
      password,
      rememberMe,
      source: CONFIG.AUTH_SOURCE,
      cfTurnstileToken,
      deviceInfo,
    });
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

  // --- Jubilujah identity API (cookie-session): sign-up + forgot password ---

  /** Phase 1: request a 6-digit email verification code. No account yet. */
  async requestSignup(name: string, email: string, password: string): Promise<SignupChallenge> {
    const res = await accountApi.signup({ name: name.trim(), email: email.trim(), password });
    return { verificationGuid: res.verificationGuid, email: res.email };
  },

  /** Phase 2: confirm the code → account created + session cookie set (logged in). */
  async verifySignup(verificationGuid: string, verificationCode: string): Promise<AuthUser> {
    const res = await accountApi.verifySignup({
      verificationGuid,
      verificationCode: verificationCode.trim(),
      rememberMe: true,
    });
    return mapAccountUser(res.user);
  },

  /** Resend the sign-up code for an in-progress sign-up. */
  resendSignup(verificationGuid: string) {
    return accountApi.resendSignup(verificationGuid);
  },

  /** Request a password-reset email (redeemed on the website). Always succeeds. */
  async forgotPassword(email: string): Promise<string> {
    const res = await accountApi.forgotPassword(email.trim());
    return res.message;
  },

  /**
   * Change the signed-in user's password. Re-authenticates against the Jubilujah
   * API first (using the current password) to obtain a `jv_session` — the app's
   * sign-in uses the SSO (bearer), which doesn't set that cookie.
   *
   * Cross-platform note: syncing the new password to the JubileeInspire DB is a
   * SERVER-SIDE concern — the Jubilujah backend does it inside its change-password
   * handler (mint a JI service token → POST /admin/set-password). The mobile app
   * must NEVER hold the `client_secret` or call JI's admin endpoints (the secret
   * would be extractable from the binary → account-takeover). See
   * `API docs/PASSWORD_SYNC.md`.
   */
  async changePassword(email: string, currentPassword: string, newPassword: string): Promise<void> {
    let res;
    try {
      res = await accountApi.signin({ email, password: currentPassword });
    } catch (e) {
      if ((e as ApiError)?.status === 401) throw new Error('Current password is incorrect.');
      throw e;
    }
    if (res.requires2FA) {
      throw new Error('Please sign in on Jubilujah first to change your password.');
    }
    await accountApi.changePassword({
      current_password: currentPassword,
      new_password: newPassword,
    });
  },

  /**
   * Permanently delete the user's account (irreversible). Re-authenticates against
   * the Jubilujah API first to obtain a `jv_session` — required because the app's
   * sign-in uses the SSO (bearer), which doesn't set that cookie.
   */
  async deleteAccount(email: string, password: string): Promise<void> {
    const res = await accountApi.signin({ email, password });
    if (res.requires2FA) {
      throw new Error('This account needs verification before it can be deleted. Please sign in on Jubilujah first.');
    }
    await accountApi.deleteAccount();
    await tokenStore.clear(); // server clears the cookie session; drop local tokens too
  },

  /** Restore a persisted session on cold start; null if none/invalid. */
  async restoreSession(): Promise<AuthUser | null> {
    const tokens = await tokenStore.load();
    if (tokens) {
      try {
        const me = await authEndpoints.me(); // 401 → interceptor refreshes transparently
        return mapUser(me.user);
      } catch {
        await tokenStore.clear();
      }
    }
    // Fall back to the cookie session created by sign-up on this API.
    try {
      const me = await accountApi.me();
      if (me.authenticated && me.user) return mapAccountUser(me.user);
    } catch {
      // no cookie session either
    }
    return null;
  },

  async signOut(): Promise<void> {
    try {
      await authEndpoints.logout();
    } catch {
      // best-effort; clear locally regardless
    }
    try {
      await accountApi.logout(); // clear the cookie session too
    } catch {
      // best-effort
    }
    await tokenStore.clear();
  },
};
