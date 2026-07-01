import React, { useEffect, useState } from 'react';
import { Dimensions, FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Screen, Loader, AppText, Artwork, Button, IconButton } from '@/components/common';
import { AlbumCard, TrackRow } from '@/components/cards';
import { FloatingMiniPlayer } from '@/components/player';
import { useAppDispatch, useAppSelector, usePlayer, useVisibleAlbums, useVisibleTracks } from '@/hooks';
import { usePlaylistMenu } from '@/components/playlists';
import { toggleFollowArtist } from '@/redux';
import { ArtistRepository } from '@/repositories';
import { Album, Artist, Track } from '@/types';
import { formatCount } from '@/utils';
import type { RootStackParamList, RootStackScreenProps } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const { width } = Dimensions.get('window');
const HERO = width * 0.95;

export const ArtistDetailsScreen: React.FC = () => {
  const { params } = useRoute<RootStackScreenProps<'ArtistDetails'>['route']>();
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { playTracks, playFrom, currentTrack } = usePlayer();
  const { openTrackOptions } = usePlaylistMenu();

  const [artist, setArtist] = useState<Artist | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const visibleAlbums = useVisibleAlbums(albums);
  const visibleTopTracks = useVisibleTracks(topTracks);

  const following = useAppSelector((s) => s.library.followedArtistIds.includes(params.artistId));

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      ArtistRepository.getById(params.artistId),
      ArtistRepository.getAlbums(params.artistId),
      ArtistRepository.getTopTracks(params.artistId),
    ])
      .then(([a, al, tt]) => {
        if (!active) return;
        setArtist(a);
        setAlbums(al);
        setTopTracks(tt);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [params.artistId]);

  if (loading) {
    return (
      <Screen safeArea={false}>
        <Loader />
      </Screen>
    );
  }

  if (!artist) {
    return (
      <Screen>
        <View style={styles.center}>
          <AppText color="textMuted">{t('errors.artistNotFound')}</AppText>
        </View>
      </Screen>
    );
  }

  // Persona summary (mirrors the web artist header, adapted for mobile). The
  // manifest maps the artist's role -> `bio` and its category label -> `genres[0]`;
  // counts are over the playable albums the app actually shows.
  const category = artist.genres?.[0];
  const role = artist.bio?.trim() || category;
  const albumCount = visibleAlbums.length;
  const totalTracks = visibleAlbums.reduce((n, a) => n + (a.trackCount ?? 0), 0);

  return (
    <Screen safeArea={false}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={[styles.hero, { height: HERO }]}>
          <Artwork uri={artist.image} style={StyleSheet.absoluteFill} iconSize={72} />
          <LinearGradient colors={['transparent', 'transparent', '#0B0B0F']} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />
          <View style={[styles.topBar, { top: insets.top + 8 }]}>
            <IconButton name="chevron-back" onPress={() => navigation.goBack()} />
          </View>
          <View style={styles.heroText}>
            <AppText variant="displayLg" numberOfLines={2}>
              {artist.name}
            </AppText>
            {artist.monthlyListeners ? (
              <AppText variant="bodySm" color="textSecondary" style={styles.listeners}>
                {t('artist.monthlyListeners', { listeners: formatCount(artist.monthlyListeners) })}
              </AppText>
            ) : null}
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            label={following ? t('common.following') : t('common.follow')}
            icon={following ? 'checkmark' : 'add'}
            variant={following ? 'ghost' : 'secondary'}
            onPress={() => dispatch(toggleFollowArtist(artist.id))}
          />
          <IconButton
            name="play-circle"
            size={52}
            color="#007FFF"
            onPress={() => visibleTopTracks.length && playTracks(visibleTopTracks, 0)}
          />
        </View>

        <View style={styles.summary}>
          {category ? (
            <AppText variant="caption" color="textMuted" style={styles.kicker}>
              {`${category} · ${t('artist.personaSummary')}`}
            </AppText>
          ) : null}
          {role || category ? (
            <AppText variant="bodySm" color="textSecondary" style={styles.summarySub}>
              {role ? `${role} · ` : ''}
              {category
                ? t('artist.albumsAnchoring', { n: albumCount, category })
                : t('artist.albumCount', { n: albumCount })}
            </AppText>
          ) : null}
          <View style={styles.stats}>
            <View style={styles.stat}>
              <AppText variant="caption" color="textMuted" style={styles.statLabel}>
                {t('artist.statAlbums')}
              </AppText>
              <AppText variant="h2">{albumCount}</AppText>
            </View>
            <View style={styles.stat}>
              <AppText variant="caption" color="textMuted" style={styles.statLabel}>
                {t('artist.statTracks')}
              </AppText>
              <AppText variant="h2">{totalTracks.toLocaleString()}</AppText>
            </View>
          </View>
        </View>

        <AppText variant="h2" style={styles.sectionTitle}>
          {t('artist.popular')}
        </AppText>
        <View style={styles.list}>
          {visibleTopTracks.map((track) => (
            <TrackRow
              key={track.id}
              track={track}
              isActive={currentTrack?.id === track.id}
              onPress={() => playFrom(visibleTopTracks, track.id)}
              onOptions={openTrackOptions}
            />
          ))}
        </View>

        <AppText variant="h2" style={styles.sectionTitle}>
          {t('artist.discography')}
        </AppText>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={visibleAlbums}
          keyExtractor={(a) => a.id}
          contentContainerStyle={styles.albumRow}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          renderItem={({ item }) => (
            <AlbumCard album={item} onPress={(al) => navigation.navigate('AlbumDetails', { albumId: al.id })} />
          )}
        />
      </ScrollView>
      <FloatingMiniPlayer />
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: { paddingBottom: 96 },
  hero: { width: '100%', justifyContent: 'flex-end' },
  topBar: { position: 'absolute', left: 12 },
  heroText: { paddingHorizontal: 16, paddingBottom: 12 },
  listeners: { marginTop: 6 },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 12 },
  summary: { paddingHorizontal: 16, marginTop: 18 },
  kicker: { textTransform: 'uppercase', letterSpacing: 1.2 },
  summarySub: { marginTop: 6, lineHeight: 20 },
  stats: { flexDirection: 'row', gap: 36, marginTop: 16 },
  stat: {},
  statLabel: { textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
  sectionTitle: { paddingHorizontal: 16, marginTop: 28, marginBottom: 12 },
  list: { paddingHorizontal: 16 },
  albumRow: { paddingHorizontal: 16 },
  sep: { width: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default ArtistDetailsScreen;
