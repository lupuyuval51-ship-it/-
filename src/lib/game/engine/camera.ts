import type { WorldBox } from "../world/types";

/**
 * How far along a ray (from → from + dir·maxDist) a third-person camera may travel before it would clip through
 * solid geometry. Slab-method ray / AABB test; closed gates count, open ones do not.
 */
export function clipCameraDistance(
  boxes: readonly WorldBox[],
  from: { x: number; y: number; z: number },
  dir: { x: number; y: number; z: number },
  maxDist: number,
  isOpenGate: (id: string) => boolean,
  minDist = 1.6,
): number {
  let best = maxDist;
  for (const b of boxes) {
    if (!b.solid || b.kind === "floor") continue;
    if (b.kind === "gate" && b.gateId && isOpenGate(b.gateId)) continue;
    let tmin = 0;
    let tmax = best;
    let hit = true;
    for (const [o, d, lo, hi] of [
      [from.x, dir.x, b.x0, b.x1],
      [from.y, dir.y, b.y0, b.y1],
      [from.z, dir.z, b.z0, b.z1],
    ] as const) {
      if (Math.abs(d) < 1e-9) {
        if (o < lo || o > hi) {
          hit = false;
          break;
        }
      } else {
        let t1 = (lo - o) / d;
        let t2 = (hi - o) / d;
        if (t1 > t2) [t1, t2] = [t2, t1];
        tmin = Math.max(tmin, t1);
        tmax = Math.min(tmax, t2);
        if (tmin > tmax) {
          hit = false;
          break;
        }
      }
    }
    if (hit && tmin < best) best = tmin;
  }
  return Math.max(Math.min(minDist, maxDist), best - 0.35);
}
