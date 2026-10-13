import type { WorldBox } from "../world/types";

/** Running entry/exit parameters of the ray inside the slabs tested so far (module scratch: the function is synchronous). */
const slab = { tmin: 0, tmax: 0 };

/**
 * Narrows `slab` by one axis of the ray / AABB test. Returns false when the ray cannot hit the box (parallel and outside
 * the slab, or the entry parameter passed the exit parameter).
 */
function clipSlab(o: number, d: number, lo: number, hi: number): boolean {
  if (Math.abs(d) < 1e-9) return !(o < lo || o > hi);
  let t1 = (lo - o) / d;
  let t2 = (hi - o) / d;
  if (t1 > t2) {
    const swap = t1;
    t1 = t2;
    t2 = swap;
  }
  slab.tmin = Math.max(slab.tmin, t1);
  slab.tmax = Math.min(slab.tmax, t2);
  return !(slab.tmin > slab.tmax);
}

/**
 * How far along a ray (from → from + dir·maxDist) a third-person camera may travel before it would clip through
 * solid geometry. Slab-method ray / AABB test; closed gates count, open ones do not.
 *
 * Runs every frame against every solid box, so it allocates nothing (the earlier version built four arrays per box).
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
  for (let i = 0; i < boxes.length; i++) {
    const b = boxes[i]!;
    if (!b.solid || b.kind === "floor") continue;
    if (b.kind === "gate" && b.gateId && isOpenGate(b.gateId)) continue;
    slab.tmin = 0;
    slab.tmax = best;
    const hit = clipSlab(from.x, dir.x, b.x0, b.x1) && clipSlab(from.y, dir.y, b.y0, b.y1) && clipSlab(from.z, dir.z, b.z0, b.z1);
    if (hit && slab.tmin < best) best = slab.tmin;
  }
  return Math.max(Math.min(minDist, maxDist), best - 0.35);
}
