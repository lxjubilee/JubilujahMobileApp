import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Screen, Loader, AppText } from '@/components/common';
import { useAppDispatch, useAppSelector, usePlayer, useVisibleAlbums, useVisibleRails } from '@/hooks';
import { fetchHomeFeed } from '@/redux';
import { AlbumRepository } from '@/repositories';
import { Album, Artist, ResolvedRail } from '@/types';
import { logger } from '@/utils';
import type { RootStackParamList } from '@/navigation/types';
import { HeroCarousel } from './components/HeroCarousel';
import { Rail } from './components/Rail';
import { HomeHeader, HomeFilter, HOME_FILTER_ALL } from './components/HomeHeader';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const HomeScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const { playTracks } = usePlayer();
  const { feed, status } = useAppSelector((s) => s.home);
  const [filter, setFilter] = useState<HomeFilter>(HOME_FILTER_ALL);
  // Hero albums minus any whose cover is missing.
  const heroes = useVisibleAlbums(feed?.heroes ?? []);
  // Rails with artwork-less items removed and emptied rails dropped — so no
  // blank gap is left where an all-missing rail used to be.
  const railsWithArt = useVisibleRails(feed?.rails ?? []);

  // Chips = "Home" + each distinct category that still has content (in order).
  const filters = useMemo<HomeFilter[]>(() => {
    const labels: string[] = [];
    for (const rail of railsWithArt) {
      if (rail.categoryLabel && !labels.includes(rail.categoryLabel)) {
        labels.push(rail.categoryLabel);
      }
    }
    return [HOME_FILTER_ALL, ...labels];
  }, [railsWithArt]);

  // Reset to "Home" if the selected category vanishes after a feed refresh.
  useEffect(() => {
    if (!filters.includes(filter)) setFilter(HOME_FILTER_ALL);
  }, [filters, filter]);

  // "Home" shows every rail; any other chip shows only rails in that category.
  const visibleRails = useMemo(
    () =>
      railsWithArt.filter(
        (rail) => filter === HOME_FILTER_ALL || rail.categoryLabel === filter,
      ),
    [railsWithArt, filter],
  );

  // Animated state for the collapsing header (chips) and its solid background.
  const chipsAnim = useRef(new Animated.Value(1)).current; // 1 = chips visible
  const bgAnim = useRef(new Animated.Value(0)).current; // 0 = gradient, 1 = solid black
  const lastY = useRef(0);
  const chipsVisible = useRef(true);
  const bgSolid = useRef(false);

  const animate = useCallback(
    (value: Animated.Value, toValue: number) =>
      Animated.timing(value, { toValue, duration: 200, useNativeDriver: false }).start(),
    [],
  );

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;

      // Background: solid black once we leave the very top.
      const solid = y > 12;
      if (solid !== bgSolid.current) {
        bgSolid.current = solid;
        animate(bgAnim, solid ? 1 : 0);
      }

      // Chips: hide on scroll-down, show on scroll-up (always shown at the top).
      const dy = y - lastY.current;
      if (y <= 12) {
        if (!chipsVisible.current) {
          chipsVisible.current = true;
          animate(chipsAnim, 1);
        }
      } else if (dy > 6 && chipsVisible.current) {
        chipsVisible.current = false;
        animate(chipsAnim, 0);
      } else if (dy < -6 && !chipsVisible.current) {
        chipsVisible.current = true;
        animate(chipsAnim, 1);
      }
      lastY.current = y;
    },
    [animate, bgAnim, chipsAnim],
  );

  useEffect(() => {
    if (status === 'idle') dispatch(fetchHomeFeed());
  }, [dispatch, status]);

  const openAlbum = useCallback(
    (album: Album) => navigation.navigate('AlbumDetails', { albumId: album.id }),
    [navigation],
  );
  const openArtist = useCallback(
    (artist: Artist) => navigation.navigate('ArtistDetails', { artistId: artist.id }),
    [navigation],
  );
  const openProfile = useCallback(
    () => navigation.navigate('MainTabs', { screen: 'LibraryTab', params: { screen: 'Profile' } }),
    [navigation],
  );
  const openSeeAll = useCallback(
    (rail: ResolvedRail) => {
      if (!rail.seeAllArtistId) return;
      navigation.navigate('AlbumList', { title: rail.title, artistId: rail.seeAllArtistId });
    },
    [navigation],
  );

  /** Hero "Play" — fetch the album's tracks then start the queue. */
  const playAlbum = useCallback(
    async (album: Album) => {
      try {
        const full = await AlbumRepository.getById(album.id);
        if (full?.tracks?.length) await playTracks(full.tracks, 0);
      } catch (e) {
        logger.warn('Home.playAlbum failed', e);
      }
    },
    [playTracks],
  );

  const refreshing = status === 'loading' && feed != null;

  if (status === 'loading' && !feed) {
    return (
      <Screen safeArea={false}>
        <Loader message="Loading your music…" />
      </Screen>
    );
  }

  if (status === 'failed' && !feed) {
    return (
      <Screen>
        <View style={styles.center}>
          <AppText variant="body" color="textMuted" style={styles.errorText}>
            {t('home.loadError')}
          </AppText>
        </View>
      </Screen>
    );
  }

  return (
    <Screen safeArea={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => dispatch(fetchHomeFeed())}
            tintColor="#fff"
          />
        }
      >
        {heroes.length ? (
          <HeroCarousel albums={heroes} onPlay={playAlbum} onOpen={openAlbum} />
        ) : null}

        {visibleRails.map((rail) => (
          <View key={rail.id} style={styles.railWrap}>
            <Rail
              rail={rail}
              onAlbumPress={openAlbum}
              onArtistPress={openArtist}
              onSeeAll={openSeeAll}
            />
          </View>
        ))}
      </ScrollView>

      {/* Fixed Netflix-style header overlaying the hero. */}
      <HomeHeader
        filters={filters}
        selected={filter}
        onSelect={setFilter}
        chipsAnim={chipsAnim}
        bgAnim={bgAnim}
        onPressProfile={openProfile}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 24 },
  railWrap: { marginBottom: 28 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { textAlign: 'center' },
});

export default HomeScreen;
