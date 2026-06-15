import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context';
import { Screen, AppText, Button, IconButton } from '@/components/common';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { signOut } from '@/redux';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const ProfileScreen: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  return (
    <Screen>
      <View style={styles.header}>
        <IconButton name="chevron-back" onPress={() => navigation.goBack()} />
        <AppText variant="h1" style={styles.title}>
          {t('profile.title')}
        </AppText>
      </View>

      <View style={styles.body}>
        <View style={[styles.avatar, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="person" size={48} color={theme.colors.iconMuted} />
        </View>
        <AppText variant="h2" style={styles.name}>
          {user?.displayName ?? 'Guest'}
        </AppText>
        <AppText variant="bodySm" color="textMuted">
          {user?.email ?? 'Not signed in'}
        </AppText>
      </View>

      {/* Account options. Handlers are placeholders — wire up the actual
          navigation / actions later. */}
      <View style={styles.menu}>
        <Row icon="shield-checkmark-outline" label="Privacy Policy" onPress={() => {}} />
        <Row icon="document-text-outline" label="Terms of Use" onPress={() => {}} />
        <Row icon="trash-outline" label="Delete Account" destructive onPress={() => {}} />
      </View>

      <Button
        label="Sign Out"
        icon="log-out-outline"
        variant="ghost"
        onPress={() => dispatch(signOut())}
        style={styles.cta}
      />
    </Screen>
  );
};

const Row: React.FC<{
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress?: () => void;
  destructive?: boolean;
}> = ({ icon, label, onPress, destructive }) => {
  const theme = useTheme();
  const tint = destructive ? theme.colors.danger : theme.colors.text;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Ionicons name={icon} size={20} color={destructive ? theme.colors.danger : theme.colors.icon} />
      <AppText variant="body" style={[styles.rowLabel, { color: tint }]}>
        {label}
      </AppText>
      <Ionicons name="chevron-forward" size={18} color={theme.colors.iconMuted} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 8 },
  title: { marginLeft: 8 },
  body: { alignItems: 'center', marginTop: 40 },
  avatar: { width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center' },
  name: { marginTop: 16 },
  menu: { marginTop: 36, paddingHorizontal: 16, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 14 },
  rowLabel: { flex: 1, marginLeft: 12 },
  cta: { marginTop: 28, marginHorizontal: 16 },
});

export default ProfileScreen;
