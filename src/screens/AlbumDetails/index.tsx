import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Screen, Loader, AppText, Artwork, Button, IconButton } from '@/components/common';
import { TrackRow } from '@/components/cards';
import { FloatingMiniPlayer } from '@/components/player';
import { useAppDispatch, useAppSelector, usePlayer } from '@/hooks';
import { usePlaylistMenu } from '@/components/playlists';
import { toggleSavedAlbum, toggleFavoriteTrack } from '@/redux';
import { AlbumRepository } from '@/repositories';
import { Album, Track } from '@/types';
import type { RootStackParamList, RootStackScreenProps } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const { width } = Dimensions.get('window');
const ART = width * 0.62;

export const AlbumDetailsScreen: React.FC = () => {
  const { params } = useRoute<RootStackScreenProps<'AlbumDetails'>['route']>();
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { playTracks, playFrom, currentTrack } = usePlayer();
  const { openTrackOptions } = usePlaylistMenu();

  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);

  const saved = useAppSelector((s) => s.library.savedAlbums.some((a) => a.id === params.albumId));
  const favoriteIds = useAppSelector((s) => s.library.favoriteTrackIds);

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

  const onPlay = useCallback(() => {
    if (tracks.length) playTracks(tracks, 0);
  }, [tracks, playTracks]);

  const onShuffle = useCallback(() => {
    if (!tracks.length) return;
    const shuffled = [...tracks].sort(() => Math.random() - 0.5);
    playTracks(shuffled, 0);
  }, [tracks, playTracks]);

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

  return (
    <Screen safeArea={false}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Artwork
            uri={album.cover}
            accentColor={album.accentColor}
            style={styles.bgArt}
            blurRadius={40}
            iconSize={0}
          />
          <LinearGradient colors={['transparent', '#0B0B0F']} style={StyleSheet.absoluteFill} />
          <View style={styles.topBar}>
            <IconButton name="chevron-back" onPress={() => navigation.goBack()} />
          </View>
          <Artwork
            uri={album.cover}
            accentColor={album.accentColor}
            style={[styles.art, { width: ART, height: ART }]}
            iconSize={Math.round(ART * 0.3)}
          />
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
        </View>

        <View style={styles.actions}>
          <View style={styles.actionsLeft}>
            <IconButton
              name={saved ? 'checkmark-circle' : 'add-circle-outline'}
              size={30}
              onPress={() => dispatch(toggleSavedAlbum(album))}
            />
          </View>
          <View style={styles.actionsRight}>
            <IconButton name="shuffle" size={26} onPress={onShuffle} style={styles.dl} />
            <Button label={t('common.play')} icon="play" onPress={onPlay} />
          </View>
        </View>

        <View style={styles.list}>
          {tracks.map((track: Track, i) => (
            <TrackRow
              key={track.id}
              track={track}
              index={i + 1}
              isActive={currentTrack?.id === track.id}
              isFavorite={favoriteIds.includes(track.id)}
              onPress={() => playFrom(tracks, track.id)}
              onToggleFavorite={(tr) => dispatch(toggleFavoriteTrack(tr))}
              onOptions={openTrackOptions}
            />
          ))}
        </View>
      </ScrollView>
      <FloatingMiniPlayer />
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: { paddingBottom: 96 },
  header: { alignItems: 'center', paddingBottom: 16, paddingTop: 0 },
  bgArt: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.5 },
  topBar: { width: '100%', paddingHorizontal: 12, paddingTop: 48, alignItems: 'flex-start' },
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
  actionsLeft: { flexDirection: 'row', alignItems: 'center' },
  actionsRight: { flexDirection: 'row', alignItems: 'center' },
  dl: { marginHorizontal: 14 },
  list: { paddingHorizontal: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default AlbumDetailsScreen;
