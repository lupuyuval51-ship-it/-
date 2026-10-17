/**
 * The part of the screen the objective marker may sit in. The marker is pinned to the edge of this band when its target is
 * off screen, so the band has to stay clear of the HUD: below the top bar and above the on-screen controls. Distances are
 * CSS pixels from each screen edge.
 */
export interface GuideInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/** What the band was before the HUD reported its size (portrait phone with a one-row top bar). */
export const DEFAULT_GUIDE_INSETS: GuideInsets = { top: 132, bottom: 120, left: 28, right: 28 };

/** The band never gets thinner than this, however much HUD there is (tiny screens). */
export const MIN_BAND_PX = 80;

export interface MarkerBand {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/**
 * Edges of the band for a viewport. `markerWidth` is the marker's current width (arrow + distance label): the band
 * shrinks by half of it on each side so the whole label stays on screen when the marker is pinned to a side edge.
 */
export function markerBand(width: number, height: number, insets: GuideInsets, markerWidth = 0): MarkerBand {
  const half = Math.max(0, markerWidth) / 2 + 6;
  const left = Math.min(Math.max(insets.left, half), width / 2 - 1);
  const right = Math.max(width - Math.max(insets.right, half), width / 2 + 1);
  const top = insets.top;
  const bottom = Math.max(height - insets.bottom, top + MIN_BAND_PX);
  return { left, right, top, bottom };
}
