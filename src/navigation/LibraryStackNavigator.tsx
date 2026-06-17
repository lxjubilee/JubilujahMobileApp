import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  LibraryScreen,
  DownloadsScreen,
  ProfileScreen,
  ChangePasswordScreen,
  PrivacyPolicyScreen,
  TermsOfUseScreen,
} from '@/screens';
import type { LibraryStackParamList } from './types';

const Stack = createNativeStackNavigator<LibraryStackParamList>();

/** Inner stack for the Library tab: Library -> Downloads / Profile. */
export const LibraryStackNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Library" component={LibraryScreen} />
    <Stack.Screen name="Downloads" component={DownloadsScreen} />
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
    <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
    <Stack.Screen name="TermsOfUse" component={TermsOfUseScreen} />
  </Stack.Navigator>
);
