import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context';
import { Screen, AppText, Button, IconButton, ConfirmDialog, PasswordInput } from '@/components/common';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { signOut, deleteAccount, clearSession } from '@/redux';
import type { LibraryStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<LibraryStackParamList>;

export const ProfileScreen: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const initial = (user?.firstName || user?.displayName || user?.email || '')
    .trim()
    .charAt(0)
    .toUpperCase();
  const [mode, setMode] = useState<null | 'confirm' | 'success' | 'error'>(null);
  const [deleting, setDeleting] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const openDeleteConfirm = () => {
    setDeletePassword('');
    setMode('confirm');
  };

  const confirmDelete = async () => {
    if (!user?.email || !deletePassword) return;
    setDeleting(true);
    try {
      await dispatch(deleteAccount({ email: user.email, password: deletePassword })).unwrap();
      setDeleting(false);
      setMode('success');
    } catch (e) {
      setDeleting(false);
      setErrorMsg(typeof e === 'string' ? e : 'Something went wrong. Please try again.');
      setMode('error');
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <IconButton name="chevron-back" onPress={() => navigation.goBack()} />
        <AppText variant="h1" style={styles.title}>
          {t('profile.title')}
        </AppText>
      </View>

      <View style={styles.body}>
        <View
          style={[
            styles.avatar,
            { backgroundColor: initial ? theme.colors.primary : theme.colors.surface },
          ]}
        >
          {initial ? (
            <AppText style={styles.avatarInitial} allowFontScaling={false}>
              {initial}
            </AppText>
          ) : (
            <Ionicons name="person" size={48} color={theme.colors.iconMuted} />
          )}
        </View>
        <AppText variant="h2" style={styles.name}>
          {user?.displayName ?? 'Guest'}
        </AppText>
        <AppText variant="bodySm" color="textMuted">
          {user?.email ?? 'Not signed in'}
        </AppText>
      </View>

      {/* Account options. */}
      <View style={styles.menu}>
        <Row
          icon="lock-closed-outline"
          label="Change Password"
          onPress={() => navigation.navigate('ChangePassword')}
        />
        <Row
          icon="shield-checkmark-outline"
          label="Privacy Policy"
          onPress={() => navigation.navigate('PrivacyPolicy')}
        />
        <Row
          icon="document-text-outline"
          label="Terms of Use"
          onPress={() => navigation.navigate('TermsOfUse')}
        />
        <Row icon="trash-outline" label="Delete Account" destructive onPress={openDeleteConfirm} />
      </View>

      <Button
        label="Sign Out"
        icon="log-out-outline"
        variant="ghost"
        onPress={() => dispatch(signOut())}
        style={styles.cta}
      />

      <ConfirmDialog
        visible={mode === 'confirm'}
        title="Delete account?"
        message="This permanently deletes your account and all your data. This action cannot be undone. Enter your password to confirm."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        loading={deleting}
        confirmDisabled={!deletePassword}
        onConfirm={confirmDelete}
        onCancel={() => setMode(null)}
      >
        <PasswordInput
          value={deletePassword}
          onChangeText={setDeletePassword}
          placeholder="Password"
        />
      </ConfirmDialog>
      <ConfirmDialog
        visible={mode === 'success'}
        title="Account deleted"
        message="Your account has been permanently deleted."
        confirmLabel="OK"
        onConfirm={() => dispatch(clearSession())}
      />
      <ConfirmDialog
        visible={mode === 'error'}
        title="Couldn't delete account"
        message={errorMsg}
        confirmLabel="OK"
        onConfirm={() => setMode(null)}
      />
    </Screen>
  );
};

const Row: React.FC<{
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress?: () => void;
  destructive?: boolean;
  loading?: boolean;
}> = ({ icon, label, onPress, destructive, loading }) => {
  const theme = useTheme();
  const tint = destructive ? theme.colors.danger : theme.colors.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Ionicons name={icon} size={20} color={destructive ? theme.colors.danger : theme.colors.icon} />
      <AppText variant="body" style={[styles.rowLabel, { color: tint }]}>
        {label}
      </AppText>
      {loading ? (
        <ActivityIndicator size="small" color={theme.colors.iconMuted} />
      ) : (
        <Ionicons name="chevron-forward" size={18} color={theme.colors.iconMuted} />
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 8 },
  title: { marginLeft: 8 },
  body: { alignItems: 'center', marginTop: 40 },
  avatar: { width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: {
    color: '#fff',
    fontSize: 46,
    lineHeight: 54,
    fontWeight: '700',
    textAlign: 'center',
    includeFontPadding: false,
  },
  name: { marginTop: 16 },
  menu: { marginTop: 36, paddingHorizontal: 16, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 14 },
  rowLabel: { flex: 1, marginLeft: 12 },
  cta: { marginTop: 28, marginHorizontal: 16 },
});

export default ProfileScreen;
