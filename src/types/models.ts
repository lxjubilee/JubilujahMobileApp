/**
 * Domain models — the shapes the UI and Redux work with.
 * These are intentionally decoupled from API DTOs (see services/api/dto.ts);
 * repositories map DTO -> model, so a backend change never ripples into screens.
 */

export type ID = string;

export interface Artist {
  id: ID;
  name: string;
  /** CDN-relative path, resolved to a full URL by utils/cdn. */
  image: string;
  bio?: string;
  monthlyListeners?: number;
  genres?: string[];
}

export interface Track {
  id: ID;
  title: string;
  /** CDN-relative path to the audio file. */
  url: string;
  /** CDN-relative path to artwork (usually the album cover). */
  artwork: string;
  duration: number; // seconds
  artistId: ID;
  artistName: string;
  albumId: ID;
  albumName: string;
  trackNumber?: number;
  explicit?: boolean;
}

export interface Album {
  id: ID;
  title: string;
  cover: string; // CDN-relative path
  artistId: ID;
  artistName: string;
  year?: number;
  genre?: string;
  trackCount?: number;
  tracks?: Track[];
  /**
   * Dominant/ambient color of the cover (hex), used for the hero backdrop —
   * provided by the catalog API (like Netflix/Spotify), not extracted on-device.
   */
  accentColor?: string;
}

export interface Playlist {
  id: ID;
  title: string;
  cover: string;
  description?: string;
  trackIds: ID[];
  curated?: boolean;
}

/** A horizontally-scrolling row on the Home screen (Netflix-style rail). */
export type RailItemType = 'album' | 'artist' | 'playlist';

export interface HomeRail {
  id: ID;
  title: string;
  itemType: RailItemType;
  /** IDs referencing albums/artists/playlists, resolved by the repository. */
  itemIds: ID[];
}

export interface HomeFeed {
  hero?: Album;
  rails: HomeRail[];
}

/** Search results across entity types. */
export interface SearchResults {
  albums: Album[];
  artists: Artist[];
  tracks: Track[];
}
