import React from 'react';
import { Dimensions, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context';
import { Screen, AppText, Placeholder, ProfileButton } from '@/components/common';
import { AlbumCard } from '@/components/cards';
import { useAppSelector } from '@/hooks';
import type { LibraryStackParamList, RootStackParamList } from '@/navigation/types';

// Library can push within its own stack (Downloads/Profile) and to root details.
type Nav = NativeStackNavigationProp<LibraryStackParamList & RootStackParamList>;
const { width } = Dimensions.get('window');
const CARD_W = (width - 48) / 2;

export const LibraryScreen: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();

  const savedAlbums = useAppSelector((s) => s.library.savedAlbums);
  const likedCount = useAppSelector((s) => s.library.favoriteTrackIds.length);
  const followCount = useAppSelector((s) => s.library.followedArtistIds.length);

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="display">{t('library.title')}</AppText>
        <ProfileButton size={32} onPress={() => navigation.navigate('Profile')} />
      </View>

      <View style={styles.shortcuts}>
        <Shortcut
          icon="heart"
          label={t('library.favorites')}
          meta={`${likedCount}`}
          color={theme.colors.accent}
        />
        <Shortcut icon="people" label={t('library.artists')} meta={`${followCount}`} />
      </View>

      <AppText variant="h2" style={styles.sectionTitle}>
        {t('library.albums')}
      </AppText>

      {savedAlbums.length ? (
        <FlatList
          data={savedAlbums}
          keyExtractor={(a) => a.id}
          numColumns={2}
          columnWrapperStyle={styles.column}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => (
            <AlbumCard
              album={item}
              width={CARD_W}
              onPress={(al) => navigation.navigate('AlbumDetails', { albumId: al.id })}
            />
          )}
        />
      ) : (
        <Placeholder icon="albums-outline" title={t('library.albums')} subtitle={t('library.empty')} />
      )}
    </Screen>
  );
};

const Shortcut: React.FC<{
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  meta?: string;
  color?: string;
  onPress?: () => void;
}> = ({ icon, label, meta, color, onPress }) => {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.shortcut, { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md }]}
    >
      <Ionicons name={icon} size={22} color={color ?? theme.colors.icon} />
      <AppText variant="label" style={styles.shortcutLabel} numberOfLines={1}>
        {label}
      </AppText>
      {meta ? (
        <AppText variant="caption" color="textMuted">
          {meta}
        </AppText>
      ) : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8 },
  shortcuts: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginTop: 16 },
  shortcut: { flex: 1, alignItems: 'center', paddingVertical: 16, paddingHorizontal: 8 },
  shortcutLabel: { marginTop: 8 },
  sectionTitle: { paddingHorizontal: 16, marginTop: 28, marginBottom: 12 },
  grid: { paddingHorizontal: 16, paddingBottom: 24 },
  column: { gap: 16, marginBottom: 16 },
});

export default LibraryScreen;
