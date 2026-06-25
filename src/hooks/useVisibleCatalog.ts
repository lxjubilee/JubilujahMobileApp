import { useMemo } from 'react';
import { Album, Artist, ResolvedRail, Track } from '@/types';
import { useAppSelector } from '@/redux';
import { peekCatalogIndex } from '@/services/catalog';
import type { CatalogIndex } from '@/services/catalog';

/**
 * Filters out catalog items whose cover image has been observed to 404 at
 * runtime (tracked in the `artwork` slice; see `Artwork` + `artworkSlice`).
 * Keyed by the CDN-relative cover path stored on each entity.
 *
 *  - Albums / tracks: hidden when their own cover/artwork is known-missing.
 *  - Artists: hidden only when EVERY one of their albums lacks artwork; if just
 *    the avatar's cover is missing, the avatar is swapped to the first album
 *    that still has artwork (so the artist stays visible with a real image).
 *  - Rails: each rail's items are filtered, and a rail that empties out is
 *    dropped entirely so the Home screen renders no blank gap in its place.
 */
type MissingMap = Record<string, true>;

function useMissingCovers(): MissingMap {
  return useAppSelector((s) => s.artwork.missing);
}

function filterArtists(
  artists: Artist[],
  missing: MissingMap,
  index: CatalogIndex | null,
): Artist[] {
  const result: Artist[] = [];
  for (const artist of artists) {
    const covers = index?.albumsByArtist.get(artist.id)?.map((al) => al.cover) ?? [];
    // "All albums" rule — drop the artist only when no album has artwork.
    if (covers.length > 0 && covers.every((c) => missing[c])) continue;
    // Avatar cover missing but other albums have art → show a good cover.
    if (artist.image && missing[artist.image]) {
      const firstGood = covers.find((c) => !missing[c]);
      result.push(firstGood ? { ...artist, image: firstGood } : artist);
    } else {
      result.push(artist);
    }
  }
  return result;
}

export function useVisibleAlbums(albums: Album[]): Album[] {
  const missing = useMissingCovers();
  return useMemo(() => albums.filter((a) => !missing[a.cover]), [albums, missing]);
}

export function useVisibleTracks(tracks: Track[]): Track[] {
  const missing = useMissingCovers();
  return useMemo(() => tracks.filter((t) => !missing[t.artwork]), [tracks, missing]);
}

export function useVisibleArtists(artists: Artist[]): Artist[] {
  const missing = useMissingCovers();
  return useMemo(() => filterArtists(artists, missing, peekCatalogIndex()), [artists, missing]);
}

export function useVisibleRails(rails: ResolvedRail[]): ResolvedRail[] {
  const missing = useMissingCovers();
  return useMemo(() => {
    const index = peekCatalogIndex();
    const out: ResolvedRail[] = [];
    for (const rail of rails) {
      if (rail.itemType === 'artist') {
        const artists = filterArtists(rail.artists ?? [], missing, index);
        if (artists.length) out.push({ ...rail, artists });
      } else {
        const albums = (rail.albums ?? []).filter((a) => !missing[a.cover]);
        if (albums.length) out.push({ ...rail, albums });
      }
    }
    return out;
  }, [rails, missing]);
}
