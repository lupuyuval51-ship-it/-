/**
 * Library ⇄ detail navigation. Links from the library carry the library's query string
 * in history state, so the detail page's back link returns to the same search, filters
 * and loaded pages (and, one step away, to the same scroll position).
 */
export interface LibraryNavState {
  /** `?…` query string of the library page the user came from ('' for none). */
  librarySearch: string;
  /** History entries since the library (1 = the previous entry is the library). */
  depth: number;
}

export function readLibraryNav(state: unknown): LibraryNavState | null {
  if (!state || typeof state !== 'object') return null;
  const { librarySearch, depth } = state as Partial<LibraryNavState>;
  if (typeof librarySearch !== 'string' || (librarySearch !== '' && !librarySearch.startsWith('?'))) return null;
  if (typeof depth !== 'number' || !Number.isInteger(depth) || depth < 1) return null;
  return { librarySearch, depth };
}

/** State for a link one step further away from the library (e.g. detail → alternative). */
export function deeperNav(nav: LibraryNavState | null): LibraryNavState | undefined {
  return nav ? { librarySearch: nav.librarySearch, depth: nav.depth + 1 } : undefined;
}

/** Library scroll positions by history entry key (in-memory; restored on back navigation). */
export const libraryScrollPositions = new Map<string, number>();
