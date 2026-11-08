import type { Adventure } from '../../shared/types.ts';

/**
 * The curated library. Every file in ./adventures exports one Adventure as its
 * default export; they are collected automatically (no central list to edit).
 */
const modules = import.meta.glob<{ default: Adventure }>('./adventures/*.ts', { eager: true });

export const LIBRARY: readonly Adventure[] = Object.values(modules)
  .map((m) => m.default)
  .filter((a): a is Adventure => Boolean(a && a.id))
  .sort((a, b) => a.id.localeCompare(b.id));

const byId = new Map(LIBRARY.map((a) => [a.id, a]));

export function getCuratedAdventure(id: string): Adventure | undefined {
  return byId.get(id);
}
