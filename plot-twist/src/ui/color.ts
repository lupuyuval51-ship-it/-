/** Tiny color helpers for keeping episode tints accessible on the ink UI. */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function mixWithWhite(hex: string, t: number): string {
  const [r, g, b] = hexToRgb(hex);
  const m = (c: number) => Math.round(c + (255 - c) * t);
  return `#${[m(r), m(g), m(b)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * The lightest surface an episode tint sits on as small text (stage cards and the
 * paused timer are a few percent ivory over ink) — checking against plain ink alone
 * let some tints (cobalt) fall just under 4.5:1 on those cards.
 */
const LIGHTEST_SURFACE = '#1c1a17';

/** Returns the accent, lightened just enough to reach 5:1 on every dark surface it is used on. */
export function uiAccent(hex: string): string {
  let out = hex;
  for (let t = 0.05; contrast(out, LIGHTEST_SURFACE) < 5 && t <= 0.85; t += 0.05) out = mixWithWhite(hex, t);
  return out;
}
