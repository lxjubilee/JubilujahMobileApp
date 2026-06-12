import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Artist } from '@/types';
import { cdnUrl } from '@/utils';
import { AppText } from '../common/AppText';

interface ArtistCardProps {
  artist: Artist;
  onPress?: (artist: Artist) => void;
  size?: number;
}

/** Circular artist avatar tile used in the "Top Artists" rail. */
export const ArtistCard: React.FC<ArtistCardProps> = ({ artist, onPress, size = 130 }) => {
  return (
    <Pressable
      onPress={() => onPress?.(artist)}
      style={({ pressed }) => [{ width: size, opacity: pressed ? 0.8 : 1 }]}
    >
      <Image
        source={{ uri: cdnUrl(artist.image) }}
        style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
        contentFit="cover"
        transition={250}
      />
      <AppText variant="h3" numberOfLines={1} style={styles.name}>
        {artist.name}
      </AppText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  avatar: { backgroundColor: '#222' },
  name: { marginTop: 8, textAlign: 'center' },
});
