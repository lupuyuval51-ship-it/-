import type { Locale } from '@domain/ai-api';

export type { Locale };

export const LOCALES: readonly Locale[] = ['he', 'en'];
export const DEFAULT_LOCALE: Locale = 'he';

export function isLocale(value: unknown): value is Locale {
  return value === 'he' || value === 'en';
}

export function isRTLLocale(locale: Locale): boolean {
  return locale === 'he';
}

/** BCP-47 tag used for Intl formatting. */
export function intlLocale(locale: Locale): string {
  return locale === 'he' ? 'he-IL' : 'en-US';
}

/**
 * A plural leaf: an object with string `one` and `other` keys and no keys other than
 * zero / one / two / other. Hebrew uses `one` / `two` / `other`, English `one` / `other`;
 * `two` and `zero` are optional in every locale (fallback: `other`). Any other object is a
 * nested group (so `{ registration: '…', other: '…' }` is a group, not a plural).
 */
export interface PluralForms {
  readonly zero?: string;
  readonly one: string;
  readonly two?: string;
  readonly other: string;
}

export type PluralCategory = 'zero' | 'one' | 'two' | 'other';

export const PLURAL_CATEGORIES: readonly PluralCategory[] = ['zero', 'one', 'two', 'other'];

/** Type-level plural detection matching `isPluralForms()` at runtime. */
export type IsPlural<V> = V extends { readonly one: string; readonly other: string }
  ? [Exclude<keyof V, PluralCategory>] extends [never]
    ? true
    : false
  : false;

export function isPluralForms(value: unknown): value is PluralForms {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  if (typeof record.one !== 'string' || typeof record.other !== 'string') return false;
  return Object.entries(record).every(([k, v]) => (PLURAL_CATEGORIES as readonly string[]).includes(k) && typeof v === 'string');
}

/**
 * Shape a translation of `T` must have: exactly the same keys, every string leaf any string,
 * every plural leaf any PluralForms. Use it to type the English namespace from the Hebrew one:
 *
 *   import he from '../he/plan';
 *   const en: Messages<typeof he> = { ... };   // missing or extra keys are compile errors
 */
export type Messages<T> = {
  readonly [K in keyof T]: T[K] extends string ? string : IsPlural<T[K]> extends true ? PluralForms : Messages<T[K]>;
};

/** Dot paths to every leaf (string or plural object) of a message tree. */
export type LeafPaths<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : IsPlural<T[K]> extends true
      ? `${Prefix}${K}`
      : LeafPaths<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

export type TranslateVars = Readonly<Record<string, string | number>>;
