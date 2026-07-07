import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Screen, Loader, AppText, Artwork, Button, IconButton } from '@/components/common';
import { useTheme } from '@/context';
import { TrackRow } from '@/components/cards';
import { FloatingMiniPlayer } from '@/components/player';
import { AlbumRatingSummary, ReviewComposer, SongRatingControl } from '@/components/reviews';
import {
  useAppDispatch,
  useAppSelector,
  useIsAlbumLiked,
  usePlayer,
  useReviews,
  useSongSummaries,
} from '@/hooks';
import { usePlaylistMenu } from '@/components/playlists';
import { shareAlbum } from '@/services/share';
import { albumUuid, trackSongUuid } from '@/services/playlists';
import { songLikeKey } from '@/services/likes';
import { toggleAlbumLike, toggleSongLike } from '@/redux';
import { AlbumRepository } from '@/repositories';
import { Album, MyReview, ReviewTargetType, Track } from '@/types';
import type { RootStackParamList, RootStackScreenProps } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const { width } = Dimensions.get('window');
const ART = width * 0.62;

export const AlbumDetailsScreen: React.FC = () => {
  const { params } = useRoute<RootStackScreenProps<'AlbumDetails'>['route']>();
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { playTracks, playFrom, currentTrack, isPlaying, toggle } = usePlayer();
  const { openTrackOptions, addAlbumToPlaylist } = usePlaylistMenu();

  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);

  const albumLiked = useIsAlbumLiked({ id: params.albumId });
  const likeKeys = useAppSelector((s) => s.likes.keys);

  useEffect(() => {
    let active = true;
    setLoading(true);
    AlbumRepository.getById(params.albumId)
      .then((a) => active && setAlbum(a))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [params.albumId]);

  const tracks = useMemo(() => album?.tracks ?? [], [album]);

  // Ratings: the reviews API keys by the backend's deterministic uuids, while
  // the mobile catalog uses codes — so convert album code -> albumUuid and each
  // track -> its song uuid (same scheme playlists use). See songId.ts.
  const albumTargetId = useMemo(() => (album ? albumUuid(album.id) : undefined), [album]);
  const { summary: albumSummary, applySummary: applyAlbumSummary } = useReviews(
    'album',
    albumTargetId,
  );
  const songTargets = useMemo(
    () =>
      tracks
        .map((tr) => ({ localId: tr.id, targetId: trackSongUuid(tr) }))
        .filter((s): s is { localId: string; targetId: string } => s.targetId != null),
    [tracks],
  );
  const { summaries: songSummaries, applyOne: applySongSummary } = useSongSummaries(songTargets);
  const [composer, setComposer] = useState<{
    type: ReviewTargetType;
    targetId: string; // uuid sent to the API
    localId?: string; // local Track.id, for keying the per-song summary
    label: string;
    initial: MyReview | null;
  } | null>(null);

  const onPlay = useCallback(() => {
    // If this album is already the active queue, just pause/resume; otherwise
    // start it from the top.
    if (currentTrack && currentTrack.albumId === album?.id) {
      toggle();
    } else if (tracks.length) {
      playTracks(tracks, 0);
    }
  }, [currentTrack, album?.id, tracks, playTracks, toggle]);

  const onShuffle = useCallback(() => {
    if (!tracks.length) return;
    const shuffled = [...tracks].sort(() => Math.random() - 0.5);
    playTracks(shuffled, 0);
  }, [tracks, playTracks]);

  const onShare = useCallback(() => {
    if (album) {
      void shareAlbum({ code: album.id, title: album.title, artistName: album.artistName });
    }
  }, [album]);

  if (loading) {
    return (
      <Screen safeArea={false}>
        <Loader />
      </Screen>
    );
  }

  if (!album) {
    return (
      <Screen>
        <View style={styles.center}>
          <AppText color="textMuted">{t('errors.albumNotFound')}</AppText>
        </View>
      </Screen>
    );
  }

  // This album is the active queue AND currently playing → show Pause.
  const isThisAlbumPlaying =
    !!currentTrack && currentTrack.albumId === album.id && isPlaying;

  return (
    <Screen safeArea={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: 96 + insets.bottom }]}
      >
        <View style={styles.header}>
          <Artwork
            uri={album.cover}
            accentColor={album.accentColor}
            style={styles.bgArt}
            blurRadius={40}
            iconSize={0}
          />
          <LinearGradient colors={['transparent', '#0B0B0F']} style={StyleSheet.absoluteFill} />
          <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
            <IconButton
              name="chevron-back"
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
            />
          </View>
          <View style={[styles.artFrame, { width: ART, height: ART }]}>
            <Artwork
              uri={album.cover}
              accentColor={album.accentColor}
              style={styles.artImage}
              contentFit="contain"
              iconSize={Math.round(ART * 0.3)}
            />
          </View>
          <AppText variant="display" style={styles.title} numberOfLines={2}>
            {album.title}
          </AppText>
          <Pressable onPress={() => navigation.navigate('ArtistDetails', { artistId: album.artistId })}>
            <AppText variant="h3" color="primary">
              {album.artistName}
            </AppText>
          </Pressable>
          <AppText variant="bodySm" color="textMuted" style={styles.sub}>
            {album.year ? `${album.year} • ` : ''}
            {t('album.tracks', { count: tracks.length })}
          </AppText>
          {album.genres?.length ? (
            <View style={styles.genres}>
              {/* Primary genre as a pill, the rest as muted secondary labels
                  (mirrors the web album header: GOSPEL · Honky-Tonk). */}
              <View style={[styles.genrePill, { borderColor: theme.colors.primary }]}>
                <AppText variant="caption" color="primary" style={styles.genrePillText}>
                  {album.genres[0].toUpperCase()}
                </AppText>
              </View>
              {album.genres.slice(1).map((g) => (
                <AppText key={g} variant="bodySm" color="textMuted" style={styles.genreSecondary}>
                  {g}
                </AppText>
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.actions}>
          <View style={styles.actionsLeft}>
            <IconButton
              name={albumLiked ? 'heart' : 'heart-outline'}
              size={28}
              color={albumLiked ? theme.colors.accent : undefined}
              onPress={() => dispatch(toggleAlbumLike(album))}
            />
            <IconButton name="share-outline" size={26} onPress={onShare} style={styles.share} />
            <Pressable
              onPress={() => addAlbumToPlaylist(tracks)}
              hitSlop={10}
              disabled={!tracks.length}
              style={[styles.share, { opacity: tracks.length ? 1 : 0.4 }]}
              accessibilityRole="button"
              accessibilityLabel={t('playlist.addToPlaylist')}
            >
              <MaterialCommunityIcons name="playlist-plus" size={28} color="#FFFFFF" />
            </Pressable>
          </View>
          <View style={styles.actionsRight}>
            <IconButton name="shuffle" size={26} onPress={onShuffle} style={styles.dl} />
            <Button
              label={isThisAlbumPlaying ? t('common.pause') : t('common.play')}
              icon={isThisAlbumPlaying ? 'pause' : 'play'}
              onPress={onPlay}
            />
          </View>
        </View>

        <AlbumRatingSummary
          summary={albumSummary}
          onRate={() =>
            albumTargetId &&
            setComposer({
              type: 'album',
              targetId: albumTargetId,
              label: album.title,
              initial: albumSummary?.mine ?? null,
            })
          }
          onSeeAll={() =>
            navigation.navigate('AlbumReviews', { albumId: album.id, albumTitle: album.title })
          }
        />

        <View style={styles.list}>
          {tracks.map((track: Track, i) => (
            <TrackRow
              key={track.id}
              track={track}
              index={i + 1}
              isActive={currentTrack?.id === track.id}
              isFavorite={!!likeKeys[songLikeKey(track) ?? '']}
              onPress={() => playFrom(tracks, track.id)}
              onToggleFavorite={
                songLikeKey(track) ? (tr) => dispatch(toggleSongLike(tr)) : undefined
              }
              onOptions={openTrackOptions}
              ratingSlot={
                trackSongUuid(track) ? (
                  <SongRatingControl
                    summary={songSummaries[track.id]}
                    onRate={() =>
                      setComposer({
                        type: 'song',
                        targetId: trackSongUuid(track)!,
                        localId: track.id,
                        label: track.title,
                        initial: songSummaries[track.id]?.mine ?? null,
                      })
                    }
                  />
                ) : null
              }
            />
          ))}
        </View>
      </ScrollView>

      {/* Solid-black safe-area bands so nothing scrolls behind the status bar or
          the gesture/navigation bar (kept below the mini player, which paints its
          own backdrop while playing). */}
      {insets.top > 0 ? (
        <View style={[styles.safeBand, styles.safeBandTop, { height: insets.top }]} pointerEvents="none" />
      ) : null}
      {insets.bottom > 0 ? (
        <View style={[styles.safeBand, styles.safeBandBottom, { height: insets.bottom }]} pointerEvents="none" />
      ) : null}

      <FloatingMiniPlayer />

      {composer ? (
        <ReviewComposer
          type={composer.type}
          id={composer.targetId}
          targetLabel={composer.label}
          initial={composer.initial}
          onClose={() => setComposer(null)}
          onSaved={(summary) =>
            composer.type === 'album'
              ? applyAlbumSummary(summary)
              : applySongSummary(composer.localId!, summary)
          }
          onDeleted={(summary) =>
            composer.type === 'album'
              ? applyAlbumSummary(summary)
              : applySongSummary(composer.localId!, summary)
          }
        />
      ) : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: { paddingBottom: 96 },
  header: { alignItems: 'center', paddingBottom: 16, paddingTop: 0 },
  bgArt: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.5 },
  topBar: { width: '100%', paddingHorizontal: 12, alignItems: 'flex-start' },
  // Circular scrim behind the back button so it reads over any artwork, bright
  // or dark. Size gives an easy tap target; IconButton centers the icon.
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  // Centered "matte" frame: consistent padding around the cover so the whole
  // artwork (contain-fit, no crop) is always visible with clean spacing, and the
  // frame's rounded corners sit in the padding — never clipping the artwork.
  artFrame: {
    marginTop: 8,
    padding: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  artImage: { flex: 1, borderRadius: 10, backgroundColor: 'transparent' },
  title: { textAlign: 'center', marginTop: 16, paddingHorizontal: 24 },
  sub: { marginTop: 6 },
  genres: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 10,
    paddingHorizontal: 24,
  },
  genrePill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  genrePillText: { letterSpacing: 0.5 },
  genreSecondary: { marginLeft: 8 },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  actionsLeft: { flexDirection: 'row', alignItems: 'center' },
  share: { marginLeft: 18 },
  actionsRight: { flexDirection: 'row', alignItems: 'center' },
  dl: { marginHorizontal: 14 },
  list: { paddingHorizontal: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  safeBand: { position: 'absolute', left: 0, right: 0, backgroundColor: '#000' },
  safeBandTop: { top: 0 },
  safeBandBottom: { bottom: 0 },
});

export default AlbumDetailsScreen;
