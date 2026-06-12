export * from './models';

/** Generic async slice status used across Redux slices. */
export type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

/** Envelope used by repositories/services for resolved (id -> entity) feeds. */
export interface ResolvedHomeFeed {
  hero?: import('./models').Album;
  rails: ResolvedRail[];
}

export interface ResolvedRail {
  id: string;
  title: string;
  itemType: import('./models').RailItemType;
  albums?: import('./models').Album[];
  artists?: import('./models').Artist[];
  playlists?: import('./models').Playlist[];
}
