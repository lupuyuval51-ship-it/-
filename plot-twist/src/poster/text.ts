/**
 * Canvas typography helpers for the poster: font strings (incl. font-stretch),
 * letter-spacing with a fallback, measuring, greedy + balanced wrapping,
 * ellipsis and bidi direction.
 *
 * Everything is drawn left-aligned at a computed x; callers do their own
 * alignment from measured widths, so layout never depends on textAlign quirks.
 */

export type FontStretch = 'normal' | 'semi-condensed' | 'condensed';

export interface FontSpec {
  family: string;
  /** CSS px */
  size: number;
  weight?: number;
  style?: 'normal' | 'italic';
  stretch?: FontStretch;
  /** Letter spacing in em (may be negative). */
  tracking?: number;
}

type Ctx = CanvasRenderingContext2D;

interface ModernTextCtx {
  letterSpacing?: string;
  fontStretch?: string;
}

const hasLetterSpacing = (ctx: Ctx): boolean => 'letterSpacing' in ctx;
const hasFontStretch = (ctx: Ctx): boolean => 'fontStretch' in ctx;

const round2 = (n: number) => Math.round(n * 100) / 100;

export function fontString(f: FontSpec, includeStretch = true): string {
  const style = f.style === 'italic' ? 'italic ' : '';
  const stretch = includeStretch && f.stretch && f.stretch !== 'normal' ? `${f.stretch} ` : '';
  return `${style}${Math.round(f.weight ?? 400)} ${stretch}${round2(f.size)}px ${f.family}`;
}

export function applyFont(ctx: Ctx, f: FontSpec): void {
  const modern = ctx as Ctx & ModernTextCtx;
  if (hasFontStretch(ctx)) {
    ctx.font = fontString(f, false);
    modern.fontStretch = f.stretch ?? 'normal';
  } else {
    // Older engines: try the stretch keyword in the shorthand; an unparsable value is ignored, so set a safe base first.
    ctx.font = fontString(f, false);
    if (f.stretch && f.stretch !== 'normal') ctx.font = fontString(f, true);
  }
  if (hasLetterSpacing(ctx)) modern.letterSpacing = '0px';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

/** Tracking (px) that will really be applied when drawing — negative tracking needs native support. */
function effectiveTracking(ctx: Ctx, f: FontSpec): number {
  const t = (f.tracking ?? 0) * f.size;
  if (t < 0 && !hasLetterSpacing(ctx)) return 0;
  return t;
}

const chars = (text: string) => Array.from(text);

/** Visual advance width (excluding trailing tracking). */
export function measureText(ctx: Ctx, text: string, f: FontSpec): number {
  if (!text) return 0;
  applyFont(ctx, f);
  const w = ctx.measureText(text).width;
  const n = chars(text).length;
  return w + effectiveTracking(ctx, f) * Math.max(0, n - 1);
}

export interface InkMetrics {
  ascent: number;
  descent: number;
}

/** Actual ink extents above/below the baseline for this text in this font. */
export function inkMetrics(ctx: Ctx, text: string, f: FontSpec): InkMetrics {
  applyFont(ctx, f);
  const m = ctx.measureText(text || 'H');
  const ascent = Number.isFinite(m.actualBoundingBoxAscent) ? m.actualBoundingBoxAscent : f.size * 0.72;
  const descent = Number.isFinite(m.actualBoundingBoxDescent) ? m.actualBoundingBoxDescent : f.size * 0.2;
  return { ascent: Math.max(0, ascent), descent: Math.max(0, descent) };
}

const capCache = new Map<string, number>();
/** Cap height of a font (ink height of "H"), cached per font string. */
export function capHeight(ctx: Ctx, f: FontSpec): number {
  const key = fontString(f);
  const hit = capCache.get(key);
  if (hit !== undefined) return hit;
  const v = inkMetrics(ctx, 'H', f).ascent;
  if (capCache.size > 400) capCache.clear();
  capCache.set(key, v);
  return v;
}

const RTL_CHAR = /[֐-ࣿיִ-﷿ﹰ-ﻼ]/;
const LTR_CHAR = /[A-Za-zÀ-ɏͰ-ϿЀ-ӿ]/;

/** Base direction from the first strong character (like dir="auto"). */
export function textDirection(text: string): 'ltr' | 'rtl' {
  for (const ch of text) {
    if (RTL_CHAR.test(ch)) return 'rtl';
    if (LTR_CHAR.test(ch)) return 'ltr';
  }
  return 'ltr';
}

/** Draws `text` with its left edge at x (any direction). Returns the visual width. */
export function drawText(ctx: Ctx, text: string, x: number, y: number, f: FontSpec, color: string): number {
  if (!text) return 0;
  const modern = ctx as Ctx & ModernTextCtx;
  const track = effectiveTracking(ctx, f);
  const width = measureText(ctx, text, f); // also applies the font
  ctx.fillStyle = color;
  ctx.direction = textDirection(text);
  if (track === 0) {
    ctx.fillText(text, x, y);
  } else if (hasLetterSpacing(ctx)) {
    modern.letterSpacing = `${round2(track)}px`;
    ctx.fillText(text, x, y);
    modern.letterSpacing = '0px';
  } else {
    // Manual tracking (positive only): glyph by glyph.
    let cx = x;
    for (const ch of chars(text)) {
      ctx.fillText(ch, cx, y);
      cx += ctx.measureText(ch).width + track;
    }
  }
  ctx.direction = 'ltr';
  return width;
}

/** Splits a word that is wider than maxW into pieces that fit (last resort for very long words). */
function breakWord(ctx: Ctx, word: string, f: FontSpec, maxW: number): string[] {
  const out: string[] = [];
  let cur = '';
  for (const ch of chars(word)) {
    const next = cur + ch;
    if (cur && measureText(ctx, `${next}-`, f) > maxW) {
      out.push(`${cur}-`);
      cur = ch;
    } else cur = next;
  }
  if (cur) out.push(cur);
  return out;
}

export function splitWords(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

/** Greedy word wrap. Words wider than maxW are broken. */
export function wrapGreedy(ctx: Ctx, text: string, f: FontSpec, maxW: number): string[] {
  const words = splitWords(text);
  const lines: string[] = [];
  let cur = '';
  for (const word of words) {
    const pieces = measureText(ctx, word, f) > maxW ? breakWord(ctx, word, f, maxW) : [word];
    for (const piece of pieces) {
      const next = cur ? `${cur} ${piece}` : piece;
      if (cur && measureText(ctx, next, f) > maxW) {
        lines.push(cur);
        cur = piece;
      } else cur = next;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

/**
 * Balanced wrap (like CSS `text-wrap: balance`): the same number of lines as
 * a greedy wrap, but with the narrowest measure that still achieves it, so the
 * last line is never a lonely widow.
 */
export function wrapBalanced(ctx: Ctx, text: string, f: FontSpec, maxW: number): string[] {
  const greedy = wrapGreedy(ctx, text, f, maxW);
  if (greedy.length <= 1) return greedy;
  let lo = maxW * 0.45;
  let hi = maxW;
  let best = greedy;
  for (let i = 0; i < 12; i++) {
    const mid = (lo + hi) / 2;
    const attempt = wrapGreedy(ctx, text, f, mid);
    if (attempt.length <= greedy.length) {
      best = attempt;
      hi = mid;
    } else lo = mid;
  }
  return best;
}

/** Shortens text with an ellipsis (at a word boundary when possible) until it fits. */
export function ellipsize(ctx: Ctx, text: string, f: FontSpec, maxW: number): string {
  if (measureText(ctx, text, f) <= maxW) return text;
  const words = splitWords(text);
  while (words.length > 1) {
    words.pop();
    const candidate = `${words.join(' ').replace(/[\s,;:.\-–—]+$/u, '')}…`;
    if (measureText(ctx, candidate, f) <= maxW) return candidate;
  }
  const letters = chars(words[0] ?? text);
  while (letters.length > 1) {
    letters.pop();
    const candidate = `${letters.join('')}…`;
    if (measureText(ctx, candidate, f) <= maxW) return candidate;
  }
  return '…';
}

/** Wraps into at most `maxLines`; overflow is folded into the last line and ellipsized. */
export function wrapClamped(ctx: Ctx, text: string, f: FontSpec, maxW: number, maxLines: number, balanced = true): { lines: string[]; truncated: boolean } {
  const lines = balanced ? wrapBalanced(ctx, text, f, maxW) : wrapGreedy(ctx, text, f, maxW);
  if (lines.length <= maxLines) return { lines, truncated: false };
  const all = wrapGreedy(ctx, text, f, maxW);
  const head = all.slice(0, Math.max(0, maxLines - 1));
  head.push(ellipsize(ctx, all.slice(head.length).join(' '), f, maxW));
  return { lines: head, truncated: true };
}
