/**
 * Motion programs ("archetypes"). Each returns a Frame for a phase:
 *  s  = eased 0→1→0 repetition curve, u = cyclic phase 0..1, side = which limb works (unilateral exercises).
 * Everything is built from planted end-effectors + two-bone IK, so bone lengths never change and feet/hands stay put.
 */
import { add, clamp, fromDown, fromUp, ik, lerp, mul, sub, v, type V } from './geom.ts';
import { ANKLE_H, FOOT_FLAT, L, frontRig, sideRig, type Arm, type Leg } from './rig.ts';
import { band, barbell, bench, box, cable, dumbbell, hangBar, kettlebell, wheel, type Frame, type Prop } from './scene.ts';

export interface Ph { s: number; u: number; side: 0 | 1 }
export type Motion = (p: Ph) => Frame;

const LEG = L.thigh + L.shank;
export const HIP0 = ANKLE_H + LEG * 0.998; // standing hip height
const PREF_FWD: V = v(1, 0);
const PREF_BACK: V = v(-1, 0);
const PREF_DOWN: V = v(0, -1);
const flatLeg = (ankle: V, pref: V = PREF_FWD): Leg => ({ to: ankle, pref, foot: FOOT_FLAT });
const shoulderOf = (hip: V, torso: number): V => add(hip, mul(fromUp(torso), L.torso));

export type Implement = 'none' | 'barbell' | 'dumbbell' | 'kettlebell' | 'band' | 'cable' | 'machine';

/** Draw an implement held at a wrist. */
function held(imp: Implement, wrist: V, extra: Prop[] = []): Prop[] {
  switch (imp) {
    case 'barbell': return [...barbell(wrist), ...extra];
    case 'dumbbell': return [...dumbbell(wrist), ...extra];
    case 'kettlebell': return [...kettlebell(wrist), ...extra];
    default: return extra;
  }
}

/* ---------------------------------------------------------------- squat */
export interface SquatCfg { load: 'none' | 'goblet' | 'back' | 'front' | 'smith'; imp?: Implement; depth?: number; wide?: boolean; pause?: boolean; box?: number; wall?: boolean; single?: boolean; lean?: number; band?: boolean }
export function squat(c: SquatCfg): Motion {
  const depthY = c.depth ?? 0.30;
  return ({ s }) => {
    const x = c.wide ? 0.0 : 0;
    const ankleN = v(x, ANKLE_H); const ankleF = v(x - 0.03, ANKLE_H);
    const hip: V = v(lerp(0, -0.12, s), lerp(HIP0, depthY, s));
    const torso = lerp(4, 40, s);
    const sh = shoulderOf(hip, torso);
    let arm: Arm; let props: Prop[] = [];
    if (c.load === 'goblet') {
      const wr = add(sh, v(0.085, -0.075)); arm = { to: wr, pref: PREF_DOWN };
      props = held(c.imp ?? 'dumbbell', add(wr, v(0.02, 0.0)));
    } else if (c.load === 'back') {
      const wr = add(sh, v(-0.03, 0.035)); arm = { to: wr, pref: v(-1, -0.4) };
      props = barbell(add(sh, v(-0.035, 0.015)));
    } else if (c.load === 'front') {
      const wr = add(sh, v(0.075, 0.0)); arm = { to: wr, pref: v(0.6, 1) };
      props = barbell(add(sh, v(0.075, 0.015)));
    } else {
      arm = { fk: [lerp(10, 88, s), lerp(14, 90, s)] };
    }
    const legF: Leg = c.single ? { to: v(lerp(0.34, 0.42, s), lerp(0.47, 0.3, s)), pref: PREF_DOWN, foot: 100 } : flatLeg(ankleF);
    const rig = sideRig({ hip, torso: c.lean !== undefined ? lerp(4, c.lean, s) : torso, head: -8, armN: arm, legN: flatLeg(ankleN), legF });
    const extra: Prop[] = [];
    if (c.band) extra.push({ k: 'line', a: add(rig.pts['kneeN'] as V, v(0, 0)), b: v(0.5, rig.pts['kneeN']![1]), w: 0.012, dash: true, layer: 'back' });
    if (c.box) extra.push(...box(-0.34, -0.1, c.box));
    if (c.wall) extra.push({ k: 'line', a: v(-0.25, 0), b: v(-0.25, 1.0), w: 0.02, layer: 'back' });
    return { rig, props: [...props, ...extra] };
  };
}

/** Isometric wall sit: back against a wall, thighs parallel. */
export const wallSit: Motion = ({ s }) => {
  const hip: V = v(-0.2, lerp(0.34, 0.31, s));
  const rig = sideRig({ hip, torso: 0, head: 0, armN: { fk: [8, 10] }, legN: flatLeg(v(0.04, ANKLE_H)), legF: flatLeg(v(0.01, ANKLE_H)) });
  return { rig, props: [{ k: 'line', a: v(-0.27, 0), b: v(-0.27, 1.0), w: 0.02, layer: 'back' }] };
};

/* ---------------------------------------------------------------- hinge */
export interface HingeCfg { imp: Implement; bend?: number; fromFloor?: boolean; bodyweight?: boolean; singleLeg?: boolean; goodMorning?: boolean; swing?: boolean }
export function hinge(c: HingeCfg): Motion {
  const bend = c.bend ?? 78;
  return ({ s, side }) => {
    const hip: V = v(lerp(0, c.fromFloor ? -0.15 : -0.17, s), lerp(HIP0, c.fromFloor ? 0.38 : 0.495, s));
    const torso = lerp(3, c.fromFloor ? 52 : bend, s);
    const sh = shoulderOf(hip, torso);
    const ankleN = v(0, ANKLE_H); const ankleF = v(-0.03, ANKLE_H);
    let legN: Leg = flatLeg(ankleN); let legF: Leg = flatLeg(ankleF);
    if (c.singleLeg) {
      const back = side === 0 ? legF : legN;
      const liftAnkle = v(lerp(-0.03, -0.42, s), lerp(ANKLE_H, 0.33, s));
      const lifted: Leg = { to: liftAnkle, pref: PREF_BACK, foot: lerp(62, 10, s) };
      if (side === 0) legF = lifted; else legN = lifted;
      void back;
    }
    let arm: Arm; let props: Prop[] = [];
    if (c.goodMorning) {
      arm = { to: add(sh, v(-0.03, 0.03)), pref: v(-1, -0.4) }; props = c.imp === 'barbell' ? barbell(add(sh, v(-0.035, 0.015))) : [];
    } else if (c.bodyweight) {
      arm = { to: add(sh, v(0.0, 0.05)), pref: PREF_BACK }; // hands behind head
    } else {
      const barY = c.fromFloor ? lerp(0.11, 0.40, 1 - s) : undefined;
      const target = c.fromFloor ? v(clamp(sh[0] + 0.01, -0.1, 0.2), barY ?? 0.11) : add(sh, v(0.01, -(L.upperArm + L.foreArm) + 0.005));
      arm = { to: target, pref: PREF_BACK };
      const wr = ik(sh, target, L.upperArm, L.foreArm, PREF_BACK).end;
      props = held(c.imp, wr);
    }
    const rig = sideRig({ hip, torso, head: -10, armN: arm, legN, legF });
    return { rig, props };
  };
}

/* ---------------------------------------------------------------- lunge */
export interface LungeCfg { kind: 'forward' | 'reverse' | 'split' | 'bulgarian' | 'stepup' | 'walking'; imp: Implement }
export function lunge(c: LungeCfg): Motion {
  return ({ s }) => {
    const frontAnkle = v(0.34, ANKLE_H);
    const backToe = v(-0.34, 0);
    const hip: V = v(lerp(0.0, 0.0, s), lerp(HIP0 - 0.02, 0.33, s));
    const torso = 4;
    const sh = shoulderOf(hip, torso);
    const legFront: Leg = { to: frontAnkle, pref: PREF_FWD, foot: FOOT_FLAT };
    let legBack: Leg = { to: add(backToe, mul(fromDown(-28), -L.foot)), pref: PREF_FWD, foot: 20 };
    const props: Prop[] = [];
    if (c.kind === 'bulgarian') {
      legBack = { to: v(-0.36, 0.38), pref: PREF_FWD, foot: 5 };
      props.push(...bench(-0.62, -0.3, 0.36));
    }
    if (c.kind === 'stepup') {
      const top = 0.3; const h2: V = v(lerp(-0.1, 0.12, s), lerp(HIP0 - 0.02, HIP0 + top - 0.1, s));
      const rig = sideRig({ hip: h2, torso: lerp(8, 2, s), head: -5, armN: { fk: [6, 8] }, legN: { to: v(0.14, top + ANKLE_H), pref: PREF_FWD, foot: FOOT_FLAT }, legF: { to: v(lerp(-0.1, 0.1, s), lerp(ANKLE_H, top + ANKLE_H + 0.12, s)), pref: PREF_FWD, foot: lerp(62, 40, s) } });
      return { rig, props: box(0.02, 0.32, top) };
    }
    let arm: Arm = { fk: [4, 6] };
    if (c.imp === 'dumbbell' || c.imp === 'kettlebell') { arm = { fk: [3, 3] }; }
    else if (c.imp === 'barbell') { arm = { to: add(sh, v(-0.03, 0.035)), pref: v(-1, -0.4) }; props.push(...barbell(add(sh, v(-0.035, 0.015)))); }
    const rig = sideRig({ hip, torso, head: -4, armN: arm, legN: legFront, legF: legBack });
    if (c.imp === 'dumbbell' || c.imp === 'kettlebell') props.push(...held(c.imp, rig.pts['wristN'] as V));
    return { rig, props };
  };
}

/* ----------------------------------------------------------- overhead press */
export interface PressCfg { imp: Implement; seated?: boolean; alternate?: boolean; kneeling?: boolean }
export function press(c: PressCfg): Motion {
  return ({ s, side }) => {
    const hip: V = c.seated ? v(0, 0.30) : v(0, HIP0);
    const sh = shoulderOf(hip, c.seated ? -4 : 0);
    const legN: Leg = c.seated ? { fk: [90, 0], foot: 80 } : flatLeg(v(0, ANKLE_H));
    const legF: Leg = c.seated ? { fk: [90, 0], foot: 80 } : flatLeg(v(-0.03, ANKLE_H));
    const sSide = c.alternate ? (side === 0 ? s : 0) : s;
    const target = v(lerp(sh[0] + 0.05, sh[0] + 0.01, sSide), lerp(sh[1] + 0.07, sh[1] + 0.325, sSide));
    const arm: Arm = { to: target, pref: v(0.1, -1) };
    const wr = ik(sh, target, L.upperArm, L.foreArm, arm.pref).end;
    const rig = sideRig({ hip, torso: c.seated ? -4 : 0, head: -3, armN: arm, legN, legF });
    const props = held(c.imp, add(wr, v(0, 0.0)));
    if (c.seated) props.push(...bench(-0.2, 0.2, 0.28), { k: 'rect', c: v(-0.2, 0.52), w: 0.05, h: 0.5, fill: true, layer: 'back' });
    return { rig, props };
  };
}

/* ---------------------------------------------------------------- curl */
export interface CurlCfg { imp: Implement; hammer?: boolean; incline?: boolean; seated?: boolean; preacher?: boolean; reverse?: boolean }
export function curl(c: CurlCfg): Motion {
  return ({ s }) => {
    const incline = c.incline ?? false;
    const hip: V = c.seated || incline ? v(0, 0.3) : v(0, HIP0);
    const torso = incline ? -38 : 0;
    const legN: Leg = c.seated || incline ? { fk: [90, 0], foot: 80 } : flatLeg(v(0, ANKLE_H));
    const upper = incline ? -22 : c.preacher ? 38 : 6;
    const arm: Arm = { fk: [upper, lerp(upper + (incline ? 2 : 4), 150, s)] };
    const rig = sideRig({ hip, torso, head: 0, armN: arm, legN, legF: legN });
    const wr = rig.pts['wristN'] as V;
    let props = held(c.imp === 'band' || c.imp === 'cable' ? 'dumbbell' : c.imp, wr);
    if (c.imp === 'cable') props = [...cable(wr, v(0.1, 0.06)), ...props.slice(0, 0)];
    if (c.imp === 'band') props = band(wr, v(0.0, 0.0));
    if (incline) props.push({ k: 'line', a: v(-0.45, 0.62), b: v(-0.02, 0.3), w: 0.05, layer: 'back' });
    if (c.preacher) props.push({ k: 'line', a: v(0.06, 0.62), b: v(0.2, 0.42), w: 0.06, layer: 'back' });
    return { rig, props };
  };
}

/* -------------------------------------------------------------- triceps */
export function tricepsOverhead(imp: Implement): Motion {
  return ({ s }) => {
    const rig = sideRig({ hip: v(0, HIP0), torso: 0, head: 0, armN: { fk: [172, lerp(-10, 172, s)] }, legN: flatLeg(v(0, ANKLE_H)), legF: flatLeg(v(-0.03, ANKLE_H)) });
    const wr = rig.pts['wristN'] as V;
    return { rig, props: imp === 'cable' ? cable(wr, v(-0.2, 0.05)) : held(imp, wr) };
  };
}
export function pushdown(imp: Implement): Motion {
  return ({ s }) => {
    const rig = sideRig({ hip: v(0, HIP0), torso: 6, head: 0, armN: { fk: [3, lerp(95, 3, s)] }, legN: flatLeg(v(0, ANKLE_H)), legF: flatLeg(v(-0.03, ANKLE_H)) });
    const wr = rig.pts['wristN'] as V;
    return { rig, props: imp === 'band' ? band(wr, v(0.12, 1.25)) : cable(wr, v(0.1, 1.25)) };
  };
}
export function kickback(imp: Implement): Motion {
  return ({ s }) => {
    const hip: V = v(-0.1, 0.5);
    const rig = sideRig({ hip, torso: 62, head: -12, armN: { fk: [-88, lerp(-8, -92, s)] }, legN: flatLeg(v(0, ANKLE_H)), legF: flatLeg(v(-0.03, ANKLE_H)) });
    const wr = rig.pts['wristN'] as V;
    return { rig, props: imp === 'dumbbell' ? dumbbell(wr) : imp === 'band' ? band(wr, v(-0.3, 0.1)) : cable(wr, v(-0.4, 0.15)) };
  };
}
export function skullCrusher(): Motion {
  return ({ s }) => {
    const hipY = 0.32;
    const rig = sideRig({ hip: v(0.4, hipY), torso: -90, head: 0, armN: { fk: [180, lerp(135, 180, s)] }, legN: { fk: [71, 4], foot: 70 }, legF: { fk: [71, 4], foot: 70 } });
    return { rig, props: [...bench(-0.4, 0.5, 0.29), ...barbell(rig.pts['wristN'] as V)] };
  };
}

/* ---------------------------------------------------------------- raises */
export function lateralRaise(imp: Implement): Motion {
  return ({ s }) => {
    const a = lerp(6, 86, s);
    const rig = frontRig({ hip: v(0, HIP0), armL: { out: [a, a] }, legOut: [3, 3] });
    const props: Prop[] = [];
    for (const key of ['wristN', 'wristF'] as const) props.push(...(imp === 'band' ? [] : dumbbell(rig.pts[key] as V)));
    return { rig, props };
  };
}
export function frontRaise(imp: Implement): Motion {
  return ({ s }) => {
    const a = lerp(5, 88, s);
    const rig = sideRig({ hip: v(0, HIP0), torso: 0, head: 0, armN: { fk: [a, a] }, legN: flatLeg(v(0, ANKLE_H)), legF: flatLeg(v(-0.03, ANKLE_H)) });
    return { rig, props: held(imp, rig.pts['wristN'] as V) };
  };
}
export function rearFly(imp: Implement): Motion {
  return ({ s }) => {
    const hip: V = v(-0.12, 0.5);
    const torso = 68; const sh = shoulderOf(hip, torso);
    const arm: Arm = { to: v(lerp(sh[0] + 0.01, sh[0] - 0.2, s), lerp(sh[1] - 0.32, sh[1] - 0.12, s)), pref: PREF_BACK };
    const rig = sideRig({ hip, torso, head: -14, armN: arm, legN: flatLeg(v(0, ANKLE_H)), legF: flatLeg(v(-0.03, ANKLE_H)) });
    return { rig, props: imp === 'cable' ? cable(rig.pts['wristN'] as V, v(0.4, 0.6)) : held(imp, rig.pts['wristN'] as V) };
  };
}
export function upright(imp: Implement): Motion {
  return ({ s }) => {
    const hip: V = v(0, HIP0); const sh = shoulderOf(hip, 0);
    const wr = v(lerp(sh[0] + 0.05, sh[0] + 0.07, s), lerp(sh[1] - 0.3, sh[1] - 0.04, s));
    const rig = sideRig({ hip, torso: 0, head: 0, armN: { to: wr, pref: v(-0.2, 1) }, legN: flatLeg(v(0, ANKLE_H)), legF: flatLeg(v(-0.03, ANKLE_H)) });
    return { rig, props: held(imp, rig.pts['wristN'] as V) };
  };
}
export function shrug(imp: Implement): Motion {
  return ({ s }) => {
    const hip: V = v(0, HIP0);
    const rig = sideRig({ hip: add(hip, v(0, 0)), torso: 0, head: 0, armN: { fk: [0, 0] }, legN: flatLeg(v(0, ANKLE_H)), legF: flatLeg(v(-0.03, ANKLE_H)) });
    const lift = lerp(0, 0.035, s);
    const moved = { ...rig, head: { ...rig.head, c: add(rig.head.c, v(0, -lift * 0.0)) } };
    const wr = add(rig.pts['wristN'] as V, v(0, lift));
    return { rig: moved, props: held(imp, wr) };
  };
}

/* ------------------------------------------------------------------ rows */
export interface RowCfg { imp: Implement; supported?: boolean; oneArm?: boolean; seated?: boolean; face?: boolean; landmine?: boolean }
export function rowBent(c: RowCfg): Motion {
  return ({ s }) => {
    if (c.seated) {
      const hip: V = v(-0.1, 0.3); const torso = lerp(-6, 8, 1 - s);
      const sh = shoulderOf(hip, torso);
      const wr = v(lerp(sh[0] + 0.31, sh[0] + 0.07, s), sh[1] - 0.03);
      const rig = sideRig({ hip, torso, head: 0, armN: { to: wr, pref: PREF_DOWN }, legN: { fk: [78, 8], foot: 70 }, legF: { fk: [78, 8], foot: 70 } });
      return { rig, props: [...cable(rig.pts['wristN'] as V, v(0.7, 0.2)), ...bench(-0.3, 0.0, 0.28)] };
    }
    if (c.face) {
      const hip: V = v(0, HIP0); const sh = shoulderOf(hip, 0);
      const wr = v(lerp(sh[0] + 0.33, sh[0] + 0.1, s), lerp(sh[1] + 0.02, sh[1] + 0.06, s));
      const rig = sideRig({ hip, torso: 0, head: 0, armN: { to: wr, pref: v(-0.3, 1) }, legN: flatLeg(v(0, ANKLE_H)), legF: flatLeg(v(-0.03, ANKLE_H)) });
      return { rig, props: cable(rig.pts['wristN'] as V, v(0.8, 1.0)) };
    }
    const hip: V = c.supported ? v(-0.25, 0.4) : v(-0.16, 0.515);
    const torso = c.supported ? 62 : 66; const sh = shoulderOf(hip, torso);
    const wr = v(lerp(sh[0] + 0.02, sh[0] - 0.12, s), lerp(sh[1] - 0.32, sh[1] - 0.2, s));
    const rig = sideRig({ hip, torso, head: -14, armN: { to: wr, pref: PREF_BACK }, legN: flatLeg(v(0, ANKLE_H)), legF: flatLeg(v(-0.03, ANKLE_H)) });
    const w = rig.pts['wristN'] as V;
    const props = c.imp === 'band' ? band(w, v(0.5, 0.42)) : c.imp === 'cable' ? cable(w, v(0.7, 0.3)) : held(c.imp, w);
    if (c.supported) props.push({ k: 'line', a: v(-0.55, 0.4), b: v(-0.02, 0.58), w: 0.05, layer: 'back' });
    return { rig, props };
  };
}
export function invertedRow(): Motion {
  return ({ s }) => {
    const barY = 0.82; const toe = v(0, 0); const ankle = add(toe, mul(fromDown(-30), -L.foot));
    // body is a straight line from the ankle up to the shoulder, rising toward the bar
    const D = LEG + L.torso;
    const shY = lerp(barY - 0.33, barY - 0.1, s);
    const sinPhi = clamp((shY - ankle[1]) / D, -0.95, 0.95); const phi = Math.asin(sinPhi);
    const dir = v(Math.cos(phi), Math.sin(phi));
    const hip = add(ankle, mul(dir, LEG)); const torso = 90 - (phi * 180) / Math.PI;
    const sh = shoulderOf(hip, torso);
    const rig = sideRig({ hip, torso, head: -4, armN: { to: v(sh[0] + 0.02, barY), pref: PREF_BACK }, legN: { to: ankle, pref: PREF_FWD, foot: 30 }, legF: { to: ankle, pref: PREF_FWD, foot: 30 } });
    return { rig, props: hangBar(v(sh[0] + 0.02, barY + 0.0)) };
  };
}

/* ------------------------------------------------------- pull-up / pulldown */
export interface PullCfg { wide?: boolean; chin?: boolean; band?: boolean; scapular?: boolean; hang?: boolean; negative?: boolean }
export function pullUp(c: PullCfg): Motion {
  return ({ s }) => {
    const barY = 1.38; const lift = c.hang ? 0 : c.scapular ? 0.06 : 0.235;
    const shY = barY - L.upperArm - L.foreArm + lerp(0, lift, c.hang ? 0 : s);
    const sh = v(0, shY); const torso = c.chin ? -4 : -8;
    const hip = sub(sh, mul(fromUp(torso), L.torso));
    const arm: Arm = { to: v(0.02, barY), pref: PREF_BACK };
    const knee = c.hang ? { fk: [0, 0] as const } : { fk: [-12, -48] as const };
    const rig = sideRig({ hip, torso, head: 6, armN: arm, legN: { ...knee, foot: 10 }, legF: { ...knee, foot: 10 } });
    const props = hangBar(v(0.02, barY));
    if (c.band) props.push({ k: 'line', a: v(0.02, barY), b: v(0.07, hip[1] - 0.4), w: 0.016, dash: true, layer: 'back' });
    return { rig, props };
  };
}
export interface PulldownCfg { imp: Implement; straightArm?: boolean; oneArm?: boolean; trx?: boolean }
export function pulldown(c: PulldownCfg): Motion {
  return ({ s }) => {
    const hip: V = v(0, 0.3); const torso = -10; const sh = shoulderOf(hip, torso);
    const arc = (deg: number): V => add(sh, mul(fromUp(deg), 0.32));
    const wr = c.straightArm
      ? arc(lerp(24, 150, s))
      : v(lerp(sh[0] + 0.03, sh[0] + 0.1, s), lerp(sh[1] + 0.34, sh[1] - 0.04, s));
    const rig = sideRig({ hip, torso, head: 0, armN: { to: wr, pref: v(-0.4, -1) }, legN: { fk: [88, 4], foot: 75 }, legF: { fk: [88, 4], foot: 75 } });
    const w = rig.pts['wristN'] as V;
    const props = c.imp === 'band' ? band(w, v(0.1, 1.55)) : cable(w, v(0.1, 1.55));
    props.push({ k: 'line', a: add(w, v(-0.07, 0)), b: add(w, v(0.07, 0)), w: 0.016, layer: 'front' }, ...bench(-0.25, 0.05, 0.28));
    return { rig, props };
  };
}

/* ----------------------------------------------------- push-ups / planks */
export interface PushCfg { prop?: 'rings' | 'blocks'; handH?: number; footH?: number; kneel?: boolean; wall?: boolean; tempo?: boolean; hold?: boolean; wide?: boolean; elbowsBack?: boolean; forearm?: boolean }
export function pushUp(c: PushCfg): Motion {
  const hh = c.handH ?? 0; const fh = c.footH ?? 0;
  return ({ s }) => {
    const reach = lerp(0.31, 0.12, c.hold ? 0 : s);
    const D = c.kneel ? L.thigh + L.torso : LEG + L.torso;
    let pivot: V; let ankle: V; let kneeFixed: V | null = null;
    if (c.kneel) { pivot = v(0, 0.035); kneeFixed = pivot; ankle = v(-L.shank, 0.045); }
    else { const toe = v(0, fh); ankle = add(toe, mul(fromDown(30), -L.foot)); pivot = ankle; }
    let phi: number;
    if (c.wall) {
      const wallX = D * Math.cos(0.9) + 0.0 + reach0(); // fixed wall for the clip
      const shX = wallX - lerp(0.31, 0.12, s);
      phi = Math.acos(clamp((shX - pivot[0]) / D, -1, 1));
    } else if (c.forearm) {
      phi = Math.asin(clamp((hh + 0.04 + L.upperArm - pivot[1]) / D, -1, 1));
    } else {
      phi = Math.asin(clamp((hh + reach - pivot[1]) / D, -1, 1));
    }
    const dir = v(Math.cos(phi), Math.sin(phi));
    const torso = 90 - (phi * 180) / Math.PI;
    const hip = add(pivot, mul(dir, c.kneel ? L.thigh : LEG));
    const sh = shoulderOf(hip, torso);
    const handY = c.wall ? sh[1] - 0.02 : hh + 0.02;
    const handTarget: V = c.wall ? v(D * Math.cos(0.9) + reach0() + 0.01, handY) : v(sh[0] + (c.wide ? 0.08 : 0.0), handY);
    const arm: Arm = c.forearm ? { fk: [0, 85] } : { to: handTarget, pref: v(-1, 0.25) };
    const legN: Leg = c.kneel ? { to: ankle, pref: PREF_FWD, foot: -90 } : { to: ankle, pref: PREF_FWD, foot: 30 };
    const rig = sideRig({ hip, torso, head: -6, armN: arm, armF: arm, legN, legF: legN });
    void kneeFixed;
    const props: Prop[] = [];
    if (hh > 0 && !c.wall && c.prop === 'rings') props.push({ k: 'line', a: v(sh[0], 1.0), b: v(sh[0], hh + 0.03), w: 0.012, layer: 'back' }, { k: 'circle', c: v(sh[0], hh), r: 0.035, layer: 'front' });
    else if (hh > 0 && !c.wall && c.prop === 'blocks') props.push({ k: 'rect', c: v(sh[0], hh / 2), w: 0.14, h: hh, fill: true, layer: 'back' });
    else if (hh > 0 && !c.wall) props.push(...bench(sh[0] - 0.2, sh[0] + 0.3, hh));
    if (fh > 0) props.push(...bench(-0.25, 0.2, fh));
    if (c.wall) props.push({ k: 'line', a: v(handTarget[0] + 0.03, 0), b: v(handTarget[0] + 0.03, 1.1), w: 0.02, layer: 'back' });
    return { rig, props };
  };
}
function reach0(): number { return 0.31; }

/* ------------------------------------------------------------- bench press */
export interface BenchCfg { imp: Implement; incline?: number; decline?: boolean; fly?: boolean; floor?: boolean; machine?: boolean; svend?: boolean; cableFly?: boolean }
export function benchPress(c: BenchCfg): Motion {
  return ({ s }) => {
    const inc = c.incline ?? 0;
    const benchTop = c.floor ? 0.02 : 0.30;
    // figure lies with head on the left (-x): torso points toward -x, rotated by the incline
    const torsoAng = -(90 - inc);
    const hip: V = v(0.38, benchTop + 0.07);
    const sh = shoulderOf(hip, torsoAng);
    const press = c.fly
      ? v(lerp(sh[0] + 0.02, sh[0] + 0.03, s), lerp(sh[1] + 0.32, sh[1] + 0.33, s))
      : v(sh[0] + 0.01, lerp(sh[1] + 0.07, sh[1] + 0.32, s));
    const wr: V = c.fly ? v(sh[0] + lerp(0.0, 0.0, s), sh[1] + lerp(0.1, 0.33, s)) : press;
    const arm: Arm = c.fly ? { to: wr, pref: v(0, 1) } : { to: wr, pref: v(0.3, -1) };
    // legs extend toward +x (away from the head) with the feet planted on the floor
    const legN: Leg = c.floor ? { fk: [135, 15], foot: 70 } : { fk: [71, 4], foot: 70 };
    const rig = sideRig({ hip, torso: torsoAng, head: 0, armN: arm, legN, legF: legN });
    const w = rig.pts['wristN'] as V;
    const props: Prop[] = [];
    if (!c.floor) props.push({ k: 'rect', c: v(0.1, benchTop - 0.025), w: 0.75, h: 0.05, fill: true, layer: 'back' }, { k: 'line', a: v(-0.2, benchTop - 0.05), b: v(-0.2, 0), w: 0.02, layer: 'back' }, { k: 'line', a: v(0.4, benchTop - 0.05), b: v(0.4, 0), w: 0.02, layer: 'back' });
    if (c.cableFly) props.push(...cable(w, v(0.1, 1.2)));
    else props.push(...held(c.machine ? 'none' : c.imp, w));
    if (c.imp === 'band') props.push(...band(w, v(-0.3, 0.45)));
    return { rig, props };
  };
}
export function dip(bars: boolean): Motion {
  return ({ s }) => {
    const barY = 0.9;
    const shY = lerp(barY + 0.32, barY + 0.17, s); const torso = lerp(8, 26, s);
    const sh = v(0, shY); const hip = sub(sh, mul(fromUp(torso), L.torso));
    const rig = sideRig({ hip, torso, head: 4, armN: { to: v(-0.05, barY), pref: PREF_BACK }, legN: { fk: [-14, -52], foot: 10 }, legF: { fk: [-14, -52], foot: 10 } });
    void bars;
    return { rig, props: hangBar(v(-0.05, barY - 0.01)) };
  };
}
export function benchDip(): Motion {
  return ({ s }) => {
    const benchTop = 0.4; const reach = lerp(0.3, 0.14, s);
    const sh = v(0.0, benchTop + reach); const torso = 4;
    const hip = sub(sh, mul(fromUp(torso), L.torso));
    const rig = sideRig({ hip, torso, head: 0, armN: { to: v(-0.01, benchTop + 0.01), pref: PREF_BACK }, legN: { to: v(0.42, ANKLE_H), pref: PREF_FWD, foot: FOOT_FLAT }, legF: { to: v(0.45, ANKLE_H), pref: PREF_FWD, foot: FOOT_FLAT } });
    return { rig, props: bench(-0.12, 0.1, benchTop) };
  };
}

/* ------------------------------------------------------------ supine/prone */
export function crunch(kind: 'crunch' | 'situp' | 'reverse' | 'legraise' | 'vup' | 'bicycle' | 'deadbug' | 'hollow'): Motion {
  // Supine, head toward -x. Limb angles are measured from straight down: 90 = along the floor toward +x, 180 = straight up.
  const hip: V = v(0.0, 0.075);
  const bent: Leg = { fk: [135, 15], foot: 70 };
  return ({ s, u, side }) => {
    if (kind === 'crunch' || kind === 'situp') {
      const torso = -lerp(90, kind === 'situp' ? 12 : 58, s);
      const sh = shoulderOf(hip, torso);
      const rig = sideRig({ hip, torso, head: kind === 'situp' ? 0 : 12, armN: { to: add(sh, v(0.0, 0.06)), pref: v(-0.4, 1) }, legN: bent, legF: bent });
      return { rig, props: [] };
    }
    if (kind === 'reverse') {
      const th = lerp(150, 182, s); const sk = th - 78;
      const rig = sideRig({ hip: add(hip, v(0, lerp(0, 0.03, s))), torso: -90, head: 0, armN: { fk: [96, 96] }, legN: { fk: [th, sk], foot: 70 }, legF: { fk: [th, sk], foot: 70 } });
      return { rig, props: [] };
    }
    if (kind === 'legraise') {
      const th = lerp(97, 178, s);
      const rig = sideRig({ hip, torso: -90, head: 0, armN: { fk: [96, 96] }, legN: { fk: [th, th], foot: 80 }, legF: { fk: [th, th], foot: 80 } });
      return { rig, props: [] };
    }
    if (kind === 'vup') {
      const torso = -lerp(90, 40, s); const th = lerp(96, 138, s);
      const rig = sideRig({ hip, torso, head: 0, armN: { fk: [lerp(260, 118, s), lerp(260, 118, s)] }, legN: { fk: [th, th], foot: 80 }, legF: { fk: [th, th], foot: 80 } });
      return { rig, props: [] };
    }
    if (kind === 'bicycle') {
      const a = u * Math.PI * 2;
      const leg = (ph: number): Leg => ({ fk: [140 + 32 * Math.sin(ph), 80 - 38 * Math.sin(ph)], foot: 70 });
      const sh = shoulderOf(hip, -58);
      const rig = sideRig({ hip, torso: -58, head: 12, armN: { to: add(sh, v(0.0, 0.06)), pref: v(-0.4, 1) }, legN: leg(a), legF: leg(a + Math.PI) });
      return { rig, props: [] };
    }
    if (kind === 'deadbug') {
      const a = side === 0 ? s : 0; const b = side === 0 ? 0 : s;
      const rig = sideRig({
        hip, torso: -90, head: 0,
        armN: { fk: [lerp(180, 262, a), lerp(180, 262, a)] }, armF: { fk: [lerp(180, 262, b), lerp(180, 262, b)] },
        legN: { fk: [lerp(180, 100, b), lerp(90, 98, b)], foot: 70 }, legF: { fk: [lerp(180, 100, a), lerp(90, 98, a)], foot: 70 },
      });
      return { rig, props: [] };
    }
    const rig = sideRig({ hip, torso: -lerp(84, 80, s), head: 4, armN: { fk: [-100, -100] }, legN: { fk: [100, 100], foot: 80 }, legF: { fk: [100, 100], foot: 80 } });
    return { rig, props: [] };
  };
}

export function bridge(thrust: boolean, imp: Implement): Motion {
  return ({ s }) => {
    const hipY = lerp(0.075, thrust ? 0.34 : 0.3, s);
    const hip = v(0, hipY);
    // shoulders stay on the floor / bench edge: choose the torso angle that keeps them at that height
    const shY = thrust ? 0.34 : 0.075;
    const torso = -(Math.acos(clamp((shY - hipY) / L.torso, -1, 1)) * 180) / Math.PI;
    const ankleN = v(0.30, ANKLE_H); const ankleF = v(0.27, ANKLE_H);
    const rig = sideRig({ hip, torso, head: 0, armN: { fk: [92, 92] }, legN: { to: ankleN, pref: PREF_FWD, foot: FOOT_FLAT }, legF: { to: ankleF, pref: PREF_FWD, foot: FOOT_FLAT } });
    const props: Prop[] = [];
    if (thrust) props.push(...bench(-0.62, -0.3, 0.3));
    if (imp === 'barbell') props.push(...barbell(add(hip, v(0.05, 0.09))));
    return { rig, props };
  };
}

export function plank(kind: 'forearm' | 'high' | 'side' | 'rkc'): Motion {
  return ({ s }) => {
    if (kind === 'side') {
      const rig = frontRig({ hip: v(0, 0.22), armL: { out: [160 - 10 * s, 170] }, legOut: [86, 88], tilt: 82 });
      return { rig, props: [] };
    }
    return pushUp({ hold: true, forearm: kind !== 'high', handH: 0 })({ s: s * 0.1, u: 0, side: 0 });
  };
}

/* --------------------------------------------------------- twist / chop */
export function russianTwist(): Motion {
  return ({ s }) => {
    const hip: V = v(0, 0.07); const torso = -50 + 0;
    const sh = shoulderOf(hip, torso);
    const sway = lerp(-0.1, 0.1, s);
    const rig = sideRig({ hip, torso, head: 0, armN: { to: v(sh[0] + 0.2 + sway * 0.4, sh[1] - 0.07), pref: PREF_DOWN }, legN: { fk: [120, 40], foot: 80 }, legF: { fk: [120, 40], foot: 80 } });
    return { rig, props: dumbbell(rig.pts['wristN'] as V) };
  };
}
export function woodChop(imp: Implement): Motion {
  return ({ s }) => {
    const hip: V = v(0, HIP0); const torso = lerp(-4, 14, s); const sh = shoulderOf(hip, torso);
    const wr = v(lerp(sh[0] + 0.14, sh[0] + 0.12, s), lerp(sh[1] + 0.3, sh[1] - 0.28, s));
    const rig = sideRig({ hip, torso, head: 0, armN: { to: wr, pref: v(0.3, -1) }, legN: flatLeg(v(0, ANKLE_H)), legF: flatLeg(v(-0.03, ANKLE_H)) });
    return { rig, props: imp === 'band' ? band(rig.pts['wristN'] as V, v(-0.3, 1.2)) : cable(rig.pts['wristN'] as V, v(-0.3, 1.3)) };
  };
}
export function palloff(imp: Implement): Motion {
  return ({ s }) => {
    const hip: V = v(0, HIP0); const sh = shoulderOf(hip, 0);
    const wr = v(lerp(sh[0] + 0.07, sh[0] + 0.33, s), sh[1] - 0.05);
    const rig = sideRig({ hip, torso: 0, head: 0, armN: { to: wr, pref: PREF_DOWN }, legN: flatLeg(v(0, ANKLE_H)), legF: flatLeg(v(-0.03, ANKLE_H)) });
    const w = rig.pts['wristN'] as V;
    return { rig, props: imp === 'band' ? band(w, v(-0.6, sh[1] - 0.05)) : cable(w, v(-0.6, sh[1] - 0.05)) };
  };
}
export function birdDog(): Motion {
  return ({ s, side }) => {
    const hip: V = v(0.0, 0.3);
    const torso = 88; const sh = shoulderOf(hip, torso);
    const a = side === 0 ? s : 0;
    const rig = sideRig({
      hip, torso, head: -8,
      armN: { to: v(lerp(sh[0], sh[0] + 0.33, a), lerp(0.03, sh[1], a)), pref: PREF_BACK }, armF: { to: v(sh[0] + 0.0, 0.03), pref: PREF_BACK },
      legN: { to: v(lerp(-0.2, -0.5, a), lerp(0.05, 0.3, a)), pref: PREF_FWD, foot: -90 }, legF: { to: v(-0.2, 0.05), pref: PREF_FWD, foot: -90 },
    });
    return { rig, props: [] };
  };
}

/* ----------------------------------------------------------- calves etc. */
export function calfRaise(imp: Implement, single = false): Motion {
  return ({ s }) => {
    const rise = lerp(0, 0.075, s);
    const toe = v(0.0, 0);
    const foot = lerp(FOOT_FLAT, 20, s);
    const ankle = sub(toe, mul(fromDown(foot), L.foot));
    const hip = v(ankle[0], ankle[1] + LEG * 0.995);
    const rig = sideRig({ hip, torso: 0, head: 0, armN: { fk: [4, 6] }, legN: { to: ankle, pref: PREF_FWD, foot }, legF: single ? { to: add(ankle, v(-0.12, 0.2)), pref: PREF_BACK, foot: 40 } : { to: add(ankle, v(-0.03, 0)), pref: PREF_FWD, foot } });
    void rise;
    return { rig, props: imp === 'dumbbell' ? held(imp, rig.pts['wristN'] as V) : [] };
  };
}

export function jumpingJack(): Motion {
  return ({ u }) => {
    const s = 0.5 - 0.5 * Math.cos(u * Math.PI * 2);
    const rig = frontRig({ hip: v(0, HIP0 + 0.015 * Math.sin(u * Math.PI)), armL: { out: [lerp(8, 165, s), lerp(8, 165, s)] }, legOut: [lerp(2, 20, s), lerp(2, 20, s)] });
    return { rig, props: [] };
  };
}
