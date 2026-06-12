export { cdnUrl } from './cdn';
export { formatDuration, formatCount } from './format';
export { logger } from './logger';

/** Resolve helper: keep entities by an ordered list of ids. */
export function pickByIds<T extends { id: string }>(items: T[], ids: string[]): T[] {
  const map = new Map(items.map((i) => [i.id, i]));
  return ids.map((id) => map.get(id)).filter((x): x is T => Boolean(x));
}

/** Promise-based delay used to simulate latency for mock data sources. */
export const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));
