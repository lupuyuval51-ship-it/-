/**
 * Pure viewport classification for the play HUD and the app pages. Keeps the phone-portrait layout as the default and
 * only changes things for short landscape screens (phones turned sideways) and for tablets.
 */

export type TouchScale = "compact" | "regular" | "large";

export interface Layout {
  width: number;
  height: number;
  landscape: boolean;
  /** A phone held sideways: little vertical room, so the HUD must be compact and must not cover the world. */
  shortLandscape: boolean;
  /** Width at which the app pages switch to two columns (Tailwind `md`). */
  twoColumns: boolean;
  /** Size of the on-screen joystick and buttons. */
  touchScale: TouchScale;
  /** Whether the mission list starts unfolded. */
  missionsOpen: boolean;
}

export const SHORT_LANDSCAPE_MAX_HEIGHT = 500;
export const TWO_COLUMN_MIN_WIDTH = 768;
export const MISSIONS_OPEN_MIN_WIDTH = 640;
/** Shortest side at which a device is treated as a tablet (phones are below this in both orientations). */
export const TABLET_MIN_SHORT_SIDE = 600;

export function computeLayout(width: number, height: number): Layout {
  const w = Number.isFinite(width) && width > 0 ? Math.round(width) : 390;
  const h = Number.isFinite(height) && height > 0 ? Math.round(height) : 844;
  const landscape = w > h;
  const shortLandscape = landscape && h <= SHORT_LANDSCAPE_MAX_HEIGHT;
  const shortSide = Math.min(w, h);
  const touchScale: TouchScale = shortLandscape ? "compact" : shortSide >= TABLET_MIN_SHORT_SIDE ? "large" : "regular";
  return {
    width: w,
    height: h,
    landscape,
    shortLandscape,
    twoColumns: w >= TWO_COLUMN_MIN_WIDTH,
    touchScale,
    missionsOpen: w >= MISSIONS_OPEN_MIN_WIDTH && !shortLandscape,
  };
}

/** The layout assumed on the server and before the first measurement: a portrait phone (the existing design). */
export const DEFAULT_LAYOUT: Layout = computeLayout(390, 844);

/** Tailwind classes (literal strings so the scanner finds them) for the touch controls at each scale. */
export const TOUCH_METRICS: Record<TouchScale, { pad: string; stick: string; knob: string; sprint: string; action: string; gap: string }> = {
  compact: { pad: "px-3 pb-2 pt-1", stick: "size-24", knob: "size-10", sprint: "size-11", action: "size-14", gap: "gap-2" },
  regular: { pad: "p-4", stick: "size-32", knob: "size-14", sprint: "size-14", action: "size-16", gap: "gap-3" },
  large: { pad: "p-6", stick: "size-40", knob: "size-16", sprint: "size-16", action: "size-20", gap: "gap-4" },
};

/** Distance (px) the knob may travel from the centre, from the measured base width and knob width. */
export function stickTravel(baseWidth: number, knobWidth: number): number {
  return Math.max(1, baseWidth / 2 - knobWidth / 4);
}

/** Normalised stick (-1..1, y up) and knob offset (px) from a pointer offset relative to the stick centre. */
export function stickVector(dx: number, dy: number, travel: number): { x: number; y: number; kx: number; ky: number } {
  const len = Math.hypot(dx, dy) || 1;
  const k = Math.min(1, travel / len);
  const kx = dx * k, ky = dy * k;
  return { x: kx / travel, y: -ky / travel, kx, ky };
}

/** Whether a scroll container hides content above / below its visible area (drives the fade + chevron scroll cue). */
export function scrollCue(scrollTop: number, clientHeight: number, scrollHeight: number, slack = 4): { above: boolean; below: boolean } {
  const ok = [scrollTop, clientHeight, scrollHeight].every((n) => Number.isFinite(n));
  if (!ok || scrollHeight <= clientHeight + slack) return { above: false, below: false };
  return { above: scrollTop > slack, below: scrollTop + clientHeight < scrollHeight - slack };
}
