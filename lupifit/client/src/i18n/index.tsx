/**
 * Lightweight, type-safe i18n.
 * - `en` dictionaries define the shape; `he` dictionaries are typed against them, so a
 *   missing or extra Hebrew key is a compile error.
 * - `t('module.key', { name })` interpolates `{name}`; keys are checked at compile time.
 * - Plurals: a leaf may be `{ one, two?, other }`; pass `{ count }` to select a form.
 * - `tx(dynamicKey, params, fallback)` is for server-provided codes (errors, notes).
 * - `lt({ en, he })` picks localized content from the API.
 * Hebrew is the default locale (RTL); English is LTR.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Locale } from '@shared/constants';
import type { LocalizedText } from '@shared/content';
import { storage } from '../lib/storage';
import { en, type Dictionary } from './locales/en';
import { he } from './locales/he';

export type PluralForms = { zero?: string; one?: string; two?: string; few?: string; many?: string; other: string };

type IsLeaf<T> = T extends string ? true : T extends { other: string } ? true : false;
type Leaves<T> = {
  [K in keyof T & string]: IsLeaf<T[K]> extends true ? K : `${K}.${Leaves<T[K]>}`;
}[keyof T & string];

export type TKey = Leaves<Dictionary>;
export type TParams = Record<string, string | number | null | undefined>;

const DICTIONARIES: Record<Locale, Dictionary> = { en, he };
export const DEFAULT_LOCALE: Locale = 'he';
const STORAGE_KEY = 'fitai.locale';

function lookup(dict: unknown, key: string): unknown {
  let node: unknown = dict;
  for (const part of key.split('.')) {
    if (node && typeof node === 'object' && part in (node as Record<string, unknown>)) node = (node as Record<string, unknown>)[part];
    else return undefined;
  }
  return node;
}

function interpolate(template: string, params?: TParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (m, name: string) => {
    const v = params[name];
    return v === undefined || v === null ? m : String(v);
  });
}

export function translate(locale: Locale, key: string, params?: TParams): string | undefined {
  let value = lookup(DICTIONARIES[locale], key);
  if (value === undefined && locale !== 'en') value = lookup(DICTIONARIES.en, key);
  if (value && typeof value === 'object' && 'other' in (value as PluralForms)) {
    const forms = value as PluralForms;
    const count = typeof params?.count === 'number' ? params.count : Number(params?.count ?? NaN);
    const rule = Number.isFinite(count) ? new Intl.PluralRules(locale).select(count) : 'other';
    value = (count === 0 && forms.zero) || forms[rule as keyof PluralForms] || forms.other;
  }
  return typeof value === 'string' ? interpolate(value, params) : undefined;
}

export interface I18nValue {
  locale: Locale;
  dir: 'rtl' | 'ltr';
  setLocale(locale: Locale): void;
  t(key: TKey, params?: TParams): string;
  /** Dynamic key (e.g. server error code). Returns `fallback` (or the key) when missing. */
  tx(key: string, params?: TParams, fallback?: string): string;
  /** Picks the current language from API-provided localized text. */
  lt(text: LocalizedText | null | undefined): string;
  formatNumber(n: number, opts?: Intl.NumberFormatOptions): string;
  formatDate(d: string | Date, opts?: Intl.DateTimeFormatOptions): string;
  formatTime(d: string | Date): string;
  formatRelativeDays(days: number): string;
  intlLocale: string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function initialLocale(): Locale {
  const stored = storage.get<string>(STORAGE_KEY);
  if (stored === 'he' || stored === 'en') return stored;
  return DEFAULT_LOCALE;
}

export function I18nProvider({ children, locale: forced }: { children: ReactNode; locale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(forced ?? initialLocale());

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    storage.set(STORAGE_KEY, l);
  }, []);

  useEffect(() => {
    const dir = locale === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale]);

  const value = useMemo<I18nValue>(() => {
    const intlLocale = locale === 'he' ? 'he-IL' : 'en-US';
    const numberFormats = new Map<string, Intl.NumberFormat>();
    return {
      locale,
      dir: locale === 'he' ? 'rtl' : 'ltr',
      intlLocale,
      setLocale,
      t: (key, params) => translate(locale, key, params) ?? key,
      tx: (key, params, fallback) => translate(locale, key, params) ?? fallback ?? key,
      lt: (text) => (text ? (locale === 'he' ? text.he || text.en : text.en || text.he) : ''),
      formatNumber: (n, opts) => {
        const k = JSON.stringify(opts ?? {});
        let f = numberFormats.get(k);
        if (!f) {
          f = new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 1, ...opts });
          numberFormats.set(k, f);
        }
        return f.format(n);
      },
      formatDate: (d, opts) => {
        const date = typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(`${d}T12:00:00Z`) : new Date(d);
        const tz = typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) ? 'UTC' : undefined;
        return new Intl.DateTimeFormat(intlLocale, { day: 'numeric', month: 'short', ...(tz ? { timeZone: tz } : {}), ...opts }).format(date);
      },
      formatTime: (d) => new Intl.DateTimeFormat(intlLocale, { hour: '2-digit', minute: '2-digit' }).format(new Date(d)),
      formatRelativeDays: (days) => new Intl.RelativeTimeFormat(intlLocale, { numeric: 'auto' }).format(days, 'day'),
    };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}
