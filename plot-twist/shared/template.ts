import { MAX_NOTE_LENGTH } from './constants.ts';

/**
 * Template tokens let later text quote the user's own field notes:
 *
 *   "Remember {{detail|the crooked door}}? It was a clue."
 *
 * `detail` is a capture key; the text after `|` is the fallback used when the
 * user skipped the note. A fallback is always required.
 */
const TOKEN = /\{\{\s*([a-z0-9][a-z0-9-]*)\s*\|([^{}]*)\}\}/g;
/** Anything that looks like a token, valid or not — used to catch malformed ones. */
const LOOSE_TOKEN = /\{\{[^]*?\}\}/g;

export interface TemplateToken {
  raw: string;
  key: string;
  fallback: string;
}

export function parseTokens(text: string): TemplateToken[] {
  const out: TemplateToken[] = [];
  for (const m of text.matchAll(TOKEN)) {
    out.push({ raw: m[0], key: m[1], fallback: m[2].trim() });
  }
  return out;
}

/** Returns raw strings of `{{…}}` sequences that are not valid tokens (missing key, missing fallback…). */
export function malformedTokens(text: string): string[] {
  const bad: string[] = [];
  for (const m of text.matchAll(LOOSE_TOKEN)) {
    const raw = m[0];
    const valid = parseTokens(raw);
    if (valid.length !== 1 || valid[0].raw !== raw || valid[0].fallback.length === 0) bad.push(raw);
  }
  // Single braces left over from a broken token, e.g. "{{detail|x}"
  const stripped = text.replace(LOOSE_TOKEN, '');
  if (stripped.includes('{{') || stripped.includes('}}')) bad.push(stripped);
  return bad;
}

/** Cleans a user note for display inside generated text. */
export function cleanNote(note: string | undefined | null): string {
  if (!note) return '';
  // Line breaks and tabs become spaces (so words don't merge); other control characters are dropped.
  const cleaned = Array.from(note)
    .map((ch) => {
      const code = ch.codePointAt(0) ?? 0;
      if (code >= 0x09 && code <= 0x0d) return ' ';
      return code < 0x20 || code === 0x7f ? '' : ch;
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
  if (cleaned.length <= MAX_NOTE_LENGTH) return cleaned;
  return cleaned.slice(0, MAX_NOTE_LENGTH - 1).trimEnd() + '…';
}

const CLOSING_QUOTES = new Set(['"', '”', "'", '’', '»', ')']);
const JOINING_PUNCTUATION = /[.,;:!?…]/;

/**
 * Renders tokens with the user's notes (or fallbacks). When the template puts
 * punctuation right after a token, the note's own trailing punctuation is
 * dropped so sentences read cleanly ("loudly.:" → "loudly:").
 */
export function renderTemplate(text: string, notes: Record<string, string | undefined> = {}): string {
  return text.replace(TOKEN, (_raw, key: string, fallback: string, offset: number, whole: string) => {
    const value = cleanNote(notes[key]) || fallback.trim();
    let i = offset + _raw.length;
    while (i < whole.length && CLOSING_QUOTES.has(whole[i])) i++;
    if (i < whole.length && JOINING_PUNCTUATION.test(whole[i])) return value.replace(/[.,;:!?…]+$/u, '');
    return value;
  });
}

/** Typographic quotes and apostrophes for display ("it's" → “it’s”). */
export function typographic(text: string): string {
  return text
    .replace(/(^|[\s([{—–-])"/g, '$1“')
    .replace(/"/g, '”')
    .replace(/(^|[\s([{—–-])'/g, '$1‘')
    .replace(/'/g, '’');
}

/** Renders every token with its fallback — what text reads like when no notes exist. */
export function renderFallbacks(text: string): string {
  return renderTemplate(text, {});
}

/** Replaces tokens whose key is not in `allowedKeys` with their fallback text. */
export function stripUnknownTokens(text: string, allowedKeys: ReadonlySet<string>): string {
  return text.replace(TOKEN, (raw, key: string, fallback: string) => (allowedKeys.has(key) ? raw : fallback.trim()));
}
