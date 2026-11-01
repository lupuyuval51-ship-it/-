import { ikSession, lockBends, smooth } from './geom.ts';
import type { ClipMode, Plan } from './classify.ts';
import type { Frame } from './scene.ts';
import { FPS } from './encode.ts';

export const DURATION_SEC = 8;
export const FRAMES = DURATION_SEC * FPS;
const REPS = 4;

export interface PhaseSample { s: number; u: number; side: 0 | 1 }

/** Phase for normalised loop time t in [0,1). Every mode returns to its t=0 state at t=1, so the loop is seamless. */
export function phaseAt(mode: ClipMode, t: number, unilateral: boolean): PhaseSample {
  const side: 0 | 1 = unilateral && t >= 0.5 ? 1 : 0;
  if (mode === 'rep') {
    const u = (t * REPS) % 1;
    return { s: 0.5 - 0.5 * Math.cos(2 * Math.PI * u), u, side };
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

export interface Clip { frames: Frame[]; ghosts: Frame[]; poster: Frame }

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
    const posterT = plan.mode === 'rep' || plan.mode === 'cycle' ? 0.5 / REPS : 0.5;
    ikSession.idx = 0; const poster = plan.motion(phaseAt(plan.mode, posterT, false));
    return { frames, ghosts: plan.mode === 'hold' ? [] : [lo, hi], poster };
  } finally { ikSession.mode = 'free'; ikSession.idx = 0; ikSession.locked = []; }
}
