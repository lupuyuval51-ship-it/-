import { add, fromDown, fromUp, ik, mul, type V } from './geom.ts';

/** Segment lengths, in units of body height (H = 1). */
export const L = { torso: 0.30, neck: 0.045, headR: 0.062, upperArm: 0.17, foreArm: 0.16, thigh: 0.245, shank: 0.245, foot: 0.096 } as const;
export const clampStats = { n: 0 };
export const FOOT_FLAT = 62; // degrees from down: toe on the floor, ankle 0.045 above it
export const ANKLE_H = 0.045;

export type Part = 'torso_lower' | 'torso_upper' | 'neck' | 'upperArm' | 'foreArm' | 'thigh' | 'shank' | 'foot';
export type Layer = 'far' | 'mid' | 'near';
export interface Seg { a: V; b: V; part: Part; layer: Layer; side: 'N' | 'F' | 'C' }
export interface Rig {
  segs: Seg[];
  head: { c: V; r: number };
  pts: Record<string, V>;
}

export type Arm = { fk: readonly [number, number] } | { to: V; pref: V };
export type Leg = { fk: readonly [number, number]; foot: number } | { to: V; pref: V; foot: number };

export interface SideInput {
  hip: V;
  /** degrees from vertical-up, positive leans toward the facing direction (+x) */
  torso: number;
  /** extra head tilt relative to the torso line, degrees (positive = looks forward/down) */
  head?: number;
  armN: Arm; armF?: Arm; legN: Leg; legF?: Leg;
}

function arm(shoulder: V, a: Arm): { elbow: V; wrist: V } {
  if ('fk' in a) {
    // angles are from straight down, counter-clockwise positive: elbow flexion means the forearm angle is >= the upper arm angle
    if (a.fk[1] < a.fk[0] - 5) clampStats.n++;
    const fk: readonly [number, number] = [a.fk[0], Math.max(a.fk[1], a.fk[0])];
    a = { fk };
    const elbow = add(shoulder, mul(fromDown(a.fk[0]), L.upperArm));
    return { elbow, wrist: add(elbow, mul(fromDown(a.fk[1]), L.foreArm)) };
  }
  const r = ik(shoulder, a.to, L.upperArm, L.foreArm, a.pref, 'elbow');
  return { elbow: r.mid, wrist: r.end };
}
function leg(hip: V, l: Leg): { knee: V; ankle: V; toe: V } {
  let knee: V; let ankle: V;
  if ('fk' in l) {
    if (l.fk[1] > l.fk[0] + 5) clampStats.n++;
    l = { ...l, fk: [l.fk[0], Math.min(l.fk[1], l.fk[0])] as const }; // knee flexion: shank angle <= thigh angle
    knee = add(hip, mul(fromDown(l.fk[0]), L.thigh));
    ankle = add(knee, mul(fromDown(l.fk[1]), L.shank));
  } else {
    const r = ik(hip, l.to, L.thigh, L.shank, l.pref, 'knee');
    knee = r.mid; ankle = r.end;
  }
  return { knee, ankle, toe: add(ankle, mul(fromDown(l.foot), L.foot)) };
}

/** Side-view rig facing +x. Near limbs are drawn bright, far limbs dim. */
export function sideRig(o: SideInput): Rig {
  const mid = add(o.hip, mul(fromUp(o.torso), L.torso * 0.5));
  const shoulder = add(o.hip, mul(fromUp(o.torso), L.torso));
  const neckEnd = add(shoulder, mul(fromUp(o.torso + (o.head ?? 0) * 0.5), L.neck));
  const headC = add(neckEnd, mul(fromUp(o.torso + (o.head ?? 0)), L.headR));
  const aN = arm(shoulder, o.armN); const aF = arm(shoulder, o.armF ?? o.armN);
  const lN = leg(o.hip, o.legN); const lF = leg(o.hip, o.legF ?? o.legN);
  const segs: Seg[] = [
    { a: shoulder, b: aF.elbow, part: 'upperArm', layer: 'far', side: 'F' }, { a: aF.elbow, b: aF.wrist, part: 'foreArm', layer: 'far', side: 'F' },
    { a: o.hip, b: lF.knee, part: 'thigh', layer: 'far', side: 'F' }, { a: lF.knee, b: lF.ankle, part: 'shank', layer: 'far', side: 'F' }, { a: lF.ankle, b: lF.toe, part: 'foot', layer: 'far', side: 'F' },
    { a: o.hip, b: mid, part: 'torso_lower', layer: 'mid', side: 'C' }, { a: mid, b: shoulder, part: 'torso_upper', layer: 'mid', side: 'C' }, { a: shoulder, b: neckEnd, part: 'neck', layer: 'mid', side: 'C' },
    { a: o.hip, b: lN.knee, part: 'thigh', layer: 'near', side: 'N' }, { a: lN.knee, b: lN.ankle, part: 'shank', layer: 'near', side: 'N' }, { a: lN.ankle, b: lN.toe, part: 'foot', layer: 'near', side: 'N' },
    { a: shoulder, b: aN.elbow, part: 'upperArm', layer: 'near', side: 'N' }, { a: aN.elbow, b: aN.wrist, part: 'foreArm', layer: 'near', side: 'N' },
  ];
  return {
    segs, head: { c: headC, r: L.headR },
    pts: { hip: o.hip, mid, shoulder, neck: neckEnd, head: headC, elbowN: aN.elbow, wristN: aN.wrist, elbowF: aF.elbow, wristF: aF.wrist, kneeN: lN.knee, ankleN: lN.ankle, toeN: lN.toe, kneeF: lF.knee, ankleF: lF.ankle, toeF: lF.toe },
  };
}

/** Front-view rig: limb angles are measured from straight down, positive = away from the midline. */
export interface FrontInput {
  hip: V; tilt?: number;
  armL: Arm | { out: readonly [number, number] }; armR?: { out: readonly [number, number] };
  legOut: readonly [number, number]; legOutR?: readonly [number, number];
}
const SHOULDER_HALF = 0.11; const HIP_HALF = 0.065;
export function frontRig(o: FrontInput & { armL: { out: readonly [number, number] } }): Rig {
  const tilt = o.tilt ?? 0;
  const up = fromUp(tilt);
  const shoulderC = add(o.hip, mul(up, L.torso));
  const mid = add(o.hip, mul(up, L.torso * 0.5));
  const side: V = [Math.cos((tilt * Math.PI) / 180), -Math.sin((tilt * Math.PI) / 180)];
  const sL = add(shoulderC, mul(side, -SHOULDER_HALF)); const sR = add(shoulderC, mul(side, SHOULDER_HALF));
  const hL = add(o.hip, [-HIP_HALF, 0]); const hR = add(o.hip, [HIP_HALF, 0]);
  const limb = (base: V, out: readonly [number, number], dirSign: 1 | -1, l1: number, l2: number): { mid: V; end: V } => {
    const m = add(base, [dirSign * Math.sin((out[0] * Math.PI) / 180) * l1, -Math.cos((out[0] * Math.PI) / 180) * l1]);
    const e = add(m, [dirSign * Math.sin((out[1] * Math.PI) / 180) * l2, -Math.cos((out[1] * Math.PI) / 180) * l2]);
    return { mid: m, end: e };
  };
  const aL = limb(sL, o.armL.out, -1, L.upperArm, L.foreArm); const aR = limb(sR, (o.armR ?? o.armL).out, 1, L.upperArm, L.foreArm);
  const lL = limb(hL, o.legOut, -1, L.thigh, L.shank); const lR = limb(hR, o.legOutR ?? o.legOut, 1, L.thigh, L.shank);
  const neckEnd = add(shoulderC, mul(up, L.neck));
  const headC = add(neckEnd, mul(up, L.headR));
  const segs: Seg[] = [
    { a: hL, b: lL.mid, part: 'thigh', layer: 'near', side: 'N' }, { a: lL.mid, b: lL.end, part: 'shank', layer: 'near', side: 'N' },
    { a: hR, b: lR.mid, part: 'thigh', layer: 'near', side: 'N' }, { a: lR.mid, b: lR.end, part: 'shank', layer: 'near', side: 'N' },
    { a: o.hip, b: mid, part: 'torso_lower', layer: 'mid', side: 'C' }, { a: mid, b: shoulderC, part: 'torso_upper', layer: 'mid', side: 'C' },
    { a: sL, b: sR, part: 'neck', layer: 'mid', side: 'C' }, { a: hL, b: hR, part: 'neck', layer: 'mid', side: 'C' }, { a: shoulderC, b: neckEnd, part: 'neck', layer: 'mid', side: 'C' },
    { a: sL, b: aL.mid, part: 'upperArm', layer: 'near', side: 'N' }, { a: aL.mid, b: aL.end, part: 'foreArm', layer: 'near', side: 'N' },
    { a: sR, b: aR.mid, part: 'upperArm', layer: 'near', side: 'N' }, { a: aR.mid, b: aR.end, part: 'foreArm', layer: 'near', side: 'N' },
  ];
  return { segs, head: { c: headC, r: L.headR }, pts: { hip: o.hip, shoulder: shoulderC, mid, head: headC, wristN: aL.end, wristF: aR.end, elbowN: aL.mid, elbowF: aR.mid, ankleN: lL.end, ankleF: lR.end, kneeN: lL.mid, kneeF: lR.mid, toeN: lL.end, toeF: lR.end } };
}
