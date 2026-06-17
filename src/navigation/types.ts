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
  AlbumList: { title: string; artistId: string };
  MusicPlayer: undefined;
};

/** Unauthenticated flow: welcome slides / profile gate → sign in → 2FA; plus sign up. */
export type AuthStackParamList = {
  Welcome: undefined;
  SignIn: undefined;
  TwoFactor: undefined;
  SignUp: undefined;
  VerifySignup: { verificationGuid: string; email: string };
  ForgotPassword: undefined;
  PrivacyPolicy: undefined;
  TermsOfUse: undefined;
};

/** Per-tab inner stacks (Library nests Profile). Downloads is hidden for v1. */
export type LibraryStackParamList = {
  Library: undefined;
  Profile: undefined;
  ChangePassword: undefined;
  PrivacyPolicy: undefined;
  TermsOfUse: undefined;
};

export type AuthStackScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<
  AuthStackParamList,
  T
>;

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
