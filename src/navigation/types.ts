import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

/** Bottom-tab routes. LibraryTab nests its own stack, so it carries those params. */
export type MainTabParamList = {
  HomeTab: undefined;
  BrowseTab: undefined;
  SearchTab: undefined;
  LibraryTab: NavigatorScreenParams<LibraryStackParamList>;
};

/**
 * Root stack. AlbumDetails/ArtistDetails live here (not inside a tab) so they
 * present full-screen over the tab bar, Netflix-style; MusicPlayer is a modal.
 */
export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  AlbumDetails: { albumId: string };
  ArtistDetails: { artistId: string };
  MusicPlayer: undefined;
  Auth: undefined;
};

/** Per-tab inner stacks (Library nests Downloads + Profile). */
export type LibraryStackParamList = {
  Library: undefined;
  Downloads: undefined;
  Profile: undefined;
};

// Typed screen-prop helpers
export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  RootStackScreenProps<keyof RootStackParamList>
>;

export type LibraryStackScreenProps<T extends keyof LibraryStackParamList> =
  NativeStackScreenProps<LibraryStackParamList, T>;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
