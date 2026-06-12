import React from 'react';
import { View } from 'react-native';
import {
  BottomTabBar,
  createBottomTabNavigator,
  BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context';
import { MiniPlayer } from '@/components/player';
import { HomeScreen, BrowseScreen, SearchScreen } from '@/screens';
import { LibraryStackNavigator } from './LibraryStackNavigator';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<keyof MainTabParamList, React.ComponentProps<typeof Ionicons>['name']> = {
  HomeTab: 'home',
  BrowseTab: 'grid',
  SearchTab: 'search',
  LibraryTab: 'library',
};

/** Custom tab bar that stacks the persistent MiniPlayer above the real tab bar. */
const TabBarWithMiniPlayer: React.FC<BottomTabBarProps> = (props) => (
  <View>
    <MiniPlayer onPress={() => props.navigation.getParent()?.navigate('MusicPlayer')} />
    <BottomTabBar {...props} />
  </View>
);

export const MainTabNavigator: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      tabBar={(props) => <TabBarWithMiniPlayer {...props} />}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.text,
        tabBarInactiveTintColor: theme.colors.iconMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.tabBar,
          borderTopColor: theme.colors.border,
        },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={ICONS[route.name]} color={color} size={size} />
        ),
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: t('tabs.home') }} />
      <Tab.Screen name="BrowseTab" component={BrowseScreen} options={{ title: t('tabs.browse') }} />
      <Tab.Screen name="SearchTab" component={SearchScreen} options={{ title: t('tabs.search') }} />
      <Tab.Screen
        name="LibraryTab"
        component={LibraryStackNavigator}
        options={{ title: t('tabs.library') }}
      />
    </Tab.Navigator>
  );
};
