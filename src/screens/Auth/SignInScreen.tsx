import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppText, IconButton } from '@/components/common';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { signIn, clearAuthError } from '@/redux';
import type { AuthStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'SignIn'>;
const RED = '#E50914';

/**
 * "Ready to listen?" — real email + password sign-in against the SSO backend.
 * On a 2FA challenge the slice sets `pending2FA`; we route to the TwoFactor
 * screen. Errors surface inline from `auth.error`.
 */
export const SignInScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const status = useAppSelector((s) => s.auth.status);
  const error = useAppSelector((s) => s.auth.error);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focused, setFocused] = useState<'email' | 'password' | null>(null);

  const loading = status === 'loading';
  const canSubmit = email.trim().length > 0 && password.length > 0 && !loading;

  const onSubmit = async () => {
    if (!canSubmit) return;
    const result = await dispatch(signIn({ email, password, rememberMe: true }));
    // If the backend asked for 2FA, the slice populated pending2FA → go verify.
    if (signIn.fulfilled.match(result) && result.payload.kind === '2fa') {
      navigation.navigate('TwoFactor');
    }
  };

  const onBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Welcome'); // Sign In is the stack root → go to Get Started
  };

  const borderFor = (field: 'email' | 'password') =>
    focused === field ? '#FFFFFF' : 'rgba(255,255,255,0.45)';

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <IconButton name="arrow-back" size={26} onPress={onBack} />
          <AppText style={styles.logo}>JUBILUJAH</AppText>
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <AppText style={styles.title}>Ready to listen?</AppText>
            <AppText variant="body" color="textSecondary" style={styles.subtitle}>
              Enter your email and password to sign in.
            </AppText>

            <TextInput
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (error) dispatch(clearAuthError());
              }}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
              placeholder="Email"
              placeholderTextColor="#8A8A99"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.input, { borderColor: borderFor('email') }]}
            />

            <TextInput
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                if (error) dispatch(clearAuthError());
              }}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
              placeholder="Password"
              placeholderTextColor="#8A8A99"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={onSubmit}
              returnKeyType="go"
              style={[styles.input, styles.inputSpaced, { borderColor: borderFor('password') }]}
            />

            {error ? (
              <AppText variant="bodySm" color="danger" style={styles.error}>
                {error}
              </AppText>
            ) : null}

            <Pressable
              onPress={onSubmit}
              disabled={!canSubmit}
              style={({ pressed }) => [
                styles.cta,
                { opacity: !canSubmit ? 0.6 : pressed ? 0.85 : 1 },
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <AppText variant="h3" style={styles.ctaLabel}>
                  Sign In
                </AppText>
              )}
            </Pressable>

            <Pressable style={styles.help} hitSlop={6}>
              <AppText variant="h3" style={styles.helpText}>
                Get Help
              </AppText>
              <Ionicons name="chevron-down" size={16} color="#FFFFFF" />
            </Pressable>

            <View style={styles.signupRow}>
              <AppText variant="body" color="textMuted">
                New to Jubilujah?{' '}
              </AppText>
              <Pressable hitSlop={6} onPress={() => navigation.navigate('SignUp')}>
                <AppText variant="body" style={styles.signupLink}>
                  Sign up
                </AppText>
              </Pressable>
            </View>

            <AppText variant="bodySm" color="textMuted" style={styles.recaptcha}>
              This page is protected to ensure you&apos;re not a bot.
            </AppText>
          </ScrollView>
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
  input: {
    marginTop: 26,
    height: 56,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  inputSpaced: { marginTop: 14 },
  error: { marginTop: 14 },
  cta: {
    marginTop: 18,
    backgroundColor: RED,
    height: 52,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaLabel: { color: '#FFFFFF', fontWeight: '700' },
  help: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 26 },
  helpText: { color: '#FFFFFF' },
  signupRow: { flexDirection: 'row', alignItems: 'center', marginTop: 26 },
  signupLink: { color: '#FFFFFF', fontWeight: '700' },
  recaptcha: { marginTop: 24, lineHeight: 18 },
});

export default SignInScreen;
