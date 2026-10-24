import type { Layout } from "@/lib/layout";

/** Fraction of the canvas height (from the top) covered by the DOM HUD: top bar, status chips, missions button. */
export function labelSafeTop(layout: Pick<Layout, "landscape" | "shortLandscape">): number {
  if (layout.shortLandscape) return 0.26; // little height: the bar is a large share of it
  if (!layout.landscape) return 0.3; // portrait phone: two HUD rows + missions button
  return 0.22;
}

/** Normalised-device-coordinate margin: a label centred beyond this is too close to the side edges to stay readable. */
export const LABEL_SIDE_LIMIT = 0.8;
/** Width of the fade-out ramp (in NDC units) so a label dims smoothly instead of popping. */
export const LABEL_FADE_BAND = 0.18;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/**
 * 0..1 multiplier for a world label's opacity from its projected position (NDC: x,y in -1..1, y up; z>1 = behind camera).
 * Labels fade near the left/right edges and when they would sit under the HUD band at the top.
 */
export function labelScreenOpacity(ndcX: number, ndcY: number, ndcZ: number, safeTop: number): number {
  if (!Number.isFinite(ndcX + ndcY + ndcZ) || ndcZ > 1 || ndcZ < -1) return 0;
  const side = clamp01((LABEL_SIDE_LIMIT + LABEL_FADE_BAND - Math.abs(ndcX)) / LABEL_FADE_BAND);
  // screen fraction measured from the top: 0 = top edge, 1 = bottom edge
  const fromTop = (1 - ndcY) / 2;
  const top = clamp01((fromTop - safeTop * 0.75) / (safeTop * 0.25));
  const bottom = clamp01((1 + 0.05 - fromTop) / 0.05);
  return side * top * bottom;
}
