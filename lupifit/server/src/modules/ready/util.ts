/** Tiny pure helpers shared by the ready-workout catalog, the safety layer and the service. */
import type { Locale } from '@shared/constants';
import type { LocalizedText } from '@shared/content';

export const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** The text in the user's language (Hebrew is the default). */
export const pickLocale = (text: LocalizedText, locale: Locale): string => (locale === 'en' ? text.en : text.he);

/** Locale-independent ordering of ids: plain code-unit order, so the order is identical on every machine and setting. */
export const compareIds = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);
