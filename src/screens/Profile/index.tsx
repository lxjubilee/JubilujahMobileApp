import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context';
import { Screen, AppText, Button, IconButton } from '@/components/common';
import { useAppSelector } from '@/hooks';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const ProfileScreen: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
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
          {user?.name ?? 'Guest'}
        </AppText>
        <AppText variant="bodySm" color="textMuted">
          {user?.email ?? 'Not signed in'}
        </AppText>

        {!user ? (
          <Button
            label={t('profile.signIn')}
            icon="log-in-outline"
            onPress={() => navigation.navigate('Auth')}
            style={styles.cta}
          />
        ) : null}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 8 },
  title: { marginLeft: 8 },
  body: { alignItems: 'center', marginTop: 40 },
  avatar: { width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center' },
  name: { marginTop: 16 },
  cta: { marginTop: 28 },
});

export default ProfileScreen;
