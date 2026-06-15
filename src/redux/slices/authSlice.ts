import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { authService } from '@/services/auth';
import type { AuthUser } from '@/services/auth';
import type { ApiError } from '@/services/api';

export type { AuthUser };

export type AuthStatus = 'restoring' | 'idle' | 'loading' | 'authenticated' | 'error';

interface AuthState {
  user: AuthUser | null;
  status: AuthStatus;
  error: string | null;
  /** Set when login returned a 2FA challenge; drives the TwoFactor screen. */
  pending2FA: { verificationGuid: string } | null;
  /**
   * True only when a session was *restored* on app launch (cold start) — the
   * "Choose your profile" gate then shows once. A fresh in-session sign-in skips
   * the gate and goes straight to Home.
   */
  profileGatePending: boolean;
}

const initialState: AuthState = {
  user: null,
  status: 'restoring', // App dispatches restoreSession() on launch.
  error: null,
  pending2FA: null,
  profileGatePending: false,
};

const errMessage = (e: unknown): string =>
  (e as ApiError)?.message ?? (e as Error)?.message ?? 'Something went wrong';

/** Cold-start: rebuild the session from secure storage (validates via /me). */
export const restoreSession = createAsyncThunk('auth/restore', () =>
  authService.restoreSession(),
);

/** Email + password sign-in. May resolve to a 2FA challenge instead of a user. */
export const signIn = createAsyncThunk(
  'auth/signIn',
  (args: { email: string; password: string; rememberMe?: boolean }, { rejectWithValue }) =>
    authService
      .signIn(args.email.trim(), args.password, args.rememberMe ?? true)
      .catch((e) => rejectWithValue(errMessage(e))),
);

/** Complete a 2FA challenge with the emailed/issued OTP code. */
export const verify2FA = createAsyncThunk(
  'auth/verify2FA',
  (args: { code: string; verificationGuid: string; trustDevice?: boolean }, { rejectWithValue }) =>
    authService
      .verify2FA(args.code.trim(), args.verificationGuid, args.trustDevice ?? true)
      .catch((e) => rejectWithValue(errMessage(e))),
);

export const signOut = createAsyncThunk('auth/signOut', () => authService.signOut());

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /** Clears auth locally without a network call (used on refresh failure). */
    clearSession(state) {
      state.user = null;
      state.status = 'idle';
      state.error = null;
      state.pending2FA = null;
      state.profileGatePending = false;
    },
    clearAuthError(state) {
      state.error = null;
    },
    /** User picked a profile on the launch gate → proceed to the app. */
    markProfileSelected(state) {
      state.profileGatePending = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // restore
      .addCase(restoreSession.pending, (state) => {
        state.status = 'restoring';
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = action.payload ? 'authenticated' : 'idle';
        // Only a restored (cold-start) session shows the profile gate.
        state.profileGatePending = action.payload != null;
      })
      .addCase(restoreSession.rejected, (state) => {
        state.user = null;
        state.status = 'idle';
      })
      // signIn
      .addCase(signIn.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(signIn.fulfilled, (state, action) => {
        if (action.payload.kind === '2fa') {
          state.status = 'idle';
          state.pending2FA = { verificationGuid: action.payload.verificationGuid };
        } else {
          state.user = action.payload.user;
          state.status = 'authenticated';
          state.pending2FA = null;
          state.profileGatePending = false; // fresh sign-in → straight to Home
        }
      })
      .addCase(signIn.rejected, (state, action) => {
        state.status = 'error';
        state.error = (action.payload as string) ?? 'Sign in failed';
      })
      // verify2FA
      .addCase(verify2FA.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(verify2FA.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = 'authenticated';
        state.pending2FA = null;
        state.profileGatePending = false; // fresh sign-in → straight to Home
      })
      .addCase(verify2FA.rejected, (state, action) => {
        state.status = 'error';
        state.error = (action.payload as string) ?? 'Verification failed';
      })
      // signOut
      .addCase(signOut.fulfilled, (state) => {
        state.user = null;
        state.status = 'idle';
        state.error = null;
        state.pending2FA = null;
      });
  },
});

export const { clearSession, clearAuthError, markProfileSelected } = authSlice.actions;
export default authSlice.reducer;
