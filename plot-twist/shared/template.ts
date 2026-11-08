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
  // Remove control characters and collapse whitespace.
  const cleaned = Array.from(note)
    .filter((ch) => {
      const code = ch.codePointAt(0) ?? 0;
      return code >= 0x20 && code !== 0x7f;
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
  if (cleaned.length <= MAX_NOTE_LENGTH) return cleaned;
  return cleaned.slice(0, MAX_NOTE_LENGTH - 1).trimEnd() + '…';
}

/** Renders tokens with the user's notes (or fallbacks). */
export function renderTemplate(text: string, notes: Record<string, string | undefined> = {}): string {
  return text.replace(TOKEN, (_raw, key: string, fallback: string) => {
    const note = cleanNote(notes[key]);
    return note || fallback.trim();
  });
}

/** Renders every token with its fallback — what text reads like when no notes exist. */
export function renderFallbacks(text: string): string {
  return renderTemplate(text, {});
}

/** Replaces tokens whose key is not in `allowedKeys` with their fallback text. */
export function stripUnknownTokens(text: string, allowedKeys: ReadonlySet<string>): string {
  return text.replace(TOKEN, (raw, key: string, fallback: string) => (allowedKeys.has(key) ? raw : fallback.trim()));
}
