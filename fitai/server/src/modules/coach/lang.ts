/** Language detection and text normalization for keyword matching (EN + HE). */
import type { Locale } from '@shared/constants';

const HEBREW_LETTER = /[\u05D0-\u05EA]/g;
const LATIN_LETTER = /[A-Za-z]/g;

/**
 * The language the reply should use: the language the message is written in when it
 * is clearly Hebrew or English, otherwise the account language.
 */
export function replyLanguage(message: string, accountLocale: Locale): Locale {
  const he = message.match(HEBREW_LETTER)?.length ?? 0;
  const en = message.match(LATIN_LETTER)?.length ?? 0;
  if (he === 0 && en <= 2) return accountLocale; // "3x8", "ok": no real language signal
  if (en === 0) return 'he';
  if (he === 0) return 'en';
  // Hebrew messages often contain English exercise names ("איך עושים bench press"),
  // so a mixed message counts as Hebrew unless it is overwhelmingly English.
  return he * 3 >= en ? 'he' : 'en';
}

/**
 * Lower-cases, strips Hebrew niqqud and Latin diacritics, unifies quote/geresh
 * characters and hyphens, and collapses whitespace. Used on both the message and the
 * keyword lists so matching is consistent.
 */
export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0591-\u05C7]/g, '') // Hebrew cantillation + niqqud
    .replace(/[\u0300-\u036F]/g, '') // Latin combining marks
    .replace(/[\u05F3'`\u2019\u2018]/g, "'")
    .replace(/[\u05F4"\u201C\u201D]/g, '"')
    .replace(/[\u2010-\u2015_-]+/g, ' ')
    .replace(/[^\p{L}\p{N}'".,/%+\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * True if `phrase` occurs in the normalized `text`. English phrases match on word
 * boundaries (with an optional plural "s"/"es"); Hebrew phrases match as substrings
 * because Hebrew attaches prefixes (ו, ה, ב, ל, מ, ש, כ) directly to words.
 */
export function containsPhrase(text: string, phrase: string): boolean {
  return phraseIndex(text, phrase) >= 0;
}

/** Position of the first match of `phrase` in `text` (see `containsPhrase`), or -1. */
export function phraseIndex(text: string, phrase: string): number {
  const p = normalizeText(phrase);
  if (!p) return -1;
  if (/[\u05D0-\u05EA]/.test(p)) return text.indexOf(p);
  const re = new RegExp(`(?:^|[^\\p{L}\\p{N}])(${escapeRe(p)}(?:s|es)?)(?=$|[^\\p{L}\\p{N}])`, 'u');
  const m = re.exec(text);
  if (!m) return -1;
  return m.index + m[0].length - m[1]!.length;
}

export function containsAny(text: string, phrases: readonly string[]): boolean {
  return phrases.some((p) => containsPhrase(text, p));
}

export function countMatches(text: string, phrases: readonly string[]): number {
  return phrases.reduce((n, p) => n + (containsPhrase(text, p) ? 1 : 0), 0);
}
