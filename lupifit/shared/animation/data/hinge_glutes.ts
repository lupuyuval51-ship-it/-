import { BODY } from '../engine';
import type { ExerciseAnimation, Keyframe, LimbSpec, Pose, Vec } from '../types';

/** Ankle height when the foot is flat on the floor. */
const FLOOR_ANKLE = 184;

const rad = (d: number) => (d * Math.PI) / 180;
const foot = (x: number, y = FLOOR_ANKLE): LimbSpec => ({ target: [x, y] });
const kf = (t: number, pose: Pose, ease?: Keyframe['ease']): Keyframe => (ease ? { t, pose, ease } : { t, pose });
/** Arm posed rigidly relative to the torso: b1/b2 are body-frame angles (0 = along the torso toward the hips). */
const rel = (torso: number, b1: number, b2: number): LimbSpec => ({ angles: [b1 - torso, b2 - torso] });

/**
 * Hip position from a planted ankle and the leg segment angles (side view, facing +x).
 * shin: forward lean of the shin (knee ahead of the ankle), thigh: thigh angle from vertical.
 */
const hipFrom = (ankle: Vec, shin: number, thigh: number): Vec => [
  ankle[0] + BODY.shin * Math.sin(rad(shin)) - BODY.thigh * Math.sin(rad(thigh)),
  ankle[1] - BODY.shin * Math.cos(rad(shin)) - BODY.thigh * Math.cos(rad(thigh)),
];
const shoulderOf = (hip: Vec, torso: number): Vec => [hip[0] + BODY.torso * Math.sin(rad(torso)), hip[1] - BODY.torso * Math.cos(rad(torso))];
/** Wrist IK target that puts the hand (and the bar/dumbbell drawn at it) at `hand` with straight-ish arms from the shoulder. */
const gripAt = (hip: Vec, torso: number, hand: Vec): LimbSpec => {
  const sh = shoulderOf(hip, torso);
  const d = Math.hypot(hand[0] - sh[0], hand[1] - sh[1]) || 1;
  return { target: [hand[0] - ((hand[0] - sh[0]) / d) * BODY.hand, hand[1] - ((hand[1] - sh[1]) / d) * BODY.hand] };
};

interface HingeStep {
  t: number;
  shin: number;
  thigh: number;
  torso: number;
  /** Hand x (bar path); defaults to hanging straight below the shoulder. */
  barX?: number;
  ease?: Keyframe['ease'];
}

/** Bilateral hinge keyframes with planted feet and the load held in straight arms. */
const hingeKeys = (ankleX: number, steps: HingeStep[], barY: (hip: Vec, torso: number) => number): Keyframe[] =>
  steps.map((st) => {
    const hip = hipFrom([ankleX, FLOOR_ANKLE], st.shin, st.thigh);
    const sh = shoulderOf(hip, st.torso);
    const x = st.barX ?? sh[0];
    return kf(st.t, { hip, torso: st.torso, head: st.torso > 30 ? -st.torso * 0.25 : 0, armNear: gripAt(hip, st.torso, [x, barY(hip, st.torso)]), legNear: foot(ankleX) }, st.ease);
  });

/** y of a hand hanging from straight arms directly below/near the shoulder at horizontal position x. */
const hangY = (x: number) => (hip: Vec, torso: number) => {
  const sh = shoulderOf(hip, torso);
  const reach = BODY.upperArm + BODY.forearm + BODY.hand - 0.6;
  const dx = x - sh[0];
  return sh[1] + Math.sqrt(Math.max(0, reach * reach - dx * dx));
};

const rdlSteps = (barX: number): HingeStep[] => [
  { t: 0, shin: 4, thigh: 2, torso: 2, barX },
  { t: 0.18, shin: 7, thigh: 6, torso: 30, barX },
  { t: 0.36, shin: 9, thigh: 12, torso: 58, barX },
  { t: 0.5, shin: 10, thigh: 16, torso: 72, barX },
  { t: 0.55, shin: 10, thigh: 16, torso: 72, barX },
  { t: 0.7, shin: 9, thigh: 12, torso: 50, barX },
  { t: 0.86, shin: 5, thigh: 4, torso: 12, barX },
  { t: 1, shin: 4, thigh: 2, torso: 2, barX },
];

export const animations: ExerciseAnimation[] = [
  {
    // Conventional deadlift from a dead stop: bar over mid-foot and in contact with the legs, hips and shoulders
    // rise together, lockout without leaning back, then hips back first on the way down.
    id: 'deadlift',
    durationSec: 3.6,
    props: [{ kind: 'barbell', plates: 'large' }],
    keyframes: (() => {
      const BAR_X = 120;
      const steps: [number, number, number, number, number][] = [
        // t, shin, thigh, torso, bar y
        [0, 20, 72, 60, 172],
        [0.08, 20, 72, 60, 172],
        [0.22, 8, 58, 48, 145],
        [0.3, 5, 32, 24, 128],
        [0.38, 2, 6, 2, 113],
        [0.48, 2, 6, 2, 113],
        [0.56, 3, 20, 14, 122],
        [0.64, 4, 40, 40, 140],
        [0.84, 20, 72, 60, 172],
        [1, 20, 72, 60, 172],
      ];
      return steps.map(([t, shin, thigh, torso, y]) => {
        const hip = hipFrom([114, FLOOR_ANKLE], shin, thigh);
        // The bar never leaves the hands: clamp to what straight arms can reach from the shoulder.
        const reachY = shoulderOf(hip, torso)[1] + BODY.upperArm + BODY.forearm + BODY.hand - 1;
        return kf(t, { hip, torso, head: -torso * 0.25, armNear: gripAt(hip, torso, [BAR_X, Math.min(y, reachY)]), legNear: foot(114) });
      });
    })(),
  },
  {
    // RDL: soft knees fixed, hips push straight back, bar slides down the thighs to just below the knee.
    id: 'romanian_deadlift',
    durationSec: 3.6,
    props: [{ kind: 'barbell', plates: 'large' }],
    keyframes: hingeKeys(114, rdlSteps(121), hangY(121)),
  },
  {
    // Same hinge with dumbbells in front of the thighs, kept close to the legs.
    id: 'dumbbell_romanian_deadlift',
    durationSec: 3.6,
    props: [{ kind: 'dumbbell', at: 'hands' }],
    keyframes: hingeKeys(114, rdlSteps(122), hangY(122)),
  },
  {
    // Seesaw hinge on one slightly bent leg: torso and free leg move as one straight line.
    id: 'single_leg_romanian_deadlift',
    durationSec: 4,
    keyframes: (() => {
      const steps: [number, number, number, number][] = [
        // t, shin, thigh, torso
        [0, 4, 3, 2],
        [0.2, 8, 12, 36],
        [0.45, 12, 22, 80],
        [0.52, 12, 22, 80],
        [0.75, 8, 12, 36],
        [1, 4, 3, 2],
      ];
      return steps.map(([t, shin, thigh, torso]) => {
        const hip = hipFrom([116, FLOOR_ANKLE], shin, thigh);
        const free = torso < 10 ? -6 : -torso;
        return kf(t, {
          hip,
          torso,
          head: -torso * 0.2,
          armNear: { angles: [2, 0] },
          legNear: foot(116),
          legFar: { angles: [free, torso < 10 ? -26 : free] },
          footFar: torso < 10 ? 30 : 180 - torso + 90,
        });
      });
    })(),
  },
  {
    // Hip-hinge swing: hike back high between the thighs, snap the hips to stand tall, bell floats to chest height.
    id: 'kettlebell_swing',
    durationSec: 1.6,
    props: [{ kind: 'kettlebell', at: 'hands' }],
    keyframes: (() => {
      const A = 116;
      const p = (shin: number, thigh: number, torso: number, arm: number, fore: number): Pose => ({
        hip: hipFrom([A, FLOOR_ANKLE], shin, thigh),
        torso,
        head: -torso * 0.3,
        armNear: { angles: [arm, fore] },
        legNear: foot(A),
      });
      return [
        kf(0, p(2, 2, -2, 82, 84)),
        kf(0.2, p(2, 2, 0, 30, 30)),
        kf(0.32, p(8, 26, 40, -4, -6)),
        kf(0.46, p(12, 40, 66, -30, -34)),
        kf(0.6, p(8, 24, 40, -6, -8)),
        kf(0.74, p(2, 2, -2, 40, 40)),
        kf(0.88, p(2, 2, -2, 82, 84)),
        kf(1, p(2, 2, -2, 82, 84)),
      ];
    })(),
  },
  {
    // Facing away from a low pulley, rope between the legs: hinge back with straight arms, drive the hips through.
    id: 'cable_pull_through',
    durationSec: 3.2,
    props: [
      { kind: 'weightStack', x: 8, y: 60 },
      { kind: 'cable', anchor: [24, 180], at: 'hands' },
    ],
    keyframes: (() => {
      const A = 118;
      const p = (shin: number, thigh: number, torso: number, arm: number): Pose => ({
        hip: hipFrom([A, FLOOR_ANKLE], shin, thigh),
        torso,
        head: -torso * 0.25,
        armNear: { angles: [arm, arm] },
        legNear: foot(A),
      });
      return [
        kf(0, p(3, 3, 0, 4)),
        kf(0.12, p(3, 3, 0, 4)),
        kf(0.45, p(12, 32, 66, -24)),
        kf(0.52, p(12, 32, 66, -24)),
        kf(0.8, p(3, 3, 0, 4)),
        kf(1, p(3, 3, 0, 4)),
      ];
    })(),
  },
  {
    // Supine, heels a hand-length from the glutes: drive through the heels to a straight shoulders–hips–knees line, hold.
    id: 'glute_bridge',
    durationSec: 3.6,
    props: [{ kind: 'mat', x: 10, w: 150 }],
    keyframes: (() => {
      const SH: Vec = [40, 180];
      const p = (lift: number): Pose => {
        const torso = -90 - lift;
        return {
          hip: [SH[0] + BODY.torso * Math.cos(rad(lift)), SH[1] - BODY.torso * Math.sin(rad(lift))],
          torso,
          head: lift * 0.6,
          armNear: { angles: [88, 90] },
          legNear: foot(128),
        };
      };
      return [kf(0, p(0)), kf(0.14, p(10)), kf(0.3, p(22)), kf(0.55, p(22)), kf(0.75, p(10)), kf(0.92, p(0)), kf(1, p(0))];
    })(),
  },
  {
    // One foot planted, the other leg straight in line with the working thigh; pelvis stays level.
    id: 'single_leg_glute_bridge',
    durationSec: 3.6,
    props: [{ kind: 'mat', x: 10, w: 150 }],
    keyframes: (() => {
      const SH: Vec = [40, 180];
      const p = (lift: number, free: number): Pose => ({
        hip: [SH[0] + BODY.torso * Math.cos(rad(lift)), SH[1] - BODY.torso * Math.sin(rad(lift))],
        torso: -90 - lift,
        head: lift * 0.6,
        armNear: { angles: [88, 90] },
        legNear: foot(128),
        legFar: { angles: [free, free] },
      });
      return [kf(0, p(0, 140)), kf(0.14, p(10, 128)), kf(0.3, p(22, 114)), kf(0.55, p(22, 114)), kf(0.75, p(10, 128)), kf(0.92, p(0, 140)), kf(1, p(0, 140))];
    })(),
  },
  {
    // Upper back on the bench edge, bar over the hips: drive up until torso and thighs are level, shins vertical.
    id: 'barbell_hip_thrust',
    durationSec: 3.4,
    props: [
      { kind: 'bench', x: 20, y: 150, w: 32 },
      { kind: 'barbell', plates: 'large' },
    ],
    keyframes: (() => {
      const SH: Vec = [50, 143];
      const p = (drop: number): Pose => {
        const hip: Vec = [SH[0] + BODY.torso * Math.cos(rad(drop)), SH[1] + BODY.torso * Math.sin(rad(drop))];
        const torso = -90 + drop;
        // Bar rests on the hip crease, on the front (belly) side of the pelvis.
        const n: Vec = [Math.cos(rad(torso)), Math.sin(rad(torso))];
        const bar: Vec = [hip[0] + n[0] * 12 + 4, hip[1] + n[1] * 12];
        return { hip, torso, head: drop * 0.4 + 6, armNear: { ...gripAt(hip, torso, bar), bend: 1 }, legNear: foot(144) };
      };
      return [kf(0, p(34)), kf(0.35, p(2)), kf(0.5, p(2)), kf(0.9, p(34)), kf(1, p(34))];
    })(),
  },
  {
    // Kneeling with ankles anchored, rigid line from knees to head: lower as slowly as possible, catch, push back up.
    id: 'nordic_hamstring_curl',
    durationSec: 5,
    props: [
      { kind: 'mat', x: 20, w: 190 },
      { kind: 'machinePad', at: 'ankles' },
    ],
    keyframes: (() => {
      const KNEE: Vec = [78, 182];
      const ANKLE: Vec = [38, 182];
      const p = (lean: number, arms: LimbSpec): Pose => ({
        hip: [KNEE[0] + BODY.thigh * Math.sin(rad(lean)), KNEE[1] - BODY.thigh * Math.cos(rad(lean))],
        torso: lean,
        head: -Math.min(lean, 40) * 0.3,
        armNear: arms,
        legNear: { target: ANKLE },
        footNear: -100,
      });
      const ready = (lean: number) => rel(lean, 14, 156);
      const out: Keyframe[] = [];
      const desc = [0, 12, 24, 36, 48, 58];
      desc.forEach((l, i) => out.push(kf(0.1 * i, p(l, ready(l)), 'linear')));
      out.push(kf(0.56, p(66, { target: [184, 166], bend: -1 }), 'in'));
      out.push(kf(0.64, p(74, { target: [172, 180], bend: -1 })));
      out.push(kf(0.7, p(68, { target: [172, 180], bend: -1 })));
      const asc = [58, 44, 30, 15, 0];
      asc.forEach((l, i) => out.push(kf(0.76 + 0.05 * i, p(l, i === 0 ? { target: [182, 160], bend: -1 } : ready(l)))));
      out.push(kf(1, p(0, ready(0))));
      return out;
    })(),
  },
  {
    // Prone: lift arms, chest and legs a few centimetres together, reach long, hold, lower slowly.
    id: 'superman',
    durationSec: 5,
    props: [{ kind: 'mat', x: 6, w: 228 }],
    keyframes: (() => {
      const p = (lift: number): Pose => ({
        hip: [96, 179 - lift * 0.15],
        torso: 90 - lift,
        head: 6,
        armNear: { angles: [90 + lift * 1.2, 90 + lift * 1.3] },
        legNear: { angles: [-90 - lift * 0.8, -90 - lift * 0.8] },
        footNear: -95 - lift * 0.8,
      });
      return [kf(0, p(0)), kf(0.08, p(0)), kf(0.25, p(11)), kf(0.6, p(11)), kf(0.85, p(0)), kf(1, p(0))];
    })(),
  },
  {
    // Loaded carry, shown as one gait cycle walked in place: tall torso, shoulders down, dumbbells hanging still.
    id: 'farmer_carry',
    durationSec: 1.2,
    props: [{ kind: 'dumbbell', at: 'hands' }],
    keyframes: (() => {
      type Leg = { a: [number, number]; f: number };
      const strike: Leg = { a: [16, 10], f: 100 };
      const mid: Leg = { a: [0, -2], f: 90 };
      const toeOff: Leg = { a: [-14, -26], f: 58 };
      const swing: Leg = { a: [12, -42], f: 76 };
      const p = (hipY: number, near: Leg, far: Leg): Pose => ({
        hip: [118, hipY],
        torso: 1,
        armNear: { angles: [2, 0] },
        legNear: { angles: near.a },
        legFar: { angles: far.a },
        footNear: near.f,
        footFar: far.f,
      });
      return [
        kf(0, p(104.2, strike, toeOff), 'linear'),
        kf(0.25, p(102, mid, swing), 'linear'),
        kf(0.5, p(104.2, toeOff, strike), 'linear'),
        kf(0.75, p(102, swing, mid), 'linear'),
        kf(1, p(104.2, strike, toeOff)),
      ];
    })(),
  },
];
