import { TOUCH_METRICS, type TouchScale } from "@/lib/layout";

/**
 * Where the HUD may put things so they never sit on top of the on-screen controls.
 *
 * The sizes come from `TOUCH_METRICS` (the single source for the joystick and button sizes), so changing a control size
 * moves the prompt and the first-run card with it. Everything is pure and unit-tested; the components only turn the
 * numbers into inline styles. Safe-area insets (notch, rounded corners, gesture bar) are folded in with `env()`.
 */

/** The touch controls keep at least this much room at the sides / bottom (see TouchControls). */
export const CONTROLS_SIDE_FLOOR_REM = 0.75;
export const CONTROLS_BOTTOM_FLOOR_REM = 0.5;

const rem = (cls: string, prefix: string): number => {
  const n = Number(new RegExp(`${prefix}-(\\d+(?:\\.\\d+)?)`).exec(cls)?.[1] ?? 0);
  return n / 4; // Tailwind spacing unit: 1 = 0.25rem
};
const sizeRem = (cls: string) => rem(cls, "size");
const gapRem = (cls: string) => rem(cls, "gap");

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
  return `calc(${(controlsHeightRem(scale) + gap).toFixed(2)}rem + max(${CONTROLS_BOTTOM_FLOOR_REM}rem, env(safe-area-inset-bottom, 0px)))`;
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
  return { left: CONTROLS_SIDE_FLOOR_REM + stick + 0.5, right: CONTROLS_SIDE_FLOOR_REM + buttons + 0.5 };
}

/** `max(<floor>, env(inset))`-style value for the physical `left` / `right` of an element beside the controls. */
export function sideWithInset(remValue: number, side: "left" | "right"): string {
  return `max(${remValue.toFixed(2)}rem, calc(${(remValue - CONTROLS_SIDE_FLOOR_REM).toFixed(2)}rem + env(safe-area-inset-${side}, 0px)))`;
}

/** Inline style for a strip in the middle of a landscape phone, between the stick and the buttons. */
export function landscapeStrip(scale: TouchScale, hasJump = true): { left: string; right: string } {
  const r = landscapeReserveRem(scale, hasJump);
  return { left: sideWithInset(r.left, "left"), right: sideWithInset(r.right, "right") };
}

/** `top` for something placed `baseRem` below the top edge when the top bar's padding is `floorRem`: moves down with the status-bar / notch inset. */
export function topWithInset(baseRem: number, floorRem: number): string {
  return `calc(${baseRem}rem + max(0px, env(safe-area-inset-top, 0px) - ${floorRem}rem))`;
}

/** Horizontal padding that keeps content out of a notch / rounded corner (0 on the web unless the page uses `viewport-fit=cover`). */
export function safePadX(base = "0.75rem"): { paddingLeft: string; paddingRight: string } {
  return { paddingLeft: `max(${base}, env(safe-area-inset-left, 0px))`, paddingRight: `max(${base}, env(safe-area-inset-right, 0px))` };
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
