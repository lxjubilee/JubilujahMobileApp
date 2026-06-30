import React, { useCallback, useMemo, useState } from 'react';
import { Dimensions, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context';
import { Screen, AppText, Artwork, IconButton, Placeholder, ProfileButton } from '@/components/common';
import { AlbumCard } from '@/components/cards';
import { PlaylistNameDialog } from '@/components/playlists';
import { useAppDispatch, useAppSelector, useVisibleAlbums } from '@/hooks';
import { createPlaylist, fetchPlaylists } from '@/redux';
import type { LibraryStackParamList, RootStackParamList } from '@/navigation/types';

// Library can push within its own stack (Profile) and to root details.
type Nav = NativeStackNavigationProp<LibraryStackParamList & RootStackParamList>;
const { width } = Dimensions.get('window');
const CARD_W = (width - 48) / 2;

export const LibraryScreen: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();

  const saved = useAppSelector((s) => s.library.savedAlbums);
  // Personal collection — never hidden by the active catalog language.
  const savedAlbums = useVisibleAlbums(saved, { filterByLanguage: false });
  const likedCount = useAppSelector((s) => s.library.favoriteTrackIds.length);
  const followCount = useAppSelector((s) => s.library.followedArtistIds.length);
  const summaries = useAppSelector((s) => s.playlists.summaries);
  // Hide the default "My Favorites" playlist (matches web; mobile has Liked Songs).
  const playlists = useMemo(() => summaries.filter((p) => !p.isDefault), [summaries]);

  const [creating, setCreating] = useState(false);

  // Refresh the server playlists each time the Library tab gains focus.
  useFocusEffect(
    useCallback(() => {
      void dispatch(fetchPlaylists());
    }, [dispatch]),
  );

  const onCreate = (name: string) => {
    setCreating(false);
    void dispatch(createPlaylist({ name }))
      .unwrap()
      .then((summary) => {
        // Wait for the dialog's modal to finish dismissing before navigating —
        // otherwise its window lingers over the new screen and blocks all touches
        // (the screen looks frozen). 350ms covers the fade-out animation.
        setTimeout(() => navigation.navigate('PlaylistDetails', { playlistId: summary.id }), 350);
      })
      .catch(() => undefined);
  };

  const listHeader = (
    <View>
      <View style={styles.shortcuts}>
        <Shortcut
          icon="heart"
          label={t('library.favorites')}
          meta={`${likedCount}`}
          color={theme.colors.accent}
          onPress={() => navigation.navigate('LikedSongs')}
        />
        <Shortcut
          icon="people"
          label={t('library.artists')}
          meta={`${followCount}`}
          onPress={() => navigation.navigate('FollowedArtists')}
        />
      </View>

      <View style={styles.sectionRow}>
        <AppText variant="h2">{t('library.playlists')}</AppText>
        <IconButton name="add" size={24} onPress={() => setCreating(true)} />
      </View>

      {playlists.length ? (
        playlists.map((pl) => (
          <Pressable
            key={pl.id}
            style={({ pressed }) => [styles.plRow, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => navigation.navigate('PlaylistDetails', { playlistId: pl.id })}
          >
            <Artwork uri={pl.cover ?? ''} style={[styles.plArt, { borderRadius: theme.radius.sm }]} iconSize={20} />
            <View style={styles.plMeta}>
              <AppText variant="h3" numberOfLines={1}>
                {pl.name}
              </AppText>
              <AppText variant="bodySm" color="textMuted">
                {t('playlist.songCount', { count: pl.itemCount })}
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.iconMuted} />
          </Pressable>
        ))
      ) : (
        <AppText variant="bodySm" color="textMuted" style={styles.plEmpty}>
          {t('library.emptyPlaylists')}
        </AppText>
      )}

      <AppText variant="h2" style={styles.albumsTitle}>
        {t('library.albums')}
      </AppText>
    </View>
  );

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="display">{t('library.title')}</AppText>
        <ProfileButton size={32} onPress={() => navigation.navigate('Profile')} />
      </View>

      <FlatList
        data={savedAlbums}
        keyExtractor={(a) => a.id}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.grid}
        ListHeaderComponent={listHeader}
        renderItem={({ item }) => (
          <AlbumCard
            album={item}
            width={CARD_W}
            onPress={(al) => navigation.navigate('AlbumDetails', { albumId: al.id })}
          />
        )}
        ListEmptyComponent={
          <Placeholder icon="albums-outline" title={t('library.albums')} subtitle={t('library.empty')} />
        }
      />

      <PlaylistNameDialog
        visible={creating}
        title={t('playlist.namePrompt')}
        confirmLabel={t('playlist.create')}
        onConfirm={onCreate}
        onCancel={() => setCreating(false)}
      />
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
  shortcuts: { flexDirection: 'row', gap: 12, marginTop: 16 },
  shortcut: { flex: 1, alignItems: 'center', paddingVertical: 16, paddingHorizontal: 8 },
  shortcutLabel: { marginTop: 8 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, marginBottom: 8 },
  plRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  plArt: { width: 52, height: 52, backgroundColor: '#222' },
  plMeta: { flex: 1, marginLeft: 12 },
  plEmpty: { paddingVertical: 8 },
  albumsTitle: { marginTop: 28, marginBottom: 12 },
  grid: { paddingHorizontal: 16, paddingBottom: 24 },
  column: { gap: 16, marginBottom: 16 },
});

export default LibraryScreen;
