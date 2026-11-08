/** Small sRGB colour toolkit for the poster: parsing, mixing, WCAG contrast. */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export function parseColor(hex: string): RGB {
  let h = hex.trim().replace(/^#/, '');
  if (h.length === 3 || h.length === 4) h = h.slice(0, 3).split('').map((c) => c + c).join('');
  const n = Number.parseInt(h.slice(0, 6), 16);
  if (!Number.isFinite(n) || h.length < 6) return { r: 0, g: 0, b: 0 };
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

const clamp255 = (v: number) => Math.max(0, Math.min(255, Math.round(v)));

export function toHex(c: RGB): string {
  return `#${[c.r, c.g, c.b].map((v) => clamp255(v).toString(16).padStart(2, '0')).join('')}`;
}

/** Linear blend in sRGB: t = 0 → a, t = 1 → b. */
export function mix(a: string, b: string, t: number): string {
  const x = parseColor(a);
  const y = parseColor(b);
  const k = Math.max(0, Math.min(1, t));
  return toHex({ r: x.r + (y.r - x.r) * k, g: x.g + (y.g - x.g) * k, b: x.b + (y.b - x.b) * k });
}

export function rgba(hex: string, alpha: number): string {
  const c = parseColor(hex);
  const a = Math.max(0, Math.min(1, alpha));
  return `rgba(${c.r},${c.g},${c.b},${Number(a.toFixed(4))})`;
}

/** The colour you see when `fg` at `alpha` is painted over `bg`. */
export function flatten(fg: string, bg: string, alpha: number): string {
  return mix(bg, fg, alpha);
}

function channel(v: number): number {
  const s = v / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance, 0 (black) … 1 (white). */
export function luminance(hex: string): number {
  const c = parseColor(hex);
  return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b);
}

/** WCAG contrast ratio, 1 … 21. */
export function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** HSL-style saturation (0 … 1) — how "colourful" a colour reads. */
export function saturation(hex: string): number {
  const c = parseColor(hex);
  const max = Math.max(c.r, c.g, c.b) / 255;
  const min = Math.min(c.r, c.g, c.b) / 255;
  const l = (max + min) / 2;
  if (max === min) return 0;
  return l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
}

/**
 * Returns `fg`, nudged toward `toward` just enough to reach `min` contrast
 * against `bg`. Keeps the hue family where possible (accent text stays accent).
 */
export function ensureContrast(fg: string, bg: string, min: number, toward?: string): string {
  if (contrast(fg, bg) >= min) return fg;
  const target = toward ?? (luminance(bg) > 0.4 ? '#000000' : '#ffffff');
  if (contrast(target, bg) < min) return target;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2;
    if (contrast(mix(fg, target, mid), bg) >= min) hi = mid;
    else lo = mid;
  }
  return mix(fg, target, hi);
}

/** Picks whichever candidate contrasts most with `bg`. */
export function mostContrasting(bg: string, candidates: readonly string[]): string {
  let best = candidates[0];
  let bestRatio = -1;
  for (const c of candidates) {
    const r = contrast(c, bg);
    if (r > bestRatio) {
      bestRatio = r;
      best = c;
    }
  }
  return best;
}
