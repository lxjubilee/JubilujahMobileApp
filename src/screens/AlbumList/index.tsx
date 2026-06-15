import React, { useEffect, useState } from 'react';
import { Dimensions, FlatList, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, AppText, Loader, IconButton } from '@/components/common';
import { AlbumCard } from '@/components/cards';
import { FloatingMiniPlayer } from '@/components/player';
import { ArtistRepository } from '@/repositories';
import { Album } from '@/types';
import type { RootStackParamList, RootStackScreenProps } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const { width } = Dimensions.get('window');
const GAP = 16;
const CARD_W = (width - GAP * 3) / 2;

/** Full grid of every album for a given artist — the "See all" target of a Home rail. */
export const AlbumListScreen: React.FC = () => {
  const { params } = useRoute<RootStackScreenProps<'AlbumList'>['route']>();
  const navigation = useNavigation<Nav>();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    ArtistRepository.getAlbums(params.artistId)
      .then((a) => {
        if (!active) return;
        // Dedupe by id — the catalog can list the same album in multiple places.
        setAlbums(Array.from(new Map(a.map((album) => [album.id, album])).values()));
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [params.artistId]);

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
        data={albums}
        keyExtractor={(a) => a.id}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <IconButton name="chevron-back" onPress={() => navigation.goBack()} />
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
  title: { marginTop: 8 },
  column: { gap: GAP, marginBottom: GAP },
});

export default AlbumListScreen;
