import type { LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from './types';

/** Deep-link configuration, e.g. jubilujah://album/al_aurora_lights */
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['jubilujah://', 'https://jubileeverse.com'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          HomeTab: 'home',
          BrowseTab: 'browse',
          SearchTab: 'search',
          LibraryTab: 'library',
        },
      },
      AlbumDetails: 'album/:albumId',
      ArtistDetails: 'artist/:artistId',
      MusicPlayer: 'player',
    },
  },
};
