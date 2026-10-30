/**
 * Biomechanical / geometric QA for the built-in exercise animations.
 * Pure functions (no I/O): used by `scripts/animation-qa.ts`, the unit tests and the manifest check.
 *
 * Joint angles are measured in the figure's own sagittal plane (side view): flexion is positive,
 * negative values are hyperextension. In the front view only unsigned angles are meaningful, so
 * hyperextension is not evaluated there.
 */
import { BODY, CANVAS, computeFrame, loopTravel, segmentProgress, type Joints } from './engine';
import type { ExerciseAnimation, LimbSpec, Vec } from './types';

export const QA_VERSION = 1;

/** Maximum comfortable flexion (degrees) and permitted hyperextension. */
export const ROM_LIMITS = {
  knee: { flex: 142, ext: 5 },
  hip: { flex: 134, ext: 15 },
  shoulder: { flex: 172, ext: 60 },
  elbow: { flex: 150, ext: 5 },
} as const;
export type RomJoint = keyof typeof ROM_LIMITS;

export const REACH_TOLERANCE = 1.5;
export const POP_FACTOR = 4;
export const SIMILARITY_LIMIT = 0.98;
const PENETRATION_TOLERANCE = 1.5;

export type QaCheck = 'rom' | 'reach' | 'pop' | 'penetration' | 'unique';

export interface QaIssue {
  check: QaCheck;
  /** Short stable key (used by exceptions and the baseline), e.g. `rom.elbow.flex`. */
  key: string;
  detail: string;
}

export interface QaException {
  /** Issue key this exception covers, e.g. `rom.knee.flex`. */
  key: string;
  /** Highest accepted absolute value (degrees / units). Findings beyond it still fail. */
  limit: number;
  reason: string;
}

export interface AnimationQa {
  id: string;
  view: 'side' | 'front';
  /** Peak joint angles over the loop. */
  rom: Record<RomJoint, { maxFlex: number; maxExt: number }>;
  maxReachError: number;
  maxPopRatio: number;
  maxPopStep: number;
  maxPenetration: number;
  issues: QaIssue[];
}

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
const sub = (a: Vec, b: Vec): Vec => [a[0] - b[0], a[1] - b[1]];
const len = (a: Vec) => Math.hypot(a[0], a[1]);
const dist = (a: Vec, b: Vec) => len(sub(a, b));
const wrap180 = (a: number) => ((((a + 180) % 360) + 360) % 360) - 180;
const norm = (a: number, lo: number) => ((((a - lo) % 360) + 360) % 360) + lo;

/** Angle (deg from straight down, + toward facing) of a vector. */
function fromDown(v: Vec, facing: 1 | -1): number {
  return deg(Math.atan2(v[0] * facing, v[1]));
}
function angleBetween(a: Vec, b: Vec): number {
  const d = len(a) * len(b) || 1;
  return deg(Math.acos(Math.min(1, Math.max(-1, (a[0] * b[0] + a[1] * b[1]) / d))));
}

/** Signed flexion angles for one side of the body. */
export function jointAngles(j: Joints, side: 'near' | 'far', front: boolean, facing: 1 | -1): Record<RomJoint, number> {
  const sh = side === 'near' ? j.shoulderNear : j.shoulderFar;
  const el = side === 'near' ? j.elbowNear : j.elbowFar;
  const wr = side === 'near' ? j.wristNear : j.wristFar;
  const hp = side === 'near' ? j.hipNear : j.hipFar;
  const kn = side === 'near' ? j.kneeNear : j.kneeFar;
  const an = side === 'near' ? j.ankleNear : j.ankleFar;
  const trunkUp = sub(j.shoulder, j.hip);
  const trunkDown: Vec = [-trunkUp[0], -trunkUp[1]];
  if (front) {
    return {
      knee: 180 - angleBetween(sub(hp, kn), sub(an, kn)),
      hip: 180 - angleBetween(trunkUp, sub(kn, hp)),
      shoulder: angleBetween(trunkDown, sub(el, sh)),
      elbow: 180 - angleBetween(sub(sh, el), sub(wr, el)),
    };
  }
  const tau = fromDown([-trunkUp[0], -trunkUp[1]], facing) * -1; // torso lean from vertical, + forward
  const thigh = fromDown(sub(kn, hp), facing);
  const shin = fromDown(sub(an, kn), facing);
  const upper = fromDown(sub(el, sh), facing);
  const fore = fromDown(sub(wr, el), facing);
  return {
    knee: wrap180(thigh - shin),
    hip: wrap180(tau + thigh),
    shoulder: norm(upper + tau, -120),
    elbow: wrap180(fore - upper),
  };
}

// ------------------------------------------------------------------ IK reach

function mirrorX(v: Vec, c: number): Vec {
  return [2 * c - v[0], v[1]];
}

type Limb = 'armNear' | 'armFar' | 'legNear' | 'legFar';

function limbSpecOf(pose: ExerciseAnimation['keyframes'][number]['pose'], limb: Limb, front: boolean): LimbSpec | undefined {
  if (limb === 'armNear') return pose.armNear;
  if (limb === 'legNear') return pose.legNear;
  if (limb === 'armFar') return pose.armFar ?? (front ? pose.armNear : pose.armNear);
  return pose.legFar ?? pose.legNear;
}

/** Reach error (units) of every IK-targeted limb, sampled at `samples` loop times. */
function reachErrors(anim: ExerciseAnimation, samples: number[]): { worst: number; at: string } {
  const front = anim.view === 'front';
  const kfs = anim.keyframes;
  let worst = 0;
  let at = '';
  for (const t of samples) {
    const seg = segmentProgress(anim, t);
    const a = kfs[seg.index]!;
    const b = kfs[seg.index + 1]!;
    const eased = seg.local;
    const j = computeFrame(anim, t).joints;
    for (const limb of ['armNear', 'armFar', 'legNear', 'legFar'] as Limb[]) {
      const sa = limbSpecOf(a.pose, limb, front);
      const sb = limbSpecOf(b.pose, limb, front);
      if (!sa || !sb || !('target' in sa) || !('target' in sb)) continue;
      const mir = front && (limb === 'armFar' || limb === 'legFar') && (limb === 'armFar' ? !a.pose.armFar : !a.pose.legFar);
      const ta = mir ? mirrorX(sa.target, a.pose.hip[0]) : sa.target;
      const tb = mir ? mirrorX(sb.target, b.pose.hip[0]) : sb.target;
      const target: Vec = [ta[0] + (tb[0] - ta[0]) * eased, ta[1] + (tb[1] - ta[1]) * eased];
      const end = limb === 'armNear' ? j.wristNear : limb === 'armFar' ? j.wristFar : limb === 'legNear' ? j.ankleNear : j.ankleFar;
      const err = dist(target, end);
      if (err > worst) {
        worst = err;
        at = `${limb}@t=${t.toFixed(2)}`;
      }
    }
  }
  return { worst, at };
}

// ------------------------------------------------------------------ sampling

const TRACKED: (keyof Joints)[] = ['hip', 'shoulder', 'neckTop', 'elbowNear', 'elbowFar', 'wristNear', 'wristFar', 'kneeNear', 'kneeFar', 'ankleNear', 'ankleFar'];

export function sampleTimes(anim: ExerciseAnimation, n = 180): number[] {
  const set = new Set<number>();
  for (let i = 0; i < n; i++) set.add(i / n);
  for (const k of anim.keyframes) if (k.t < 1) set.add(k.t);
  return [...set].sort((a, b) => a - b);
}

export function trajectory(anim: ExerciseAnimation, times: number[]): Vec[][] {
  return times.map((t) => {
    const j = computeFrame(anim, t).joints;
    return TRACKED.map((k) => j[k]);
  });
}

function median(xs: number[]): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)]!;
}

/** Largest single-step joint jump relative to the median step (a pop is a ratio above POP_FACTOR). */
export function popStats(anim: ExerciseAnimation, n = 240): { ratio: number; step: number; at: string } {
  const times = Array.from({ length: n }, (_, i) => i / n);
  const traj = trajectory(anim, times);
  const travel = anim.camera?.followX ? loopTravel(anim) : 0;
  const steps: { d: number; at: string }[] = [];
  for (let i = 0; i < n; i++) {
    const a = traj[i]!;
    const b = traj[(i + 1) % n]!;
    for (let k = 0; k < TRACKED.length; k++) {
      const wrapStep = i === n - 1;
      const bx = wrapStep ? b[k]![0] + travel : b[k]![0];
      steps.push({ d: Math.hypot(bx - a[k]![0], b[k]![1] - a[k]![1]), at: `${TRACKED[k]}@t=${times[i]!.toFixed(2)}` });
    }
  }
  // Each joint is compared with its own typical step (distal joints legitimately move faster than proximal ones).
  let worst = { ratio: 0, step: 0, at: '' };
  for (let k = 0; k < TRACKED.length; k++) {
    const mine = steps.filter((_, i) => i % TRACKED.length === k);
    const med = median(mine.map((s) => s.d).filter((d) => d > 0.02));
    if (!(med > 0)) continue;
    for (const s of mine) if (s.d / med > worst.ratio && s.d > 1) worst = { ratio: s.d / med, step: s.d, at: s.at };
  }
  return { ratio: worst.ratio, step: worst.step, at: worst.at };
}

// ------------------------------------------------------------------ penetration

/** Deepest penetration (units) of the body or carried loads into the floor, benches, boxes or seats. */
function penetration(anim: ExerciseAnimation, times: number[]): { depth: number; at: string } {
  let worst = 0;
  let at = '';
  const props = anim.props ?? [];
  const benches = props.filter((p): p is Extract<typeof p, { kind: 'bench' }> => p.kind === 'bench');
  const boxes = props.filter((p): p is Extract<typeof p, { kind: 'box' }> => p.kind === 'box');
  // Mats are drawn 3 units thick on top of the floor line; the body is authored against the floor line itself.
  const floorY = CANVAS.floor;
  const note = (d: number, label: string) => {
    if (d > worst) {
      worst = d;
      at = label;
    }
  };
  for (const t of times) {
    const f = computeFrame(anim, t);
    for (const s of f.segments) {
      if (s.part === 'foot') continue;
      for (const p of [s.a, s.b]) {
        // Skip a segment's joint on the surface it is deliberately touching only via tolerance.
        note(p[1] + s.w / 2 - floorY, `${s.part}/${s.side} floor@t=${t.toFixed(2)}`);
        for (const b of benches) {
          if (p[0] >= b.x && p[0] <= b.x + b.w && (s.part === 'torso' || s.part === 'thigh' || s.part === 'neck')) note(p[1] + s.w / 2 - b.y, `${s.part} bench@t=${t.toFixed(2)}`);
        }
        for (const bx of boxes) {
          if (p[0] >= bx.x && p[0] <= bx.x + bx.w && p[1] > bx.y - 40 && s.part !== 'hand' && s.part !== 'forearm' && s.part !== 'upperArm') note(p[1] + s.w / 2 - bx.y, `${s.part} box@t=${t.toFixed(2)}`);
        }
      }
    }
    note(f.head.c[1] + f.head.r - floorY, `head floor@t=${t.toFixed(2)}`);
    for (const sh of f.props) {
      if (sh.layer === 'back' && sh.type !== 'circle') continue;
      if (sh.type === 'circle' && (sh.tone === 'plate' || sh.tone === 'ball' || sh.tone === 'rubber')) note(sh.c[1] + sh.r - floorY, `${sh.tone} floor@t=${t.toFixed(2)}`);
      if (sh.type === 'rect' && sh.tone === 'plate' && !sh.rotate) note(sh.y + sh.h - floorY, `plate floor@t=${t.toFixed(2)}`);
    }
  }
  return { depth: worst, at };
}

// ------------------------------------------------------------------ analysis

export function analyzeAnimation(anim: ExerciseAnimation, exceptions: QaException[] = []): AnimationQa {
  const front = anim.view === 'front';
  const facing = anim.facing ?? 1;
  const times = sampleTimes(anim);
  const rom: AnimationQa['rom'] = {
    knee: { maxFlex: -999, maxExt: 0 },
    hip: { maxFlex: -999, maxExt: 0 },
    shoulder: { maxFlex: -999, maxExt: 0 },
    elbow: { maxFlex: -999, maxExt: 0 },
  };
  for (const t of times) {
    const j = computeFrame(anim, t).joints;
    for (const side of ['near', 'far'] as const) {
      const a = jointAngles(j, side, front, facing);
      for (const k of Object.keys(rom) as RomJoint[]) {
        rom[k].maxFlex = Math.max(rom[k].maxFlex, a[k]);
        rom[k].maxExt = Math.max(rom[k].maxExt, -a[k]);
      }
    }
  }
  const reach = reachErrors(anim, times);
  const pop = popStats(anim);
  const pen = penetration(anim, times);
  const issues: QaIssue[] = [];
  const allowed = (key: string, value: number) => exceptions.find((e) => e.key === key && value <= e.limit);
  for (const k of Object.keys(rom) as RomJoint[]) {
    const lim = ROM_LIMITS[k];
    if (rom[k].maxFlex > lim.flex + 0.5 && !allowed(`rom.${k}.flex`, rom[k].maxFlex)) issues.push({ check: 'rom', key: `rom.${k}.flex`, detail: `${k} flexion ${rom[k].maxFlex.toFixed(0)}° > ${lim.flex}°` });
    if (!front && rom[k].maxExt > lim.ext + 0.5 && !allowed(`rom.${k}.ext`, rom[k].maxExt)) issues.push({ check: 'rom', key: `rom.${k}.ext`, detail: `${k} hyperextension ${rom[k].maxExt.toFixed(0)}° > ${lim.ext}°` });
  }
  if (reach.worst > REACH_TOLERANCE && !allowed('reach', reach.worst)) issues.push({ check: 'reach', key: 'reach', detail: `IK reach error ${reach.worst.toFixed(1)} units (${reach.at})` });
  if (pop.ratio > POP_FACTOR && pop.step > 1 && !allowed('pop', pop.ratio)) issues.push({ check: 'pop', key: 'pop', detail: `joint jump ${pop.step.toFixed(1)} units = ${pop.ratio.toFixed(1)}x median step (${pop.at})` });
  if (pen.depth > PENETRATION_TOLERANCE && !allowed('penetration', pen.depth)) issues.push({ check: 'penetration', key: 'penetration', detail: `penetration ${pen.depth.toFixed(1)} units (${pen.at})` });
  return {
    id: anim.id,
    view: front ? 'front' : 'side',
    rom,
    maxReachError: reach.worst,
    maxPopRatio: pop.ratio,
    maxPopStep: pop.step,
    maxPenetration: pen.depth,
    issues,
  };
}

// ------------------------------------------------------------------ uniqueness

/** Motion signature: centred joint trajectories over the loop (facing normalised to +x) plus the mean pose. */
export interface MotionSignature {
  centred: number[];
  mean: number[];
}

export function motionSignature(anim: ExerciseAnimation, n = 48): MotionSignature {
  const times = Array.from({ length: n }, (_, i) => i / n);
  const facing = anim.facing ?? 1;
  const traj = trajectory(anim, times);
  const dims = TRACKED.length * 2;
  const mean = new Array<number>(dims).fill(0);
  for (const frame of traj) frame.forEach((p, k) => { mean[k * 2]! += (p[0] * facing) / n; mean[k * 2 + 1]! += p[1] / n; });
  const centred: number[] = [];
  for (const frame of traj) frame.forEach((p, k) => { centred.push(p[0] * facing - mean[k * 2]!, p[1] - mean[k * 2 + 1]!); });
  return { centred, mean };
}

/**
 * Similarity 0..1: cosine of the centred trajectories (same movement shape), damped when the
 * amplitudes differ, and when the average posture differs by more than ~4 units (a different bench angle,
 * stance or camera reads as a visibly different demo even if the stroke is the same).
 */
export function similarity(a: MotionSignature, b: MotionSignature): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.centred.length; i++) {
    dot += a.centred[i]! * b.centred[i]!;
    na += a.centred[i]! * a.centred[i]!;
    nb += b.centred[i]! * b.centred[i]!;
  }
  let meanSq = 0;
  for (let i = 0; i < a.mean.length; i++) meanSq += (a.mean[i]! - b.mean[i]!) ** 2;
  const rms = Math.sqrt(meanSq / (a.mean.length / 2));
  const posture = rms <= 4 ? 1 : Math.max(0, 1 - (rms - 4) / 20);
  if (na < 1e-6 || nb < 1e-6) return na < 1e-6 && nb < 1e-6 ? posture : 0;
  const ratio = Math.min(na, nb) / Math.max(na, nb);
  return (dot / Math.sqrt(na * nb)) * Math.sqrt(ratio) * posture;
}

export interface SimilarPair {
  a: string;
  b: string;
  similarity: number;
}

export function similarPairs(anims: ExerciseAnimation[], limit = SIMILARITY_LIMIT): SimilarPair[] {
  const sigs = anims.map((a) => ({ a, sig: motionSignature(a), view: a.view ?? 'side' }));
  const out: SimilarPair[] = [];
  for (let i = 0; i < sigs.length; i++) {
    for (let j = i + 1; j < sigs.length; j++) {
      if (sigs[i]!.view !== sigs[j]!.view) continue;
      const s = similarity(sigs[i]!.sig, sigs[j]!.sig);
      if (s >= limit) out.push({ a: sigs[i]!.a.id, b: sigs[j]!.a.id, similarity: s });
    }
  }
  return out.sort((x, y) => y.similarity - x.similarity);
}

/** The visible elements of an animation (prop kinds + view), used to judge `sharedMotionWith` pairs. */
export function visualSignature(anim: ExerciseAnimation): string {
  const kinds = (anim.props ?? []).map((p) => p.kind).sort();
  return `${anim.view ?? 'side'}|${kinds.join(',')}`;
}

export const _internal = { rad, BODY };

/** Authoring aid: per-keyframe angles, reach errors and key joint positions. */
export function describeKeyframes(anim: ExerciseAnimation): string[] {
  const front = anim.view === 'front';
  const facing = anim.facing ?? 1;
  const out: string[] = [];
  for (const k of anim.keyframes) {
    const f = computeFrame(anim, k.t >= 1 ? 0 : k.t);
    const j = f.joints;
    const a = jointAngles(j, 'near', front, facing);
    const r = reachErrors(anim, [k.t >= 1 ? 0.99999 : k.t]);
    const p = (v: Vec) => `(${v[0].toFixed(0)},${v[1].toFixed(0)})`;
    out.push(`t=${k.t.toFixed(2)} hip${p(j.hip)} sh${p(j.shoulder)} wrist${p(j.wristNear)} ankle${p(j.ankleNear)} | knee ${a.knee.toFixed(0)} hip ${a.hip.toFixed(0)} shoulder ${a.shoulder.toFixed(0)} elbow ${a.elbow.toFixed(0)} | reach ${r.worst.toFixed(1)} ${r.at}`);
  }
  return out;
}
