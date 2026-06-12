import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/context';
import { Album } from '@/types';
import { cdnUrl } from '@/utils';
import { AppText } from '../common/AppText';

interface AlbumCardProps {
  album: Album;
  onPress?: (album: Album) => void;
  /** Card width; height of the cover matches width (square artwork). */
  width?: number;
}

/** Vertical album tile used in Home rails and grids. */
export const AlbumCard: React.FC<AlbumCardProps> = ({ album, onPress, width = 150 }) => {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => onPress?.(album)}
      style={({ pressed }) => [{ width, opacity: pressed ? 0.8 : 1 }]}
    >
      <Image
        source={{ uri: cdnUrl(album.cover) }}
        style={[styles.cover, { width, height: width, borderRadius: theme.radius.md }]}
        contentFit="cover"
        transition={250}
      />
      <View style={styles.meta}>
        <AppText variant="h3" numberOfLines={1}>
          {album.title}
        </AppText>
        <AppText variant="bodySm" color="textMuted" numberOfLines={1}>
          {album.artistName}
        </AppText>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cover: { backgroundColor: '#222' },
  meta: { marginTop: 8 },
});
