import { TOUCH_METRICS, type TouchScale } from "@/lib/layout";
import { DEFAULT_GUIDE_INSETS, MIN_BAND_PX, type GuideInsets } from "../scene/guideBand";

/**
 * Where the HUD may put things so they never sit on top of the on-screen controls.
 *
 * The sizes come from `TOUCH_METRICS` (the single source for the joystick and button sizes), so changing a control size
 * moves the prompt and the first-run card with it. Everything is pure and unit-tested; the components only turn the
 * numbers into inline styles. Safe-area insets (notch, rounded corners, gesture bar) are folded in with `env()`.
 */

/** A Tailwind spacing class such as `px-3` / `size-24` in rem (1 unit = 0.25rem), or null when the string has none. */
const remOrNull = (cls: string, prefix: string): number | null => {
  const m = new RegExp(`(?<![\\w-])${prefix}-(\\d+(?:\\.\\d+)?)`).exec(cls);
  return m ? Number(m[1]) / 4 : null;
};
const rem = (cls: string, prefix: string): number => remOrNull(cls, prefix) ?? 0;
const sizeRem = (cls: string) => rem(cls, "size");
const gapRem = (cls: string) => rem(cls, "gap");

/** How far the controls keep from the screen's sides and bottom, from the padding in `TOUCH_METRICS` (before any inset). */
export function controlsPadRem(scale: TouchScale): { side: number; bottom: number } {
  const pad = TOUCH_METRICS[scale].pad;
  return { side: remOrNull(pad, "px") ?? rem(pad, "p"), bottom: remOrNull(pad, "pb") ?? rem(pad, "p") };
}

/** Padding of the touch-controls bar: the scale's own padding, or the notch / gesture-bar inset when that is larger. */
export function controlsInsetStyle(scale: TouchScale): { paddingLeft: string; paddingRight: string; paddingBottom: string } {
  const p = controlsPadRem(scale);
  return { paddingLeft: `max(${p.side}rem, env(safe-area-inset-left, 0px))`, paddingRight: `max(${p.side}rem, env(safe-area-inset-right, 0px))`, paddingBottom: `max(${p.bottom}rem, env(safe-area-inset-bottom, 0px))` };
}

/** Height (rem, without the bottom inset) from the bottom edge to the top of the tallest control. */
export function controlsHeightRem(scale: TouchScale): number {
  const m = TOUCH_METRICS[scale];
  const stick = sizeRem(m.stick);
  // regular / large: sprint above the action buttons; compact (landscape): everything in one row
  const buttons = scale === "compact" ? Math.max(sizeRem(m.sprint), sizeRem(m.action)) : sizeRem(m.sprint) + gapRem(m.gap) + sizeRem(m.action);
  return Math.max(stick, buttons);
}

/** CSS `bottom` that puts something `gapRem` above the touch controls (portrait phones and tablets). */
export function bottomAboveControls(scale: TouchScale, gap = 0.5): string {
  return `calc(${(controlsHeightRem(scale) + gap).toFixed(2)}rem + max(${controlsPadRem(scale).bottom}rem, env(safe-area-inset-bottom, 0px)))`;
}

/** CSS `bottom` for something that sits at the bottom edge (nothing in the way), clear of the gesture bar. */
export function bottomEdge(gap = 0.75): string {
  return `max(${gap}rem, env(safe-area-inset-bottom, 0px))`;
}

/** Horizontal room (rem, without the inset) the controls take up at the left (stick) and right (buttons) of a landscape phone. */
export function landscapeReserveRem(scale: TouchScale, hasJump = true): { left: number; right: number } {
  const m = TOUCH_METRICS[scale];
  const stick = sizeRem(m.stick);
  const gap = gapRem(m.gap);
  // compact: [sprint][jump][interact] in one row
  const buttons = sizeRem(m.sprint) + gap + (hasJump ? sizeRem(m.action) + gap : 0) + sizeRem(m.action);
  const side = controlsPadRem(scale).side;
  return { left: side + stick + 0.5, right: side + buttons + 0.5 };
}

/** `max(<floor>, env(inset))`-style value for the physical `left` / `right` of an element beside the controls. */
export function sideWithInset(remValue: number, side: "left" | "right", floorRem: number): string {
  return `max(${remValue.toFixed(2)}rem, calc(${(remValue - floorRem).toFixed(2)}rem + env(safe-area-inset-${side}, 0px)))`;
}

/** Inline style for a strip in the middle of a landscape phone, between the stick and the buttons. */
export function landscapeStrip(scale: TouchScale, hasJump = true): { left: string; right: string } {
  const r = landscapeReserveRem(scale, hasJump);
  const floor = controlsPadRem(scale).side;
  return { left: sideWithInset(r.left, "left", floor), right: sideWithInset(r.right, "right", floor) };
}

/** `top` for something placed `baseRem` below the top edge when the top bar's padding is `floorRem`: moves down with the status-bar / notch inset. */
export function topWithInset(baseRem: number, floorRem: number): string {
  return `calc(${baseRem}rem + max(0px, env(safe-area-inset-top, 0px) - ${floorRem}rem))`;
}

/** Horizontal padding that keeps content out of a notch / rounded corner (0 on the web unless the page uses `viewport-fit=cover`). */
export function safePadX(base = "0.75rem"): { paddingLeft: string; paddingRight: string } {
  return { paddingLeft: `max(${base}, env(safe-area-inset-left, 0px))`, paddingRight: `max(${base}, env(safe-area-inset-right, 0px))` };
}

/** Padding on all four sides for a full-screen overlay: at least `base`, and never under a notch, rounded corner or gesture bar. */
export function safePadAll(base = "1rem"): { paddingTop: string; paddingBottom: string; paddingLeft: string; paddingRight: string } {
  return { ...safePadX(base), paddingTop: `max(${base}, env(safe-area-inset-top, 0px))`, paddingBottom: `max(${base}, env(safe-area-inset-bottom, 0px))` };
}

/**
 * How far the on-screen keyboard covers the bottom of the page, from the visual viewport. Browsers that shrink only the
 * visual viewport (Chrome Android with the default `interactive-widget`, iOS Safari) leave fixed bottom sheets behind the
 * keyboard; the sheet lifts itself by this amount. Pinch-zoom also shrinks the visual viewport, so a zoomed page and
 * small differences (browser toolbars) count as "no keyboard".
 */
export function keyboardInset(layoutHeight: number, vv: { height: number; offsetTop: number; scale: number } | null | undefined): number {
  if (!vv || !Number.isFinite(layoutHeight) || !Number.isFinite(vv.height)) return 0;
  if (vv.scale > 1.01) return 0;
  const covered = Math.round(layoutHeight - vv.height - vv.offsetTop);
  return covered >= 120 ? covered : 0;
}

/** Share of the stick's travel that is ignored, so a resting thumb does not make the avatar creep. */
export const STICK_DEADZONE = 0.12;

/** Radial dead zone with rescaling: 0 inside the zone, then a smooth climb to full tilt (a full push is still exactly 1). */
export function applyDeadzone(x: number, y: number, zone = STICK_DEADZONE): { x: number; y: number } {
  const m = Math.hypot(x, y);
  if (!(m > zone)) return { x: 0, y: 0 };
  const k = Math.min(1, (m - zone) / (1 - zone)) / m;
  return { x: x * k, y: y * k };
}

/**
 * The band the objective marker may use: under the top bar (measured by the bar itself) and above the on-screen controls
 * (their size from the touch metrics). Before the bar has reported its size the old fixed band is used.
 */
export function guideInsets(o: { hudBottom: number | undefined; viewportHeight: number; touch: boolean; scale: TouchScale; rootPx?: number }): GuideInsets {
  const rootPx = o.rootPx ?? 16;
  const top = o.hudBottom === undefined || !Number.isFinite(o.hudBottom) ? DEFAULT_GUIDE_INSETS.top : Math.round(o.hudBottom + 14);
  const controls = o.touch ? Math.round((controlsHeightRem(o.scale) + controlsPadRem(o.scale).bottom) * rootPx) + 18 : 72;
  // on a very short screen the controls win the argument: keep a usable band between the two
  const room = o.viewportHeight - top - MIN_BAND_PX;
  const bottom = Math.max(16, Math.min(controls, Number.isFinite(room) ? room : controls));
  return { top, bottom, left: DEFAULT_GUIDE_INSETS.left, right: DEFAULT_GUIDE_INSETS.right };
}
