import { accountClient } from './accountClient';
import {
  AccountMeRes,
  AccountUserDTO,
  ChangePasswordReq,
  ForgotPasswordRes,
  ResendSignupRes,
  SigninReq,
  SigninRes,
  SignupReq,
  SignupRes,
  VerifySignupReq,
  VerifySignupRes,
} from './accountDto';
import { AuthUser, mapUser } from './authMappers';

/** Adapt the account API's lean user to the app's domain AuthUser. */
export const mapAccountUser = (u: AccountUserDTO): AuthUser =>
  mapUser({ id: u.id, email: u.email, displayName: u.displayName });

/**
 * Typed endpoints for the Jubilujah identity API — the only place these URLs
 * live. Cookie/CSRF handling is in `accountClient`.
 */
export const accountApi = {
  signup: (body: SignupReq) =>
    accountClient.post<SignupRes>('/api/auth/signup', body).then((r) => r.data),

  verifySignup: (body: VerifySignupReq) =>
    accountClient.post<VerifySignupRes>('/api/auth/verify-signup', body).then((r) => r.data),

  resendSignup: (verificationGuid: string) =>
    accountClient
      .post<ResendSignupRes>('/api/auth/send-signup-verification', { verificationGuid })
      .then((r) => r.data),

  signin: (body: SigninReq) =>
    accountClient.post<SigninRes>('/api/auth/signin', body).then((r) => r.data),

  forgotPassword: (email: string) =>
    accountClient
      .post<ForgotPasswordRes>('/api/auth/forgot-password', { email })
      .then((r) => r.data),

  changePassword: (body: ChangePasswordReq) =>
    accountClient.post('/api/auth/change-password', body).then((r) => r.data),

  deleteAccount: () => accountClient.delete('/api/auth/account').then((r) => r.data),

  me: () => accountClient.get<AccountMeRes>('/api/auth/me').then((r) => r.data),

  logout: () => accountClient.post('/api/auth/logout').then((r) => r.data),
};
