import React, { useEffect, useState } from 'react';
import { Dimensions, FlatList, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, AppText, Loader, IconButton } from '@/components/common';
import { AlbumCard } from '@/components/cards';
import { FloatingMiniPlayer } from '@/components/player';
import { useVisibleAlbums } from '@/hooks';
import { AlbumRepository, ArtistRepository } from '@/repositories';
import { Album } from '@/types';
import { pickByIds } from '@/utils';
import type { RootStackParamList, RootStackScreenProps } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const { width } = Dimensions.get('window');
const GAP = 16;
const CARD_W = (width - GAP * 3) / 2;

/** Full grid of albums — the "See all"/"See more" target of a Home rail. Shows a
 *  specific list (`albumIds`, e.g. a section's albums) when given, otherwise every
 *  album for `artistId`. */
export const AlbumListScreen: React.FC = () => {
  const { params } = useRoute<RootStackScreenProps<'AlbumList'>['route']>();
  const navigation = useNavigation<Nav>();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const visibleAlbums = useVisibleAlbums(albums);

  useEffect(() => {
    let active = true;
    setLoading(true);
    // A section passes an explicit `albumIds` list (order preserved); an artist
    // rail passes `artistId` and we fetch that artist's albums.
    const load: Promise<Album[]> = params.albumIds
      ? AlbumRepository.list().then((all) => pickByIds(all, params.albumIds ?? []))
      : ArtistRepository.getAlbums(params.artistId ?? '');
    load
      .then((a) => {
        if (!active) return;
        // Dedupe by id — the catalog can list the same album in multiple places.
        setAlbums(Array.from(new Map(a.map((album) => [album.id, album])).values()));
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [params.artistId, params.albumIds]);

  if (loading) {
    return (
      <Screen>
        <Loader />
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={visibleAlbums}
        keyExtractor={(a) => a.id}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <IconButton
              name="chevron-back"
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
            />
            <AppText variant="display" numberOfLines={2} style={styles.title}>
              {params.title}
            </AppText>
          </View>
        }
        renderItem={({ item }) => (
          <AlbumCard
            album={item}
            width={CARD_W}
            onPress={(al) => navigation.navigate('AlbumDetails', { albumId: al.id })}
          />
        )}
      />
      <FloatingMiniPlayer />
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: { paddingHorizontal: GAP, paddingBottom: 96 },
  header: { alignItems: 'flex-start', paddingTop: 8, paddingBottom: 16 },
  // Circular button backing the back chevron. Light translucent-white fill so it
  // reads clearly on the dark background.
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.16)' },
  title: { marginTop: 8 },
  column: { gap: GAP, marginBottom: GAP },
});

export default AlbumListScreen;
