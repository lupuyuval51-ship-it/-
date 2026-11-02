import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * The tests read UI copy from the app's own dictionaries (client/src/i18n/features/*.ts), so they stay correct when copy is reworded
 * and never hard-code user-facing strings. Returns `t(key, vars)` for one language.
 */
const DIR = resolve(import.meta.dirname, '../client/src/i18n/features');
type Tree = { [k: string]: string | Tree };
let cache: { en: Record<string, string>; he: Record<string, string> } | null = null;

function flatten(tree: Tree, prefix: string, out: Record<string, string>): void {
  for (const [k, v] of Object.entries(tree)) {
    if (typeof v === 'string') out[`${prefix}${k}`] = v; else flatten(v, `${prefix}${k}.`, out);
  }
}

export async function loadCopy(): Promise<{ en: Record<string, string>; he: Record<string, string> }> {
  if (cache) return cache;
  const en: Record<string, string> = {}; const he: Record<string, string> = {};
  for (const f of readdirSync(DIR).filter((x) => x.endsWith('.ts'))) {
    const mod = (await import(pathToFileURL(resolve(DIR, f)).href)) as { default?: { en: Tree; he: Tree } };
    if (mod.default?.en && mod.default.he) { flatten(mod.default.en, '', en); flatten(mod.default.he, '', he); }
  }
  cache = { en, he };
  return cache;
}

export type TFn = (key: string, vars?: Record<string, string | number>) => string;
export async function makeT(lang: 'he' | 'en'): Promise<TFn> {
  const dict = (await loadCopy())[lang];
  return (key, vars) => {
    const s = dict[key];
    if (s === undefined) throw new Error(`e2e copy: missing key ${key} (${lang})`);
    return vars ? s.replace(/\{(\w+)\}/g, (_m, name: string) => String(vars[name] ?? `{${name}}`)) : s;
  };
}

/** RegExp that matches an exact label (aria-label / accessible name) ignoring surrounding whitespace. */
export const exact = (s: string): RegExp => new RegExp(`^\\s*${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`);
export const contains = (s: string): RegExp => new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
