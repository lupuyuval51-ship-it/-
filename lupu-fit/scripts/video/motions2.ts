/** Second batch of motion programs: hanging, floor, machine, front-view and cyclic movements. */
import { add, clamp, fromDown, fromUp, ik, lerp, mul, norm, sub, v, type V } from './geom.ts';
import { ANKLE_H, FOOT_FLAT, L, frontRig, sideRig, type Leg, type Rig, type Seg } from './rig.ts';
import { hinge, HIP0, type Implement, type Motion } from './motions.ts';
import { band, barbell, bench, box, cable, dumbbell, hangBar, kettlebell, medBall, wheel, type Prop } from './scene.ts';

const LEG = L.thigh + L.shank;
const PREF_FWD: V = v(1, 0); const PREF_BACK: V = v(-1, 0); const PREF_DOWN: V = v(0, -1);
const flat = (a: V, pref: V = PREF_FWD): Leg => ({ to: a, pref, foot: FOOT_FLAT });
const shoulderOf = (hip: V, torso: number): V => add(hip, mul(fromUp(torso), L.torso));
const held = (imp: Implement, w: V): Prop[] => (imp === 'barbell' ? barbell(w) : imp === 'dumbbell' ? dumbbell(w) : imp === 'kettlebell' ? kettlebell(w) : []);

/* ------------------------------------------------------------- hanging */
export function hangRaise(knee: boolean): Motion {
  return ({ s }) => {
    const barY = 1.45; const sh = v(0, barY - L.upperArm - L.foreArm); const hip = sub(sh, v(0, L.torso));
    const th = lerp(4, knee ? 105 : 88, s); const sk = knee ? lerp(4, 20, s) : th;
    const leg: Leg = { fk: [th, sk], foot: knee ? 60 : 80 };
    const rig = sideRig({ hip, torso: lerp(0, -8, s), head: 4, armN: { to: v(0.0, barY), pref: PREF_BACK }, legN: leg, legF: leg });
    return { rig, props: hangBar(v(0, barY)) };
  };
}

/* ------------------------------------------------- kneeling roll-outs */
export function rollout(wheelOn: boolean, nordic = false): Motion {
  return ({ s }) => {
    const knee = v(0, 0.035);
    const phi = ((lerp(86, nordic ? 25 : 14, s)) * Math.PI) / 180; // body line angle above horizontal
    const dir = v(Math.cos(phi), Math.sin(phi));
    const hip = add(knee, mul(dir, L.thigh)); const torso = 90 - (phi * 180) / Math.PI;
    const sh = shoulderOf(hip, torso);
    const handsAt = v(sh[0] + (nordic ? 0.12 * s : 0.0), nordic ? lerp(0.5, 0.03, s) : 0.05);
    const arm = { to: nordic ? add(sh, v(0.04, -0.28)) : handsAt, pref: PREF_BACK };
    const legs: Leg = { to: v(-L.shank, 0.045), pref: PREF_FWD, foot: -90 };
    const rig = sideRig({ hip, torso, head: -8, armN: arm, legN: legs, legF: legs });
    return { rig, props: wheelOn ? wheel(rig.pts['wristN'] as V) : [] };
  };
}

/* -------------------------------------------------------- floor / prone */
export function kicks(kind: 'flutter' | 'scissor'): Motion {
  return ({ u }) => {
    const hip = v(0, 0.075); const a = u * Math.PI * 2;
    const amp = kind === 'flutter' ? 9 : 16;
    const legN: Leg = { fk: [100 + amp * Math.sin(a), 100 + amp * Math.sin(a)], foot: 80 };
    const legF: Leg = { fk: [100 - amp * Math.sin(a), 100 - amp * Math.sin(a)], foot: 80 };
    const rig = sideRig({ hip, torso: -80, head: 14, armN: { fk: [96, 96] }, legN, legF });
    return { rig, props: [] };
  };
}
export function wipers(): Motion {
  return ({ s }) => {
    const hip = v(0, 0.075); const t = lerp(168, 190, s);
    const rig = sideRig({ hip, torso: -90, head: 0, armN: { fk: [-100, -100] }, legN: { fk: [t, t], foot: 80 }, legF: { fk: [t, t], foot: 80 } });
    return { rig, props: [] };
  };
}
/** Prone (face-down, head toward +x). 'y' lifts straight arms overhead; the others are labelled approximate (frontal-plane moves). */
export function proneRaise(mode: 'y' | 't' | 'superman' | 'snow' | 'pull'): Motion {
  return ({ s }) => {
    const hip = v(0, 0.1);
    const sup = mode === 'superman';
    const torso = 90 - (sup ? lerp(0, 16, s) : mode === 'y' ? lerp(0, 8, s) : mode === 'pull' ? lerp(0, 12, s) : 0);
    const lift = mode === 'pull' ? lerp(0, -10, s) : lerp(0, mode === 'y' ? 45 : sup ? 22 : 30, s);
    const arm = { fk: [90 + lift, 90 + lift] as const };
    const th = -90 - (sup ? lerp(0, 14, s) : 0);
    const legs: Leg = { fk: [th, th], foot: -100 };
    const rig = sideRig({ hip, torso, head: sup || mode === 'y' ? lerp(0, -12, s) : 0, armN: arm, legN: legs, legF: legs });
    return { rig, props: [] };
  };
}
export function sideLying(which: 'top' | 'bottom' | 'clam'): Motion {
  return ({ s }) => {
    const hip = v(0, 0.09);
    const top: Leg = which === 'top' ? { fk: [lerp(92, 128, s), lerp(92, 128, s)], foot: 80 } : which === 'clam' ? { fk: [lerp(120, 150, s), lerp(60, 70, s)], foot: 70 } : { fk: [92, 92], foot: 80 };
    const bottom: Leg = which === 'bottom' ? { fk: [lerp(92, 124, s), lerp(92, 124, s)], foot: 80 } : which === 'clam' ? { fk: [120, 60], foot: 70 } : { fk: [92, 92], foot: 80 };
    const rig = sideRig({ hip, torso: -90, head: 0, armN: { fk: [-100, -100] }, legN: top, legF: bottom });
    return { rig, props: [] };
  };
}
export function lyingCurl(machine: boolean): Motion {
  return ({ s }) => {
    const hip = v(0, 0.14);
    const sh = -90 - lerp(0, 80, s); // heel toward the glutes
    const rig = sideRig({ hip, torso: 90, head: 0, armN: { fk: [100, 100] }, legN: { fk: [-90, sh], foot: -100 }, legF: { fk: [-90, sh], foot: -100 } });
    return { rig, props: machine ? bench(-0.5, 0.45, 0.1) : [] };
  };
}
export function hamBridge(): Motion {
  return ({ s }) => {
    const hipY = lerp(0.09, 0.32, s); const hip = v(0, hipY);
    const torso = -(Math.acos(clamp((0.075 - hipY) / L.torso, -1, 1)) * 180) / Math.PI;
    const ankle = v(lerp(0.49, 0.28, s), 0.1);
    const leg: Leg = { to: ankle, pref: PREF_FWD, foot: 40 };
    const rig = sideRig({ hip, torso, head: 0, armN: { fk: [92, 92] }, legN: leg, legF: leg });
    return { rig, props: [{ k: 'circle', c: add(ankle, v(0.04, -0.01)), r: 0.09, layer: 'front' }] };
  };
}

/* ---------------------------------------------------------- quadruped */
export function quadruped(kind: 'donkey' | 'bear' | 'cat'): Motion {
  return ({ s, u }) => {
    if (kind === 'bear') {
      const hip = v(-0.12, 0.4); const torso = 76; const sh = shoulderOf(hip, torso);
      const rig = sideRig({ hip, torso, head: -8, armN: { to: v(sh[0] + 0.02, 0.03), pref: PREF_BACK }, legN: { to: v(-0.4, 0.05), pref: PREF_FWD, foot: 20 }, legF: { to: v(-0.43, 0.05), pref: PREF_FWD, foot: 20 } });
      return { rig, props: [] };
    }
    const hip = v(0.0, 0.3);
    const arch = kind === 'cat' ? lerp(84, 98, s) : 88;
    const sh = shoulderOf(hip, arch);
    const kneeY = 0.04;
    const arm = { to: v(sh[0] + 0.01, 0.03), pref: PREF_BACK };
    const legStatic: Leg = { to: v(-0.2, kneeY + 0.01), pref: PREF_FWD, foot: -90 };
    const legUp: Leg = kind === 'donkey' ? { to: v(lerp(-0.2, -0.38, s), lerp(0.05, 0.4, s)), pref: PREF_FWD, foot: lerp(-90, 100, s) } : legStatic;
    const rig = sideRig({ hip, torso: arch, head: kind === 'cat' ? lerp(-6, 20, s) : -8, armN: arm, legN: legUp, legF: legStatic });
    void u; return { rig, props: [] };
  };
}

/* ----------------------------------------------------------- plank forms */
/**
 * Side plank (front view): forearm on the floor, feet or knee on the floor. The hip is solved so that the torso keeps
 * its length and the legs reach the support point, so no bone ever stretches.
 */
export function sidePlank(variant: 'plain' | 'knee' | 'dip' | 'lift'): Motion {
  return ({ s }) => {
    const elbow = v(0.64, 0.04); const wrist = v(elbow[0] + L.foreArm, 0.04);
    const shoulder = v(elbow[0], elbow[1] + L.upperArm);
    const kneeVariant = variant === 'knee';
    const chain = kneeVariant ? L.thigh : LEG;
    const supY = 0.035; const dxFull = Math.sqrt(Math.max(0.01, (chain + L.torso) ** 2 - (shoulder[1] - supY) ** 2));
    const support: V = v(shoulder[0] - dxFull * 0.998, supY);
    const toSupport = sub(support, shoulder); const dist = Math.hypot(toSupport[0], toSupport[1]);
    // hip lies on the circle of radius torso around the shoulder, rotated by a sag angle (hip dip) off the straight line
    const sag = variant === 'dip' ? lerp(0.0, 0.34, 1 - s) : 0;
    const baseAng = Math.atan2(toSupport[1], toSupport[0]) + sag;
    const hip = add(shoulder, v(Math.cos(baseAng) * L.torso, Math.sin(baseAng) * L.torso));
    void dist; void chain;
    const mid = add(hip, mul(sub(shoulder, hip), 0.5));
    const neckDir = norm(sub(shoulder, hip)); const neck = add(shoulder, mul(neckDir, L.neck)); const head = add(neck, mul(neckDir, L.headR));
    const lowerLeg = (target: V): { knee: V; ankle: V } => { const r = ik(hip, target, L.thigh, L.shank, v(0, 1)); return { knee: r.mid, ankle: r.end }; };
    const nearTarget: V = kneeVariant ? v(support[0] - L.shank, 0.04) : support;
    const near = lowerLeg(nearTarget);
    const farTarget: V = variant === 'lift' ? v(lerp(support[0], support[0] - 0.12, s), lerp(support[1], 0.3, s)) : kneeVariant ? v(support[0] - L.shank, 0.04) : add(support, v(0, 0.0));
    const far = lowerLeg(farTarget);
    const nearKnee = kneeVariant ? support : near.knee;
    const handElbow = add(shoulder, v(0.0, L.upperArm)); const hand = add(handElbow, v(0.0, L.foreArm));
    const segs: Seg[] = [
      { a: hip, b: far.knee, part: 'thigh', layer: 'far', side: 'F' }, { a: far.knee, b: far.ankle, part: 'shank', layer: 'far', side: 'F' },
      { a: hip, b: mid, part: 'torso_lower', layer: 'mid', side: 'C' }, { a: mid, b: shoulder, part: 'torso_upper', layer: 'mid', side: 'C' }, { a: shoulder, b: neck, part: 'neck', layer: 'mid', side: 'C' },
      { a: hip, b: nearKnee, part: 'thigh', layer: 'near', side: 'N' }, { a: nearKnee, b: near.ankle, part: 'shank', layer: 'near', side: 'N' },
      { a: shoulder, b: elbow, part: 'upperArm', layer: 'near', side: 'N' }, { a: elbow, b: wrist, part: 'foreArm', layer: 'near', side: 'N' },
      { a: shoulder, b: handElbow, part: 'upperArm', layer: 'far', side: 'F' }, { a: handElbow, b: hand, part: 'foreArm', layer: 'far', side: 'F' },
    ];
    const rig: Rig = { segs, head: { c: head, r: L.headR }, pts: { hip, shoulder, mid, head, wristN: wrist, wristF: hand, elbowN: elbow, elbowF: handElbow, kneeN: nearKnee, ankleN: near.ankle, toeN: near.ankle, kneeF: far.knee, ankleF: far.ankle, toeF: far.ankle } };
    return { rig, props: [] };
  };
}
export function plankTap(kind: 'taps' | 'legLift'): Motion {
  return ({ s, side }) => {
    const reach = 0.31; const toe = v(0, 0); const ankle = add(toe, mul(fromDown(30), -L.foot));
    const phi = Math.asin(clamp((reach - ankle[1]) / (LEG + L.torso), -1, 1));
    const dir = v(Math.cos(phi), Math.sin(phi)); const hip = add(ankle, mul(dir, LEG)); const torso = 90 - (phi * 180) / Math.PI; const sh = shoulderOf(hip, torso);
    const plant: V = v(sh[0], 0.02);
    const tapT = add(sh, v(0.14, -0.06 + lerp(0, 0.12, 0)));
    const armUp = kind === 'taps' ? { to: v(lerp(plant[0], tapT[0], s), lerp(plant[1], sh[1] - 0.05, s)), pref: PREF_BACK } : { to: plant, pref: PREF_BACK };
    const legUp: Leg = kind === 'legLift' ? { to: v(lerp(ankle[0], ankle[0] - 0.12, s), lerp(ankle[1], ankle[1] + 0.22, s)), pref: PREF_FWD, foot: 30 } : { to: ankle, pref: PREF_FWD, foot: 30 };
    const rig = sideRig({ hip, torso, head: -6, armN: kind === 'taps' ? (side === 0 ? armUp : { to: plant, pref: PREF_BACK }) : { to: plant, pref: PREF_BACK }, armF: { to: plant, pref: PREF_BACK }, legN: legUp, legF: { to: ankle, pref: PREF_FWD, foot: 30 } });
    return { rig, props: [] };
  };
}
export function lSit(vSit: boolean): Motion {
  return ({ s }) => {
    if (vSit) {
      const hip = v(0, 0.075); const torso = -lerp(32, 38, s);
      const rig = sideRig({ hip, torso, head: 0, armN: { fk: [88, 88] }, legN: { fk: [lerp(132, 138, s), lerp(132, 138, s)], foot: 80 }, legF: { fk: [lerp(132, 138, s), lerp(132, 138, s)], foot: 80 } });
      return { rig, props: [] };
    }
    const handY = 0.16; const sh = v(0, handY + 0.31); const hip = sub(sh, v(0, L.torso));
    const lift = lerp(86, 94, s);
    const rig = sideRig({ hip, torso: 0, head: 0, armN: { to: v(0.0, handY), pref: PREF_BACK }, legN: { fk: [lift, lift], foot: 85 }, legF: { fk: [lift, lift], foot: 85 } });
    return { rig, props: [{ k: 'rect', c: v(0, handY - 0.03), w: 0.12, h: 0.06, fill: true, layer: 'back' }] };
  };
}

import { invertedRow } from './motions.ts';
export const invertedRowAlias = (): Motion => invertedRow();

/* ------------------------------------------------------------- inverted */
export function pike(press: boolean): Motion {
  return ({ s }) => {
    const handsAt = v(0.02, 0.02); const reach = press ? lerp(0.31, 0.16, s) : 0.27;
    const sh = v(handsAt[0], handsAt[1] + reach);
    const dirBack = v(-0.8, 0.6); const hip = add(sh, mul(dirBack, L.torso));
    const dy = hip[1] - ANKLE_H; const ankle = v(hip[0] - Math.sqrt(Math.max(0.01, LEG * LEG * 0.97 - dy * dy)), ANKLE_H);
    const torso = (Math.atan2(-dirBack[0], -dirBack[1]) * 180) / Math.PI; // hip -> shoulder direction
    const rig = sideRig({ hip, torso, head: -30, armN: { to: handsAt, pref: PREF_BACK }, legN: { to: ankle, pref: PREF_FWD, foot: 40 }, legF: { to: ankle, pref: PREF_FWD, foot: 40 } });
    return { rig, props: [] };
  };
}
export function handstand(press: boolean): Motion {
  return ({ s }) => {
    const hands = v(0.0, 0.02); const reach = press ? lerp(0.31, 0.15, s) : 0.31;
    const sh = v(0, reach + 0.02); const hip = add(sh, v(-0.02, L.torso));
    const rig = sideRig({ hip, torso: 178, head: -10, armN: { to: hands, pref: PREF_BACK }, legN: { fk: [176, 178], foot: 150 }, legF: { fk: [176, 178], foot: 150 } });
    return { rig, props: [{ k: 'line', a: v(-0.17, 0), b: v(-0.17, 1.5), w: 0.02, layer: 'back' }] };
  };
}

/* --------------------------------------------------------------- machines */
export function legPress(): Motion {
  return ({ s }) => {
    const hip = v(-0.34, 0.3); const torso = -52;
    const d = lerp(0.46, 0.27, s); const ang = (38 * Math.PI) / 180;
    const ankle = add(hip, v(Math.cos(ang) * d, Math.sin(ang) * d));
    const sh = shoulderOf(hip, torso);
    const rig = sideRig({ hip, torso, head: 6, armN: { fk: [50, 60] }, legN: { to: ankle, pref: v(0, 1), foot: 120 }, legF: { to: ankle, pref: v(0, 1), foot: 120 } });
    void sh;
    return { rig, props: [{ k: 'line', a: add(ankle, v(0.04, -0.1)), b: add(ankle, v(0.04, 0.12)), w: 0.03, layer: 'back' }, { k: 'line', a: v(-0.7, 0.05), b: v(-0.3, 0.42), w: 0.06, layer: 'back' }] };
  };
}
export function legExtension(seatedCalf = false): Motion {
  return ({ s }) => {
    const hip = v(0, 0.3);
    const sk = seatedCalf ? 0 : lerp(4, 84, s);
    const foot = seatedCalf ? lerp(75, 35, s) : 80;
    const rig = sideRig({ hip, torso: -6, head: 0, armN: { fk: [20, 25] }, legN: { fk: [90, sk], foot }, legF: { fk: [90, sk], foot } });
    return { rig, props: [...bench(-0.2, 0.1, 0.28), { k: 'rect', c: v(-0.2, 0.55), w: 0.05, h: 0.5, fill: true, layer: 'back' }] };
  };
}
export function machinePress(standing: boolean, imp: Implement): Motion {
  return ({ s }) => {
    const hip = standing ? v(0, HIP0) : v(0, 0.3); const sh = shoulderOf(hip, standing ? 4 : -3);
    const wr = v(lerp(sh[0] + 0.1, sh[0] + 0.34, s), sh[1] - 0.04);
    const legN: Leg = standing ? flat(v(0, ANKLE_H)) : { fk: [90, 2], foot: 80 };
    const rig = sideRig({ hip, torso: standing ? 4 : -3, head: 0, armN: { to: wr, pref: PREF_BACK }, legN, legF: legN });
    const w = rig.pts['wristN'] as V;
    const props: Prop[] = imp === 'band' ? band(w, v(-0.4, sh[1] - 0.04)) : imp === 'cable' ? cable(w, v(-0.5, sh[1] - 0.04)) : [];
    if (!standing) props.push(...bench(-0.2, 0.1, 0.28), { k: 'rect', c: v(-0.2, 0.55), w: 0.05, h: 0.5, fill: true, layer: 'back' });
    return { rig, props };
  };
}
export function standingFly(imp: Implement, low = false, high = false): Motion {
  return ({ s }) => {
    const hip = v(0, HIP0); const sh = shoulderOf(hip, 6);
    // hands sweep an arc around the shoulder (never through it), arm slightly bent
    const [from, to] = high ? [150, 78] : low ? [38, 128] : [52, 100];
    const wr = add(sh, mul(fromDown(lerp(from, to, s)), 0.27));
    const rig = sideRig({ hip, torso: 6, head: 0, armN: { to: wr, pref: v(-0.3, -1) }, legN: flat(v(0, ANKLE_H)), legF: flat(v(-0.03, ANKLE_H)) });
    const w = rig.pts['wristN'] as V;
    return { rig, props: imp === 'band' ? band(w, v(-0.5, sh[1] + 0.1)) : cable(w, v(-0.5, low ? 0.15 : 1.35)) };
  };
}
/** Forearm resting on the thigh; the hand (drawn as a short segment) flexes/extends at the wrist. */
export function wristCurl(reverse = false): Motion {
  return ({ s }) => {
    const hip = v(0, 0.3);
    const rig = sideRig({ hip, torso: 18, head: 0, armN: { fk: [30, 88] }, legN: { fk: [90, 2], foot: 80 }, legF: { fk: [90, 2], foot: 80 } });
    const w = rig.pts['wristN'] as V;
    const a = reverse ? lerp(78, 128, s) : lerp(60, 122, s); // hand direction, degrees from down
    const end = add(w, mul(fromDown(a), 0.065));
    return { rig, props: [{ k: 'line', a: w, b: end, w: 0.03, layer: 'front' }, ...dumbbell(add(end, mul(fromDown(a), 0.02)), 90 - a)] };
  };
}
/** Isometric curl against a towel under the foot or the underside of a table (the arm barely moves). */
export function isoCurl(kind: 'towel' | 'table'): Motion {
  return ({ s }) => {
    const hip = v(0, HIP0);
    const f = 95 + 3 * s;
    const rig = sideRig({ hip, torso: 0, head: 0, armN: { fk: [5, f] }, legN: flat(v(0, ANKLE_H)), legF: flat(v(-0.03, ANKLE_H)) });
    const w = rig.pts['wristN'] as V;
    const props: Prop[] = kind === 'towel'
      ? [{ k: 'line', a: w, b: v(0.1, ANKLE_H + 0.02), w: 0.012, layer: 'front', far: true }, { k: 'circle', c: v(0.1, ANKLE_H + 0.02), r: 0.015, fill: true, layer: 'front', far: true }]
      : [{ k: 'rect', c: v(w[0] + 0.12, w[1] + 0.075), w: 0.5, h: 0.04, fill: true, layer: 'back' }, { k: 'line', a: v(w[0] + 0.34, w[1] + 0.055), b: v(w[0] + 0.34, 0), w: 0.02, layer: 'back' }];
    return { rig, props };
  };
}
export function sideBend(): Motion {
  return ({ s }) => {
    const rig = frontRig({ hip: v(0, HIP0), tilt: lerp(-3, 22, s), armL: { out: [4, 4] }, legOut: [2, 2] });
    return { rig, props: dumbbell(rig.pts['wristN'] as V) };
  };
}
const legY = (h: number, a1: number, a2: number) => h - L.thigh * Math.cos((a1 * Math.PI) / 180) - L.shank * Math.cos((a2 * Math.PI) / 180);
export function lateral(kind: 'lunge' | 'cossack'): Motion {
  return ({ s }) => {
    const a1 = lerp(10, kind === 'cossack' ? 62 : 48, s);
    // bent leg: thigh a1, shank straighter; solve hip height so that foot is on the floor
    const a2 = lerp(2, 8, s); const h = ANKLE_H + L.thigh * Math.cos((a1 * Math.PI) / 180) + L.shank * Math.cos((a2 * Math.PI) / 180);
    const straight = Math.acos(clamp((h - ANKLE_H) / LEG, 0.2, 1)) * 180 / Math.PI;
    const rig = frontRig({ hip: v(0, h), armL: { out: [lerp(5, 40, s), lerp(5, 70, s)] }, legOut: [a1, a2], legOutR: [straight, straight] });
    void legY; return { rig, props: kind === 'lunge' ? [] : [] };
  };
}
export function lateralWalk(): Motion {
  return ({ u }) => {
    const step = 0.5 - 0.5 * Math.cos(u * Math.PI * 2);
    const h = HIP0 - 0.05;
    const rig = frontRig({ hip: v(0, h), armL: { out: [12, 12] }, legOut: [lerp(8, 22, step), lerp(8, 4, step)], legOutR: [8, 8] });
    return { rig, props: [{ k: 'line', a: rig.pts['kneeN'] as V, b: rig.pts['kneeF'] as V, w: 0.012, dash: true, layer: 'front' }] };
  };
}
export function armsFront(kind: 'circle' | 'slide' | 'pullApart' | 'extRot' | 'shoulderPass'): Motion {
  return ({ s, u }) => {
    const hip = v(0, HIP0);
    let arm: readonly [number, number];
    if (kind === 'circle') arm = [88 + 10 * Math.sin(u * 6.28318), 88 + 10 * Math.sin(u * 6.28318)];
    else if (kind === 'slide') arm = [lerp(95, 160, s), lerp(95, 175, s)];
    else if (kind === 'pullApart') arm = [lerp(52, 90, s), lerp(52, 90, s)];
    else if (kind === 'extRot') arm = [3, lerp(-85, 85, s)];
    else arm = [lerp(110, 170, s), lerp(110, 170, s)];
    const rig = frontRig({ hip, armL: { out: arm }, legOut: [3, 3] });
    return { rig, props: kind === 'pullApart' ? band(rig.pts['wristN'] as V, rig.pts['wristF'] as V) : [] };
  };
}

/* --------------------------------------------------------- jumps / cardio */
/** Crouch depth 0..1 over a jump cycle ph in [0,2): load, extend at takeoff (ph 0.5), flight, land and absorb. */
const smoothstep = (x: number) => { const t = clamp(x, 0, 1); return t * t * (3 - 2 * t); };
function crouchAt(ph: number): number {
  if (ph < 0.35) return smoothstep(ph / 0.35);
  if (ph < 0.5) return 1 - smoothstep((ph - 0.35) / 0.15);
  if (ph < 1.6) return 0;
  if (ph < 1.75) return smoothstep((ph - 1.6) / 0.15);
  return 1 - smoothstep((ph - 1.75) / 0.25);
}
export function jump(kind: 'squat' | 'tuck' | 'broad' | 'skater'): Motion {
  return ({ u }) => {
    const ph = u * 2;
    const dep = crouchAt(ph);
    const air = ph >= 0.5 && ph <= 1.6 ? Math.sin(((ph - 0.5) / 1.1) * Math.PI) : 0;
    const tuck = kind === 'tuck' ? air : air * 0.25;
    const hipY = lerp(HIP0, 0.34, dep) + air * 0.24 - tuck * 0.05;
    const hip: V = v(lerp(0, -0.1, dep) + (kind === 'broad' ? air * 0.1 : 0), hipY);
    const ankle: V = v(tuck * 0.12, ANKLE_H + air * 0.26 + tuck * 0.12);
    const leg: Leg = { to: ankle, pref: PREF_FWD, foot: lerp(FOOT_FLAT, 20, clamp(air * 1.5, 0, 1)) };
    const sway = lerp(-25, 150, clamp(air * 1.2 + (dep > 0.05 ? 0 : 0), 0, 1)) * (1 - dep * 0.0);
    const arm = { fk: [sway, sway] as const };
    const rig = sideRig({ hip, torso: lerp(4, 36, dep), head: -6, armN: arm, legN: leg, legF: leg });
    return { rig, props: [] };
  };
}
export function boxJump(): Motion {
  return ({ u }) => {
    const boxH = 0.3;
    // 0-.3 load & takeoff, .3-.5 flight onto box, .5-.65 stand tall, .65-.85 step down, .85-1 reset
    const up = smoothstep((u - 0.3) / 0.2) - smoothstep((u - 0.65) / 0.2);
    const dep = u < 0.3 ? Math.sin((u / 0.3) * Math.PI * 0.5) * (1 - smoothstep((u - 0.2) / 0.1)) + 0 : u > 0.85 ? 0 : 0;
    const air = u >= 0.3 && u <= 0.5 ? Math.sin(((u - 0.3) / 0.2) * Math.PI) : 0;
    const hipY = lerp(HIP0, 0.34, clamp(dep, 0, 1)) + up * boxH + air * 0.12;
    const ankle: V = v(up * 0.18, ANKLE_H + up * boxH + air * 0.1);
    const leg: Leg = { to: ankle, pref: PREF_FWD, foot: FOOT_FLAT };
    const armT = smoothstep((u - 0.12) / 0.3) - smoothstep((u - 0.5) / 0.3);
    const sway = lerp(-25, 120, clamp(armT, 0, 1));
    const rig = sideRig({ hip: v(lerp(0, -0.08, clamp(dep, 0, 1)) + up * 0.18, hipY), torso: lerp(4, 30, clamp(dep, 0, 1)), head: -6, armN: { fk: [sway, sway] }, legN: leg, legF: leg });
    return { rig, props: box(0.1, 0.4, boxH) };
  };
}
export function runInPlace(high: boolean): Motion {
  return ({ u }) => {
    const a = u * Math.PI * 2; const hipY = HIP0 - 0.02 + 0.02 * Math.abs(Math.sin(a));
    const lead = (ph: number): Leg => { const k = Math.max(0, Math.sin(ph)); return { fk: [lerp(-12, high ? 100 : 58, k), lerp(-35, high ? 20 : -5, k) - (k > 0 ? 0 : 20)], foot: 45 }; };
    const rig = sideRig({ hip: v(0, hipY), torso: 8, head: 0, armN: { fk: [-50 * Math.sin(a) + 30, 90 + 20 * Math.sin(a)] }, armF: { fk: [50 * Math.sin(a) + 30, 90 - 20 * Math.sin(a)] }, legN: lead(a), legF: lead(a + Math.PI) });
    return { rig, props: [] };
  };
}
export function mountainClimber(): Motion {
  return ({ u }) => {
    const reach = 0.31; const ankle = v(-0.0, 0.07); void ankle;
    const sh = v(0.62, reach + 0.02); const dir = v(-0.93, -0.12); const hip = add(sh, mul(dir, L.torso));
    const a = u * Math.PI * 2; const k = 0.5 + 0.5 * Math.sin(a);
    const torso = (Math.atan2(-dir[0], -dir[1]) * 180) / Math.PI;
    const legBack: Leg = { to: v(hip[0] - 0.46, 0.06), pref: PREF_FWD, foot: 25 };
    const legIn: Leg = { to: v(lerp(hip[0] - 0.46, hip[0] + 0.1, k), lerp(0.06, 0.2, k)), pref: PREF_FWD, foot: 25 };
    const legIn2: Leg = { to: v(lerp(hip[0] + 0.1, hip[0] - 0.46, k), lerp(0.2, 0.06, k)), pref: PREF_FWD, foot: 25 };
    void legBack;
    const rig = sideRig({ hip, torso, head: -8, armN: { to: v(sh[0], 0.02), pref: PREF_BACK }, legN: legIn, legF: legIn2 });
    return { rig, props: [] };
  };
}
export function jumpRope(): Motion {
  return ({ u }) => {
    const a = u * Math.PI * 2; const hop = Math.max(0, Math.sin(a)) * 0.05;
    const rig = sideRig({ hip: v(0, HIP0 + hop), torso: 2, head: 0, armN: { fk: [10, 70] }, legN: { fk: [hop * 100, -14 - hop * 200], foot: 40 + hop * 300 }, legF: { fk: [hop * 100, -14 - hop * 200], foot: 40 + hop * 300 } });
    const w = rig.pts['wristN'] as V; const loop = 0.5 + 0.5 * Math.cos(a);
    return { rig, props: [{ k: 'circle', c: v(w[0] + 0.02, lerp(0.5, 0.52, loop)), r: lerp(0.52, 0.56, loop), layer: 'back' }] };
  };
}
interface Key { hip: V; torso: number; hand: V; ankle: V; foot: number }
export function burpee(): Motion {
  // plank keyframe derived from the same geometry as a push-up top position
  const plankAnkle = add(v(0, 0), mul(fromDown(-30), L.foot)); // toe at origin
  const ank = v(-plankAnkle[0] * -1 - 0.0, 0.083); void ank;
  const toe = v(0, 0); const ankleP = sub(toe, mul(fromDown(30), L.foot));
  const phi = Math.asin(clamp((0.31 - ankleP[1]) / (LEG + L.torso), -1, 1));
  const dir = v(Math.cos(phi), Math.sin(phi)); const hipP = add(ankleP, mul(dir, LEG)); const torsoP = 90 - (phi * 180) / Math.PI; const shP = shoulderOf(hipP, torsoP);
  const stand: Key = { hip: v(0.1, HIP0), torso: 0, hand: v(0.12, HIP0 + 0.3 - 0.3), ankle: v(0.1, ANKLE_H), foot: FOOT_FLAT };
  const crouch: Key = { hip: v(0.02, 0.3), torso: 52, hand: v(0.3, 0.03), ankle: v(0.1, ANKLE_H), foot: FOOT_FLAT };
  const plank: Key = { hip: hipP, torso: torsoP, hand: v(shP[0], 0.02), ankle: ankleP, foot: 30 };
  const seq = [stand, crouch, plank, crouch, stand];
  return ({ u }) => {
    const seg = Math.min(3.999, u * 4); const i = Math.floor(seg); const e = smoothstep(seg - i);
    const A = seq[i] as Key; const B = seq[i + 1] as Key;
    const mix = (a: V, b: V): V => v(lerp(a[0], b[0], e), lerp(a[1], b[1], e));
    const hip = mix(A.hip, B.hip); const torso = lerp(A.torso, B.torso, e);
    const ankle = mix(A.ankle, B.ankle); const hand = mix(A.hand, B.hand);
    const leg: Leg = { to: ankle, pref: PREF_FWD, foot: lerp(A.foot, B.foot, e) };
    const rig = sideRig({ hip, torso, head: -6, armN: { to: hand, pref: PREF_BACK }, legN: leg, legF: leg });
    return { rig, props: [] };
  };
}
export function swing(imp: Implement): Motion {
  return ({ s }) => {
    const hip: V = v(lerp(-0.02, -0.17, 1 - s), lerp(HIP0, 0.5, 1 - s)); const torso = lerp(2, 62, 1 - s);
    const sh = shoulderOf(hip, torso);
    const arm = { to: v(lerp(sh[0] + 0.18, sh[0] + 0.02, 1 - s), lerp(sh[1] + 0.2, sh[1] - 0.3, 1 - s)), pref: PREF_BACK };
    const rig = sideRig({ hip, torso, head: -8, armN: arm, legN: flat(v(0, ANKLE_H)), legF: flat(v(-0.03, ANKLE_H)) });
    return { rig, props: held(imp === 'none' ? 'kettlebell' : imp, rig.pts['wristN'] as V) };
  };
}
export function carry(imp: Implement, suitcase = false): Motion {
  return ({ u }) => {
    const a = u * Math.PI * 2; const hipY = HIP0 - 0.01 + 0.01 * Math.abs(Math.sin(a));
    const swingLeg = (ph: number): Leg => ({ fk: [26 * Math.sin(ph), 26 * Math.sin(ph) - 6 - 24 * Math.max(0, -Math.sin(ph))], foot: 62 });
    const rig = sideRig({ hip: v(0, hipY), torso: suitcase ? 2 : 0, head: 0, armN: { fk: [3, 3] }, armF: { fk: [3, 3] }, legN: swingLeg(a), legF: swingLeg(a + Math.PI) });
    return { rig, props: [...held(imp, rig.pts['wristN'] as V), ...(suitcase ? [] : held(imp, rig.pts['wristF'] as V))] };
  };
}
export function rowCycle(): Motion {
  return ({ u }) => {
    const s = 0.5 - 0.5 * Math.cos(u * Math.PI * 2);
    const hip = v(lerp(-0.2, -0.1, s), 0.3);
    const torso = lerp(30, -20, s);
    const sh = shoulderOf(hip, torso);
    const wr = v(lerp(sh[0] + 0.32, sh[0] + 0.05, s), sh[1] - 0.02);
    const ankle = v(lerp(0.2, 0.42, 1 - s), 0.1);
    const rig = sideRig({ hip, torso, head: 0, armN: { to: wr, pref: PREF_DOWN }, legN: { to: ankle, pref: v(0, 1), foot: 80 }, legF: { to: ankle, pref: v(0, 1), foot: 80 } });
    return { rig, props: cable(rig.pts['wristN'] as V, v(0.8, 0.12)) };
  };
}
export function bike(): Motion {
  return ({ u }) => {
    const a = u * Math.PI * 2;
    const pedal = (ph: number): V => v(0.3 + 0.1 * Math.cos(ph), 0.2 + 0.1 * Math.sin(ph));
    const hip = v(-0.05, 0.5);
    const rig = sideRig({ hip, torso: 38, head: -10, armN: { to: v(0.52, 0.78), pref: v(0, -1) }, legN: { to: pedal(a), pref: PREF_FWD, foot: 70 }, legF: { to: pedal(a + Math.PI), pref: PREF_FWD, foot: 70 } });
    return { rig, props: [{ k: 'line', a: v(0.3, 0.2), b: v(-0.15, 0.45), w: 0.02, layer: 'back' }, { k: 'line', a: v(0.3, 0.2), b: v(0.55, 0.75), w: 0.02, layer: 'back' }, { k: 'rect', c: v(-0.15, 0.47), w: 0.12, h: 0.03, fill: true, layer: 'back' }] };
  };
}
export function mobilityHold(kind: 'hipFlexor' | 'hamstring' | 'child' | 'pigeon' | 'openBook' | 'ankle' | 'foam'): Motion {
  return ({ s }) => {
    if (kind === 'hipFlexor') {
      const hip = v(lerp(0.02, 0.12, s), lerp(0.52, 0.45, s));
      const rig = sideRig({ hip, torso: lerp(2, -4, s), head: 0, armN: { fk: [150, 170] }, legN: { to: v(0.36, ANKLE_H), pref: PREF_FWD, foot: FOOT_FLAT }, legF: { to: v(-0.32, 0.02), pref: PREF_FWD, foot: 20 } });
      return { rig, props: [] };
    }
    if (kind === 'hamstring') {
      const hip = v(0, 0.075);
      const rig = sideRig({ hip, torso: -lerp(90, 50, s), head: 6, armN: { to: add(shoulderOf(hip, -lerp(90, 50, s)), v(0.3, 0.2)), pref: v(0, -1) }, legN: { fk: [lerp(110, 130, s), lerp(110, 130, s)], foot: 90 }, legF: { fk: [92, 92], foot: 80 } });
      return { rig, props: [] };
    }
    if (kind === 'child') {
      const hip = v(-0.12, 0.16);
      const rig = sideRig({ hip, torso: lerp(70, 84, s), head: -12, armN: { fk: [95, 95] }, legN: { to: v(-0.34, 0.04), pref: PREF_FWD, foot: 10 }, legF: { to: v(-0.34, 0.04), pref: PREF_FWD, foot: 10 } });
      return { rig, props: [] };
    }
    if (kind === 'pigeon') {
      const hip = v(0, 0.2);
      const rig = sideRig({ hip, torso: lerp(10, 70, s), head: 0, armN: { to: v(0.34, 0.03), pref: PREF_BACK }, legN: { to: v(0.26, 0.05), pref: PREF_DOWN, foot: 90 }, legF: { to: v(-0.45, 0.05), pref: PREF_FWD, foot: -90 } });
      return { rig, props: [] };
    }
    if (kind === 'openBook') {
      const hip = v(0, 0.12);
      const rig = sideRig({ hip, torso: -90 + lerp(0, 10, s), head: 0, armN: { fk: [lerp(95, 175, s), lerp(95, 175, s)] }, armF: { fk: [95, 95] }, legN: { fk: [135, 20], foot: 70 }, legF: { fk: [135, 20], foot: 70 } });
      return { rig, props: [] };
    }
    if (kind === 'ankle') {
      const toe = v(0.12, 0); const ankle = v(lerp(0.02, 0.1, s), ANKLE_H);
      const hip = v(ankle[0] - 0.06, 0.3);
      const rig = sideRig({ hip, torso: 6, head: 0, armN: { fk: [90, 90] }, legN: { to: ankle, pref: PREF_FWD, foot: FOOT_FLAT }, legF: { to: v(-0.2, ANKLE_H), pref: PREF_FWD, foot: FOOT_FLAT } });
      void toe; return { rig, props: [{ k: 'line', a: v(0.35, 0), b: v(0.35, 1.0), w: 0.02, layer: 'back' }] };
    }
    const hip = v(0.0, 0.2);
    const rig = sideRig({ hip, torso: -lerp(86, 74, s), head: lerp(0, -12, s), armN: { fk: [lerp(95, 175, s), lerp(95, 175, s)] }, legN: { fk: [130, 25], foot: 70 }, legF: { fk: [130, 25], foot: 70 } });
    return { rig, props: [{ k: 'rect', c: v(-0.12, 0.1), w: 0.34, h: 0.12, fill: false, layer: 'front' }] };
  };
}

export function tibialis(): Motion {
  return ({ s }) => {
    const ankle = v(0.0, ANKLE_H);
    const hip = v(ankle[0] - 0.02, ankle[1] + LEG * 0.99);
    const foot = lerp(62, 118, s);
    const rig = sideRig({ hip, torso: -4, head: 0, armN: { fk: [8, 10] }, legN: { to: ankle, pref: PREF_FWD, foot }, legF: { to: v(-0.03, ANKLE_H), pref: PREF_FWD, foot } });
    return { rig, props: [{ k: 'line', a: v(-0.12, 0), b: v(-0.12, 1.0), w: 0.02, layer: 'back' }] };
  };
}

export function cobra(): Motion {
  return ({ s }) => {
    const hip = v(-0.05, 0.075); const torso = lerp(84, 34, s); const sh = shoulderOf(hip, torso);
    const rig = sideRig({ hip, torso, head: lerp(0, 14, s), armN: { to: v(sh[0] + 0.02, 0.02), pref: PREF_BACK }, legN: { fk: [-92, -92], foot: -90 }, legF: { fk: [-92, -92], foot: -90 } });
    return { rig, props: [] };
  };
}
export function turkishGetUp(): Motion {
  return ({ u }) => {
    const seg = Math.min(5.999, u * 6); const i = Math.floor(seg); const e = smoothstep(seg - i);
    type K = { hip: V; torso: number; ankle: V };
    const lying: K = { hip: v(0.02, 0.075), torso: -88, ankle: v(0.42, 0.06) };
    const elbow: K = { hip: v(0.02, 0.075), torso: -50, ankle: v(0.42, 0.06) };
    const sit: K = { hip: v(0.04, 0.1), torso: -12, ankle: v(0.34, 0.06) };
    const stand: K = { hip: v(0.1, HIP0), torso: 0, ankle: v(0.1, ANKLE_H) };
    const seq = [lying, elbow, sit, stand, sit, elbow, lying];
    const A = seq[i] as K; const B = seq[i + 1] as K;
    const hip = v(lerp(A.hip[0], B.hip[0], e), lerp(A.hip[1], B.hip[1], e)); const torso = lerp(A.torso, B.torso, e);
    const ankle = v(lerp(A.ankle[0], B.ankle[0], e), lerp(A.ankle[1], B.ankle[1], e));
    const sh = shoulderOf(hip, torso);
    // weight stays locked overhead on the supporting side
    const rig = sideRig({ hip, torso, head: 0, armN: { to: v(sh[0] + 0.0, sh[1] + 0.32), pref: PREF_BACK }, armF: { to: v(sh[0] + 0.3, Math.max(0.06, sh[1] - 0.2)), pref: v(0, 1) }, legN: { to: ankle, pref: v(0.3, 1), foot: 70 }, legF: { to: ankle, pref: v(0.3, 1), foot: 70 } });
    return { rig, props: kettlebell(rig.pts['wristN'] as V) };
  };
}

export function sledPush(): Motion {
  return ({ u }) => {
    const a = u * Math.PI * 2; const torso = 52; const hip = v(0, 0.47 + 0.01 * Math.abs(Math.sin(a)));
    const sh = shoulderOf(hip, torso);
    const drive = (ph: number): Leg => ({ to: v(-0.3 + 0.22 * Math.sin(ph), ANKLE_H + 0.16 * Math.max(0, Math.cos(ph))), pref: PREF_FWD, foot: 50 });
    const rig = sideRig({ hip, torso, head: -12, armN: { to: v(sh[0] + 0.3, sh[1] - 0.04), pref: PREF_DOWN }, armF: { to: v(sh[0] + 0.3, sh[1] - 0.05), pref: PREF_DOWN }, legN: drive(a), legF: drive(a + Math.PI) });
    const w = rig.pts['wristN'] as V;
    return { rig, props: [{ k: 'rect', c: v(w[0] + 0.14, 0.12), w: 0.34, h: 0.2, fill: false, layer: 'back' }, { k: 'line', a: v(w[0] + 0.0, w[1]), b: v(w[0] + 0.0, 0.2), w: 0.02, layer: 'back' }] };
  };
}

/* ------------------------------------------------------------ v2 additions */
const smoothstep2 = (x: number): number => { const t = clamp(x, 0, 1); return t * t * (3 - 2 * t); };

/** Sissy squat: heels raised, hips pushed forward-under, torso leaning back, knees travelling far past the toes. */
export function sissySquat(): Motion {
  return ({ s }) => {
    const ankle = v(0, 0.095);
    const hip: V = v(lerp(0.0, -0.13, s), lerp(ankle[1] + LEG * 0.995, 0.40, s));
    const torso = lerp(2, -24, s);
    const rig = sideRig({ hip, torso, head: 6, armN: { fk: [lerp(8, 82, s), lerp(10, 86, s)] }, legN: { to: ankle, pref: PREF_FWD, foot: 30 }, legF: { to: add(ankle, v(-0.03, 0)), pref: PREF_FWD, foot: 30 } });
    return { rig, props: [] };
  };
}
/** Machine hack squat: back against a slanted pad that slides, shoulders under pads, feet forward on the platform. */
export function hackSquat(): Motion {
  const lean = 28; const t = Math.tan((lean * Math.PI) / 180);
  return ({ s }) => {
    const y = lerp(HIP0, 0.36, s);
    const hip: V = v(-0.2 + (HIP0 - y) * t, y);
    const ankle = v(0.12, ANKLE_H);
    const rig = sideRig({ hip, torso: -lean, head: 0, armN: { fk: [6, 12] }, legN: flat(ankle), legF: flat(add(ankle, v(-0.03, 0))) });
    const a: V = v(-0.27 + (HIP0 - 0.95) * t, 0.95); const b: V = v(-0.27 + (HIP0 - 0.25) * t, 0.25);
    return { rig, props: [{ k: 'line', a, b, w: 0.05, layer: 'back' }, { k: 'line', a: v(0.0, 0.0), b: v(0.3, 0.0), w: 0.03, layer: 'back' }] };
  };
}
/** Spanish squat: band behind the knees anchored in front, shins vertical, hips far back, torso leaning back. */
export function spanishSquat(): Motion {
  return ({ s }) => {
    const hip: V = v(lerp(0, -0.2, s), lerp(HIP0, 0.34, s));
    const rig = sideRig({ hip, torso: lerp(2, -16, s), head: 0, armN: { fk: [lerp(8, 88, s), lerp(10, 90, s)] }, legN: flat(v(0, ANKLE_H)), legF: flat(v(-0.03, ANKLE_H)) });
    const k = rig.pts['kneeN'] as V;
    return { rig, props: [{ k: 'line', a: k, b: v(0.62, k[1] + 0.02), w: 0.012, dash: true, layer: 'back' }, { k: 'line', a: v(0.62, 0), b: v(0.62, 0.6), w: 0.03, layer: 'back' }] };
  };
}
/** Cable pull-through: hinge with straight arms, hands between the legs, rope to a low pulley behind. */
export function pullThrough(): Motion {
  const base = hinge({ imp: 'none' });
  return (p) => { const f = base(p); return { rig: f.rig, props: [...f.props, ...cable(f.rig.pts['wristN'] as V, v(-0.8, 0.1))] }; };
}
/** Medicine-ball slam: ball overhead (top) to the floor in front of the feet (bottom). */
export function ballSlam(): Motion {
  return ({ s }) => {
    const hip: V = v(lerp(-0.14, 0.0, s), lerp(0.55, HIP0, s)); const torso = lerp(58, 2, s);
    const sh = shoulderOf(hip, torso);
    const target = v(lerp(0.3, sh[0] + 0.03, s), lerp(0.14, sh[1] + 0.32, s));
    const rig = sideRig({ hip, torso, head: -10, armN: { to: target, pref: PREF_BACK }, legN: flat(v(0, ANKLE_H)), legF: flat(v(-0.03, ANKLE_H)) });
    const w = rig.pts['wristN'] as V;
    return { rig, props: medBall(add(w, v(0.02, 0.085))) };
  };
}
/** Dumbbell thruster: front squat at the bottom, drive up and press overhead at the top. */
export function thruster(): Motion {
  return ({ s }) => {
    const dep = 1 - smoothstep2(s / 0.55); const press = smoothstep2((s - 0.5) / 0.5);
    const hip: V = v(lerp(0, -0.12, dep), lerp(HIP0, 0.3, dep)); const torso = lerp(3, 34, dep);
    const sh = shoulderOf(hip, torso);
    const target = v(lerp(sh[0] + 0.06, sh[0] + 0.03, press), lerp(sh[1] + 0.0, sh[1] + 0.325, press));
    const rig = sideRig({ hip, torso, head: -4, armN: { to: target, pref: PREF_DOWN }, legN: flat(v(0, ANKLE_H)), legF: flat(v(-0.03, ANKLE_H)) });
    return { rig, props: dumbbell(add(rig.pts['wristN'] as V, v(0, 0.035)), 90) };
  };
}
/** Back extension on a 45 degree machine: hips on the pad, body hinges from folded to a straight line. */
export function backExtensionMachine(): Motion {
  return ({ s }) => {
    const hip = v(0, 0.64); const ankle = v(-0.33, 0.33);
    const torso = lerp(118, 46, s);
    const sh = shoulderOf(hip, torso);
    const rig = sideRig({ hip, torso, head: lerp(10, -4, s), armN: { to: add(sh, v(0.07, -0.07)), pref: PREF_DOWN }, legN: { to: ankle, pref: PREF_FWD, foot: FOOT_FLAT }, legF: { to: ankle, pref: PREF_FWD, foot: FOOT_FLAT } });
    return { rig, props: [{ k: 'line', a: v(-0.3, 0.3), b: v(0.04, 0.57), w: 0.06, layer: 'back' }, { k: 'line', a: v(-0.3, 0.0), b: v(-0.3, 0.24), w: 0.03, layer: 'back' }, { k: 'line', a: v(0.1, 0.0), b: v(0.1, 0.5), w: 0.03, layer: 'back' }] };
  };
}
/** Wall angel / wall slide (front view): arms from a "W" (elbows at shoulder height) up to a "Y". */
export function wallAngel(slide = false): Motion {
  return ({ s }) => {
    const hip = v(0, HIP0);
    const arm: readonly [number, number] = slide ? [lerp(40, 120, s), lerp(120, 155, s)] : [lerp(88, 150, s), lerp(172, 158, s)];
    const rig = frontRig({ hip, armL: { out: arm }, legOut: [3, 3] });
    return { rig, props: [{ k: 'rect', c: v(0, 0.75), w: 0.9, h: 1.6, fill: false, layer: 'back', far: true }] };
  };
}
/** Inchworm: feet planted, hands walk from the folded position out to a plank and back. */
export function inchworm(): Motion {
  const circ = (p0: V, r0: number, p1: V, r1: number): V => {
    const d = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]); const a = (r0 * r0 - r1 * r1 + d * d) / (2 * d); const h = Math.sqrt(Math.max(0, r0 * r0 - a * a));
    const ux = (p1[0] - p0[0]) / d; const uy = (p1[1] - p0[1]) / d;
    const c1: V = [p0[0] + ux * a - uy * h, p0[1] + uy * a + ux * h]; const c2: V = [p0[0] + ux * a + uy * h, p0[1] + uy * a - ux * h];
    return c1[1] >= c2[1] ? c1 : c2;
  };
  return ({ s }) => {
    const ankle = v(0, lerp(ANKLE_H, 0.095, s));
    const th = (lerp(10, 80, s) * Math.PI) / 180;
    const hip: V = v(ankle[0] + LEG * 0.995 * Math.sin(th), ankle[1] + LEG * 0.995 * Math.cos(th));
    const hand = v(lerp(0.14, 0.76, s), 0.02);
    const reach = L.upperArm + L.foreArm - 0.004;
    const dist = Math.hypot(hand[0] - hip[0], hand[1] - hip[1]);
    const h2: V = dist > L.torso + reach - 0.01 ? v(hip[0], hip[1]) : hip;
    const sh = circ(h2, L.torso, hand, reach);
    const torso = (Math.atan2(sh[0] - hip[0], sh[1] - hip[1]) * 180) / Math.PI;
    const rig = sideRig({ hip, torso, head: -8, armN: { to: hand, pref: PREF_BACK }, legN: { to: ankle, pref: PREF_FWD, foot: lerp(FOOT_FLAT, 30, s) }, legF: { to: ankle, pref: PREF_FWD, foot: lerp(FOOT_FLAT, 30, s) } });
    return { rig, props: [] };
  };
}
