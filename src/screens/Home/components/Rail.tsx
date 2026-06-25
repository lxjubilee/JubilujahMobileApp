import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useTheme } from '@/context';
import { AlbumCard, ArtistCard } from '@/components/cards';
import { SectionHeader } from '@/components/common';
import { Album, Artist, ResolvedRail } from '@/types';

interface RailProps {
  rail: ResolvedRail;
  onAlbumPress: (album: Album) => void;
  onArtistPress: (artist: Artist) => void;
  onSeeAll?: (rail: ResolvedRail) => void;
}

/** A single horizontally-scrolling Home row of albums or artists. */
export const Rail: React.FC<RailProps> = ({ rail, onAlbumPress, onArtistPress, onSeeAll }) => {
  const theme = useTheme();
  // Items are already artwork-filtered upstream (useVisibleRails); empty rails
  // are dropped there too, so these guards are just defensive.
  const albums = rail.albums ?? [];
  const artists = rail.artists ?? [];

  if (rail.itemType === 'artist') {
    if (!artists.length) return null;
    return (
      <>
        <SectionHeader title={rail.title} />
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={artists}
          keyExtractor={(a) => a.id}
          contentContainerStyle={{ paddingHorizontal: theme.spacing.lg }}
          ItemSeparatorComponent={() => <Sep />}
          renderItem={({ item }) => <ArtistCard artist={item} onPress={onArtistPress} />}
        />
      </>
    );
  }

  if (!albums.length) return null;
  return (
    <>
      <SectionHeader
        title={rail.title}
        onSeeAll={rail.seeAllArtistId ? () => onSeeAll?.(rail) : undefined}
      />
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={albums}
        keyExtractor={(a) => a.id}
        contentContainerStyle={{ paddingHorizontal: theme.spacing.lg }}
        ItemSeparatorComponent={() => <Sep />}
        renderItem={({ item }) => <AlbumCard album={item} onPress={onAlbumPress} />}
      />
    </>
  );
};

const Sep = () => <View style={styles.sep} />;

const styles = StyleSheet.create({
  sep: { width: 14 },
});
