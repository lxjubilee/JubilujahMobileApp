import { ENV } from '@/constants';

/**
 * Build a fully-qualified CDN URL from a relative path. ALL media (audio,
 * album covers, artist images) flows through here, so the CDN host lives in
 * exactly one place (configured via app.json -> extra.cdnBaseUrl).
 *
 * Accepts already-absolute URLs and returns them unchanged, so mock data can
 * mix absolute and relative paths during development.
 */
export function cdnUrl(path?: string | null): string {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const base = ENV.CDN_BASE_URL.replace(/\/+$/, '');
  const rel = path.replace(/^\/+/, '');
  return `${base}/${rel}`;
}
