import React from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context';
import { AppText, Artwork } from '@/components/common';
import { useAppDispatch, useIsAlbumLiked } from '@/hooks';
import { toggleAlbumLike } from '@/redux';
import { Album } from '@/types';

interface HeroBannerProps {
  album: Album;
  onPlay: (album: Album) => void;
  onOpen: (album: Album) => void;
}

const { width: W } = Dimensions.get('window');
const H_PADDING = 16;
// Wide featured card spanning the content width, tall portrait crop (~Netflix hero).
const POSTER_W = W - H_PADDING * 2;
const POSTER_H = Math.round(POSTER_W * 1.36);

/**
 * Featured album as a tall, full-width poster (Netflix hero) with the tag line
 * and Play / My List actions overlaid on the bottom of the image, fading in via
 * a dark gradient.
 */
export const HeroBanner: React.FC<HeroBannerProps> = ({ album, onPlay, onOpen }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const saved = useIsAlbumLiked(album);

  // Dot-separated descriptors built from the album's real metadata.
  const tags = [album.genre, album.year?.toString(), album.artistName].filter(Boolean) as string[];

  return (
    <View style={[styles.container, { paddingTop: insets.top + 120 }]}>
      <Pressable
        onPress={() => onOpen(album)}
        style={[styles.poster, { width: POSTER_W, height: POSTER_H, borderRadius: theme.radius.lg }]}
      >
        <Artwork
          uri={album.cover}
          accentColor={album.accentColor}
          style={StyleSheet.absoluteFill}
          iconSize={64}
        />

        {/* Brand mark in the corner, like the streaming logo on the poster. */}
        <View style={styles.brandMark}>
          <Ionicons name="musical-notes" size={16} color={theme.colors.primary} />
        </View>

        {/* Bottom overlay: gradient + tags + actions, sitting over the image. */}
        <View style={styles.overlay}>
          <LinearGradient
            colors={['transparent', 'rgba(11,11,15,0.55)', 'rgba(11,11,15,0.95)']}
            locations={[0, 0.45, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {tags.length ? (
            <AppText variant="bodySm" color="text" style={styles.tags} numberOfLines={1}>
              {tags.join('   •   ')}
            </AppText>
          ) : null}

          <View style={styles.actions}>
            <Pressable
              onPress={() => onPlay(album)}
              style={({ pressed }) => [
                styles.btn,
                styles.playBtn,
                { borderRadius: theme.radius.sm, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Ionicons name="play" size={20} color="#000" />
              <AppText variant="label" style={styles.playLabel}>
                {t('common.play')}
              </AppText>
            </Pressable>

            <Pressable
              onPress={() => dispatch(toggleAlbumLike(album))}
              style={({ pressed }) => [
                styles.btn,
                styles.listBtn,
                {
                  borderRadius: theme.radius.sm,
                  borderColor: 'rgba(255,255,255,0.25)',
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Ionicons name={saved ? 'checkmark' : 'add'} size={20} color={theme.colors.text} />
              <AppText variant="label" style={styles.listLabel}>
                My List
              </AppText>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingHorizontal: H_PADDING, paddingBottom: 20 },
  poster: { backgroundColor: '#222', overflow: 'hidden' },
  brandMark: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 64,
    paddingHorizontal: 12,
    paddingBottom: 14,
  },
  tags: { textAlign: 'center', marginBottom: 14 },
  actions: { flexDirection: 'row', gap: 10 },
  btn: {
    flex: 1,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: { backgroundColor: '#FFFFFF' },
  playLabel: { color: '#000', marginLeft: 8 },
  listBtn: { backgroundColor: 'rgba(40,40,46,0.6)', borderWidth: 1 },
  listLabel: { marginLeft: 8 },
});
