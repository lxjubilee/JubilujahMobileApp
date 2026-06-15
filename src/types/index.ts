export * from './models';

/** Generic async slice status used across Redux slices. */
export type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

/** Envelope used by repositories/services for resolved (id -> entity) feeds. */
export interface ResolvedHomeFeed {
  /** Albums shown in the rotating hero carousel (first is the primary). */
  heroes?: import('./models').Album[];
  rails: ResolvedRail[];
}

export interface ResolvedRail {
  id: string;
  title: string;
  itemType: import('./models').RailItemType;
  albums?: import('./models').Album[];
  artists?: import('./models').Artist[];
  playlists?: import('./models').Playlist[];
  /** When set, the rail shows a "See all" action targeting this artist's full album list. */
  seeAllArtistId?: string;
  /** Catalog category label this rail belongs to, used by the Home filter chips. */
  categoryLabel?: string;
}
