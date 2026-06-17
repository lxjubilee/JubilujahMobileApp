import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppText, IconButton, OtpInput } from '@/components/common';
import { useAppDispatch } from '@/hooks';
import { verifySignup, resendSignup } from '@/redux';
import type { AuthStackParamList, AuthStackScreenProps } from '@/navigation/types';

const RED = '#E50914';

/**
 * Sign-up phase 2: enter the 6-digit code emailed by /signup. On success the
 * account is created, the cookie session is set, and the slice flips to
 * authenticated — the app gate then swaps to the main navigator automatically.
 */
export const VerifySignupScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { params } = useRoute<AuthStackScreenProps<'VerifySignup'>['route']>();
  const dispatch = useAppDispatch();

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const onVerify = async (codeArg?: string) => {
    const otp = codeArg ?? code;
    if (otp.length !== 6 || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await dispatch(
        verifySignup({ verificationGuid: params.verificationGuid, verificationCode: otp }),
      ).unwrap();
      // Success → slice sets authenticated; RootGate swaps to the main app.
    } catch (e) {
      setError(typeof e === 'string' ? e : 'Verification failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = code.length === 6 && !submitting;

  const onResend = async () => {
    if (cooldown > 0) return;
    setError(null);
    try {
      await dispatch(resendSignup(params.verificationGuid)).unwrap();
      setCooldown(60);
    } catch (e) {
      setError(typeof e === 'string' ? e : 'Could not resend the code.');
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <IconButton name="arrow-back" size={26} onPress={() => navigation.goBack()} />
          <AppText style={styles.logo}>JUBILUJAH</AppText>
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.content}>
            <AppText style={styles.title}>Verify your email</AppText>
            <AppText variant="body" color="textSecondary" style={styles.subtitle}>
              Enter the 6-digit code we sent to {params.email} to finish creating your account.
            </AppText>

            <View style={styles.otpWrap}>
              <OtpInput
                value={code}
                onChange={(v) => {
                  setCode(v);
                  if (error) setError(null);
                }}
                onComplete={(v) => onVerify(v)}
              />
            </View>

            {error ? (
              <AppText variant="bodySm" color="danger" style={styles.error}>
                {error}
              </AppText>
            ) : null}

            <Pressable
              onPress={() => onVerify()}
              disabled={!canSubmit}
              style={({ pressed }) => [
                styles.cta,
                { opacity: !canSubmit ? 0.6 : pressed ? 0.85 : 1 },
              ]}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <AppText variant="h3" style={styles.ctaLabel}>
                  Verify & Create Account
                </AppText>
              )}
            </Pressable>

            <View style={styles.resendRow}>
              <AppText variant="body" color="textMuted">
                Didn&apos;t get a code?{' '}
              </AppText>
              <Pressable hitSlop={6} onPress={onResend} disabled={cooldown > 0}>
                <AppText variant="body" style={[styles.resendLink, cooldown > 0 && styles.resendDisabled]}>
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                </AppText>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B0B0F' },
  safe: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 6,
  },
  logo: { color: RED, fontSize: 20, lineHeight: 26, fontWeight: '900', letterSpacing: 1 },
  content: { paddingHorizontal: 22, paddingTop: 18 },
  title: { color: '#FFFFFF', fontSize: 28, lineHeight: 36, fontWeight: '800' },
  subtitle: { marginTop: 12, fontSize: 16, lineHeight: 22 },
  otpWrap: { marginTop: 26 },
  error: { marginTop: 14 },
  cta: {
    marginTop: 20,
    backgroundColor: RED,
    height: 52,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaLabel: { color: '#FFFFFF', fontWeight: '700' },
  resendRow: { flexDirection: 'row', alignItems: 'center', marginTop: 26 },
  resendLink: { color: '#FFFFFF', fontWeight: '700' },
  resendDisabled: { color: '#8A8A99' },
});

export default VerifySignupScreen;
