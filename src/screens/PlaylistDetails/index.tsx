import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  Screen,
  AppText,
  Artwork,
  Button,
  IconButton,
  Placeholder,
  ConfirmDialog,
} from '@/components/common';
import { TrackRow } from '@/components/cards';
import { TrackOptionsModal, TrackOption } from '@/components/modals';
import { PlaylistNameDialog } from '@/components/playlists';
import { FloatingMiniPlayer } from '@/components/player';
import { useTheme } from '@/context';
import {
  useAppDispatch,
  useAppSelector,
  usePlayer,
  useTracksByIds,
  useVisibleTracks,
} from '@/hooks';
import {
  deletePlaylist,
  removeTrackFromPlaylist,
  renamePlaylist,
  toggleFavoriteTrack,
} from '@/redux';
import { shuffle as shuffleArray } from '@/utils';
import { Track } from '@/types';
import type { RootStackParamList, RootStackScreenProps } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const { width } = Dimensions.get('window');
const ART = width * 0.62;

export const PlaylistDetailsScreen: React.FC = () => {
  const { params } = useRoute<RootStackScreenProps<'PlaylistDetails'>['route']>();
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { playTracks, playFrom, currentTrack } = usePlayer();

  const playlist = useAppSelector((s) =>
    s.library.playlists.find((p) => p.id === params.playlistId),
  );
  const favoriteIds = useAppSelector((s) => s.library.favoriteTrackIds);

  const { tracks: resolved, loading } = useTracksByIds(playlist?.trackIds ?? []);
  // Personal collection — never hidden by the active catalog language.
  const tracks = useVisibleTracks(resolved, { filterByLanguage: false });

  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [optionsTrack, setOptionsTrack] = useState<Track | null>(null);

  const trackOptions = useMemo<TrackOption[]>(() => {
    if (!optionsTrack || !playlist) return [];
    const isFav = favoriteIds.includes(optionsTrack.id);
    return [
      {
        key: 'remove',
        label: t('playlist.removeFromPlaylist'),
        icon: 'remove-circle-outline',
        destructive: true,
        onPress: (track) =>
          dispatch(removeTrackFromPlaylist({ playlistId: playlist.id, trackId: track.id })),
      },
      {
        key: 'like',
        label: isFav ? t('player.removeFromLiked') : t('player.like'),
        icon: isFav ? 'heart' : 'heart-outline',
        onPress: (track) => dispatch(toggleFavoriteTrack(track)),
      },
    ];
  }, [optionsTrack, playlist, favoriteIds, dispatch, t]);

  if (!playlist) {
    return (
      <Screen>
        <View style={styles.topBarFixed}>
          <IconButton name="chevron-back" onPress={() => navigation.goBack()} />
        </View>
        <Placeholder icon="musical-notes-outline" title={t('playlist.notFound')} />
      </Screen>
    );
  }

  const onPlay = () => {
    if (tracks.length) void playTracks(tracks, 0);
  };
  const onShuffle = () => {
    if (tracks.length) void playTracks(shuffleArray(tracks), 0);
  };

  return (
    <Screen safeArea={false}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Artwork uri={playlist.cover} style={styles.bgArt} blurRadius={40} iconSize={0} />
          <LinearGradient colors={['transparent', '#0B0B0F']} style={StyleSheet.absoluteFill} />
          <View style={styles.topBar}>
            <IconButton name="chevron-back" onPress={() => navigation.goBack()} />
            <IconButton name="ellipsis-horizontal" onPress={() => setMenuOpen(true)} />
          </View>
          <Artwork
            uri={playlist.cover}
            style={[styles.art, { width: ART, height: ART }]}
            iconSize={Math.round(ART * 0.3)}
          />
          <AppText variant="display" style={styles.title} numberOfLines={2}>
            {playlist.title}
          </AppText>
          <AppText variant="bodySm" color="textMuted" style={styles.sub}>
            {t('playlist.songCount', { count: tracks.length })}
          </AppText>
        </View>

        <View style={styles.actions}>
          <Button
            label={t('playlist.addSongs')}
            icon="add"
            variant="secondary"
            onPress={() => navigation.navigate('PlaylistAddSongs', { playlistId: playlist.id })}
          />
          <View style={styles.actionsRight}>
            <IconButton
              name="shuffle"
              size={26}
              onPress={onShuffle}
              style={styles.shuffle}
              disabled={!tracks.length}
            />
            <Button label={t('common.play')} icon="play" onPress={onPlay} />
          </View>
        </View>

        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={theme.colors.primary} size="large" />
          </View>
        ) : tracks.length ? (
          <View style={styles.list}>
            {tracks.map((track, i) => (
              <TrackRow
                key={track.id}
                track={track}
                index={i + 1}
                isActive={currentTrack?.id === track.id}
                onPress={() => playFrom(tracks, track.id)}
                onOptions={setOptionsTrack}
              />
            ))}
          </View>
        ) : (
          // Natural-height (no flex:1) so it renders safely inside the ScrollView.
          <View style={styles.stateBox}>
            <Ionicons name="musical-notes-outline" size={56} color={theme.colors.iconMuted} />
            <AppText variant="h2" style={styles.emptyTitle}>
              {t('playlist.empty')}
            </AppText>
            <AppText variant="bodySm" color="textMuted" style={styles.emptyHint}>
              {t('playlist.emptyHint')}
            </AppText>
          </View>
        )}
      </ScrollView>

      <FloatingMiniPlayer />

      {/* Modals are mounted only while open — never permanently with visible=false.
          A stack of always-mounted RN <Modal>s inside a native-stack screen wedges
          the UI thread on Android (Old Arch), which froze this screen on open. */}

      {/* Per-track options (remove / like). */}
      {optionsTrack ? (
        <TrackOptionsModal
          track={optionsTrack}
          options={trackOptions}
          onClose={() => setOptionsTrack(null)}
        />
      ) : null}

      {/* Playlist-level menu: rename / delete. */}
      {menuOpen ? (
      <Modal visible transparent animationType="slide" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={[styles.backdrop, { backgroundColor: theme.colors.overlay }]} onPress={() => setMenuOpen(false)}>
          <Pressable
            style={[
              styles.sheet,
              {
                backgroundColor: theme.colors.backgroundElevated,
                borderTopLeftRadius: theme.radius.xl,
                borderTopRightRadius: theme.radius.xl,
              },
            ]}
          >
            <Pressable
              style={({ pressed }) => [styles.menuRow, { opacity: pressed ? 0.6 : 1 }]}
              onPress={() => {
                setMenuOpen(false);
                // Let the menu sheet close before opening the next modal so they
                // don't overlap (the second can fail to appear / freeze on Android).
                setTimeout(() => setRenaming(true), 260);
              }}
            >
              <Ionicons name="create-outline" size={22} color={theme.colors.icon} />
              <AppText variant="body" style={styles.menuLabel}>
                {t('playlist.rename')}
              </AppText>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.menuRow, { opacity: pressed ? 0.6 : 1 }]}
              onPress={() => {
                setMenuOpen(false);
                setTimeout(() => setConfirmDelete(true), 260);
              }}
            >
              <Ionicons name="trash-outline" size={22} color={theme.colors.danger} />
              <AppText variant="body" color="danger" style={styles.menuLabel}>
                {t('playlist.delete')}
              </AppText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
      ) : null}

      {renaming ? (
        <PlaylistNameDialog
          visible
          title={t('playlist.rename')}
          confirmLabel={t('playlist.save')}
          initialName={playlist.title}
          onConfirm={(name) => {
            dispatch(renamePlaylist({ id: playlist.id, title: name }));
            setRenaming(false);
          }}
          onCancel={() => setRenaming(false)}
        />
      ) : null}

      {confirmDelete ? (
        <ConfirmDialog
          visible
          title={t('playlist.delete')}
          message={t('playlist.deleteConfirm', { title: playlist.title })}
          confirmLabel={t('playlist.delete')}
          cancelLabel={t('common.cancel')}
          destructive
          onConfirm={() => {
            setConfirmDelete(false);
            // Defer until the confirm dialog dismisses; go back first (unmounting
            // this screen), then delete — avoids a frozen overlay and a "not found"
            // flash from the removed playlist.
            setTimeout(() => {
              navigation.goBack();
              dispatch(deletePlaylist({ id: playlist.id }));
            }, 350);
          }}
          onCancel={() => setConfirmDelete(false)}
        />
      ) : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: { paddingBottom: 96 },
  header: { alignItems: 'center', paddingBottom: 16 },
  bgArt: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.5 },
  topBar: { width: '100%', paddingHorizontal: 12, paddingTop: 48, flexDirection: 'row', justifyContent: 'space-between' },
  topBarFixed: { paddingHorizontal: 12, paddingTop: 8 },
  art: { borderRadius: 10, marginTop: 8, backgroundColor: '#222' },
  title: { textAlign: 'center', marginTop: 16, paddingHorizontal: 24 },
  sub: { marginTop: 6 },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  actionsRight: { flexDirection: 'row', alignItems: 'center' },
  shuffle: { marginHorizontal: 14 },
  list: { paddingHorizontal: 16 },
  // Natural-height state area (loading / empty) — no flex:1, so it's safe inside the ScrollView.
  stateBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 72, paddingHorizontal: 32 },
  emptyTitle: { marginTop: 16, textAlign: 'center' },
  emptyHint: { marginTop: 8, textAlign: 'center' },
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36 },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  menuLabel: { marginLeft: 16 },
});

export default PlaylistDetailsScreen;
