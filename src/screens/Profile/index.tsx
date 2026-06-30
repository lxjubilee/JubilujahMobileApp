import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context';
import { Screen, AppText, Button, IconButton, ConfirmDialog } from '@/components/common';
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
  const [errorMsg, setErrorMsg] = useState('');

  const openDeleteConfirm = () => setMode('confirm');

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await dispatch(deleteAccount()).unwrap();
      setDeleting(false);
      setMode('success');
    } catch (e) {
      setDeleting(false);
      setErrorMsg(typeof e === 'string' ? e : t('errors.generic'));
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
          {user?.displayName ?? t('profile.guest')}
        </AppText>
        <AppText variant="bodySm" color="textMuted">
          {user?.email ?? t('profile.notSignedIn')}
        </AppText>
      </View>

      {/* Account options. */}
      <View style={styles.menu}>
        <Row
          icon="lock-closed-outline"
          label={t('profile.changePassword')}
          onPress={() => navigation.navigate('ChangePassword')}
        />
        <Row
          icon="shield-checkmark-outline"
          label={t('profile.privacyPolicy')}
          onPress={() => navigation.navigate('PrivacyPolicy')}
        />
        <Row
          icon="document-text-outline"
          label={t('profile.termsOfUse')}
          onPress={() => navigation.navigate('TermsOfUse')}
        />
        <Row icon="trash-outline" label={t('profile.deleteAccount')} destructive onPress={openDeleteConfirm} />
      </View>

      <Button
        label={t('profile.signOut')}
        icon="log-out-outline"
        variant="ghost"
        onPress={() => dispatch(signOut())}
        style={styles.cta}
      />

      <ConfirmDialog
        visible={mode === 'confirm'}
        title={t('profile.deleteTitle')}
        message={t('profile.deleteMessage')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        destructive
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setMode(null)}
      />
      <ConfirmDialog
        visible={mode === 'success'}
        title={t('profile.deletedTitle')}
        message={t('profile.deletedMessage')}
        confirmLabel={t('common.ok')}
        onConfirm={() => dispatch(clearSession())}
      />
      <ConfirmDialog
        visible={mode === 'error'}
        title={t('profile.deleteFailedTitle')}
        message={errorMsg}
        confirmLabel={t('common.ok')}
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
