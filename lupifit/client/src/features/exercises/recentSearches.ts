/**
 * Recent library searches, remembered per browser (a convenience only: every read and
 * write is guarded because storage can be unavailable, e.g. in private windows).
 */
import { cleanSearch } from './filters';

export const RECENT_SEARCHES_KEY = 'fitai.exercises.recent';
export const MAX_RECENT_SEARCHES = 6;
/** Shorter texts are usually half-typed words. */
const MIN_LENGTH = 2;

function safeStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function readRecentSearches(storage: Pick<Storage, 'getItem'> | null = safeStorage()): string[] {
  try {
    const raw = storage?.getItem(RECENT_SEARCHES_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === 'string' && cleanSearch(x) !== '').slice(0, MAX_RECENT_SEARCHES);
  } catch {
    return [];
  }
}

/** Newest first, case-insensitive de-duplication, capped. Returns the new list. */
export function addRecentSearch(raw: string, storage: Pick<Storage, 'getItem' | 'setItem'> | null = safeStorage()): string[] {
  const q = cleanSearch(raw);
  const current = readRecentSearches(storage);
  if (q.length < MIN_LENGTH) return current;
  const next = [q, ...current.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, MAX_RECENT_SEARCHES);
  try {
    storage?.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}

export function clearRecentSearches(storage: Pick<Storage, 'removeItem'> | null = safeStorage()): void {
  try {
    storage?.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    /* ignore */
  }
}
