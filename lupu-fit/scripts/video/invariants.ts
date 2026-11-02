import type { Frame } from './scene.ts';
import type { V } from './geom.ts';

const cross = (a: V, b: V): number => a[0] * b[1] - a[1] * b[0];
const unit = (a: V, b: V): V => { const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; };

/**
 * Side-view rigs face +x, so a knee flexes with cross(thigh, shank) < 0 and an elbow with cross(upperArm, foreArm) > 0
 * (sin of the joint's flexion angle). Hyperextension is the opposite sign beyond `tol` (default sin 10 deg).
 * Returns the worst hyperextension (sin units, 0 if none) for knees and elbows over the given frames.
 */
export function worstHyperextension(frames: readonly Frame[], tol = 0.17): { knee: number; elbow: number } {
  let knee = 0; let elbow = 0;
  for (const f of frames) {
    const s = f.rig.segs;
    if (s.length !== 13 || s[0]!.part !== 'upperArm') continue; // front-view rigs have no sagittal joint definition
    const j = (i: number, k: number, sign: 1 | -1): number => { const a = s[i]!; const b = s[k]!; return -sign * cross(unit(a.a, a.b), unit(b.a, b.b)); };
    // indexes follow sideRig(): far arm 0/1, far leg 2/3, near leg 8/9, near arm 11/12
    for (const [i, k] of [[2, 3], [8, 9]] as const) knee = Math.max(knee, j(i, k, -1) - tol);
    for (const [i, k] of [[0, 1], [11, 12]] as const) elbow = Math.max(elbow, j(i, k, 1) - tol);
  }
  return { knee: Math.max(0, knee), elbow: Math.max(0, elbow) };
}
