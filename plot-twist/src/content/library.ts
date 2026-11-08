import type { Adventure } from '../../shared/types.ts';

/**
 * The curated library. Every file in ./adventures exports one Adventure as its
 * default export; they are collected automatically (no central list to edit).
 */
const modules = import.meta.glob<{ default: Adventure }>('./adventures/*.ts', { eager: true });

const ALL: readonly Adventure[] = Object.values(modules)
  .map((m) => m.default)
  .filter((a): a is Adventure => Boolean(a && a.id))
  .sort((a, b) => a.id.localeCompare(b.id));

/**
 * Development-only: `?library=id1,id2` (or `?library=none`) restricts the library,
 * so empty and partial-match states can be reviewed. Compiled out of production builds.
 */
function devRestrict(list: readonly Adventure[]): readonly Adventure[] {
  if (!import.meta.env.DEV || typeof window === 'undefined') return list;
  const param = new URLSearchParams(window.location.search).get('library');
  if (!param) return list;
  const ids = new Set(param.split(','));
  return list.filter((a) => ids.has(a.id));
}

export const LIBRARY: readonly Adventure[] = devRestrict(ALL);

const byId = new Map(LIBRARY.map((a) => [a.id, a]));

export function getCuratedAdventure(id: string): Adventure | undefined {
  return byId.get(id);
}
