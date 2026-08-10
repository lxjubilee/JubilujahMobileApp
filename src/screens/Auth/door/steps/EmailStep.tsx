import React from 'react';
import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/common';
import { AuthPrimaryButton, AuthTextField } from '@/components/auth';

interface EmailStepProps {
  email: string;
  onChangeEmail: (v: string) => void;
  onSubmit: () => void;
  busy: boolean;
  disabled: boolean;
}

/**
 * The door itself: one email field. What the user types here decides which of
 * the three branches opens, so nothing else is asked for yet.
 */
export const EmailStep: React.FC<EmailStepProps> = ({
  email,
  onChangeEmail,
  onSubmit,
  busy,
  disabled,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <AppText style={styles.help} variant="bodySm" color="textMuted">
        {t('auth.door.email.help')}
      </AppText>

      <AuthTextField
        value={email}
        onChangeText={onChangeEmail}
        placeholder={t('auth.door.email.emailLabel')}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="go"
        onSubmitEditing={onSubmit}
        autoFocus
        containerStyle={styles.field}
      />

      <AuthPrimaryButton
        label={t('auth.door.email.submit')}
        busyLabel={t('auth.door.email.submitting')}
        onPress={onSubmit}
        loading={busy}
        disabled={disabled}
        style={styles.cta}
      />

      <AppText variant="caption" color="textMuted" style={styles.disclaimer}>
        {t('auth.door.email.disclaimer')}
      </AppText>
    </>
  );
};

const styles = StyleSheet.create({
  help: { marginTop: 10, lineHeight: 20 },
  field: { marginTop: 22 },
  cta: { marginTop: 18 },
  disclaimer: { marginTop: 16, lineHeight: 18 },
});
