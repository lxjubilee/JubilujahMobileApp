import { CONFIG } from '@/constants';
import { Album, Artist, ResolvedHomeFeed, ResolvedRail, SearchResults, Track } from '@/types';
import { pickByIds } from '@/utils';
import { MusicDataSource } from './DataSource';
import { MockDataSource } from './MockDataSource';
import { ApiDataSource } from './ApiDataSource';

/**
 * Single factory deciding which data source backs every repository.
 * THIS is the swap point: flip CONFIG.USE_MOCK (app.json `extra.useMock`).
 */
const dataSource: MusicDataSource = CONFIG.USE_MOCK ? new MockDataSource() : new ApiDataSource();

/**
 * HomeRepository turns the raw home config (rails of ids) into a fully-resolved
 * feed of entities the Home screen can render directly — business logic that
 * belongs above the data source, not in the UI.
 */
export const HomeRepository = {
  async getFeed(): Promise<ResolvedHomeFeed> {
    const [config, albums, artists] = await Promise.all([
      dataSource.getHomeConfig(),
      dataSource.listAlbums(),
      dataSource.listArtists(),
    ]);

    const rails: ResolvedRail[] = config.rails.map((rail) => {
      if (rail.itemType === 'artist') {
        return {
          id: rail.id,
          title: rail.title,
          itemType: rail.itemType,
          artists: pickByIds(artists, rail.itemIds),
        };
      }
      return {
        id: rail.id,
        title: rail.title,
        itemType: rail.itemType,
        albums: pickByIds(albums, rail.itemIds),
      };
    });

    const hero = albums.find((a) => a.id === config.heroAlbumId);
    return { hero, rails };
  },
};

export const AlbumRepository = {
  list: (): Promise<Album[]> => dataSource.listAlbums(),
  getById: (id: string): Promise<Album | null> => dataSource.getAlbum(id),
};

export const ArtistRepository = {
  getById: (id: string): Promise<Artist | null> => dataSource.getArtist(id),
  getAlbums: (artistId: string): Promise<Album[]> => dataSource.getArtistAlbums(artistId),
  getTopTracks: (artistId: string): Promise<Track[]> => dataSource.getArtistTopTracks(artistId),
};

export const SearchRepository = {
  search: (query: string): Promise<SearchResults> => dataSource.search(query),
};
