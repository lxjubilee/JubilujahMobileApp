import { Album, Artist, HomeRail, SearchResults, Track } from '@/types';

/**
 * The contract every data source implements. Repositories depend ONLY on this
 * interface, so swapping MockDataSource <-> ApiDataSource is invisible to them
 * (and therefore to Redux and the UI).
 */
export interface HomeConfig {
  heroAlbumId: string;
  rails: HomeRail[];
}

export interface MusicDataSource {
  getHomeConfig(): Promise<HomeConfig>;
  listAlbums(): Promise<Album[]>;
  getAlbum(id: string): Promise<Album | null>;
  listArtists(): Promise<Artist[]>;
  getArtist(id: string): Promise<Artist | null>;
  getArtistAlbums(artistId: string): Promise<Album[]>;
  getArtistTopTracks(artistId: string): Promise<Track[]>;
  search(query: string): Promise<SearchResults>;
}
