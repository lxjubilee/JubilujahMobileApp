import { getManifest } from './manifestClient';
import { buildCatalogIndex, CatalogIndex } from './manifestMappers';

/**
 * Module-level cache of the built catalog index, shared by every repository
 * (via ManifestDataSource). Keeping it here — rather than on a data-source
 * instance — lets a background manifest refresh swap it for the whole app at
 * once: call `invalidateCatalogIndex()` and the next `getCatalogIndex()` rebuilds
 * from the freshly-cached manifest.
 */
let indexPromise: Promise<CatalogIndex> | null = null;

export function getCatalogIndex(): Promise<CatalogIndex> {
  if (!indexPromise) {
    indexPromise = getManifest()
      .then(buildCatalogIndex)
      .catch((err) => {
        indexPromise = null; // allow retry
        throw err;
      });
  }
  return indexPromise;
}

/** Drop the built index so the next read rebuilds it (after a manifest refresh). */
export function invalidateCatalogIndex(): void {
  indexPromise = null;
}
