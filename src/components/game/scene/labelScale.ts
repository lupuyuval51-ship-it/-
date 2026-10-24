/**
 * World labels (station and character names) keep a steady size on screen: a fixed share of the viewport height.
 * That is 3.4 % of the camera distance in world units, which is fine on a tall desktop window but leaves a phone held
 * sideways (about 360 px high) with labels around 10 px tall, i.e. text nobody can read. So a label is never smaller than
 * `MIN_LABEL_PX` CSS pixels tall; on windows that are tall enough the original size is unchanged.
 */

/** Height of a label of scale 1 as a share of the distance to the camera (the original, desktop-sized look). */
export const LABEL_BASE_FACTOR = 0.034;
/** Smallest label height on screen, in CSS pixels (about 10.5 px text on the 512x96 label texture). */
export const MIN_LABEL_PX = 22;

/**
 * World height of a label per unit of (clamped) camera distance.
 * A label `h` world units tall at distance `d` is `h / (2 d tan(fov/2)) * viewportHeight` pixels tall.
 */
export function labelHeightFactor(viewportHeightPx: number, fovDeg: number, minPx = MIN_LABEL_PX): number {
  if (!Number.isFinite(viewportHeightPx) || viewportHeightPx <= 0 || !Number.isFinite(fovDeg) || fovDeg <= 0 || fovDeg >= 180) return LABEL_BASE_FACTOR;
  const tan = Math.tan((fovDeg * Math.PI) / 360);
  return Math.max(LABEL_BASE_FACTOR, (2 * minPx * tan) / viewportHeightPx);
}

/** On-screen height (CSS px) of a label of the given scale, for tests and documentation. */
export function labelPixelHeight(factor: number, viewportHeightPx: number, fovDeg: number, scale = 1): number {
  const tan = Math.tan((fovDeg * Math.PI) / 360);
  return (factor * scale * viewportHeightPx) / (2 * tan);
}
