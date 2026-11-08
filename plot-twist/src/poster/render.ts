/**
 * PLOT TWIST poster renderer — Canvas 2D, 2:3, deterministic from the input.
 *
 * Anatomy (1080 × 1620; everything scales with width):
 *
 *   EPISODE 04 ───────── SERIES NAME ───────── 8 NOV 2026 · 31 MIN     rail (mono, tracked)
 *   ┌───────────────────────────────────────────────┐
 *   │                motif artwork plate            │                  procedural art
 *   └───────────────────────────────────────────────┘
 *   The Undercover                                                      title (Fraunces, fitted ≤ 3 lines)
 *   Tourist
 *   ENDING · THE QUIET DETECTIVE                                        condensed sans
 *   “This street keeps its secrets above eye level.”                    italic serif, balanced
 *   ── EVIDENCE A ──────────     ── EVIDENCE B ──────────               user field notes
 *   ───────────────────────────────────────────────────
 *   A PLOT TWIST ORIGINAL  STARRING YOU  WRITTEN BY THE ARCHIVE          billing block (condensed 75%)
 *
 * The plate height adapts to the text (within limits); text never leaves the
 * safe area — titles shrink, lines balance, overflow is ellipsized.
 */
import { PALETTES, type PaletteColors } from '../../shared/constants.ts';
import type { PaletteName, Weirdness } from '../../shared/types.ts';
import { FONT_DISPLAY, FONT_MONO, FONT_SANS } from '../fonts.ts';
import { contrast, ensureContrast, flatten, luminance, mix, mostContrasting, saturation } from './color.ts';
import { drawKindAccent, drawMotif, drawTexture, type ArtColors, type MotifContext, type Rect } from './motifs.ts';
import { hashParts, mulberry32, stream, unitHash } from './prng.ts';
import {
  capHeight,
  drawText,
  ellipsize,
  fontString,
  inkMetrics,
  measureText,
  splitWords,
  wrapClamped,
  wrapGreedy,
  type FontSpec,
} from './text.ts';
import { POSTER_HEIGHT, POSTER_WIDTH, type PosterInput } from './types.ts';

// ── colour system ─────────────────────────────────────────────────────

type ColorKey = 'bg' | 'ink' | 'accent' | 'accent2' | 'accent3';

interface PlateRecipe {
  /** The colour the plate is mixed toward from the background… */
  deep: ColorKey;
  /** …by this much, per weirdness level (calm → loud). */
  amount: readonly [number, number, number];
  /** Preferred order for primary / secondary / tertiary art colours. */
  order: readonly ColorKey[];
}

/** Hand-tuned per palette; unknown palettes fall back to a computed recipe. */
const PLATE_RECIPES: Partial<Record<PaletteName, PlateRecipe>> = {
  ember: { deep: 'accent3', amount: [0.42, 0.62, 0.84], order: ['accent', 'accent2', 'ink'] },
  noir: { deep: 'ink', amount: [0.06, 0.085, 0.11], order: ['accent', 'accent3', 'accent2'] },
  tide: { deep: 'accent3', amount: [0.36, 0.56, 0.78], order: ['accent', 'accent2', 'ink'] },
  neon: { deep: 'accent', amount: [0.1, 0.15, 0.2], order: ['accent', 'accent3', 'accent2'] },
  citrus: { deep: 'accent', amount: [0.07, 0.14, 0.24], order: ['accent', 'accent2', 'accent3'] },
  moss: { deep: 'accent3', amount: [0.34, 0.52, 0.72], order: ['accent', 'accent2', 'ink'] },
  dusk: { deep: 'accent3', amount: [0.55, 0.75, 0.95], order: ['accent', 'accent2', 'ink'] },
  paper: { deep: 'accent3', amount: [0.16, 0.28, 0.42], order: ['accent', 'accent2', 'ink'] },
  cobalt: { deep: 'accent', amount: [0.22, 0.38, 0.62], order: ['accent2', 'ink', 'accent3'] },
  rose: { deep: 'accent3', amount: [0.42, 0.62, 0.84], order: ['accent', 'accent2', 'ink'] },
};

function computedRecipe(p: PaletteColors): PlateRecipe {
  const keys: ColorKey[] = ['accent', 'accent2', 'accent3'];
  const deep = keys.slice().sort((a, b) => saturation(p[a]) - saturation(p[b]))[0];
  return { deep, amount: p.light ? [0.08, 0.14, 0.22] : [0.35, 0.55, 0.75], order: keys.filter((k) => k !== deep).concat('ink') };
}

export function artColorsFor(p: PaletteColors, name: PaletteName, weirdness: Weirdness): ArtColors {
  const recipe = PLATE_RECIPES[name] ?? computedRecipe(p);
  const plate = mix(p.bg, p[recipe.deep], recipe.amount[weirdness - 1]);
  const line = mostContrasting(plate, [p.ink, p.bg]);
  const pool: ColorKey[] = [...recipe.order, 'accent', 'accent2', 'accent3', 'ink'];
  const picked: string[] = [];
  for (const key of pool) {
    const col = p[key];
    if (picked.includes(col) || contrast(col, plate) < 1.45) continue;
    picked.push(col);
    if (picked.length === 3) break;
  }
  while (picked.length < 3) picked.push(line);
  const light = luminance(plate) > 0.35;
  return {
    plate,
    shade: light ? mix(plate, p.ink, 0.1) : mix(plate, '#000000', 0.38),
    primary: picked[0],
    secondary: picked[1],
    tertiary: picked[2],
    line,
    light,
  };
}

interface Theme {
  palette: PaletteColors;
  bg: string;
  ink: string;
  /** secondary text */
  soft: string;
  /** tertiary text (still ≥ 4.5:1) */
  faint: string;
  /** hairline rules */
  hair: string;
  /** accent for small labels, contrast-checked (≥ 4.5:1) */
  label: string;
  light: boolean;
  art: ArtColors;
}

function makeTheme(input: PosterInput): Theme {
  const name: PaletteName = input.palette in PALETTES ? input.palette : 'noir';
  const p = PALETTES[name];
  const weirdness: Weirdness = input.weirdness === 1 || input.weirdness === 3 ? input.weirdness : 2;
  const art = artColorsFor(p, name, weirdness);
  const ink = ensureContrast(p.ink, p.bg, 7);
  const soft = ensureContrast(flatten(p.ink, p.bg, p.light ? 0.8 : 0.76), p.bg, 4.8, ink);
  const faint = ensureContrast(flatten(p.ink, p.bg, p.light ? 0.66 : 0.6), p.bg, 4.5, ink);
  const labelBase =
    [art.primary, p.accent, p.accent2, p.accent3].find((col) => saturation(col) >= 0.35 && contrast(col, p.bg) >= 2) ?? p.accent;
  return {
    palette: p,
    bg: p.bg,
    ink,
    soft,
    faint,
    hair: flatten(p.ink, p.bg, p.light ? 0.24 : 0.2),
    label: ensureContrast(labelBase, p.bg, 4.6, ink),
    light: p.light,
    art,
  };
}

// ── text content helpers ──────────────────────────────────────────────

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export function formatPosterDate(dateISO: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateISO.trim());
  if (!m) return dateISO.trim().toUpperCase();
  const month = MONTHS[Number(m[2]) - 1];
  if (!month) return dateISO.trim();
  return `${Number(m[3])} ${month} ${m[1]}`;
}

const tidy = (text: string | null | undefined) => (text ?? '').replace(/\s+/g, ' ').trim();

/** Typographer's quotes and apostrophes: don't → don’t, "x" → “x”. */
export function smartQuotes(text: string): string {
  return text
    .replace(/(\p{L}|\p{N})'(?=\p{L}|\p{N}|\s|$|[.,!?;:)])/gu, '$1’')
    .replace(/'(\p{L}|\p{N})/gu, '‘$1')
    .replace(/'/g, '’')
    .replace(/(^|[\s(\[{—–-])"/gu, '$1“')
    .replace(/"/g, '”');
}
const upper = (text: string) => smartQuotes(tidy(text)).toLocaleUpperCase('en-US');

function stripQuotes(text: string): string {
  return tidy(text).replace(/^["'“”‘’«»„]+/u, '').replace(/["'“”‘’«»]+$/u, '').trim();
}

const normalizeForCompare = (t: string) => t.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

/** Notes worth showing: non-empty, unique, and not already quoted verbatim in the closing line. */
export function evidenceNotes(notes: readonly string[], closingLine: string): string[] {
  const closing = normalizeForCompare(closingLine);
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of notes) {
    const note = smartQuotes(tidy(raw));
    const key = normalizeForCompare(note);
    if (!key || seen.has(key)) continue;
    if (key === closing || (key.length >= 14 && closing.includes(key))) continue;
    seen.add(key);
    out.push(note);
    if (out.length === 4) break;
  }
  return out;
}

/** All characters the poster will draw (for font subset loading). */
export function posterText(input: PosterInput): string {
  return [input.title, input.endingTitle, input.closingLine, input.seriesName ?? '', input.narrator ?? '', ...(input.notes ?? [])].join(' ');
}

// ── layout ────────────────────────────────────────────────────────────

export interface TextBox {
  id: string;
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Text colour and the background it sits on (for contrast QA). */
  color: string;
  background: string;
  size: number;
}

export interface PosterLayout {
  width: number;
  height: number;
  scale: number;
  safe: Rect;
  plate: Rect;
  titleLines: string[];
  titleSize: number;
  closingLines: string[];
  notesShown: number;
  boxes: TextBox[];
  /** A motif generator error that was caught and replaced by a fallback (QA). */
  motifError: string | null;
}

interface Run {
  id: string;
  text: string;
  x: number;
  /** baseline */
  y: number;
  font: FontSpec;
  color: string;
  /** What the run sits on, when it is not the poster background (QA contrast). */
  bg?: string;
}

interface Rule {
  x1: number;
  x2: number;
  y: number;
  color: string;
  width: number;
}

interface Block {
  height: number;
  /** Runs with baselines relative to the block top. */
  runs: Run[];
  rules: Rule[];
  marks: { x: number; y: number; w: number; h: number; color: string }[];
}

const emptyBlock = (): Block => ({ height: 0, runs: [], rules: [], marks: [] });

function shiftBlock(b: Block, dy: number): Block {
  return {
    height: b.height,
    runs: b.runs.map((r) => ({ ...r, y: r.y + dy })),
    rules: b.rules.map((r) => ({ ...r, y: r.y + dy })),
    marks: b.marks.map((m) => ({ ...m, y: m.y + dy })),
  };
}

type Ctx = CanvasRenderingContext2D;

const titleFont = (size: number, weight: number): FontSpec => ({ family: FONT_DISPLAY, size, weight, tracking: -0.018 });

interface TitleFit {
  lines: string[];
  size: number;
}

/**
 * Chooses line breaks (≤ 3 lines) and the largest size that fits the measure,
 * preferring balanced lines and penalising widows. Never overflows: words that
 * cannot fit even at the floor size are broken.
 */
function fitTitle(ctx: Ctx, title: string, maxW: number, maxSize: number, minSize: number, weight: number, leading: number, maxH: number): TitleFit {
  const words = splitWords(title);
  if (!words.length) words.push('Untitled');
  const unit = (t: string) => measureText(ctx, t, titleFont(100, weight));
  const candidates: string[][] = [];
  const n = words.length;
  const join = (a: number, b: number) => words.slice(a, b).join(' ');
  candidates.push([join(0, n)]);
  for (let a = 1; a < n; a++) candidates.push([join(0, a), join(a, n)]);
  if (n <= 18) for (let a = 1; a < n - 1; a++) for (let b = a + 1; b < n; b++) candidates.push([join(0, a), join(a, b), join(b, n)]);

  let best: (TitleFit & { score: number }) | null = null;
  for (const lines of candidates) {
    const widths = lines.map(unit);
    const widest = Math.max(...widths);
    const k = lines.length;
    let size = Math.min(k === 1 ? maxSize * 1.22 : maxSize, (maxW / widest) * 100);
    size = Math.min(size, maxH / (0.95 + (k - 1) * leading));
    const ragged = k > 1 ? (widest - Math.min(...widths)) / widest : 0;
    const lastWords = splitWords(lines[k - 1]).length;
    const widow = k > 1 && lastWords === 1 && widths[k - 1] < widest * 0.42 ? 1 : 0;
    const dangling = lines.slice(0, -1).filter((l) => /\b(a|an|the)$/i.test(l)).length;
    const score = size * (1 - 0.12 * (k - 1)) * (1 - 0.16 * ragged) * (1 - 0.14 * widow) * (1 - 0.06 * dangling);
    if (!best || score > best.score) best = { lines, size, score };
  }
  let fit: TitleFit = best ?? { lines: [title], size: minSize };
  if (fit.size < minSize * 1.25) {
    // A word too long for the measure: hyphenate across lines at a real display size rather than shrink it away.
    for (let size = maxSize; size >= minSize; size *= 0.95) {
      const lines = wrapGreedy(ctx, title, titleFont(size, weight), maxW);
      if (lines.length <= 3 && size * (0.95 + (lines.length - 1) * leading) <= maxH) {
        if (size > fit.size * 1.12) fit = { lines, size };
        break;
      }
    }
  }
  const floor = Math.min(minSize, 34 * (maxW / 952));
  if (fit.size < floor) {
    // Pathological input (one enormous word): break it at the floor size.
    const wrapped = wrapClamped(ctx, title, titleFont(floor, weight), maxW, 3, true);
    fit = { lines: wrapped.lines, size: floor };
  }
  // Exact check at the final size (optical sizing changes widths a little).
  const widestAt = (f: TitleFit) => Math.max(...f.lines.map((l) => measureText(ctx, l, titleFont(f.size, weight))));
  for (let i = 0; i < 40 && widestAt(fit) > maxW; i++) fit = { lines: fit.lines, size: fit.size * 0.975 };
  if (widestAt(fit) > maxW) {
    // Safety net — never overflow: re-wrap with word breaking at the size we ended up with.
    fit = { lines: wrapClamped(ctx, fit.lines.join(' '), titleFont(fit.size, weight), maxW, 3, false).lines, size: fit.size };
  }
  return fit;
}

interface Credit {
  role: string;
  name: string;
}

function creditsFor(input: PosterInput): Credit[] {
  const out: Credit[] = [
    { role: '', name: 'A PLOT TWIST ORIGINAL' },
    { role: 'STARRING', name: 'YOU' },
    { role: 'WRITTEN BY', name: input.source === 'ai' ? 'THE AI DIRECTOR' : 'THE ARCHIVE' },
  ];
  const narrator = upper(input.narrator ?? '');
  if (narrator) out.push({ role: 'NARRATED BY', name: narrator });
  const series = upper(input.seriesName ?? '');
  if (series) out.push({ role: 'SERIES', name: series });
  return out;
}

/** Film-poster billing block: small stacked roles, tall condensed names, centred lines. */
function layoutBilling(ctx: Ctx, credits: Credit[], left: number, cw: number, s: number, theme: Theme): Block {
  let nameSize = 27 * s;
  let lines: { items: { roleLines: string[]; roleW: number; name: string; nameW: number; w: number }[]; w: number }[] = [];
  let nameFont: FontSpec = { family: FONT_SANS, size: nameSize, weight: 500, stretch: 'condensed', tracking: 0.04 };
  let roleFont: FontSpec = { family: FONT_SANS, size: nameSize * 0.42, weight: 600, stretch: 'condensed', tracking: 0.08 };
  for (let attempt = 0; attempt < 8; attempt++) {
    nameFont = { ...nameFont, size: nameSize };
    roleFont = { ...roleFont, size: nameSize * 0.42 };
    const gapRole = nameSize * 0.22;
    const sep = nameSize * 0.85;
    const items = credits.map((c) => {
      const words = splitWords(c.role);
      const roleLines = words.length >= 2 ? [words.slice(0, -1).join(' '), words[words.length - 1]] : words;
      const roleW = roleLines.length ? Math.max(...roleLines.map((l) => measureText(ctx, l, roleFont))) : 0;
      const room = cw - (roleW ? roleW + gapRole : 0);
      const name = ellipsize(ctx, c.name, nameFont, room);
      const nameW = measureText(ctx, name, nameFont);
      return { roleLines, roleW, name, nameW, w: (roleW ? roleW + gapRole : 0) + nameW };
    });
    lines = [];
    for (const item of items) {
      const cur = lines[lines.length - 1];
      if (cur && cur.w + sep + item.w <= cw) {
        cur.items.push(item);
        cur.w += sep + item.w;
      } else lines.push({ items: [item], w: item.w });
    }
    if (lines.length <= 3 || nameSize < 15 * s) break;
    nameSize *= 0.9;
  }
  const capN = capHeight(ctx, nameFont);
  const capR = capHeight(ctx, roleFont);
  const pitch = capN + nameSize * 0.52;
  const block = emptyBlock();
  const gapRole = nameSize * 0.22;
  const sep = nameSize * 0.85;
  lines.forEach((line, li) => {
    const base = capN + li * pitch;
    let x = left + (cw - line.w) / 2;
    line.items.forEach((item) => {
      if (item.roleLines.length === 2) {
        block.runs.push({ id: 'billing-role', text: item.roleLines[0], x, y: base - capN + capR, font: roleFont, color: theme.faint });
        block.runs.push({ id: 'billing-role', text: item.roleLines[1], x, y: base, font: roleFont, color: theme.faint });
      } else if (item.roleLines.length === 1) {
        block.runs.push({ id: 'billing-role', text: item.roleLines[0], x, y: base - (capN - capR) / 2, font: roleFont, color: theme.faint });
      }
      if (item.roleW) x += item.roleW + gapRole;
      block.runs.push({ id: 'billing-name', text: item.name, x, y: base, font: nameFont, color: theme.soft });
      x += item.nameW + sep;
    });
  });
  block.height = capN + (lines.length - 1) * pitch + nameSize * 0.2;
  return block;
}

interface StackOptions {
  attempt: number;
}

interface Stack {
  title: Block;
  titleFit: TitleFit;
  ending: Block;
  closing: Block;
  closingLines: string[];
  evidence: Block;
  notesShown: number;
}

function layoutStack(ctx: Ctx, input: PosterInput, theme: Theme, left: number, cw: number, s: number, o: StackOptions): Stack {
  const weirdness = input.weirdness === 1 || input.weirdness === 3 ? input.weirdness : 2;
  const weight = weirdness === 1 ? 380 : weirdness === 2 ? 560 : 760;
  const leading = 0.95;

  // Title
  const maxSize = (156 - o.attempt * 12) * s;
  const fit = fitTitle(ctx, smartQuotes(tidy(input.title)) || 'Untitled', cw, maxSize, 58 * s, weight, leading, (410 - o.attempt * 36) * s);
  const tFont = titleFont(fit.size, weight);
  const title = emptyBlock();
  const firstInk = inkMetrics(ctx, fit.lines[0], tFont);
  const lastInk = inkMetrics(ctx, fit.lines[fit.lines.length - 1], tFont);
  const asc = Math.max(firstInk.ascent, capHeight(ctx, tFont));
  fit.lines.forEach((line, i) => {
    title.runs.push({ id: 'title', text: line, x: left, y: asc + i * fit.size * leading, font: tFont, color: theme.ink });
  });
  title.height = asc + (fit.lines.length - 1) * fit.size * leading + Math.max(lastInk.descent, fit.size * 0.04);

  // Ending label: "ENDING · THE QUIET DETECTIVE"
  const ending = emptyBlock();
  const endingTitle = upper(input.endingTitle);
  if (endingTitle) {
    let size = 23 * s;
    let endFont: FontSpec = { family: FONT_SANS, size, weight: 600, stretch: 'condensed', tracking: 0.13 };
    const prefix = 'ENDING';
    const sepGap = () => endFont.size * 0.9;
    let text = endingTitle;
    for (let i = 0; i < 6; i++) {
      const avail = cw - measureText(ctx, prefix, endFont) - sepGap() * 2;
      if (measureText(ctx, text, endFont) <= avail || size <= 17 * s) {
        text = ellipsize(ctx, text, endFont, avail);
        break;
      }
      size *= 0.92;
      endFont = { ...endFont, size };
    }
    const cap = capHeight(ctx, endFont);
    const prefixW = measureText(ctx, prefix, endFont);
    ending.runs.push({ id: 'ending-label', text: prefix, x: left, y: cap, font: endFont, color: theme.label });
    ending.marks.push({ x: left + prefixW + sepGap() - 2.5 * s, y: cap / 2 - 2.5 * s, w: 5 * s, h: 5 * s, color: theme.label });
    ending.runs.push({ id: 'ending-title', text, x: left + prefixW + sepGap() * 2, y: cap, font: endFont, color: theme.ink });
    ending.height = cap;
  }

  // Closing line, in quotes, hanging punctuation, balanced.
  const closing = emptyBlock();
  let closingLines: string[] = [];
  const body = smartQuotes(stripQuotes(input.closingLine));
  if (body) {
    const cFont: FontSpec = { family: FONT_DISPLAY, size: (40 - o.attempt * 2) * s, weight: 340, style: 'italic', tracking: -0.004 };
    const quoteW = measureText(ctx, '“', cFont);
    const maxLines = o.attempt >= 4 ? 3 : 4;
    const wrapped = wrapClamped(ctx, `“${body}”`, cFont, cw - quoteW, maxLines, true);
    closingLines = wrapped.lines;
    const lh = cFont.size * 1.24;
    const asc = Math.max(inkMetrics(ctx, closingLines[0], cFont).ascent, capHeight(ctx, cFont));
    closingLines.forEach((line, i) => {
      closing.runs.push({ id: 'closing', text: line, x: left + (i === 0 ? 0 : quoteW), y: asc + i * lh, font: cFont, color: theme.ink });
    });
    const lastDesc = inkMetrics(ctx, closingLines[closingLines.length - 1], cFont).descent;
    closing.height = asc + (closingLines.length - 1) * lh + Math.max(lastDesc, cFont.size * 0.1);
  }

  // Evidence: the user's field notes as labelled exhibits.
  const evidence = emptyBlock();
  const notes = evidenceNotes(input.notes ?? [], input.closingLine ?? '');
  if (notes.length) {
    const columns = notes.length === 1 ? 1 : 2;
    const colGap = 36 * s;
    const colW = (cw - colGap * (columns - 1)) / columns;
    const labelFont: FontSpec = { family: FONT_MONO, size: 15 * s, weight: 600, tracking: 0.2 };
    const noteFont: FontSpec = { family: FONT_SANS, size: (25 - (o.attempt >= 5 ? 2 : 0)) * s, weight: 450, tracking: 0 };
    const labelCap = capHeight(ctx, labelFont);
    const noteCap = capHeight(ctx, noteFont);
    const noteLH = noteFont.size * 1.3;
    const maxNoteLines = o.attempt >= 3 ? 1 : 2;
    const rowGap = 24 * s;
    let y = 0;
    for (let row = 0; row * columns < notes.length; row++) {
      let rowH = 0;
      for (let col = 0; col < columns; col++) {
        const i = row * columns + col;
        if (i >= notes.length) break;
        const x = left + col * (colW + colGap);
        const letter = String.fromCharCode(65 + i);
        evidence.rules.push({ x1: x, x2: x + colW, y, color: theme.hair, width: Math.max(1, s) });
        const labelBase = y + 17 * s + labelCap;
        const wordW = measureText(ctx, 'EVIDENCE', labelFont);
        evidence.runs.push({ id: 'evidence-label', text: 'EVIDENCE', x, y: labelBase, font: labelFont, color: theme.label });
        const tagX = x + wordW + 10 * s;
        const tagW = measureText(ctx, letter, labelFont) + 12 * s;
        evidence.marks.push({ x: tagX, y: labelBase - labelCap - 5 * s, w: tagW, h: labelCap + 10 * s, color: theme.label });
        evidence.runs.push({ id: 'evidence-letter', text: letter, x: tagX + 6 * s, y: labelBase, font: labelFont, color: theme.bg, bg: theme.label });
        const lines = wrapClamped(ctx, notes[i], noteFont, colW, maxNoteLines, true).lines;
        const first = labelBase + 15 * s + noteCap;
        lines.forEach((line, li) => {
          evidence.runs.push({ id: 'evidence-note', text: line, x, y: first + li * noteLH, font: noteFont, color: theme.soft });
        });
        rowH = Math.max(rowH, first + (lines.length - 1) * noteLH + noteFont.size * 0.26 - y);
      }
      y += rowH + rowGap;
    }
    evidence.height = y - rowGap;
  }

  return { title, titleFit: fit, ending, closing, closingLines, evidence, notesShown: notes.length };
}

interface Layout {
  plate: Rect;
  safe: Rect;
  runs: Run[];
  rules: Rule[];
  marks: Block['marks'];
  titleFit: TitleFit;
  closingLines: string[];
  notesShown: number;
}

function computeLayout(ctx: Ctx, input: PosterInput, theme: Theme, width: number, height: number): Layout {
  const s = width / POSTER_WIDTH;
  const M = 64 * s;
  const top = 58 * s;
  const bottom = 60 * s;
  const cw = width - 2 * M;
  const runs: Run[] = [];
  const rules: Rule[] = [];
  const marks: Block['marks'] = [];

  // Rail: EPISODE 04 ── SERIES ── 8 NOV 2026 · 31 MIN
  const railFont: FontSpec = { family: FONT_MONO, size: 17 * s, weight: 500, tracking: 0.2 };
  const railCap = capHeight(ctx, railFont);
  const ep = Math.max(0, Math.floor(Number.isFinite(input.episodeNumber) ? input.episodeNumber : 0));
  const leftText = `EPISODE ${String(ep).padStart(2, '0')}`;
  const minutes = Math.max(1, Math.round(Number.isFinite(input.minutes) ? input.minutes : 1));
  const rightText = [formatPosterDate(input.dateISO), `${minutes} MIN`].filter(Boolean).join(' · ');
  const leftW = measureText(ctx, leftText, railFont);
  const rightShown = ellipsize(ctx, rightText, railFont, cw * 0.45);
  const rightW = measureText(ctx, rightShown, railFont);
  const gap = 22 * s;
  // The series name heads the poster like a show title; without one, the poster carries the brand.
  const sFont: FontSpec = { ...railFont, weight: 600 };
  const centreRoom = cw - leftW - rightW - gap * 4;
  const series = centreRoom > 80 * s ? ellipsize(ctx, upper(input.seriesName ?? '') || 'PLOT TWIST', sFont, centreRoom) : '';
  // Baseline from the real ink of the rail strings (digits and fallback scripts can overshoot the cap height).
  const railAscent = Math.max(
    railCap,
    inkMetrics(ctx, leftText, railFont).ascent,
    inkMetrics(ctx, rightShown, railFont).ascent,
    series ? inkMetrics(ctx, series, sFont).ascent : 0,
  );
  const railBase = top + railAscent;
  runs.push({ id: 'rail-episode', text: leftText, x: M, y: railBase, font: railFont, color: theme.ink });
  runs.push({ id: 'rail-meta', text: rightShown, x: width - M - rightW, y: railBase, font: railFont, color: theme.soft });
  const midY = railBase - railCap / 2;
  if (series) {
    const sw = measureText(ctx, series, sFont);
    const sx = M + leftW + gap + (cw - leftW - rightW - 2 * gap - sw) / 2;
    runs.push({ id: 'rail-series', text: series, x: sx, y: railBase, font: sFont, color: theme.label });
    rules.push({ x1: M + leftW + gap, x2: sx - gap, y: midY, color: theme.hair, width: Math.max(1, s) });
    rules.push({ x1: sx + sw + gap, x2: width - M - rightW - gap, y: midY, color: theme.hair, width: Math.max(1, s) });
  } else {
    rules.push({ x1: M + leftW + gap, x2: width - M - rightW - gap, y: midY, color: theme.hair, width: Math.max(1, s) });
  }
  // Fixed from the cap height, so plates align across a whole series whatever the rail says.
  const plateTop = top + railCap + 30 * s;

  // Billing block, bottom-anchored, with a rule above.
  const billing = layoutBilling(ctx, creditsFor(input), M, cw, s, theme);
  const billingTop = height - bottom - billing.height;
  const ruleY = billingTop - 26 * s;
  const placedBilling = shiftBlock(billing, billingTop);
  runs.push(...placedBilling.runs);
  rules.push({ x1: M, x2: width - M, y: ruleY, color: theme.hair, width: Math.max(1, s) });

  // Text stack under the plate; shrink until the plate keeps a poster-worthy size.
  const plateGap = 44 * s;
  const gapTitleEnding = 28 * s;
  const gapEndingClosing = 18 * s;
  const minGapEvidence = 34 * s;
  const gapAboveRule = 36 * s;
  const minPlate = height * 0.4;
  const maxPlate = height * 0.62;
  let stack = layoutStack(ctx, input, theme, M, cw, s, { attempt: 0 });
  const textHeight = (st: Stack) =>
    st.title.height +
    (st.ending.height ? gapTitleEnding + st.ending.height : 0) +
    (st.closing.height ? (st.ending.height ? gapEndingClosing : gapTitleEnding) + st.closing.height : 0) +
    (st.evidence.height ? minGapEvidence + st.evidence.height : 0);
  for (let attempt = 1; attempt <= 7; attempt++) {
    const plateH = ruleY - gapAboveRule - textHeight(stack) - plateGap - plateTop;
    if (plateH >= minPlate) break;
    stack = layoutStack(ctx, input, theme, M, cw, s, { attempt });
  }
  const available = ruleY - gapAboveRule - textHeight(stack) - plateGap - plateTop;
  const plateH = Math.max(Math.min(available, maxPlate), Math.min(minPlate, available));
  const plate: Rect = { x: M, y: plateTop, w: cw, h: Math.max(height * 0.2, plateH) };

  let y = plate.y + plate.h + plateGap;
  const place = (b: Block) => {
    const placed = shiftBlock(b, y);
    runs.push(...placed.runs);
    rules.push(...placed.rules);
    marks.push(...placed.marks);
    y += b.height;
  };
  place(stack.title);
  if (stack.ending.height) {
    y += gapTitleEnding;
    place(stack.ending);
  }
  if (stack.closing.height) {
    y += stack.ending.height ? gapEndingClosing : gapTitleEnding;
    place(stack.closing);
  }
  if (stack.evidence.height) {
    // Evidence sits on the rule: any spare height becomes breathing room above it.
    y = Math.max(y + minGapEvidence, ruleY - gapAboveRule - stack.evidence.height);
    place(stack.evidence);
  }

  return {
    plate,
    safe: { x: M, y: top, w: cw, h: height - top - bottom },
    runs,
    rules,
    marks,
    titleFit: stack.titleFit,
    closingLines: stack.closingLines,
    notesShown: stack.notesShown,
  };
}

// ── finishing: misregistration, vignette, grain ───────────────────────

function createScratchCanvas(ctx: Ctx, w: number, h: number): HTMLCanvasElement | OffscreenCanvas | null {
  const doc = (ctx.canvas as HTMLCanvasElement | undefined)?.ownerDocument ?? (typeof document !== 'undefined' ? document : null);
  if (doc) {
    const c = doc.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  return null;
}

/** A riso-style ghost of the plate, slightly off register. */
function misregister(ctx: Ctx, r: Rect, s: number, light: boolean, dx: number, dy: number, alpha: number): void {
  const canvas = ctx.canvas as HTMLCanvasElement | undefined;
  if (!canvas || typeof ctx.getTransform !== 'function') return;
  const t = ctx.getTransform();
  if (Math.abs(t.b) > 1e-6 || Math.abs(t.c) > 1e-6) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(r.x, r.y, r.w, r.h);
  ctx.clip();
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = light ? 'multiply' : 'screen';
  ctx.drawImage(canvas, t.a * r.x + t.e, t.d * r.y + t.f, t.a * r.w, t.d * r.h, r.x + dx * s, r.y + dy * s, r.w, r.h);
  ctx.restore();
}

/**
 * Light falloff inside the plate, built from a few flat elliptical steps
 * instead of a gradient: Skia dithers gradients, and dither under the grain
 * roughly doubles the PNG size. The grain hides the steps.
 */
function drawPlateLight(ctx: Ctx, r: Rect, light: boolean): void {
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h * 0.46;
  ctx.save();
  ctx.beginPath();
  ctx.rect(r.x, r.y, r.w, r.h);
  ctx.clip();
  ctx.fillStyle = light ? 'rgba(74,48,20,0.012)' : 'rgba(0,0,0,0.026)';
  for (let k = 0; k < 13; k++) {
    const g = 1 + k * 0.07;
    ctx.beginPath();
    ctx.rect(r.x, r.y, r.w, r.h);
    ctx.ellipse(cx, cy, r.w * 0.44 * g, r.h * 0.42 * g, 0, 0, Math.PI * 2);
    ctx.fill('evenodd');
  }
  ctx.restore();
}

/**
 * Seeded film grain: a 256 px tile of quantised, sparse 2 px specks repeated
 * as a pattern. Coarse cells + few levels keep the PNG compact; random tiling
 * offset and per-poster tile keep it from reading as a pattern.
 */
function drawGrain(ctx: Ctx, w: number, h: number, s: number, light: boolean, seed: number, wear: number): void {
  const rng = stream(seed, 'grain');
  const tile = 256;
  const cell = Math.max(1, Math.round(2 * s));
  const scratch = createScratchCanvas(ctx, tile, tile);
  const tctx = scratch?.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null | undefined;
  if (!scratch || !tctx) return;
  const img = tctx.createImageData(tile, tile);
  const data = img.data;
  const strength = (light ? 0.075 : 0.1) * (1 + 0.35 * wear) * Math.min(1, 0.45 + 0.55 * s);
  for (let y = 0; y < tile; y += cell) {
    for (let x = 0; x < tile; x += cell) {
      const v = rng() + rng() - 1;
      const mag = Math.abs(v);
      if (mag < 0.4) continue;
      const bright = v > 0;
      const level = Math.ceil(mag * 3) / 3;
      const a = Math.round(255 * strength * level * (bright === light ? 0.55 : 1));
      const col = bright ? 255 : 0;
      for (let yy = y; yy < Math.min(tile, y + cell); yy++) {
        for (let xx = x; xx < Math.min(tile, x + cell); xx++) {
          const i = (yy * tile + xx) * 4;
          data[i] = col;
          data[i + 1] = col;
          data[i + 2] = col;
          data[i + 3] = a;
        }
      }
    }
  }
  tctx.putImageData(img, 0, 0);
  const pattern = ctx.createPattern(scratch as CanvasImageSource, 'repeat');
  if (!pattern) return;
  const ox = Math.floor(rng() * tile);
  const oy = Math.floor(rng() * tile);
  ctx.save();
  ctx.translate(-ox, -oy);
  ctx.fillStyle = pattern;
  ctx.fillRect(ox, oy, w, h);
  ctx.restore();
  // A few long, faint scratches when the episode took the scenic route (alternatives).
  if (wear > 0) {
    const n = Math.round(2 + 4 * wear);
    ctx.save();
    for (let i = 0; i < n; i++) {
      const x = rng() * w;
      ctx.fillStyle = light ? 'rgba(40,25,10,0.07)' : 'rgba(255,255,255,0.06)';
      ctx.fillRect(x, rng() * h * 0.3, Math.max(1, s), h * (0.3 + 0.5 * rng()));
    }
    ctx.restore();
  }
}

// ── public API ────────────────────────────────────────────────────────

/** Draws the poster and returns its layout (boxes, plate, fitted title) — used by the QA lab. */
export function drawPosterWithLayout(ctx: CanvasRenderingContext2D, input: PosterInput, width: number, height: number): PosterLayout {
  const s = width / POSTER_WIDTH;
  const theme = makeTheme(input);
  const seed = Number.isFinite(input.seed) ? input.seed >>> 0 : hashParts(input.title, input.dateISO);
  const weirdness: Weirdness = input.weirdness === 1 || input.weirdness === 3 ? input.weirdness : 2;
  const choice = Math.max(0, Math.min(2, Math.floor(Number.isFinite(input.firstChoiceIndex) ? input.firstChoiceIndex : 0)));
  const alternates = Math.max(0, Math.floor(Number.isFinite(input.alternatesUsed) ? input.alternatesUsed : 0));
  const labels = (input.choiceLabels ?? []).map(tidy).filter(Boolean);

  ctx.save();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.setLineDash([]);
  ctx.imageSmoothingEnabled = true;
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, width, height);

  const layout = computeLayout(ctx, input, theme, width, height);

  const m: MotifContext = {
    rng: mulberry32(hashParts(seed, 'art', input.motif, weirdness, choice, input.kind, ...labels)),
    colors: theme.art,
    weirdness,
    dir: choice === 0 ? -1 : choice === 1 ? 1 : 0,
    texture: Math.min(1, alternates / 2),
    kind: input.kind,
    variant: unitHash('variant', ...labels, seed % 997),
    s,
  };
  const art = drawMotif(ctx, input.motif, layout.plate, m);
  drawKindAccent(ctx, layout.plate, art.focus, m);
  drawTexture(ctx, layout.plate, m);
  if (weirdness === 3 || alternates >= 3) {
    const rr = stream(seed, 'register');
    misregister(ctx, layout.plate, s, theme.art.light, 4 + rr() * 3, -(2 + rr() * 3), weirdness === 3 ? 0.24 : 0.14);
  }

  drawPlateLight(ctx, layout.plate, theme.art.light);

  // Type.
  for (const rule of layout.rules) {
    ctx.fillStyle = rule.color;
    ctx.fillRect(rule.x1, rule.y - rule.width / 2, Math.max(0, rule.x2 - rule.x1), rule.width);
  }
  for (const mark of layout.marks) {
    ctx.fillStyle = mark.color;
    ctx.fillRect(mark.x, mark.y, mark.w, mark.h);
  }
  const boxes: TextBox[] = [];
  for (const run of layout.runs) {
    const w = drawText(ctx, run.text, run.x, run.y, run.font, run.color);
    const ink = inkMetrics(ctx, run.text, run.font);
    boxes.push({
      id: run.id,
      text: run.text,
      x: run.x,
      y: run.y - ink.ascent,
      w,
      h: ink.ascent + ink.descent,
      color: run.color,
      background: run.bg ?? theme.bg,
      size: run.font.size,
    });
  }

  drawGrain(ctx, width, height, s, theme.light, seed, m.texture);
  ctx.restore();

  return {
    width,
    height,
    scale: s,
    safe: layout.safe,
    plate: layout.plate,
    titleLines: layout.titleFit.lines,
    titleSize: layout.titleFit.size,
    closingLines: layout.closingLines,
    notesShown: layout.notesShown,
    boxes,
    motifError: art.error,
  };
}

export function drawPoster(ctx: CanvasRenderingContext2D, input: PosterInput, width: number, height: number): void {
  drawPosterWithLayout(ctx, input, width, height);
}

// ── fonts ─────────────────────────────────────────────────────────────

const FONT_FACES: FontSpec[] = [
  { family: FONT_DISPLAY, size: 40, weight: 400 },
  { family: FONT_DISPLAY, size: 40, weight: 400, style: 'italic' },
  { family: FONT_SANS, size: 24, weight: 500 },
  { family: FONT_SANS, size: 24, weight: 600, stretch: 'condensed' },
  { family: FONT_MONO, size: 18, weight: 500 },
];

/** Waits (bounded) for the web fonts the poster uses, incl. the unicode subsets `text` needs. Never rejects. */
export async function ensurePosterFonts(text = '', timeoutMs = 3000): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts || typeof document.fonts.load !== 'function') return;
  const sample = Array.from(new Set(Array.from(`${text} ABCXYZ abcxyz 0123456789 “”·—…`))).join('');
  const loads = FONT_FACES.map((f) => document.fonts.load(fontString(f), sample).then(
    () => undefined,
    () => undefined,
  ));
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, Math.max(0, timeoutMs));
  });
  try {
    await Promise.race([Promise.all(loads).then(() => undefined), timeout]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

/** True when every poster face is ready (for QA). */
export function posterFontsReady(): boolean {
  if (typeof document === 'undefined' || !document.fonts) return false;
  return FONT_FACES.every((f) => document.fonts.check(fontString(f)));
}

function normalizeWidth(width: number | undefined): number {
  const w = Math.round(width ?? POSTER_WIDTH);
  return Number.isFinite(w) ? Math.max(120, Math.min(4096, w)) : POSTER_WIDTH;
}

export async function renderPosterCanvas(input: PosterInput, opts: { width?: number } = {}): Promise<HTMLCanvasElement> {
  const width = normalizeWidth(opts.width);
  const height = Math.round((width * POSTER_HEIGHT) / POSTER_WIDTH);
  await ensurePosterFonts(posterText(input));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Canvas 2D is not available in this browser.');
  drawPoster(ctx, input, width, height);
  return canvas;
}

/** Frees the pixel buffer early (iOS Safari caps total canvas memory). */
function release(canvas: HTMLCanvasElement): void {
  canvas.width = 0;
  canvas.height = 0;
}

function dataURLToBlob(url: string): Blob {
  const [head, b64] = url.split(',');
  const mime = /data:([^;]+)/.exec(head)?.[1] ?? 'image/png';
  const bin = atob(b64 ?? '');
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export async function posterToBlob(input: PosterInput, opts: { width?: number } = {}): Promise<Blob> {
  const canvas = await renderPosterCanvas(input, opts);
  try {
    const blob = await new Promise<Blob | null>((resolve) => {
      if (typeof canvas.toBlob === 'function') canvas.toBlob((b) => resolve(b), 'image/png');
      else resolve(null);
    });
    return blob ?? dataURLToBlob(canvas.toDataURL('image/png'));
  } finally {
    release(canvas);
  }
}

export async function posterToDataURL(input: PosterInput, opts: { width?: number } = {}): Promise<string> {
  const canvas = await renderPosterCanvas(input, opts);
  try {
    return canvas.toDataURL('image/png');
  } finally {
    release(canvas);
  }
}

/** Exposed for the lab and tests: the colours a palette resolves to. */
export function posterTheme(input: PosterInput): { bg: string; ink: string; label: string; plate: string } {
  const t = makeTheme(input);
  return { bg: t.bg, ink: t.ink, label: t.label, plate: t.art.plate };
}
