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
 * A plural leaf: an object whose `other` key is a string. Hebrew uses `one` / `two` / `other`,
 * English `one` / `other`. `two` and `zero` are optional in every locale (fallback: `other`).
 */
export interface PluralForms {
  readonly zero?: string;
  readonly one: string;
  readonly two?: string;
  readonly other: string;
}

export type PluralCategory = 'zero' | 'one' | 'two' | 'other';

/**
 * Shape a translation of `T` must have: exactly the same keys, every string leaf any string,
 * every plural leaf any PluralForms. Use it to type the English namespace from the Hebrew one:
 *
 *   import he from '../he/plan';
 *   const en: Messages<typeof he> = { ... };   // missing or extra keys are compile errors
 */
export type Messages<T> = {
  readonly [K in keyof T]: T[K] extends string ? string : T[K] extends { readonly other: string } ? PluralForms : Messages<T[K]>;
};

/** Dot paths to every leaf (string or plural object) of a message tree. */
export type LeafPaths<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : T[K] extends { readonly other: string }
      ? `${Prefix}${K}`
      : LeafPaths<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

export type TranslateVars = Readonly<Record<string, string | number>>;
