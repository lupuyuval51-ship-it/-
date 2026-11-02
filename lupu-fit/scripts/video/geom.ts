export type V = readonly [number, number];
export const v = (x: number, y: number): V => [x, y];
export const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1]];
export const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1]];
export const mul = (a: V, k: number): V => [a[0] * k, a[1] * k];
export const len = (a: V): number => Math.hypot(a[0], a[1]);
export const norm = (a: V): V => { const l = len(a) || 1; return [a[0] / l, a[1] / l]; };
export const dot = (a: V, b: V): number => a[0] * b[0] + a[1] * b[1];
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const lerpV = (a: V, b: V, t: number): V => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
export const clamp = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x));
export const rad = (deg: number): number => (deg * Math.PI) / 180;

/** Direction measured from straight DOWN, positive toward +x (the facing direction). 0 = down, 90 = forward, 180 = up. */
export const fromDown = (deg: number): V => [Math.sin(rad(deg)), -Math.cos(rad(deg))];
/** Direction measured from straight UP, positive toward +x. Used for the torso. */
export const fromUp = (deg: number): V => [Math.sin(rad(deg)), Math.cos(rad(deg))];

export const smooth = (t: number): number => { const x = clamp(t, 0, 1); return x * x * (3 - 2 * x); };

/**
 * Bend-side bookkeeping. A two-bone chain has two mirror solutions. Picking one per frame from a fixed world-space
 * preference makes joints flip mid-motion whenever the chain rotates past perpendicular to that preference.
 * So the side is chosen ONCE per limb (at the most strongly bent sample of the motion) and locked for the whole clip.
 */
export const ikSession: { mode: 'free' | 'record' | 'lock'; idx: number; rec: { sign: 1 | -1; h: number }[]; locked: (1 | -1)[] } = { mode: 'free', idx: 0, rec: [], locked: [] };

/**
 * Two-bone IK. Returns the middle joint and the ACTUAL end point (clamped to reach so bone lengths stay constant).
 * `pref` is the world direction the joint should bend toward; used to choose the mirror solution (see ikSession).
 */
export function ik(base: V, target: V, l1: number, l2: number, pref: V, joint?: 'knee' | 'elbow'): { mid: V; end: V } {
  const d0 = sub(target, base);
  const reach = l1 + l2 - 1e-4;
  const dMin = Math.abs(l1 - l2) + 1e-4;
  const d = clamp(len(d0), dMin, reach);
  const u = norm(d0);
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const perp: V = [-u[1], u[0]];
  // Anatomy beats the caller's preference: a figure facing +x flexes its knee with the joint on the LEFT of base->end and
  // its elbow on the RIGHT (cross(upper, lower) = -h*s*d), so neither can ever bend backwards.
  const natural: 1 | -1 = joint === 'knee' ? 1 : joint === 'elbow' ? -1 : dot(perp, pref) >= 0 ? 1 : -1;
  let sign = natural;
  const i = ikSession.idx++;
  if (ikSession.mode === 'record') ikSession.rec[i] = { sign: natural, h };
  else if (!joint && ikSession.mode === 'lock' && ikSession.locked[i] !== undefined) sign = ikSession.locked[i] as 1 | -1;
  const mid = add(add(base, mul(u, a)), mul(perp, h * sign));
  const end = add(base, mul(u, d));
  return { mid, end };
}

/**
 * Samples `eval(k)` at the given phases in record mode, then returns the per-call-index sign taken at the most
 * strongly bent sample. If the call count differs between samples the motion is not lockable and `null` is returned.
 */
export function lockBends(phases: number, evalAt: (k: number) => void): (1 | -1)[] | null {
  const runs: { sign: 1 | -1; h: number }[][] = [];
  ikSession.mode = 'record';
  try {
    for (let k = 0; k < phases; k++) { ikSession.idx = 0; ikSession.rec = []; evalAt(k); runs.push([...ikSession.rec]); }
  } finally { ikSession.mode = 'free'; ikSession.idx = 0; }
  const n = runs[0]?.length ?? 0;
  if (n === 0 || runs.some((r) => r.length !== n)) return null;
  const locked: (1 | -1)[] = [];
  for (let i = 0; i < n; i++) {
    let best = runs[0]![i]!;
    for (const r of runs) if (r[i]!.h > best.h) best = r[i]!;
    locked.push(best.sign);
  }
  return locked;
}
