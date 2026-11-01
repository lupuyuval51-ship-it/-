import type { Language } from '../enums.js';
import { en } from './en.js';
import { he } from './he.js';

type Widen<T> = T extends string ? string : { -readonly [K in keyof T]: Widen<T[K]> };
/** English is the structural source of truth; Hebrew must provide every key (compile-time enforced). */
export type Dict = Widen<typeof en>;

export const DICTIONARIES: Record<Language, Dict> = { en, he };
export { en, he };

/** Dot-path lookup, e.g. t('he', 'unit.kg'). Returns the key itself if missing (never throws in UI). */
export function t(lang: Language, path: string): string {
  let cur: unknown = DICTIONARIES[lang];
  for (const part of path.split('.')) {
    if (typeof cur !== 'object' || cur === null) return path;
    cur = (cur as Record<string, unknown>)[part];
  }
  return typeof cur === 'string' ? cur : path;
}
