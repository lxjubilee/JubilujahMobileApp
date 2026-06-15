import { Album, Artist, HomeRail, Track } from '@/types';
import { HomeConfig } from '@/repositories/DataSource';
import {
  CatalogManifest,
  ManifestAlbum,
  ManifestArtist,
  ManifestCategory,
} from './manifestTypes';

/**
 * Translates the raw catalog manifest into the app's domain models and the
 * lookup structures `ManifestDataSource` serves from. Built once per session.
 *
 * Conventions (all relative paths are resolved + URL-encoded by cdnUrl()):
 *  - audio:  `music/<track.url>`
 *  - cover:  `music/<album.path>/artwork/<album.code>.png`
 *            (not yet published to the CDN — renders a placeholder until it is)
 */

const MAX_RAIL_ITEMS = 20;

/** Artists pinned to the front of the per-artist rails (after "Featured Artists"). */
const PINNED_ARTIST_SLUGS = ['jubilee-inspire', 'melody-inspire'];

/** Deterministic dark accent color from an id, for placeholder tiles + hero backdrops. */
function accentFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return `hsl(${h % 360}, 42%, 26%)`;
}

const coverPath = (album: ManifestAlbum): string =>
  `music/${album.path}/artwork/${album.code}.png`;

const isPlayable = (album: ManifestAlbum): boolean =>
  album.playable === 1 || album.tracks.some((t) => t.audio);

function buildTrack(
  t: ManifestAlbum['tracks'][number],
  album: ManifestAlbum,
  artist: ManifestArtist,
  index: number,
): Track {
  return {
    // `index` guarantees uniqueness — some albums repeat track numbers (`n`).
    id: `${album.code}-${index}-${t.n}`,
    title: t.title,
    url: `music/${t.url}`,
    artwork: coverPath(album),
    duration: 0, // not in the manifest; track-player reports it from the file
    artistId: artist.slug,
    artistName: artist.name,
    albumId: album.code,
    albumName: album.title,
    trackNumber: t.n,
  };
}

function buildAlbum(
  album: ManifestAlbum,
  artist: ManifestArtist,
  category: ManifestCategory,
  withTracks: boolean,
): Album {
  return {
    id: album.code,
    title: album.title,
    cover: coverPath(album),
    artistId: artist.slug,
    artistName: artist.name,
    genre: category.label,
    trackCount: album.trackCount,
    accentColor: accentFor(album.code),
    ...(withTracks
      ? {
          tracks: album.tracks
            .filter((t) => t.audio) // exclude non-playable extras (booklets, etc.)
            .sort((a, b) => a.n - b.n)
            .map((t, i) => buildTrack(t, album, artist, i)),
        }
      : {}),
  };
}

function buildArtist(artist: ManifestArtist, category: ManifestCategory): Artist {
  const firstAlbum = artist.albums[0];
  return {
    id: artist.slug,
    name: artist.name,
    // No artist image in the manifest; fall back to a cover (placeholder until published).
    image: firstAlbum ? coverPath(firstAlbum) : '',
    bio: artist.role,
    genres: [category.label],
  };
}

export interface CatalogIndex {
  /** Every album (light: no tracks), for listAlbums/search. */
  albums: Album[];
  /** Full albums (with tracks), keyed by code, for getAlbum. */
  albumsById: Map<string, Album>;
  artists: Artist[];
  artistsById: Map<string, Artist>;
  albumsByArtist: Map<string, Album[]>;
  tracksByArtist: Map<string, Track[]>;
  home: HomeConfig;
}

export function buildCatalogIndex(manifest: CatalogManifest): CatalogIndex {
  const albums: Album[] = [];
  const albumsById = new Map<string, Album>();
  const artists: Artist[] = [];
  const artistsById = new Map<string, Artist>();
  const albumsByArtist = new Map<string, Album[]>();
  const tracksByArtist = new Map<string, Track[]>();

  const featuredArtistIds: string[] = [];
  let heroAlbumId: string | undefined;
  /** First playable album per artist — the pool the hero carousel draws from. */
  const heroByArtist = new Map<string, string>();

  // One album rail per artist, in catalog (manifest) encounter order; pinned
  // artists are lifted to the front below.
  const artistRailById = new Map<string, HomeRail>();
  const artistOrder: string[] = [];

  for (const category of manifest.categories) {
    for (const artist of category.artists) {
      const domainArtist = buildArtist(artist, category);
      artists.push(domainArtist);
      artistsById.set(domainArtist.id, domainArtist);

      const artistAlbums: Album[] = [];
      const artistTracks: Track[] = [];
      let artistHasPlayable = false;
      let firstPlayableCode: string | undefined;

      for (const album of artist.albums) {
        const light = buildAlbum(album, artist, category, false);
        const full = buildAlbum(album, artist, category, true);
        albums.push(light);
        albumsById.set(album.code, full);
        artistAlbums.push(light);
        artistTracks.push(...(full.tracks ?? []));

        if (isPlayable(album)) {
          artistHasPlayable = true;
          if (!firstPlayableCode) firstPlayableCode = album.code;
          if (!heroAlbumId) heroAlbumId = album.code;
        }
      }

      if (firstPlayableCode) heroByArtist.set(domainArtist.id, firstPlayableCode);

      albumsByArtist.set(domainArtist.id, artistAlbums);
      tracksByArtist.set(domainArtist.id, artistTracks);
      if (artistHasPlayable && featuredArtistIds.length < MAX_RAIL_ITEMS) {
        featuredArtistIds.push(domainArtist.id);
      }

      // A rail of ALL this artist's albums (no cap), with a "See all" target.
      if (artistAlbums.length) {
        artistRailById.set(domainArtist.id, {
          id: `artist-${domainArtist.id}`,
          title: domainArtist.name,
          itemType: 'album',
          itemIds: artistAlbums.map((a) => a.id),
          seeAllArtistId: domainArtist.id,
          categoryLabel: category.label,
        });
        artistOrder.push(domainArtist.id);
      }
    }
  }

  const pinned = PINNED_ARTIST_SLUGS.filter((s) => artistRailById.has(s));
  const rest = artistOrder.filter((s) => !PINNED_ARTIST_SLUGS.includes(s));
  const rails: HomeRail[] = [...pinned, ...rest].map((s) => artistRailById.get(s)!);

  if (featuredArtistIds.length) {
    rails.unshift({
      id: 'featured-artists',
      title: 'Featured Artists',
      itemType: 'artist',
      itemIds: featuredArtistIds,
    });
  }

  // Hero carousel: pin a Jubilee Inspire album first, then a few other
  // featured artists' albums (in featured order). Capped at HERO_COUNT.
  const HERO_COUNT = 5;
  const HERO_PIN_SLUG = 'jubilee-inspire';
  const heroAlbumIds: string[] = [];
  const pinCode = heroByArtist.get(HERO_PIN_SLUG);
  if (pinCode) heroAlbumIds.push(pinCode);
  for (const slug of featuredArtistIds) {
    if (heroAlbumIds.length >= HERO_COUNT) break;
    if (slug === HERO_PIN_SLUG) continue;
    const code = heroByArtist.get(slug);
    if (code && !heroAlbumIds.includes(code)) heroAlbumIds.push(code);
  }

  return {
    albums,
    albumsById,
    artists,
    artistsById,
    albumsByArtist,
    tracksByArtist,
    home: {
      heroAlbumId: heroAlbumIds[0] ?? heroAlbumId ?? albums[0]?.id ?? '',
      heroAlbumIds,
      rails,
    },
  };
}
