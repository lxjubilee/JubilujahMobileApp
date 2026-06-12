import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context';
import { Screen, AppText, Button, IconButton } from '@/components/common';

/**
 * UI-only authentication stub. Not gated this pass — "Continue" simply returns
 * to the app. The authSlice + setAuthToken plumbing is in place for a real flow.
 */
export const AuthScreen: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const field = (placeholder: string, value: string, set: (v: string) => void, secure?: boolean) => (
    <TextInput
      value={value}
      onChangeText={set}
      placeholder={placeholder}
      placeholderTextColor={theme.colors.textMuted}
      secureTextEntry={secure}
      autoCapitalize="none"
      style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderRadius: theme.radius.md }]}
    />
  );

  return (
    <Screen>
      <View style={styles.header}>
        <IconButton name="close" onPress={() => navigation.goBack()} />
      </View>
      <View style={styles.body}>
        <AppText variant="displayLg" style={styles.brand}>
          Jubilujah
        </AppText>
        <AppText variant="body" color="textMuted" style={styles.tagline}>
          Music without limits.
        </AppText>

        {field('Email', email, setEmail)}
        {field('Password', password, setPassword, true)}

        <Button label={t('profile.signIn')} fullWidth onPress={() => navigation.goBack()} style={styles.cta} />
        <Button label="Continue as guest" variant="ghost" fullWidth onPress={() => navigation.goBack()} style={styles.guest} />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: { paddingHorizontal: 12, paddingTop: 8 },
  body: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, marginTop: -40 },
  brand: { textAlign: 'center' },
  tagline: { textAlign: 'center', marginTop: 8, marginBottom: 32 },
  input: { height: 50, paddingHorizontal: 16, marginBottom: 14, fontSize: 15 },
  cta: { marginTop: 12 },
  guest: { marginTop: 12 },
});

export default AuthScreen;
