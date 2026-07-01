import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
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
import { useAppDispatch, useAppSelector, usePlayer } from '@/hooks';
import {
  deletePlaylist,
  fetchPlaylistDetail,
  removeItemFromPlaylist,
  renamePlaylist,
  reorderPlaylistItems,
  toggleSongLike,
} from '@/redux';
import { shuffle as shuffleArray } from '@/utils';
import { songLikeKey } from '@/services/likes';
import type { PlaylistItem } from '@/services/playlists';
import type { RootStackParamList, RootStackScreenProps } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const { width } = Dimensions.get('window');
const ART = width * 0.62;

export const PlaylistDetailsScreen: React.FC = () => {
  const { params } = useRoute<RootStackScreenProps<'PlaylistDetails'>['route']>();
  const id = params.playlistId;
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { playTracks, playFrom, currentTrack } = usePlayer();

  const detail = useAppSelector((s) => s.playlists.byId[id]);
  const summary = useAppSelector((s) => s.playlists.summaries.find((p) => p.id === id));
  const likeKeys = useAppSelector((s) => s.likes.keys);

  const [failed, setFailed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [optionsItem, setOptionsItem] = useState<PlaylistItem | null>(null);
  const [editing, setEditing] = useState(false);
  const [order, setOrder] = useState<PlaylistItem[]>([]);

  // Refresh detail whenever the screen gains focus (e.g. returning from Add Songs).
  useFocusEffect(
    useCallback(() => {
      setFailed(false);
      void dispatch(fetchPlaylistDetail(id))
        .unwrap()
        .catch(() => setFailed(true));
    }, [dispatch, id]),
  );

  const items = useMemo(() => detail?.items ?? [], [detail]);
  const tracks = useMemo(() => items.map((i) => i.track), [items]);
  const name = detail?.name ?? summary?.name ?? '';
  const cover = tracks[0]?.artwork ?? '';

  const trackOptions = useMemo<TrackOption[]>(() => {
    if (!optionsItem) return [];
    const likeKey = songLikeKey(optionsItem.track);
    const isFav = likeKey ? !!likeKeys[likeKey] : false;
    return [
      {
        key: 'remove',
        label: t('playlist.removeFromPlaylist'),
        icon: 'remove-circle-outline',
        destructive: true,
        onPress: () =>
          dispatch(
            removeItemFromPlaylist({
              playlistId: id,
              itemId: optionsItem.id,
              songId: optionsItem.songId,
            }),
          ),
      },
      {
        key: 'like',
        label: isFav ? t('player.removeFromLiked') : t('player.like'),
        icon: isFav ? 'heart' : 'heart-outline',
        onPress: (track) => dispatch(toggleSongLike(track)),
      },
    ];
  }, [optionsItem, likeKeys, dispatch, t, id]);

  const onPlay = () => {
    if (tracks.length) void playTracks(tracks, 0);
  };
  const onShuffle = () => {
    if (tracks.length) void playTracks(shuffleArray(tracks), 0);
  };

  const startEdit = () => {
    setOrder(items);
    setEditing(true);
  };
  const move = (from: number, to: number) =>
    setOrder((prev) => {
      if (to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  const saveOrder = () => {
    void dispatch(reorderPlaylistItems({ playlistId: id, orderedSongIds: order.map((i) => i.songId) }));
    setEditing(false);
  };

  if (failed && !detail) {
    return (
      <Screen>
        <View style={styles.topBarFixed}>
          <IconButton name="chevron-back" onPress={() => navigation.goBack()} />
        </View>
        <Placeholder icon="musical-notes-outline" title={t('playlist.notFound')} />
      </Screen>
    );
  }

  return (
    <Screen safeArea={false}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Artwork uri={cover} style={styles.bgArt} blurRadius={40} iconSize={0} />
          <LinearGradient colors={['transparent', '#0B0B0F']} style={StyleSheet.absoluteFill} />
          <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
            <IconButton name="chevron-back" onPress={() => navigation.goBack()} />
            {!editing ? (
              <IconButton name="ellipsis-horizontal" onPress={() => setMenuOpen(true)} />
            ) : null}
          </View>
          <Artwork uri={cover} style={[styles.art, { width: ART, height: ART }]} iconSize={Math.round(ART * 0.3)} />
          <AppText variant="display" style={styles.title} numberOfLines={2}>
            {name}
          </AppText>
          <AppText variant="bodySm" color="textMuted" style={styles.sub}>
            {t('playlist.songCount', { count: tracks.length })}
          </AppText>
        </View>

        {editing ? (
          <View style={styles.actions}>
            <Button label={t('common.cancel')} variant="ghost" onPress={() => setEditing(false)} />
            <Button label={t('common.done')} icon="checkmark" onPress={saveOrder} />
          </View>
        ) : (
          <View style={styles.actions}>
            <Button
              label={t('playlist.addSongs')}
              icon="add"
              variant="secondary"
              onPress={() => navigation.navigate('PlaylistAddSongs', { playlistId: id })}
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
        )}

        {!detail ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={theme.colors.primary} size="large" />
          </View>
        ) : editing ? (
          <View style={styles.list}>
            {order.map((item, i) => (
              <View key={item.id} style={styles.editRow}>
                <AppText variant="body" numberOfLines={1} style={styles.editTitle}>
                  {item.track.title}
                </AppText>
                <IconButton
                  name="chevron-up"
                  size={22}
                  disabled={i === 0}
                  onPress={() => move(i, i - 1)}
                />
                <IconButton
                  name="chevron-down"
                  size={22}
                  disabled={i === order.length - 1}
                  onPress={() => move(i, i + 1)}
                  style={styles.downArrow}
                />
              </View>
            ))}
          </View>
        ) : tracks.length ? (
          <View style={styles.list}>
            {items.map((item, i) => (
              <TrackRow
                key={item.id}
                track={item.track}
                index={i + 1}
                isActive={currentTrack?.id === item.track.id}
                onPress={() => playFrom(tracks, item.track.id)}
                onOptions={() => setOptionsItem(item)}
              />
            ))}
          </View>
        ) : (
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

      {/* Modals mounted only while open (a stack of always-mounted RN <Modal>s wedges
          the Android UI thread on Old Arch). */}
      {optionsItem ? (
        <TrackOptionsModal
          track={optionsItem.track}
          options={trackOptions}
          onClose={() => setOptionsItem(null)}
        />
      ) : null}

      {menuOpen ? (
        <Modal visible transparent animationType="slide" onRequestClose={() => setMenuOpen(false)}>
          <Pressable
            style={[styles.backdrop, { backgroundColor: theme.colors.overlay }]}
            onPress={() => setMenuOpen(false)}
          >
            <Pressable
              style={[
                styles.sheet,
                {
                  backgroundColor: theme.colors.backgroundElevated,
                  borderTopLeftRadius: theme.radius.xl,
                  borderTopRightRadius: theme.radius.xl,
                  paddingBottom: 36 + insets.bottom,
                },
              ]}
            >
              <Pressable
                style={({ pressed }) => [styles.menuRow, { opacity: pressed ? 0.6 : 1 }]}
                onPress={() => {
                  setMenuOpen(false);
                  setTimeout(() => setRenaming(true), 260);
                }}
              >
                <Ionicons name="create-outline" size={22} color={theme.colors.icon} />
                <AppText variant="body" style={styles.menuLabel}>
                  {t('playlist.rename')}
                </AppText>
              </Pressable>
              {items.length > 1 ? (
                <Pressable
                  style={({ pressed }) => [styles.menuRow, { opacity: pressed ? 0.6 : 1 }]}
                  onPress={() => {
                    setMenuOpen(false);
                    setTimeout(startEdit, 260);
                  }}
                >
                  <Ionicons name="swap-vertical-outline" size={22} color={theme.colors.icon} />
                  <AppText variant="body" style={styles.menuLabel}>
                    {t('playlist.reorder')}
                  </AppText>
                </Pressable>
              ) : null}
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
          initialName={name}
          onConfirm={(newName) => {
            void dispatch(renamePlaylist({ id, name: newName }));
            setRenaming(false);
          }}
          onCancel={() => setRenaming(false)}
        />
      ) : null}

      {confirmDelete ? (
        <ConfirmDialog
          visible
          title={t('playlist.delete')}
          message={t('playlist.deleteConfirm', { title: name })}
          confirmLabel={t('playlist.delete')}
          cancelLabel={t('common.cancel')}
          destructive
          onConfirm={() => {
            setConfirmDelete(false);
            setTimeout(() => {
              navigation.goBack();
              void dispatch(deletePlaylist(id));
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
  topBar: { width: '100%', paddingHorizontal: 12, flexDirection: 'row', justifyContent: 'space-between' },
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
  editRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  editTitle: { flex: 1, marginRight: 12 },
  downArrow: { marginLeft: 8 },
  stateBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 72, paddingHorizontal: 32 },
  emptyTitle: { marginTop: 16, textAlign: 'center' },
  emptyHint: { marginTop: 8, textAlign: 'center' },
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36 },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  menuLabel: { marginLeft: 16 },
});

export default PlaylistDetailsScreen;
