/**
 * Small text helpers shared by the hard-constraint checks (constraints.ts) and
 * the safety screen (safety.ts): clause scope, negation, hypotheticals, quoted
 * spans, and quoting model text safely inside a prompt.
 */

/** Punctuation that ends a clause outright. A comma is handled by `negatedAt` and `hypotheticalAt`. */
export const CLAUSE_BREAK = /[.!?;:()[\]{}"“”—–…]/;

/** Words after which a base-form verb is an instruction: "and grab a coffee", "then stand on the roof", "you sit…". */
const IMPERATIVE_LEADS = ['and', 'then', 'or', 'you', 'now', 'first', 'next', 'finally', 'just', 'quickly', 'carefully', 'slowly', 'quietly', 'secretly', 'sneakily', 'discreetly', 'please', 'simply', 'go', 'try\\s+to'];

/**
 * A regex lookbehind for where an imperative verb can stand: the start of the text, a
 * sentence or a clause, or after one of IMPERATIVE_LEADS (plus `extra`). Used before
 * base verb forms, it tells an instruction ("Grab a coffee", "…and lean over the
 * railing") from a description of others ("commuters grabbing a coffee", "a man
 * leaning over the railing"). A lookbehind, so the match starts at the verb.
 */
export function imperativeBefore(extra: readonly string[] = []): string {
  return String.raw`(?<=^|[.!?;:,—–(]\s*|\b(?:${[...IMPERATIVE_LEADS, ...extra].join('|')})\s+)`;
}

/** Lowercase words of `text`; curly apostrophes count as straight ones. */
export function wordsOf(text: string): string[] {
  return text.toLowerCase().replace(/[’‘]/g, "'").match(/[a-z']+/g) ?? [];
}

/** The clause that ends at `index` (at most `max` characters back). */
export function clauseBefore(text: string, index: number, max = 120): string {
  return text.slice(Math.max(0, index - max), index).split(CLAUSE_BREAK).pop() ?? '';
}

/** Words that join the items of a list: "no buying, ordering or paying". */
const LIST_GLUE: ReadonlySet<string> = new Set(['or', 'and', 'nor', 'even', 'also', 'any', 'anything']);

/**
 * True when the match at `index` is negated in its own clause, so it is the rule
 * being respected rather than broken:
 * - one of the three words right before it is a negation: "no need to buy anything",
 *   "never follow strangers";
 * - or it continues a negated list: "no buying, ordering or paying", "never
 *   photograph, film or record anyone" (the negated segment ends on one of
 *   `listWords`, so the comma separates list items).
 * A comma closes a negated lead-in, so the instruction after it still counts:
 * "No pressure, buy a coffee", "Without a sound, follow the man", "Don't run, just
 * tail the jogger", "Never photograph strangers, film them instead".
 */
export function negatedAt(text: string, index: number, negations: ReadonlySet<string>, listWords: ReadonlySet<string> = new Set()): boolean {
  const segments = clauseBefore(text, index).split(',');
  let words = wordsOf(segments.pop() ?? '');
  if (words.slice(-3).some((w) => negations.has(w))) return true;
  // Walk back through list items ("…, ordering or ") to the segment that started the list.
  while (segments.length > 0 && words.every((w) => LIST_GLUE.has(w) || listWords.has(w))) {
    const previous = wordsOf(segments.pop() ?? '');
    const negation = previous.findIndex((w) => negations.has(w));
    if (negation >= 0 && negation < previous.length - 1 && listWords.has(previous[previous.length - 1])) return true;
    if (previous.length === 0 || !previous.every((w) => LIST_GLUE.has(w) || listWords.has(w))) return false;
    words = previous;
  }
  return false;
}

/**
 * Markers of a hypothetical or imagined action: "imagine you could order anything",
 * "pick one thing you'd buy", "picture yourself in a café". "Picture" only counts as
 * a verb (not after "a", "the" …).
 */
const HYPOTHETICAL =
  /\b(?:would|wouldn't|[a-z]+'d|imagine|imagining|imagined|pretend|pretending|daydream(?:ing)?|dream(?:ing)?\s+(?:of|about|up)|if\s+you\s+(?:could|were|had)|as\s+if|as\s+though|in\s+your\s+(?:mind|head|imagination)|(?<!\b(?:a|an|the|your|this|that|one|quick|first|last)\s)pictur(?:e|ing))\b/i;

/**
 * True when the clause before `index` (up to a comma or stronger break) frames the
 * match as hypothetical. A comma ends the frame: "Imagine you're a critic, then buy a
 * pastry" is still a purchase.
 */
export function hypotheticalAt(text: string, index: number): boolean {
  const segment = clauseBefore(text, index).split(',').pop() ?? '';
  return HYPOTHETICAL.test(segment.replace(/[’‘]/g, "'"));
}

/** Character ranges of quoted text: "…", “…”, ‘…’ and '…' (an apostrophe inside a word is not a quote). */
export function quotedSpans(text: string): [number, number][] {
  const spans: [number, number][] = [];
  for (const re of [/"[^"\n]*"/g, /“[^”\n]*”/g, /‘[^’\n]*’/g, /(?<![\p{L}\p{N}])'[^'\n]+'(?![\p{L}\p{N}])/gu]) {
    for (const m of text.matchAll(re)) spans.push([m.index, m.index + m[0].length]);
  }
  return spans;
}

/** True when `index` falls inside quoted text (a sign, a slogan, a line of speech). */
export function insideQuotes(text: string, index: number): boolean {
  return quotedSpans(text).some(([start, end]) => index > start && index < end);
}

/** `<` and `>` as JSON unicode escapes, so model text can never open or close a tag in a prompt. */
export function escapeAngles(text: string): string {
  return text.replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
}

/**
 * Quotes model text for a message the model will read back (a repair brief): JSON
 * string syntax, so quotes and newlines are escaped, plus escaped angle brackets,
 * clipped to `max` characters.
 */
export function quoteModelText(text: string, max = 60): string {
  const clipped = text.length > max ? `${text.slice(0, max - 1)}…` : text;
  return escapeAngles(JSON.stringify(clipped));
}
