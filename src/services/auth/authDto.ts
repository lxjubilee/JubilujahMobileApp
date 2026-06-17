/**
 * SSO auth API DTOs (see SignIn Machinism/SSO.txt). Kept separate from the
 * AuthUser domain model; authMappers.ts adapts between them.
 */

export interface UserDTO {
  id: string;
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  accountType?: string;
  accountId?: string;
  isAccountPrimary?: boolean;
  subscriptionStatus?: string;
  subscriptionPeriod?: string;
  profile_picture_url?: string;
  createdAt?: string;
  lastLoginAt?: string;
}

export interface LoginTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  deviceType: string;
  platform: string;
  appName: string;
  appVersion: string;
  language?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
  cfTurnstileToken?: string;
  /** Platform whose user DB to authenticate against (e.g. "jubilujah"). */
  source?: string;
  deviceInfo?: DeviceInfo;
}

/** Login may resolve to tokens OR a 2FA challenge. */
export interface LoginSuccessDTO {
  success: true;
  user: UserDTO;
  tokens: LoginTokens;
  trustToken?: string | null;
}
export interface Login2FADTO {
  success: true;
  requires2FA: true;
  verificationGuid: string;
}
export type LoginResponseDTO = LoginSuccessDTO | Login2FADTO;

export const isTwoFactor = (r: LoginResponseDTO): r is Login2FADTO =>
  (r as Login2FADTO).requires2FA === true;

export interface VerifyLoginRequest {
  code: string;
  verificationGuid: string;
  trustDevice?: boolean;
}
/** verify-login returns tokens FLAT (top-level), not nested under `tokens`. */
export interface VerifyLoginDTO {
  success: true;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  trustToken?: string | null;
  user?: UserDTO;
}

export interface MeDTO {
  success: true;
  user: UserDTO;
}

export interface RefreshDTO {
  success: true;
  accessToken: string;
  expiresAt: string;
}
