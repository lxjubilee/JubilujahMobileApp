import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { MiniPlayer } from './MiniPlayer';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * Bottom-pinned MiniPlayer for the full-screen detail screens (AlbumDetails,
 * ArtistDetails, AlbumList) that present over the tab bar — where the tab bar's
 * own MiniPlayer is hidden. Tapping opens the full player. Renders an inert
 * overlay when nothing is playing (MiniPlayer itself returns null).
 */
export const FloatingMiniPlayer: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[styles.wrap, { paddingBottom: insets.bottom + 8 }]}
      pointerEvents="box-none"
    >
      <MiniPlayer onPress={() => navigation.navigate('MusicPlayer')} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
