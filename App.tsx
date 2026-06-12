import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@/redux';
import { ThemeProvider } from '@/context';
import { RootNavigator } from '@/navigation';
import { usePlayerSync } from '@/hooks';
import { setupPlayer } from '@/services/music';
import '@/localization'; // initialize i18next

/** Mounts the engine->Redux bridge exactly once, near the root. */
const PlayerSyncGate: React.FC = () => {
  usePlayerSync();
  return null;
};

export default function App() {
  // Initialize the playback engine once on app start.
  useEffect(() => {
    void setupPlayer();
  }, []);

  return (
    <GestureHandlerRootView style={styles.flex}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <SafeAreaProvider>
            <ThemeProvider>
              <PlayerSyncGate />
              <RootNavigator />
            </ThemeProvider>
          </SafeAreaProvider>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
