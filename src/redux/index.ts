export { store, persistor } from './store/store';
export type { RootState, AppDispatch } from './store/store';
export { useAppDispatch, useAppSelector } from './store/hooks';

// Slice actions/thunks
export { fetchHomeFeed } from './slices/homeSlice';
export { runSearch, setQuery, addRecentSearch, clearRecentSearches } from './slices/searchSlice';
export {
  toggleFavoriteTrack,
  toggleSavedAlbum,
  toggleFollowArtist,
} from './slices/librarySlice';
export {
  enqueueDownload,
  updateDownloadProgress,
  completeDownload,
  removeDownload,
} from './slices/downloadsSlice';
export {
  setQueue,
  setPlayOrder,
  setCurrentTrack,
  setIsPlaying,
  setIsBuffering,
  setRepeatMode,
  cycleRepeatMode,
  toggleShuffle,
} from './slices/playerSlice';
export type { RepeatMode } from './slices/playerSlice';
export {
  restoreSession,
  signIn,
  verify2FA,
  signOut,
  clearSession,
  clearAuthError,
  markProfileSelected,
} from './slices/authSlice';
export type { AuthUser, AuthStatus } from './slices/authSlice';
