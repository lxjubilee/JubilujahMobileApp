import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppText, IconButton } from '@/components/common';
import type { AuthStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'SignUp'>;
const RED = '#E50914';

/**
 * Create-account UI. The backend signup contract isn't available yet, so submit
 * shows a "coming soon" notice rather than calling the API. The form,
 * validation, and layout are production-ready for when the endpoint lands.
 */
export const SignUpScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const emailValid = /^\S+@\S+\.\S+$/.test(email.trim());
  const canSubmit = name.trim().length > 1 && emailValid && password.length >= 6;

  const onSubmit = () => {
    if (!canSubmit) return;
    // TODO: wire to authEndpoints.signup once the backend contract is provided.
    setNotice('Account creation is coming soon. Please sign in for now.');
  };

  const field = (
    placeholder: string,
    value: string,
    set: (v: string) => void,
    opts?: { secure?: boolean; email?: boolean },
  ) => (
    <TextInput
      value={value}
      onChangeText={(t) => {
        set(t);
        if (notice) setNotice(null);
      }}
      placeholder={placeholder}
      placeholderTextColor="#8A8A99"
      secureTextEntry={opts?.secure}
      keyboardType={opts?.email ? 'email-address' : 'default'}
      autoCapitalize={opts?.email ? 'none' : 'words'}
      autoCorrect={false}
      style={styles.input}
    />
  );

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
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <AppText style={styles.title}>Create your account</AppText>
            <AppText variant="body" color="textSecondary" style={styles.subtitle}>
              Join Jubilujah to save your music, build playlists, and listen anywhere.
            </AppText>

            {field('Full name', name, setName)}
            {field('Email', email, setEmail, { email: true })}
            {field('Password (min 6 characters)', password, setPassword, { secure: true })}

            {notice ? (
              <AppText variant="bodySm" style={styles.notice}>
                {notice}
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
              <AppText variant="h3" style={styles.ctaLabel}>
                Create Account
              </AppText>
            </Pressable>

            <View style={styles.signinRow}>
              <AppText variant="body" color="textMuted">
                Already have an account?{' '}
              </AppText>
              <Pressable hitSlop={6} onPress={() => navigation.navigate('SignIn')}>
                <AppText variant="body" style={styles.signinLink}>
                  Sign in
                </AppText>
              </Pressable>
            </View>
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
    marginTop: 14,
    height: 56,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    borderRadius: 6,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  notice: { marginTop: 16, color: '#F5C518' },
  cta: {
    marginTop: 18,
    backgroundColor: RED,
    height: 52,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaLabel: { color: '#FFFFFF', fontWeight: '700' },
  signinRow: { flexDirection: 'row', alignItems: 'center', marginTop: 26 },
  signinLink: { color: '#FFFFFF', fontWeight: '700' },
});

export default SignUpScreen;
