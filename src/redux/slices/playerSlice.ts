import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Track } from '@/types';

export type RepeatMode = 'off' | 'track' | 'queue';

/**
 * UI-facing mirror of the track-player engine. The engine (react-native-track-
 * player) remains the source of truth for actual playback; this slice holds a
 * React-friendly snapshot kept in sync by the usePlayer hook, plus user prefs
 * (shuffle/repeat) that persist across sessions.
 */
interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  /** Persisted user preferences. */
  repeatMode: RepeatMode;
  shuffle: boolean;
}

const initialState: PlayerState = {
  currentTrack: null,
  queue: [],
  isPlaying: false,
  repeatMode: 'off',
  shuffle: false,
};

const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    setQueue(state, action: PayloadAction<Track[]>) {
      state.queue = action.payload;
    },
    setCurrentTrack(state, action: PayloadAction<Track | null>) {
      state.currentTrack = action.payload;
    },
    setIsPlaying(state, action: PayloadAction<boolean>) {
      state.isPlaying = action.payload;
    },
    setRepeatMode(state, action: PayloadAction<RepeatMode>) {
      state.repeatMode = action.payload;
    },
    cycleRepeatMode(state) {
      const order: RepeatMode[] = ['off', 'queue', 'track'];
      const idx = order.indexOf(state.repeatMode);
      state.repeatMode = order[(idx + 1) % order.length];
    },
    toggleShuffle(state) {
      state.shuffle = !state.shuffle;
    },
  },
});

export const {
  setQueue,
  setCurrentTrack,
  setIsPlaying,
  setRepeatMode,
  cycleRepeatMode,
  toggleShuffle,
} = playerSlice.actions;
export default playerSlice.reducer;
