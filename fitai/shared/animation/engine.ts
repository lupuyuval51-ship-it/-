/**
 * Pure animation engine: turns an ExerciseAnimation + time into drawable geometry.
 * No DOM access — used by the React renderer and by the offline contact-sheet renderer.
 */
import type { Muscle } from '../constants';
import type { ExerciseAnimation, Keyframe, LimbSpec, Pose, Prop, Vec } from './types';

export const CANVAS = { w: 240, h: 200, floor: 188 } as const;

/** Segment lengths (viewBox units, ~1 unit ≈ 1.1 cm for a 180 cm person). */
export const BODY = {
  torso: 52,
  neck: 7,
  headR: 9.5,
  upperArm: 30,
  forearm: 27,
  hand: 5,
  thigh: 42,
  shin: 40,
  foot: 14,
  heel: 3,
  ankleHeight: 4,
  shoulderHalf: 14, // front view
  hipHalf: 9, // front view
} as const;

/** Hip height of a person standing upright on the floor. */
export const STAND_HIP_Y = CANVAS.floor - BODY.ankleHeight - BODY.shin - BODY.thigh;

export type BodyPart = 'torso' | 'neck' | 'upperArm' | 'forearm' | 'hand' | 'thigh' | 'shin' | 'foot';
export type Side = 'near' | 'far' | 'center';

export interface Segment {
  a: Vec;
  b: Vec;
  w: number;
  part: BodyPart;
  side: Side;
  highlight: boolean;
}

export type Tone = 'metal' | 'plate' | 'pad' | 'wood' | 'band' | 'cable' | 'rubber' | 'frame' | 'ball' | 'floorMark';

export type PropShape =
  | { type: 'line'; a: Vec; b: Vec; w: number; tone: Tone; dash?: string; layer: 'back' | 'front' }
  | { type: 'circle'; c: Vec; r: number; tone: Tone; layer: 'back' | 'front' }
  | { type: 'rect'; x: number; y: number; w: number; h: number; rx?: number; tone: Tone; rotate?: { deg: number; cx: number; cy: number }; layer: 'back' | 'front' }
  | { type: 'path'; d: string; tone: Tone; fill?: boolean; w?: number; layer: 'back' | 'front' };

export interface Frame {
  segments: Segment[];
  /** Highlight overlays (muscle emphasis) drawn above the body. */
  overlays: { a: Vec; b: Vec; w: number }[];
  overlayDots: { c: Vec; r: number }[];
  head: { c: Vec; r: number; highlight: boolean };
  joints: Joints;
  props: PropShape[];
  shadow: { cx: number; cy: number; rx: number; opacity: number };
}

export interface Joints {
  hip: Vec;
  shoulder: Vec;
  neckTop: Vec;
  hipNear: Vec;
  hipFar: Vec;
  shoulderNear: Vec;
  shoulderFar: Vec;
  elbowNear: Vec;
  elbowFar: Vec;
  wristNear: Vec;
  wristFar: Vec;
  handNear: Vec;
  handFar: Vec;
  kneeNear: Vec;
  kneeFar: Vec;
  ankleNear: Vec;
  ankleFar: Vec;
  toeNear: Vec;
  toeFar: Vec;
  heelNear: Vec;
  heelFar: Vec;
}

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
const add = (a: Vec, b: Vec): Vec => [a[0] + b[0], a[1] + b[1]];
const scale = (a: Vec, s: number): Vec => [a[0] * s, a[1] * s];
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpVec = (a: Vec, b: Vec, t: number): Vec => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const dist = (a: Vec, b: Vec) => Math.hypot(b[0] - a[0], b[1] - a[1]);

/** Direction of a limb angle (0 = down, + = toward facing direction). */
function limbDir(angle: number, facing: 1 | -1): Vec {
  return [Math.sin(rad(angle)) * facing, Math.cos(rad(angle))];
}
/** Inverse of limbDir. */
function limbAngle(v: Vec, facing: 1 | -1): number {
  return deg(Math.atan2(v[0] * facing, v[1]));
}
/** Direction of the torso (0 = up, + = leaning toward facing direction). */
function torsoDir(angle: number, facing: 1 | -1): Vec {
  return [Math.sin(rad(angle)) * facing, -Math.cos(rad(angle))];
}

function ease(kind: Keyframe['ease'], t: number): number {
  switch (kind) {
    case 'linear':
      return t;
    case 'in':
      return t * t;
    case 'out':
      return 1 - (1 - t) * (1 - t);
    default:
      return 0.5 - Math.cos(Math.PI * t) / 2;
  }
}

/** Two-bone IK: returns the middle joint for a chain base→target with lengths a, b. */
function solveIk(base: Vec, target: Vec, a: number, b: number, bend: 1 | -1): { mid: Vec; end: Vec } {
  const dx = target[0] - base[0];
  const dy = target[1] - base[1];
  const raw = Math.hypot(dx, dy) || 0.0001;
  const d = Math.min(a + b - 0.001, Math.max(Math.abs(a - b) + 0.001, raw));
  const theta = Math.atan2(dy, dx);
  const cosA = Math.min(1, Math.max(-1, (a * a + d * d - b * b) / (2 * a * d)));
  const alpha = Math.acos(cosA);
  const ang = theta + bend * alpha;
  const mid: Vec = [base[0] + a * Math.cos(ang), base[1] + a * Math.sin(ang)];
  const end: Vec = [base[0] + (dx / raw) * d, base[1] + (dy / raw) * d];
  return { mid, end };
}

interface ResolvedLimb {
  angles: [number, number];
  target?: Vec;
  bend?: 1 | -1;
}

function resolveLimb(spec: LimbSpec, base: Vec, a: number, b: number, facing: 1 | -1, defaultBend: 1 | -1): ResolvedLimb {
  if ('angles' in spec) return { angles: spec.angles };
  const bend = (-(spec.bend ?? defaultBend) * facing) as 1 | -1;
  const { mid, end } = solveIk(base, spec.target, a, b, bend);
  return {
    angles: [limbAngle([mid[0] - base[0], mid[1] - base[1]], facing), limbAngle([end[0] - mid[0], end[1] - mid[1]], facing)],
    target: spec.target,
    bend: spec.bend ?? defaultBend,
  };
}

/** Shortest angular interpolation. */
function lerpAngle(a: number, b: number, t: number): number {
  let d = ((b - a + 540) % 360) - 180;
  if (d === -180 && b > a) d = 180;
  return a + d * t;
}

function mirrorSpec(spec: LimbSpec, center: number): LimbSpec {
  if ('angles' in spec) return spec;
  return { target: [2 * center - spec.target[0], spec.target[1]], bend: spec.bend };
}

interface Skeleton {
  joints: Joints;
}

function buildSkeleton(anim: ExerciseAnimation, from: Pose, to: Pose, t: number): Skeleton {
  const facing = anim.facing ?? 1;
  const front = anim.view === 'front';
  const hip = lerpVec(from.hip, to.hip, t);
  const torso = lerpAngle(from.torso, to.torso, t);
  const tDir = front ? torsoDir(torso, 1) : torsoDir(torso, facing);
  const shoulder = add(hip, scale(tDir, BODY.torso));
  const headTilt = lerp(from.head ?? 0, to.head ?? 0, t);
  const nDir = front ? torsoDir(torso + headTilt, 1) : torsoDir(torso + headTilt, facing);
  const neckTop = add(shoulder, scale(nDir, BODY.neck));

  // Body width in front view (perpendicular to the torso).
  const perp: Vec = [-tDir[1], tDir[0]];
  const shoulderNear: Vec = front ? add(shoulder, scale(perp, -BODY.shoulderHalf)) : shoulder;
  const shoulderFar: Vec = front ? add(shoulder, scale(perp, BODY.shoulderHalf)) : shoulder;
  const hipNear: Vec = front ? add(hip, scale(perp, -BODY.hipHalf)) : hip;
  const hipFar: Vec = front ? add(hip, scale(perp, BODY.hipHalf)) : hip;

  const limb = (
    specA: LimbSpec,
    specB: LimbSpec,
    base: Vec,
    a: number,
    b: number,
    defaultBend: 1 | -1,
    limbFacing: 1 | -1,
  ): { mid: Vec; end: Vec } => {
    const ra = resolveLimb(specA, base, a, b, limbFacing, defaultBend);
    const rb = resolveLimb(specB, base, a, b, limbFacing, defaultBend);
    if (ra.target && rb.target) {
      const target = lerpVec(ra.target, rb.target, t);
      const bend = (-((t < 0.5 ? ra.bend : rb.bend) ?? defaultBend) * limbFacing) as 1 | -1;
      return solveIk(base, target, a, b, bend);
    }
    const a1 = lerpAngle(ra.angles[0], rb.angles[0], t);
    const a2 = lerpAngle(ra.angles[1], rb.angles[1], t);
    const mid = add(base, scale(limbDir(a1, limbFacing), a));
    const end = add(mid, scale(limbDir(a2, limbFacing), b));
    return { mid, end };
  };

  // In front view "near" is the figure's right side drawn on the viewer's left (x smaller);
  // positive angles = abduction, i.e. away from the midline.
  const nearFacing: 1 | -1 = front ? -1 : facing;
  const farFacing: 1 | -1 = front ? 1 : facing;
  const center = hip[0];
  const farSpec = (near: LimbSpec, far: LimbSpec | undefined) => far ?? (front ? mirrorSpec(near, center) : near);

  const armN = limb(from.armNear, to.armNear, shoulderNear, BODY.upperArm, BODY.forearm, -1, nearFacing);
  const armF = limb(farSpec(from.armNear, from.armFar), farSpec(to.armNear, to.armFar), shoulderFar, BODY.upperArm, BODY.forearm, -1, farFacing);
  const legN = limb(from.legNear, to.legNear, hipNear, BODY.thigh, BODY.shin, 1, nearFacing);
  const legF = limb(farSpec(from.legNear, from.legFar), farSpec(to.legNear, to.legFar), hipFar, BODY.thigh, BODY.shin, 1, farFacing);

  const handOf = (elbow: Vec, wrist: Vec): Vec => {
    const d = dist(elbow, wrist) || 1;
    return add(wrist, scale([(wrist[0] - elbow[0]) / d, (wrist[1] - elbow[1]) / d], BODY.hand));
  };

  const footOf = (knee: Vec, ankle: Vec, override: number | undefined, f: 1 | -1, isFront: boolean): { toe: Vec; heel: Vec } => {
    if (isFront) {
      // Feet seen from the front: short stub pointing slightly outward.
      return { toe: add(ankle, [f * 4, 3]), heel: add(ankle, [0, 2]) };
    }
    const shinAngle = limbAngle([ankle[0] - knee[0], ankle[1] - knee[1]], facing);
    const nearFloor = ankle[1] >= CANVAS.floor - BODY.ankleHeight - 3;
    const angle = override ?? (nearFloor ? 90 : Math.max(40, Math.min(150, shinAngle + 90)));
    const dir = limbDir(angle, facing);
    const toe = add(ankle, scale(dir, BODY.foot - BODY.heel));
    const heel = add(ankle, scale(dir, -BODY.heel));
    // Flatten to the floor if the toe would sink into it.
    if (toe[1] > CANVAS.floor) toe[1] = CANVAS.floor;
    if (heel[1] > CANVAS.floor) heel[1] = CANVAS.floor;
    return { toe, heel };
  };

  const footNear = from.footNear != null && to.footNear != null ? lerp(from.footNear, to.footNear, t) : (t < 0.5 ? from.footNear : to.footNear);
  const footFar = from.footFar != null && to.footFar != null ? lerp(from.footFar, to.footFar, t) : (t < 0.5 ? from.footFar : to.footFar);
  const fN = footOf(legN.mid, legN.end, footNear, -1, front);
  const fF = footOf(legF.mid, legF.end, footFar ?? footNear, 1, front);

  return {
    joints: {
      hip,
      shoulder,
      neckTop,
      hipNear,
      hipFar,
      shoulderNear,
      shoulderFar,
      elbowNear: armN.mid,
      elbowFar: armF.mid,
      wristNear: armN.end,
      wristFar: armF.end,
      handNear: handOf(armN.mid, armN.end),
      handFar: handOf(armF.mid, armF.end),
      kneeNear: legN.mid,
      kneeFar: legF.mid,
      ankleNear: legN.end,
      ankleFar: legF.end,
      toeNear: fN.toe,
      toeFar: fF.toe,
      heelNear: fN.heel,
      heelFar: fF.heel,
    },
  };
}

// ---------------------------------------------------------------- muscle highlighting

type Region = 'chest' | 'back' | 'abs' | 'lowerBack' | 'shoulder' | 'glutes' | 'upperArmFront' | 'upperArmBack' | 'forearm' | 'thighFront' | 'thighBack' | 'thighInner' | 'shin';

const MUSCLE_REGIONS: Record<Muscle, Region[]> = {
  chest: ['chest'],
  lats: ['back'],
  upper_back: ['back'],
  traps: ['back'],
  lower_back: ['lowerBack'],
  shoulders: ['shoulder'],
  rear_delts: ['shoulder'],
  biceps: ['upperArmFront'],
  triceps: ['upperArmBack'],
  forearms: ['forearm'],
  abs: ['abs'],
  obliques: ['abs'],
  glutes: ['glutes'],
  quadriceps: ['thighFront'],
  hamstrings: ['thighBack'],
  adductors: ['thighInner'],
  calves: ['shin'],
  hip_flexors: ['thighFront'],
};

export function highlightRegions(muscles: Muscle[]): Set<Region> {
  const out = new Set<Region>();
  for (const m of muscles) for (const r of MUSCLE_REGIONS[m] ?? []) out.add(r);
  return out;
}

// ---------------------------------------------------------------- props

function handPoint(j: Joints, at: string): Vec {
  if (at === 'handNear') return j.handNear;
  if (at === 'handFar') return j.handFar;
  if (at === 'footNear') return j.ankleNear;
  if (at === 'footFar') return j.ankleFar;
  if (at === 'feet') return lerpVec(j.ankleNear, j.ankleFar, 0.5);
  return lerpVec(j.handNear, j.handFar, 0.5);
}

function buildProps(props: Prop[], j: Joints, front: boolean, facing: 1 | -1): PropShape[] {
  const out: PropShape[] = [];
  const F = CANVAS.floor;
  for (const p of props) {
    switch (p.kind) {
      case 'barbell':
      case 'ezBar': {
        const h = lerpVec(j.handNear, j.handFar, 0.5);
        const big = p.kind === 'barbell' && p.plates !== 'small';
        if (front) {
          const y = h[1];
          const mid = h[0];
          out.push({ type: 'line', a: [mid - 70, y], b: [mid + 70, y], w: 2.6, tone: 'metal', layer: 'front' });
          for (const s of [-1, 1]) {
            out.push({ type: 'rect', x: mid + s * 58 - 3, y: y - (big ? 15 : 9), w: 6, h: big ? 30 : 18, rx: 2, tone: 'plate', layer: 'front' });
            out.push({ type: 'rect', x: mid + s * 64 - 2.5, y: y - (big ? 12 : 7), w: 5, h: big ? 24 : 14, rx: 2, tone: 'plate', layer: 'front' });
          }
        } else {
          const r = big ? 16 : 9;
          out.push({ type: 'circle', c: h, r, tone: 'plate', layer: 'back' });
          out.push({ type: 'circle', c: h, r: 2.6, tone: 'metal', layer: 'front' });
        }
        break;
      }
      case 'dumbbell': {
        const hands = p.at === 'hands' ? [j.handNear, j.handFar] : [handPoint(j, p.at)];
        hands.forEach((h, i) => {
          if (front) {
            out.push({ type: 'line', a: [h[0] - 7, h[1]], b: [h[0] + 7, h[1]], w: 2.2, tone: 'metal', layer: 'front' });
            out.push({ type: 'rect', x: h[0] - 9, y: h[1] - 5, w: 4, h: 10, rx: 1.5, tone: 'plate', layer: 'front' });
            out.push({ type: 'rect', x: h[0] + 5, y: h[1] - 5, w: 4, h: 10, rx: 1.5, tone: 'plate', layer: 'front' });
          } else {
            out.push({ type: 'circle', c: h, r: 6.5, tone: 'plate', layer: i === 0 ? 'front' : 'back' });
            out.push({ type: 'circle', c: h, r: 1.8, tone: 'metal', layer: i === 0 ? 'front' : 'back' });
          }
        });
        break;
      }
      case 'kettlebell': {
        const hands = p.at === 'hands' ? [lerpVec(j.handNear, j.handFar, 0.5)] : [handPoint(j, p.at)];
        for (const h of hands) {
          const wrist = p.at === 'handFar' ? j.wristFar : j.wristNear;
          const d = dist(wrist, h) || 1;
          const dir: Vec = [(h[0] - wrist[0]) / d, (h[1] - wrist[1]) / d];
          const c = add(h, scale(dir, 8));
          out.push({ type: 'circle', c, r: 8.5, tone: 'plate', layer: 'front' });
          out.push({ type: 'line', a: h, b: add(h, scale(dir, 2)), w: 3, tone: 'metal', layer: 'front' });
        }
        break;
      }
      case 'medicineBall': {
        const h = lerpVec(j.handNear, j.handFar, 0.5);
        out.push({ type: 'circle', c: h, r: 10, tone: 'ball', layer: 'front' });
        break;
      }
      case 'abWheel': {
        const h = lerpVec(j.handNear, j.handFar, 0.5);
        out.push({ type: 'circle', c: [h[0], Math.min(h[1] + 6, F - 9)], r: 9, tone: 'rubber', layer: 'front' });
        out.push({ type: 'circle', c: [h[0], Math.min(h[1] + 6, F - 9)], r: 2.5, tone: 'metal', layer: 'front' });
        break;
      }
      case 'jumpRope': {
        const a = j.handNear;
        const b = j.handFar;
        const low = Math.max(a[1], b[1]);
        out.push({ type: 'path', d: `M${a[0]},${a[1]} C${a[0] - 24 * facing},${F + 6} ${b[0] + 24 * facing},${F + 6} ${b[0]},${b[1]}`, tone: 'band', w: 1.5, layer: 'back' });
        void low;
        break;
      }
      case 'handle': {
        const h = handPoint(j, p.at);
        out.push({ type: 'line', a: [h[0], h[1] - 4], b: [h[0], h[1] + 4], w: 3, tone: 'metal', layer: 'front' });
        break;
      }
      case 'cable':
      case 'band': {
        const h = handPoint(j, p.at);
        out.push({ type: 'line', a: p.anchor, b: h, w: p.kind === 'cable' ? 1.2 : 2.6, tone: p.kind === 'cable' ? 'cable' : 'band', layer: 'back' });
        if (p.kind === 'cable') {
          out.push({ type: 'circle', c: p.anchor, r: 3.5, tone: 'metal', layer: 'back' });
          out.push({ type: 'line', a: [h[0], h[1] - 3], b: [h[0], h[1] + 3], w: 3, tone: 'metal', layer: 'front' });
        }
        if (p.at === 'hands') {
          out.push({ type: 'line', a: p.anchor, b: j.handFar, w: p.kind === 'cable' ? 1.2 : 2.6, tone: p.kind === 'cable' ? 'cable' : 'band', layer: 'back' });
        }
        break;
      }
      case 'bandBetweenHands':
        out.push({ type: 'line', a: j.handNear, b: j.handFar, w: 2.6, tone: 'band', layer: 'front' });
        break;
      case 'strap': {
        const h = handPoint(j, p.at);
        out.push({ type: 'line', a: p.anchor, b: h, w: p.style === 'trx' ? 2.4 : 1.4, tone: p.style === 'trx' ? 'band' : 'cable', layer: 'back' });
        if (p.style === 'rings') out.push({ type: 'circle', c: h, r: 4.5, tone: 'wood', layer: 'front' });
        else out.push({ type: 'line', a: [h[0], h[1] - 4], b: [h[0], h[1] + 4], w: 3, tone: 'rubber', layer: 'front' });
        if (p.at === 'hands') {
          out.push({ type: 'line', a: p.anchor, b: j.handFar, w: p.style === 'trx' ? 2.4 : 1.4, tone: p.style === 'trx' ? 'band' : 'cable', layer: 'back' });
        }
        out.push({ type: 'rect', x: p.anchor[0] - 6, y: p.anchor[1] - 3, w: 12, h: 3, rx: 1, tone: 'frame', layer: 'back' });
        break;
      }
      case 'bench': {
        const top = p.y;
        const legH = F - top - 5;
        out.push({ type: 'rect', x: p.x, y: top, w: p.w, h: 5, rx: 2.5, tone: 'pad', layer: 'back' });
        out.push({ type: 'line', a: [p.x + 8, top + 5], b: [p.x + 8, top + 5 + legH], w: 3, tone: 'frame', layer: 'back' });
        out.push({ type: 'line', a: [p.x + p.w - 8, top + 5], b: [p.x + p.w - 8, top + 5 + legH], w: 3, tone: 'frame', layer: 'back' });
        if (p.incline) {
          const len = 58;
          const ang = rad(p.incline);
          const sx = facing === 1 ? p.x + 6 : p.x + p.w - 6;
          const ex = sx - facing * Math.cos(ang) * len;
          const ey = top - Math.sin(ang) * len;
          out.push({ type: 'line', a: [sx, top], b: [ex, ey], w: 5, tone: 'pad', layer: 'back' });
        }
        break;
      }
      case 'pullUpBar':
        out.push({ type: 'line', a: [p.x - 40, p.y], b: [p.x + 40, p.y], w: 3, tone: 'metal', layer: 'back' });
        out.push({ type: 'line', a: [p.x - 40, p.y], b: [p.x - 40, 0], w: 3, tone: 'frame', layer: 'back' });
        out.push({ type: 'line', a: [p.x + 40, p.y], b: [p.x + 40, 0], w: 3, tone: 'frame', layer: 'back' });
        break;
      case 'dipBars':
        out.push({ type: 'line', a: [p.x - 36, p.y], b: [p.x + 36, p.y], w: 3.2, tone: 'metal', layer: 'front' });
        out.push({ type: 'line', a: [p.x - 30, p.y], b: [p.x - 30, F], w: 3, tone: 'frame', layer: 'back' });
        out.push({ type: 'line', a: [p.x + 30, p.y], b: [p.x + 30, F], w: 3, tone: 'frame', layer: 'back' });
        break;
      case 'box':
        out.push({ type: 'rect', x: p.x, y: p.y, w: p.w, h: p.h, rx: 2, tone: 'wood', layer: 'back' });
        break;
      case 'rack':
        out.push({ type: 'line', a: [p.x, 30], b: [p.x, F], w: 3.5, tone: 'frame', layer: 'back' });
        out.push({ type: 'line', a: [p.x - 5, p.hookY], b: [p.x + 5, p.hookY], w: 3, tone: 'metal', layer: 'back' });
        break;
      case 'wall':
        out.push({ type: 'rect', x: p.x, y: 8, w: 6, h: F - 8, tone: 'frame', layer: 'back' });
        break;
      case 'mat':
        out.push({ type: 'rect', x: p.x, y: F - 2, w: p.w, h: 3, rx: 1.5, tone: 'rubber', layer: 'back' });
        break;
      case 'chair':
        out.push({ type: 'rect', x: p.x, y: p.y, w: 30, h: 4, rx: 2, tone: 'wood', layer: 'back' });
        out.push({ type: 'line', a: [p.x + 3, p.y], b: [p.x + 3, F], w: 2.5, tone: 'wood', layer: 'back' });
        out.push({ type: 'line', a: [p.x + 27, p.y], b: [p.x + 27, F], w: 2.5, tone: 'wood', layer: 'back' });
        out.push({ type: 'line', a: [facing === 1 ? p.x + 3 : p.x + 27, p.y], b: [facing === 1 ? p.x + 3 : p.x + 27, p.y - 34], w: 2.5, tone: 'wood', layer: 'back' });
        break;
      case 'seat': {
        out.push({ type: 'rect', x: p.x, y: p.y, w: p.w, h: 6, rx: 3, tone: 'pad', layer: 'back' });
        out.push({ type: 'line', a: [p.x + p.w / 2, p.y + 6], b: [p.x + p.w / 2, F], w: 4, tone: 'frame', layer: 'back' });
        if (p.back) {
          const bx = facing === 1 ? p.x + 2 : p.x + p.w - 2;
          out.push({ type: 'line', a: [bx, p.y], b: [bx - facing * 6, p.y - p.back], w: 6, tone: 'pad', layer: 'back' });
        }
        break;
      }
      case 'legPressSled': {
        const f = lerpVec(j.ankleNear, j.ankleFar, 0.5);
        const c = add(f, [facing * 6, -2]);
        out.push({ type: 'line', a: add(c, [-facing * 10, -16]), b: add(c, [facing * 10, 16]), w: 4, tone: 'frame', layer: 'front' });
        out.push({ type: 'line', a: [c[0] + facing * 30, c[1] - 30], b: [c[0] - facing * 40, c[1] + 40], w: 2, tone: 'metal', dash: '4 3', layer: 'back' });
        break;
      }
      case 'machinePad': {
        const pts: Vec[] =
          p.at === 'ankles' ? [j.ankleNear] : p.at === 'shins' ? [lerpVec(j.kneeNear, j.ankleNear, 0.7)] : p.at === 'thighs' ? [lerpVec(j.hipNear, j.kneeNear, 0.75)] : [j.handNear];
        for (const c of pts) out.push({ type: 'circle', c, r: 6, tone: 'pad', layer: 'front' });
        break;
      }
      case 'weightStack':
        out.push({ type: 'rect', x: p.x, y: p.y, w: 14, h: F - p.y, rx: 2, tone: 'frame', layer: 'back' });
        for (let i = 0; i < 6; i++) out.push({ type: 'rect', x: p.x + 2, y: F - 10 - i * 7, w: 10, h: 5, rx: 1, tone: 'plate', layer: 'back' });
        break;
      case 'smithRails':
        out.push({ type: 'line', a: [p.x, 20], b: [p.x, F], w: 3, tone: 'frame', layer: 'back' });
        break;
      case 'treadmill':
        out.push({ type: 'rect', x: p.x, y: F - 8, w: p.w, h: 8, rx: 3, tone: 'rubber', layer: 'back' });
        out.push({ type: 'line', a: [p.x + p.w - 6, F - 8], b: [p.x + p.w + 4, F - 80], w: 3, tone: 'frame', layer: 'back' });
        break;
      case 'bike':
        out.push({ type: 'circle', c: [p.x + 40, F - 22], r: 20, tone: 'frame', layer: 'back' });
        out.push({ type: 'line', a: [p.x + 10, F - 90], b: [p.x + 40, F - 22], w: 3.5, tone: 'frame', layer: 'back' });
        break;
      case 'rower':
        out.push({ type: 'rect', x: p.x, y: F - 6, w: 140, h: 6, rx: 3, tone: 'frame', layer: 'back' });
        out.push({ type: 'circle', c: [p.x + 132, F - 20], r: 14, tone: 'frame', layer: 'back' });
        break;
    }
  }
  return out;
}

// ---------------------------------------------------------------- frame

/** Locates the keyframe segment for loop time t (0..1). */
function segmentAt(kfs: Keyframe[], t: number): { from: Keyframe; to: Keyframe; local: number } {
  const tt = ((t % 1) + 1) % 1;
  for (let i = 0; i < kfs.length - 1; i++) {
    const a = kfs[i]!;
    const b = kfs[i + 1]!;
    if (tt >= a.t && tt <= b.t) {
      const span = b.t - a.t || 1;
      return { from: a, to: b, local: ease(a.ease, (tt - a.t) / span) };
    }
  }
  const last = kfs[kfs.length - 1]!;
  return { from: last, to: last, local: 0 };
}

const W = { torsoSide: 17, torsoFront: 24, neck: 7, upperArm: 8.5, forearm: 7, hand: 6, thigh: 12, shin: 9, foot: 6 } as const;

export function computeFrame(anim: ExerciseAnimation, t: number, highlightMuscles: Muscle[] = []): Frame {
  const { from, to, local } = segmentAt(anim.keyframes, t);
  const { joints: j } = buildSkeleton(anim, from.pose, to.pose, local);
  const front = anim.view === 'front';
  const facing = anim.facing ?? 1;
  const hl = highlightRegions(highlightMuscles);

  const segs: Segment[] = [];
  // In front view both sides face the viewer, so neither side is shaded as 'far'.
  const seg = (a: Vec, b: Vec, w: number, part: BodyPart, side: Side, highlight = false) =>
    segs.push({ a, b, w, part, side: front && side === 'far' ? 'near' : side, highlight });

  // Far side first (drawn behind the torso in side view).
  seg(j.hipFar, j.kneeFar, W.thigh, 'thigh', 'far', hl.has('thighFront') || hl.has('thighBack') || hl.has('thighInner'));
  seg(j.kneeFar, j.ankleFar, W.shin, 'shin', 'far', hl.has('shin'));
  seg(j.heelFar, j.toeFar, W.foot, 'foot', 'far');
  seg(j.shoulderFar, j.elbowFar, W.upperArm, 'upperArm', 'far', hl.has('upperArmFront') || hl.has('upperArmBack'));
  seg(j.elbowFar, j.wristFar, W.forearm, 'forearm', 'far', hl.has('forearm'));
  seg(j.wristFar, j.handFar, W.hand, 'hand', 'far');
  // Torso & neck.
  seg(j.hip, j.shoulder, front ? W.torsoFront : W.torsoSide, 'torso', 'center');
  seg(j.shoulder, j.neckTop, W.neck, 'neck', 'center');
  // Near side.
  seg(j.hipNear, j.kneeNear, W.thigh, 'thigh', 'near', hl.has('thighFront') || hl.has('thighBack') || hl.has('thighInner'));
  seg(j.kneeNear, j.ankleNear, W.shin, 'shin', 'near', hl.has('shin'));
  seg(j.heelNear, j.toeNear, W.foot, 'foot', 'near');
  seg(j.shoulderNear, j.elbowNear, W.upperArm, 'upperArm', 'near', hl.has('upperArmFront') || hl.has('upperArmBack'));
  seg(j.elbowNear, j.wristNear, W.forearm, 'forearm', 'near', hl.has('forearm'));
  seg(j.wristNear, j.handNear, W.hand, 'hand', 'near');

  // Muscle overlays on the torso (front/back bands) and dots for joints-centred groups.
  const overlays: Frame['overlays'] = [];
  const overlayDots: Frame['overlayDots'] = [];
  const tv: Vec = [j.shoulder[0] - j.hip[0], j.shoulder[1] - j.hip[1]];
  const tl = Math.hypot(tv[0], tv[1]) || 1;
  const tn: Vec = [tv[0] / tl, tv[1] / tl];
  // Normal pointing toward the figure's front (chest side) in side view.
  const frontN: Vec = front ? [0, 0] : facing === 1 ? [-tn[1], tn[0]] : [tn[1], -tn[0]];
  const along = (f: number): Vec => add(j.hip, scale(tv, f));
  const band = (f0: number, f1: number, side: 1 | -1, w = 6) => {
    const off = scale(frontN, side * (front ? 0 : 5.5));
    overlays.push({ a: add(along(f0), off), b: add(along(f1), off), w });
  };
  if (hl.has('chest')) band(0.62, 0.92, 1, front ? 14 : 6);
  if (hl.has('abs')) band(0.12, 0.58, 1, front ? 10 : 6);
  if (hl.has('back')) band(0.5, 0.95, -1, front ? 18 : 6);
  if (hl.has('lowerBack')) band(0.08, 0.45, -1, front ? 10 : 6);
  if (hl.has('shoulder')) {
    overlayDots.push({ c: j.shoulderNear, r: 6 });
    if (front) overlayDots.push({ c: j.shoulderFar, r: 6 });
  }
  if (hl.has('glutes')) overlayDots.push({ c: add(j.hip, scale(frontN, front ? 0 : -5)), r: 7.5 });

  const shadowSrc = Math.min(j.ankleNear[1], j.ankleFar[1], j.hip[1]);
  const lift = Math.max(0, CANVAS.floor - BODY.ankleHeight - Math.max(j.ankleNear[1], j.ankleFar[1]));
  return {
    segments: segs,
    overlays,
    overlayDots,
    head: { c: add(j.neckTop, scale([j.neckTop[0] - j.shoulder[0], j.neckTop[1] - j.shoulder[1]], BODY.headR / BODY.neck)), r: BODY.headR, highlight: false },
    joints: j,
    props: buildProps(anim.props ?? [], j, front, facing),
    shadow: { cx: (j.hip[0] + (j.ankleNear[0] + j.ankleFar[0]) / 2) / 2, cy: CANVAS.floor + 1.5, rx: Math.max(14, 34 - lift * 0.35), opacity: Math.max(0.12, 0.35 - lift * 0.004 - (shadowSrc < 0 ? 0 : 0)) },
  };
}

/** Basic sanity checks used by tests and the authoring tool. */
export function validateAnimation(anim: ExerciseAnimation): string[] {
  const errors: string[] = [];
  const k = anim.keyframes;
  if (!k.length || k[0]!.t !== 0 || k[k.length - 1]!.t !== 1) errors.push('keyframes must start at t=0 and end at t=1');
  for (let i = 1; i < k.length; i++) if (k[i]!.t <= k[i - 1]!.t) errors.push(`keyframe ${i} time is not increasing`);
  if (!(anim.durationSec > 0.3 && anim.durationSec < 20)) errors.push('durationSec out of range');
  for (let s = 0; s <= 40; s++) {
    const f = computeFrame(anim, s / 40);
    for (const seg of f.segments) {
      for (const p of [seg.a, seg.b]) {
        if (!Number.isFinite(p[0]) || !Number.isFinite(p[1])) {
          errors.push(`non-finite geometry at t=${s / 40}`);
          return errors;
        }
      }
    }
    const lowest = Math.max(...f.segments.flatMap((sg) => [sg.a[1], sg.b[1]]));
    if (lowest > CANVAS.floor + 8) errors.push(`body below the floor at t=${(s / 40).toFixed(2)} (y=${lowest.toFixed(1)})`);
  }
  return errors;
}

/** SVG viewBox honouring the optional camera (zoom < 1 shows more of the scene). */
export function viewBoxFor(anim: Pick<ExerciseAnimation, 'camera'>): { x: number; y: number; w: number; h: number } {
  const cam = anim.camera;
  if (!cam || !(cam.zoom > 0)) return { x: 0, y: 0, w: CANVAS.w, h: CANVAS.h };
  const w = CANVAS.w / cam.zoom;
  const h = CANVAS.h / cam.zoom;
  return { x: cam.cx - w / 2, y: cam.cy - h / 2, w, h };
}
