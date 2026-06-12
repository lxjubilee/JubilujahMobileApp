import React from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/context';
import { AppText, IconButton } from '@/components/common';
import { ProgressBar } from '@/components/player';
import { useAppDispatch, useAppSelector, usePlayer, useSafeProgress } from '@/hooks';
import { toggleFavoriteTrack } from '@/redux';
import { cdnUrl } from '@/utils';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const { width } = Dimensions.get('window');
const ART = width - 48;

export const MusicPlayerScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const { currentTrack, isPlaying, repeatMode, shuffle, toggle, next, previous, seekTo, cycleRepeat, toggleShuffle } =
    usePlayer();
  const { position, duration } = useSafeProgress(500);
  const isFavorite = useAppSelector((s) =>
    currentTrack ? s.library.favoriteTrackIds.includes(currentTrack.id) : false,
  );

  if (!currentTrack) {
    return (
      <View style={[styles.empty, { backgroundColor: theme.colors.background }]}>
        <AppText color="textMuted">Nothing playing.</AppText>
        <IconButton name="chevron-down" size={28} onPress={() => navigation.goBack()} style={styles.emptyClose} />
      </View>
    );
  }

  const repeatActive = repeatMode !== 'off';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Image source={{ uri: cdnUrl(currentTrack.artwork) }} style={StyleSheet.absoluteFill} contentFit="cover" blurRadius={60} />
      <LinearGradient colors={['rgba(11,11,15,0.4)', '#0B0B0F']} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <IconButton name="chevron-down" size={28} onPress={() => navigation.goBack()} />
        <AppText variant="label" color="textSecondary">
          {currentTrack.albumName}
        </AppText>
        <IconButton name="ellipsis-horizontal" size={24} />
      </View>

      <View style={styles.artWrap}>
        <Image
          source={{ uri: cdnUrl(currentTrack.artwork) }}
          style={[styles.art, { width: ART, height: ART, borderRadius: theme.radius.lg }]}
          contentFit="cover"
        />
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <View style={styles.titleText}>
            <AppText variant="display" numberOfLines={1}>
              {currentTrack.title}
            </AppText>
            <Pressable
              onPress={() =>
                navigation.navigate('ArtistDetails', { artistId: currentTrack.artistId })
              }
            >
              <AppText variant="h3" color="textSecondary" numberOfLines={1}>
                {currentTrack.artistName}
              </AppText>
            </Pressable>
          </View>
          <IconButton
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={28}
            color={isFavorite ? theme.colors.accent : theme.colors.icon}
            onPress={() => dispatch(toggleFavoriteTrack(currentTrack))}
          />
        </View>

        <ProgressBar position={position} duration={duration} onSeek={seekTo} />

        <View style={styles.controls}>
          <IconButton
            name="shuffle"
            size={24}
            color={shuffle ? theme.colors.accent : theme.colors.iconMuted}
            onPress={toggleShuffle}
          />
          <IconButton name="play-skip-back" size={34} onPress={previous} />
          <Pressable
            onPress={toggle}
            style={[styles.playBtn, { backgroundColor: theme.colors.text }]}
          >
            <IconButton
              name={isPlaying ? 'pause' : 'play'}
              size={34}
              color="#000"
              onPress={toggle}
            />
          </Pressable>
          <IconButton name="play-skip-forward" size={34} onPress={next} />
          <IconButton
            name="repeat"
            size={24}
            color={repeatActive ? theme.colors.accent : theme.colors.iconMuted}
            onPress={cycleRepeat}
          />
        </View>

        <View style={styles.footer}>
          <IconButton name="share-outline" size={22} color={theme.colors.iconMuted} />
          <IconButton name="list" size={22} color={theme.colors.iconMuted} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 52 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyClose: { position: 'absolute', top: 52, left: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  artWrap: { alignItems: 'center', marginTop: 24 },
  art: { backgroundColor: '#222' },
  body: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 24, paddingBottom: 36 },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  titleText: { flex: 1, marginRight: 12 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  playBtn: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 28 },
});

export default MusicPlayerScreen;
