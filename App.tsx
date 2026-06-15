import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import {
  store,
  persistor,
  fetchHomeFeed,
  restoreSession,
  clearSession,
  markProfileSelected,
} from '@/redux';
import { ThemeProvider } from '@/context';
import { RootNavigator, AuthNavigator } from '@/navigation';
import { ChooseProfileScreen } from '@/screens/Auth';
import { usePlayerSync, useAppSelector, useAppDispatch } from '@/hooks';
import { setupPlayer } from '@/services/music';
import { initAuthClient } from '@/services/auth';
import { getManifest, onCatalogUpdated, invalidateCatalogIndex } from '@/services/catalog';
import { CONFIG } from '@/constants';
import { SplashScreen } from '@/components/SplashScreen';
import { storage, STORAGE_KEYS } from '@/services/storage';
import '@/localization'; // initialize i18next

/** Mounts the engine->Redux bridge exactly once, near the root. */
const PlayerSyncGate: React.FC = () => {
  usePlayerSync();
  return null;
};

/**
 * Chooses between the unauthenticated flow and the main app, based on the
 * restored session and the first-launch onboarding flag. Renders nothing while
 * either is still resolving (the splash overlay covers that window).
 */
const RootGate: React.FC = () => {
  const dispatch = useAppDispatch();
  const status = useAppSelector((s) => s.auth.status);
  const isAuthenticated = useAppSelector((s) => s.auth.user != null);
  // Set only when a session is restored on launch; cleared on fresh sign-in.
  const profileGatePending = useAppSelector((s) => s.auth.profileGatePending);
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    void storage
      .getItem<boolean>(STORAGE_KEYS.ONBOARDING_DONE)
      .then((done) => setHasOnboarded(Boolean(done)));
  }, []);

  if (status === 'restoring' || hasOnboarded === null) return null;

  if (isAuthenticated) {
    // Only a restored (cold-start) session shows the profile gate; a fresh
    // sign-in goes straight to Home.
    if (profileGatePending) {
      return <ChooseProfileScreen onSelect={() => dispatch(markProfileSelected())} />;
    }
    return <RootNavigator />;
  }

  // Signed out / never signed in: Sign In (or first-run Welcome slides).
  return <AuthNavigator initialRoute={hasOnboarded ? 'SignIn' : 'Welcome'} />;
};

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  // Initialize the playback engine once on app start.
  useEffect(() => {
    void setupPlayer();
  }, []);

  // Wire the auth client's refresh-failure handler, then restore any session.
  useEffect(() => {
    initAuthClient(() => store.dispatch(clearSession()));
    void store.dispatch(restoreSession());
  }, []);

  // Warm the catalog so lists are ready before the user navigates, and refresh
  // the (instantly-rendered, persisted) home feed once a background revalidation
  // brings newer data.
  useEffect(() => {
    if (CONFIG.DATA_SOURCE !== 'manifest') return undefined;
    void getManifest();
    return onCatalogUpdated(() => {
      invalidateCatalogIndex();
      void store.dispatch(fetchHomeFeed());
    });
  }, []);

  return (
    <GestureHandlerRootView style={styles.flex}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <SafeAreaProvider>
            <ThemeProvider>
              <PlayerSyncGate />
              <RootGate />
            </ThemeProvider>
          </SafeAreaProvider>
        </PersistGate>
      </Provider>

      {/* Netflix-style intro overlay; unmounts when its animation finishes. */}
      {showSplash ? <SplashScreen onFinish={() => setShowSplash(false)} /> : null}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
