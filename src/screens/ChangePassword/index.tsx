import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, AppText, IconButton, PasswordInput } from '@/components/common';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { changePassword } from '@/redux';
import type { LibraryStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<LibraryStackParamList>;
const RED = '#E50914';

/**
 * Change the signed-in user's password. Requires the cookie session created by
 * the Jubilujah account API (sign-up); the call keeps the current session and
 * logs out other devices.
 */
export const ChangePasswordScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const email = useAppSelector((s) => s.auth.user?.email ?? '');

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const matches = next.length >= 8 && next === confirm;
  const canSubmit = current.length > 0 && matches && !submitting;

  const onSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await dispatch(
        changePassword({ email, currentPassword: current, newPassword: next }),
      ).unwrap();
      setDone(true);
    } catch (e) {
      setError(typeof e === 'string' ? e : 'Could not change your password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const clearError = () => error && setError(null);

  return (
    <Screen>
      <View style={styles.header}>
        <IconButton name="chevron-back" onPress={() => navigation.goBack()} />
        <AppText variant="h1" style={styles.title}>
          Change Password
        </AppText>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {done ? (
            <>
              <AppText variant="body" color="textSecondary" style={styles.subtitle}>
                Your password has been changed. You&apos;ll stay signed in here; other devices have
                been signed out.
              </AppText>
              <Pressable
                onPress={() => navigation.goBack()}
                style={({ pressed }) => [styles.cta, { opacity: pressed ? 0.85 : 1 }]}
              >
                <AppText variant="h3" style={styles.ctaLabel}>
                  Done
                </AppText>
              </Pressable>
            </>
          ) : (
            <>
              <AppText variant="body" color="textSecondary" style={styles.subtitle}>
                Enter your current password and choose a new one (at least 8 characters).
              </AppText>

              <PasswordInput
                value={current}
                onChangeText={(t) => {
                  setCurrent(t);
                  clearError();
                }}
                placeholder="Current password"
                containerStyle={styles.field}
              />
              <PasswordInput
                value={next}
                onChangeText={(t) => {
                  setNext(t);
                  clearError();
                }}
                placeholder="New password (min 8 characters)"
                containerStyle={styles.field}
              />
              <PasswordInput
                value={confirm}
                onChangeText={(t) => {
                  setConfirm(t);
                  clearError();
                }}
                placeholder="Confirm new password"
                containerStyle={styles.field}
              />

              {confirm.length > 0 && next !== confirm ? (
                <AppText variant="bodySm" style={styles.error}>
                  Passwords don’t match.
                </AppText>
              ) : null}
              {error ? (
                <AppText variant="bodySm" style={styles.error}>
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
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <AppText variant="h3" style={styles.ctaLabel}>
                    Update Password
                  </AppText>
                )}
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 8 },
  title: { marginLeft: 8 },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },
  subtitle: { marginBottom: 8, lineHeight: 22 },
  field: { marginTop: 14 },
  error: { marginTop: 12, color: '#FF4D5E' },
  cta: {
    marginTop: 24,
    backgroundColor: RED,
    height: 52,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaLabel: { color: '#FFFFFF', fontWeight: '700' },
});

export default ChangePasswordScreen;
