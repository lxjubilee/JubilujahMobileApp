import { logger } from '@/utils';
import { configureApiClient } from '@/services/api/client';
import { authEndpoints } from './authEndpoints';
import { isTwoFactor } from './authDto';
import { AuthUser, mapUser } from './authMappers';
import { tokenStore } from './tokenStore';
import { buildDeviceInfo } from './deviceInfo';
import { configureAuthClient, refreshSession } from './authClient';
import { clearSessionCookies } from './cookieJar';

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
    isAccessTokenExpired: () => tokenStore.isAccessTokenExpired(),
    persistTokens: ({ accessToken, refreshToken, expiresAt }) => {
      void tokenStore.updateTokens(accessToken, refreshToken, expiresAt);
    },
    onAuthFailure,
  });
  // The catalog/data client shares this session: give it the same single-flight
  // refresh so a 401 there renews the token instead of failing the request.
  configureApiClient(async () => {
    const outcome = await refreshSession();
    return outcome.result === 'ok' ? outcome.accessToken : null;
  });
  // Flush any jv_session cookie persisted from a previous run so mutations
  // (logout/change-password/delete) aren't treated as cookie requests → CSRF 403.
  void clearSessionCookies();
}

export const authService = {
  /** Email + password sign-in. Resolves to tokens, or a 2FA challenge. */
  async signIn(
    email: string,
    password: string,
    rememberMe: boolean,
    cfTurnstileToken?: string,
  ): Promise<SignInResult> {
    const deviceInfo = await buildDeviceInfo();
    const res = await authEndpoints.signin({
      email,
      password,
      rememberMe,
      cfTurnstileToken,
      deviceInfo,
    });
    if (isTwoFactor(res)) {
      return { kind: '2fa', verificationGuid: res.verificationGuid };
    }
    await tokenStore.save(res.tokens);
    const user = mapUser(res.user);
    await tokenStore.saveUser(user);
    return { kind: 'authenticated', user };
  },

  /** Complete a 2FA challenge with the emailed OTP code. */
  async verify2FA(
    email: string,
    code: string,
    verificationGuid: string,
    rememberMe: boolean,
  ): Promise<AuthUser> {
    const res = await authEndpoints.verifyLogin({
      email,
      verificationGuid,
      verificationCode: code,
      rememberMe,
    });
    await tokenStore.save(res.tokens);
    const user = mapUser(res.user);
    await tokenStore.saveUser(user);
    return user;
  },

  // --- Sign up ---

  /** Phase 1: request a 6-digit email verification code. No account yet. */
  async requestSignup(name: string, email: string, password: string): Promise<SignupChallenge> {
    const res = await authEndpoints.signup({ name: name.trim(), email: email.trim(), password });
    return { verificationGuid: res.verificationGuid, email: res.email };
  },

  /** Phase 2: confirm the code → account created + tokens issued (logged in). */
  async verifySignup(verificationGuid: string, verificationCode: string): Promise<AuthUser> {
    const res = await authEndpoints.verifySignup({
      verificationGuid,
      verificationCode: verificationCode.trim(),
      rememberMe: true,
    });
    await tokenStore.save(res.tokens);
    const user = mapUser(res.user);
    await tokenStore.saveUser(user);
    return user;
  },

  /** Resend the sign-up code for an in-progress sign-up. */
  resendSignup(verificationGuid: string) {
    return authEndpoints.sendSignupVerification(verificationGuid);
  },

  // --- Password / account ---

  /** Request a password-reset email (redeemed on the website). Always succeeds. */
  async forgotPassword(email: string): Promise<string> {
    const res = await authEndpoints.forgotPassword(email.trim());
    return res.message;
  },

  /**
   * Change the signed-in user's password (Bearer-authed). The server revokes the
   * user's other sessions; we pass the current refresh token so this session
   * stays alive. Cross-platform password sync to JubileeInspire is handled
   * server-side by the change-password handler — the mobile client never touches
   * JI's admin endpoints. See `API docs/API.md`.
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await authEndpoints.changePassword({
      current_password: currentPassword,
      new_password: newPassword,
      refreshToken: tokenStore.getRefreshToken() ?? undefined,
    });
  },

  /** Permanently delete the signed-in user's account (Bearer-authed, irreversible). */
  async deleteAccount(): Promise<void> {
    await authEndpoints.deleteAccount();
    await tokenStore.clear(); // session is revoked server-side; drop local tokens
  },

  /**
   * Restore a persisted session on cold start; null if there is none.
   *
   * "Keep me signed in" gives us a refresh token good for a YEAR, while the access
   * token lasts an hour — so on almost every launch the access token is stale and
   * must be renewed. Two rules make that reliable:
   *
   *  1. Renew PROACTIVELY. `GET /api/auth/me` answers 200 `{authenticated:false}`
   *     for an expired token — never 401 — so the 401 interceptor would never fire
   *     and the session would be thrown away with a perfectly good refresh token
   *     still in the keychain. That was the hourly-relogin bug.
   *  2. Only discard tokens when the server DEFINITIVELY rejects them. Offline,
   *     timeout and 5xx all keep the session and fall back to the cached profile.
   */
  async restoreSession(): Promise<AuthUser | null> {
    const tokens = await tokenStore.load();
    if (!tokens) return null;

    if (tokenStore.isAccessTokenExpired()) {
      const outcome = await refreshSession();
      if (outcome.result === 'invalid') {
        await tokenStore.clear(); // refresh token revoked/expired → a real sign-out
        return null;
      }
      if (outcome.result === 'error') {
        logger.warn('restoreSession: refresh unavailable — restoring cached session');
        return tokenStore.getUser();
      }
    }

    try {
      let me = await authEndpoints.me();
      // Not authenticated despite a token we believe is live (revoked token, or a
      // skewed device clock). Try one renewal before concluding the session is dead.
      if (!me.authenticated) {
        const outcome = await refreshSession();
        if (outcome.result === 'invalid') {
          await tokenStore.clear();
          return null;
        }
        if (outcome.result === 'error') return tokenStore.getUser();
        me = await authEndpoints.me();
      }
      if (me.authenticated && me.user) {
        const user = mapUser(me.user);
        void tokenStore.saveUser(user);
        return user;
      }
      await tokenStore.clear();
      return null;
    } catch (e) {
      // Network/server failure — never sign the user out over a blip.
      logger.warn('restoreSession: /me failed — restoring cached session', e);
      return tokenStore.getUser();
    }
  },

  async signOut(): Promise<void> {
    // Drop the session cookie first so the logout POST isn't seen as a cookie
    // request (which would demand CSRF and 403). We authenticate via Bearer.
    await clearSessionCookies();
    try {
      await authEndpoints.logout(tokenStore.getRefreshToken() ?? undefined);
    } catch {
      // best-effort; clear locally regardless
    }
    await tokenStore.clear();
  },
};
