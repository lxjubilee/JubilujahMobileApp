/**
 * DTOs for the Jubilujah identity API (api.jubilujah.com). See
 * `API docs/AUTH_API 1.md`. Cookie-session based — responses carry no tokens.
 */

export interface AccountUserDTO {
  id: string;
  email: string;
  displayName?: string;
}

/** POST /api/auth/signup — request a verification code (no account yet). */
export interface SignupReq {
  name: string;
  email: string;
  password: string;
}
export interface SignupRes {
  success: boolean;
  requiresVerification: boolean;
  email: string;
  verificationGuid: string;
}

/** POST /api/auth/verify-signup — confirm the code, create account, set session. */
export interface VerifySignupReq {
  verificationGuid: string;
  verificationCode: string;
  rememberMe?: boolean;
}
export interface VerifySignupRes {
  user: AccountUserDTO;
}

/** POST /api/auth/send-signup-verification — resend the code. */
export interface ResendSignupRes {
  success: boolean;
  verificationGuid: string;
  resendsRemaining?: number;
}

/** POST /api/auth/forgot-password — anti-enumeration; always succeeds. */
export interface ForgotPasswordRes {
  ok: boolean;
  message: string;
}

/** POST /api/auth/signin — establishes a cookie session (used to re-auth before
 *  destructive actions like delete-account). */
export interface SigninReq {
  email: string;
  password: string;
}
export interface SigninRes {
  user?: AccountUserDTO;
  requires2FA?: boolean;
  verificationGuid?: string;
}

/** POST /api/auth/change-password — note the snake_case field names. */
export interface ChangePasswordReq {
  current_password: string;
  new_password: string;
}

/** GET /api/auth/me — current cookie session. */
export interface AccountMeRes {
  authenticated: boolean;
  user?: AccountUserDTO;
  roles?: string[];
}
