import React from 'react';
import { NavigationContainer, DarkTheme, Theme as NavTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@/context';
import {
  AlbumDetailsScreen,
  ArtistDetailsScreen,
  MusicPlayerScreen,
  AuthScreen,
} from '@/screens';
import { MainTabNavigator } from './MainTabNavigator';
import { linking } from './linking';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const theme = useTheme();

  const navTheme: NavTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: theme.colors.background,
      card: theme.colors.background,
      text: theme.colors.text,
      primary: theme.colors.primary,
      border: theme.colors.border,
    },
  };

  return (
    <NavigationContainer theme={navTheme} linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        {/* Detail screens push full-screen over the tabs, Netflix-style. */}
        <Stack.Screen name="AlbumDetails" component={AlbumDetailsScreen} />
        <Stack.Screen name="ArtistDetails" component={ArtistDetailsScreen} />
        {/* Player + Auth slide up as modals. */}
        <Stack.Group screenOptions={{ presentation: 'modal' }}>
          <Stack.Screen name="MusicPlayer" component={MusicPlayerScreen} />
          <Stack.Screen name="Auth" component={AuthScreen} />
        </Stack.Group>
      </Stack.Navigator>
    </NavigationContainer>
  );
};
