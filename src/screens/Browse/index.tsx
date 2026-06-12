import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, FlatList, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Screen, AppText, Loader } from '@/components/common';
import { AlbumCard } from '@/components/cards';
import { AlbumRepository } from '@/repositories';
import { Album } from '@/types';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const { width } = Dimensions.get('window');
const GAP = 16;
const CARD_W = (width - GAP * 3) / 2;

export const BrowseScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    AlbumRepository.list()
      .then((a) => active && setAlbums(a))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const genres = useMemo(
    () => Array.from(new Set(albums.map((a) => a.genre).filter(Boolean))) as string[],
    [albums],
  );

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
            <AppText variant="display">{t('tabs.browse')}</AppText>
            <AppText variant="bodySm" color="textMuted" style={styles.genres}>
              {genres.join(' • ')}
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
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: { paddingHorizontal: GAP, paddingBottom: 24 },
  header: { paddingTop: 8, paddingBottom: 16 },
  genres: { marginTop: 8 },
  column: { gap: GAP, marginBottom: GAP },
});

export default BrowseScreen;
