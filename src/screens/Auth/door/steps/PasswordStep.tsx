import React from 'react';
import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/common';
import {
  AccountChip,
  AuthCheckbox,
  AuthLinkButton,
  AuthLinkRow,
  AuthPrimaryButton,
  AuthTextField,
  TurnstileGate,
} from '@/components/auth';

interface PasswordStepProps {
  /**
   * `welcome` is a returning member signing in; `confirm` is someone whose
   * Jubilee ID exists elsewhere proving it before we create an account here.
   */
  mode: 'welcome' | 'confirm';
  email: string;
  password: string;
  onChangePassword: (v: string) => void;
  rememberMe: boolean;
  onChangeRememberMe: (v: boolean) => void;
  onUseDifferentEmail: () => void;
  onForgotPassword: () => void;
  onSubmit: () => void;
  busy: boolean;
  disabled: boolean;
  captchaKey: number;
  onCaptchaToken: (token: string | null) => void;
  onCaptchaReady: (ready: boolean) => void;
}

/**
 * The two password steps. They differ only in copy and in whether the
 * remember-me checkbox is offered — `confirm` doesn't ask, because the choice is
 * made a step later when the account is actually created.
 *
 * The Turnstile challenge lives HERE rather than on the email step: only
 * `POST /signin` reads the token, it is single-use and short-lived, and the
 * signup branch never needs one. Minting it on the email step and spending it
 * two screens later is how you get `invalid-input-response`, and gating the one
 * screen every user sees on a WebView is the widest blast radius available.
 */
export const PasswordStep: React.FC<PasswordStepProps> = ({
  mode,
  email,
  password,
  onChangePassword,
  rememberMe,
  onChangeRememberMe,
  onUseDifferentEmail,
  onForgotPassword,
  onSubmit,
  busy,
  disabled,
  captchaKey,
  onCaptchaToken,
  onCaptchaReady,
}) => {
  const { t } = useTranslation();
  const ns = mode === 'welcome' ? 'auth.door.welcome' : 'auth.door.confirm';

  return (
    <>
      {mode === 'confirm' ? (
        <AppText variant="bodySm" color="textSecondary" style={styles.subtitle}>
          {t('auth.door.confirm.subtitle', { site: 'JubiLujah' })}
        </AppText>
      ) : null}

      <AccountChip
        email={email}
        actionLabel={t('auth.door.account.useDifferentEmail')}
        onAction={onUseDifferentEmail}
      />

      <AuthTextField
        value={password}
        onChangeText={onChangePassword}
        placeholder={t(`${ns}.passwordLabel`)}
        secure
        showPasswordLabel={t('auth.door.a11y.showPassword')}
        hidePasswordLabel={t('auth.door.a11y.hidePassword')}
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={onSubmit}
        autoFocus
        containerStyle={styles.field}
      />

      <AuthLinkRow placement="aboveSubmit" align="right">
        <AuthLinkButton label={t(`${ns}.forgot`)} onPress={onForgotPassword} />
      </AuthLinkRow>

      {mode === 'welcome' ? (
        <AuthCheckbox
          checked={rememberMe}
          onChange={onChangeRememberMe}
          label={t('auth.door.welcome.rememberMe')}
          style={styles.remember}
        />
      ) : null}

      <TurnstileGate
        resetKey={captchaKey}
        onToken={onCaptchaToken}
        onReadyChange={onCaptchaReady}
      />

      <AuthPrimaryButton
        label={t(`${ns}.submit`)}
        busyLabel={t(`${ns}.submitting`)}
        onPress={onSubmit}
        loading={busy}
        disabled={disabled}
        style={styles.cta}
      />
    </>
  );
};

const styles = StyleSheet.create({
  subtitle: { marginTop: 10, marginBottom: 18, lineHeight: 20 },
  field: { marginTop: 18 },
  remember: { marginTop: 14 },
  cta: { marginTop: 18 },
});
