import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Album, Track } from '@/types';

interface LibraryState {
  favoriteTrackIds: string[];
  savedAlbums: Album[];
  followedArtistIds: string[];
}

const initialState: LibraryState = {
  favoriteTrackIds: [],
  savedAlbums: [],
  followedArtistIds: [],
};

const librarySlice = createSlice({
  name: 'library',
  initialState,
  reducers: {
    toggleFavoriteTrack(state, action: PayloadAction<Track | string>) {
      const id = typeof action.payload === 'string' ? action.payload : action.payload.id;
      state.favoriteTrackIds = state.favoriteTrackIds.includes(id)
        ? state.favoriteTrackIds.filter((t) => t !== id)
        : [id, ...state.favoriteTrackIds];
    },
    toggleSavedAlbum(state, action: PayloadAction<Album>) {
      const exists = state.savedAlbums.some((a) => a.id === action.payload.id);
      state.savedAlbums = exists
        ? state.savedAlbums.filter((a) => a.id !== action.payload.id)
        : [{ ...action.payload, tracks: undefined }, ...state.savedAlbums];
    },
    toggleFollowArtist(state, action: PayloadAction<string>) {
      const id = action.payload;
      state.followedArtistIds = state.followedArtistIds.includes(id)
        ? state.followedArtistIds.filter((a) => a !== id)
        : [id, ...state.followedArtistIds];
    },
  },
});

export const { toggleFavoriteTrack, toggleSavedAlbum, toggleFollowArtist } = librarySlice.actions;
export default librarySlice.reducer;
