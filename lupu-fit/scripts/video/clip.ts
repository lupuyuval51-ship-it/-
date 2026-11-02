import { ikSession, lockBends, smooth, type V } from './geom.ts';
import type { ClipMode, Plan } from './classify.ts';
import type { Frame } from './scene.ts';
import { FPS } from './encode.ts';

export const DURATION_SEC = 8;
export const FRAMES = DURATION_SEC * FPS;
export const REPS = 4;

export interface PhaseSample { s: number; u: number; side: 0 | 1 }

/** Repetitions per 8 s loop: bilateral rep clips show 2 slow reps (4 s each), unilateral ones 4 (2 per side), cycles 4. */
export const repsFor = (mode: ClipMode, unilateral: boolean): number => (mode === 'rep' ? (unilateral ? 4 : 2) : REPS);
const ease = (t: number): number => smooth(t);

/**
 * Phase for normalised loop time t in [0,1). Every mode returns to its t=0 state at t=1, so the loop is seamless.
 * Rep profile per rep: 6% rest at the bottom, 34% concentric, 20% pause at the top, 34% eccentric, 6% rest (so the bottom
 * pause is 12% of a rep, the top pause 20%: 0.8 s at the top and 0.5 s at the bottom for a 4 s rep).
 */
export function phaseAt(mode: ClipMode, t: number, unilateral: boolean): PhaseSample {
  const side: 0 | 1 = unilateral && t >= 0.5 ? 1 : 0;
  if (mode === 'rep') {
    const n = repsFor(mode, unilateral);
    const u = (t * n) % 1;
    const s = u < 0.06 ? 0 : u < 0.40 ? ease((u - 0.06) / 0.34) : u < 0.60 ? 1 : u < 0.94 ? 1 - ease((u - 0.60) / 0.34) : 0;
    return { s, u, side };
  }
  if (mode === 'cycle') {
    const u = (t * REPS) % 1;
    return { s: 0.5 - 0.5 * Math.cos(2 * Math.PI * u), u, side };
  }
  if (mode === 'hold') return { s: 0.5 - 0.5 * Math.cos(2 * Math.PI * t), u: t, side };
  // stretch: ease in, hold, ease out
  const s = smooth(Math.min(t / 0.28, 1)) * smooth(Math.min((1 - t) / 0.28, 1));
  return { s, u: t, side };
}

export interface Clip { frames: Frame[]; ghosts: Frame[]; poster: Frame; trail: V[] }

export function buildClip(plan: Plan, unilateral: boolean): Clip {
  const SAMPLES = 9;
  const sampleAt = (k: number) => plan.motion({ s: k / (SAMPLES - 1), u: k / SAMPLES, side: 0 });
  const locked = lockBends(SAMPLES, sampleAt);
  const sides = unilateral ? [0, 1] as const : [0] as const;
  // lock must also cover the second side of unilateral motions
  const lockedAll = locked && unilateral ? lockBends(SAMPLES * 2, (k) => plan.motion({ s: (k % SAMPLES) / (SAMPLES - 1), u: (k % SAMPLES) / SAMPLES, side: sides[Math.floor(k / SAMPLES)] ?? 0 })) : locked;
  if (lockedAll) { ikSession.mode = 'lock'; ikSession.locked = lockedAll; }
  try {
    const frames: Frame[] = [];
    for (let i = 0; i < FRAMES; i++) { ikSession.idx = 0; frames.push(plan.motion(phaseAt(plan.mode, i / FRAMES, unilateral))); }
    ikSession.idx = 0; const lo = plan.motion({ s: 0, u: 0, side: 0 });
    ikSession.idx = 0; const hi = plan.motion({ s: 1, u: 0.5, side: 0 });
    const posterT = plan.mode === 'rep' ? 0.5 / repsFor('rep', unilateral) : plan.mode === 'cycle' ? 0.5 / REPS : 0.5;
    ikSession.idx = 0; const poster = plan.motion(phaseAt(plan.mode, posterT, false));
    return { frames, ghosts: plan.mode === 'hold' ? [] : [lo, hi], poster, trail: implementTrail(frames) };
  } finally { ikSession.mode = 'free'; ikSession.idx = 0; ikSession.locked = []; }
}

/** Path of the first hand-held implement over the loop (empty for bodyweight clips or tiny paths), sampled every 3 frames. */
export function implementTrail(frames: readonly Frame[]): V[] {
  const held = (f: Frame): boolean => f.props.some((p) => p.layer === 'front' && !('far' in p && p.far) && (p.k === 'circle' || p.k === 'rect'));
  if (!frames.every(held)) return [];
  const pts: V[] = [];
  for (let i = 0; i < frames.length; i += 3) { const w = frames[i]!.rig.pts['wristN']; if (w) pts.push(w); }
  let len = 0; for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i]![0] - pts[i - 1]![0], pts[i]![1] - pts[i - 1]![1]);
  return len > 0.35 && len < 6 ? pts : [];
}
