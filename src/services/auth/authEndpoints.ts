import { authClient } from './authClient';
import {
  LoginRequest,
  LoginResponseDTO,
  MeDTO,
  RefreshDTO,
  VerifyLoginRequest,
  VerifyLoginDTO,
} from './authDto';

/**
 * Typed SSO endpoint functions — the only place auth URLs are declared.
 * Sign-up endpoints are declared but intentionally not implemented yet (the
 * backend contract is still pending); calling them throws a clear error so the
 * UI can wire to a stable surface now.
 */
export const authEndpoints = {
  login: (body: LoginRequest) =>
    authClient.post<LoginResponseDTO>('/api/auth/login', body).then((r) => r.data),

  verifyLogin: (body: VerifyLoginRequest) =>
    authClient.post<VerifyLoginDTO>('/api/auth/verify-login', body).then((r) => r.data),

  me: () => authClient.get<MeDTO>('/api/auth/me').then((r) => r.data),

  refresh: (refreshToken: string) =>
    authClient.post<RefreshDTO>('/api/auth/refresh', { refreshToken }).then((r) => r.data),

  logout: () => authClient.post('/api/auth/logout').then((r) => r.data),

  // --- Sign Up (UI built, API deferred until the backend contract is known) ---
  signup: (_body: { email: string; password: string; displayName?: string }): Promise<never> => {
    throw new Error('Sign up is coming soon.');
  },
  verifySignup: (_body: { email: string; code: string }): Promise<never> => {
    throw new Error('Sign up is coming soon.');
  },
};
