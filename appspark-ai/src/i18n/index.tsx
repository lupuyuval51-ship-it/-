import { getLocales } from 'expo-localization';
import { createContext, useCallback, useContext, useMemo, type PropsWithChildren } from 'react';

import type { Locale, Localized, LocalizedList } from '@/data/types';
import { usePreferences } from '@/store/preferences';

import { en } from './en';
import { he, type Dictionary } from './he';

export const dictionaries: Record<Locale, Dictionary> = { he, en };

type Leaves<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${Prefix}${K}` : Leaves<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

/** Every dotted key path that resolves to a string in the dictionary. */
export type TranslationKey = Leaves<Dictionary>;

export type Translate = (key: TranslationKey, params?: Record<string, string | number>) => string;

export interface I18n {
  locale: Locale;
  isRTL: boolean;
  dir: 'rtl' | 'ltr';
  t: Translate;
  /** Picks the current locale's string from a localized value. */
  pick: (value: Localized) => string;
  pickList: (value: LocalizedList) => string[];
  dict: Dictionary;
  setLocale: (locale: Locale) => void;
}

function resolve(dict: Dictionary, key: string): string | undefined {
  const parts = key.split('.');
  let node: unknown = dict;
  for (const part of parts) {
    if (!node || typeof node !== 'object') return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string' ? node : undefined;
}

export function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name];
    return value === undefined || value === null ? match : String(value);
  });
}

export function translate(locale: Locale, key: TranslationKey, params?: Record<string, string | number>): string {
  const value = resolve(dictionaries[locale], key) ?? resolve(dictionaries.he, key) ?? key;
  return interpolate(value, params);
}

export function isRtlLocale(locale: Locale): boolean {
  return locale === 'he';
}

/** Best-effort guess of the device's preferred supported locale. */
export function detectDeviceLocale(): Locale {
  try {
    const code = getLocales()[0]?.languageCode?.toLowerCase();
    return code === 'en' ? 'en' : 'he';
  } catch {
    return 'he';
  }
}

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ children }: PropsWithChildren) {
  const locale = usePreferences((s) => s.locale);
  const setLocale = usePreferences((s) => s.setLocale);

  const t = useCallback<Translate>((key, params) => translate(locale, key, params), [locale]);
  const pick = useCallback((value: Localized) => value[locale] || value.he || value.en, [locale]);
  const pickList = useCallback((value: LocalizedList) => value[locale] ?? value.he ?? value.en, [locale]);

  const value = useMemo<I18n>(
    () => ({
      locale,
      isRTL: isRtlLocale(locale),
      dir: isRtlLocale(locale) ? 'rtl' : 'ltr',
      t,
      pick,
      pickList,
      dict: dictionaries[locale],
      setLocale,
    }),
    [locale, t, pick, pickList, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used inside <I18nProvider>');
  }
  return ctx;
}

/** Formats a date for the current locale without pulling in a library. */
export function formatDate(iso: string, locale: Locale): string {
  try {
    return new Intl.DateTimeFormat(locale === 'he' ? 'he-IL' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}
