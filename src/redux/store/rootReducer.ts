import { combineReducers } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistReducer } from 'redux-persist';

import homeReducer from '../slices/homeSlice';
import searchReducer from '../slices/searchSlice';
import libraryReducer from '../slices/librarySlice';
import downloadsReducer from '../slices/downloadsSlice';
import playerReducer from '../slices/playerSlice';
import authReducer from '../slices/authSlice';

/**
 * Per-slice persistence. We persist only durable data:
 *  - library & downloads in full
 *  - player: just user prefs (shuffle/repeat), NOT transient playback state
 *  - search: just recent terms, NOT live query/results
 *  - home: not persisted (always refetched)
 */
const persistedPlayer = persistReducer(
  { key: 'player', storage: AsyncStorage, whitelist: ['repeatMode', 'shuffle'] },
  playerReducer,
);

const persistedSearch = persistReducer(
  { key: 'search', storage: AsyncStorage, whitelist: ['recent'] },
  searchReducer,
);

const persistedLibrary = persistReducer(
  { key: 'library', storage: AsyncStorage },
  libraryReducer,
);

const persistedDownloads = persistReducer(
  { key: 'downloads', storage: AsyncStorage },
  downloadsReducer,
);

export const rootReducer = combineReducers({
  home: homeReducer,
  search: persistedSearch,
  library: persistedLibrary,
  downloads: persistedDownloads,
  player: persistedPlayer,
  auth: authReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
