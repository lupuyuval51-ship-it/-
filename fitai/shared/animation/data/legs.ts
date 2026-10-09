import { BODY, STAND_HIP_Y } from '../engine';
import type { ExerciseAnimation, Keyframe, LimbSpec, Pose, Vec } from '../types';

/** Ankle height when the foot is flat on the floor. */
const FLOOR_ANKLE = 184;
const S = STAND_HIP_Y;

/** Arm posed rigidly relative to the torso: b1/b2 are body-frame angles (0 = along the torso toward the hips). */
const rel = (torso: number, b1: number, b2: number): LimbSpec => ({ angles: [b1 - torso, b2 - torso] });
/** Hands resting on the hips (iliac crest), elbows out behind. */
const handsOnHips = (torso: number) => rel(torso, -32, 40);
/** Torso-relative arm angles holding a load. */
const BACK_BAR: [number, number] = [-25, 173]; // bar on the upper traps, elbows down and back
const FRONT_RACK: [number, number] = [92, -95]; // elbows high and forward, bar on the front delts
const GOBLET: [number, number] = [12, 160]; // dumbbell held vertically against the chest

const foot = (x: number, y = FLOOR_ANKLE): LimbSpec => ({ target: [x, y] });
const kf = (t: number, pose: Pose, ease?: Keyframe['ease']): Keyframe => (ease ? { t, pose, ease } : { t, pose });

const rad = (d: number) => (d * Math.PI) / 180;
const dir = (deg: number): Vec => [Math.sin(rad(deg)), Math.cos(rad(deg))];

/**
 * Hip position from a planted ankle and the leg segment angles (side view, facing +x).
 * shin: forward lean of the shin (knee ahead of the ankle), thigh: thigh angle from vertical (90 = parallel).
 */
const hipFrom = (ankle: Vec, shin: number, thigh: number): Vec => {
  const knee: Vec = [ankle[0] + BODY.shin * Math.sin(rad(shin)), ankle[1] - BODY.shin * Math.cos(rad(shin))];
  return [knee[0] - BODY.thigh * Math.sin(rad(thigh)), knee[1] - BODY.thigh * Math.cos(rad(thigh))];
};

/** Hand position for a hip/torso pair and a torso-relative arm (forward kinematics). */
const handAt = (hip: Vec, torso: number, b1: number, b2: number): Vec => {
  const sh: Vec = [hip[0] + BODY.torso * Math.sin(rad(torso)), hip[1] - BODY.torso * Math.cos(rad(torso))];
  const e = dir(b1 - torso);
  const f = dir(b2 - torso);
  const lf = BODY.forearm + BODY.hand;
  return [sh[0] + e[0] * BODY.upperArm + f[0] * lf, sh[1] + e[1] * BODY.upperArm + f[1] * lf];
};

/** Torso angle that puts a torso-fixed load (bar) directly above x — keeps the bar path vertical over mid-foot. */
const balanceTorso = (hip: Vec, x: number, b1: number, b2: number): number => {
  let best = 0;
  let err = Infinity;
  for (let a = -5; a <= 75; a += 0.25) {
    const e = Math.abs(handAt(hip, a, b1, b2)[0] - x);
    if (e < err) {
      err = e;
      best = a;
    }
  }
  return Math.round(best * 4) / 4;
};

interface SquatStep {
  t: number;
  shin: number;
  thigh: number;
  torso?: number;
  ease?: Keyframe['ease'];
}

/** Bilateral squat keyframes: feet planted, hips/knees driven by segment angles, torso balanced under the load. */
const squatKeys = (ankleX: number, steps: SquatStep[], arm: [number, number], loadX?: number, armsFor?: (torso: number, i: number) => LimbSpec): Keyframe[] =>
  steps.map((st, i) => {
    const hip = hipFrom([ankleX, FLOOR_ANKLE], st.shin, st.thigh);
    const torso = st.torso ?? balanceTorso(hip, loadX ?? ankleX + 5, arm[0], arm[1]);
    return kf(st.t, { hip, torso, armNear: armsFor ? armsFor(torso, i) : rel(torso, arm[0], arm[1]), legNear: foot(ankleX) }, st.ease);
  });

export const animations: ExerciseAnimation[] = [
  {
    // High-bar back squat: bar stays over mid-foot, hips and knees break together, thighs just below parallel.
    id: 'barbell_back_squat',
    durationSec: 3.4,
    props: [
      { kind: 'rack', x: 190, hookY: 64 },
      { kind: 'barbell', plates: 'large' },
    ],
    keyframes: squatKeys(114, [
      { t: 0, shin: 0, thigh: 4, torso: 8 },
      { t: 0.16, shin: 9, thigh: 34 },
      { t: 0.32, shin: 18, thigh: 66 },
      { t: 0.48, shin: 24, thigh: 94 },
      { t: 0.54, shin: 24, thigh: 94 },
      { t: 0.66, shin: 18, thigh: 66 },
      { t: 0.78, shin: 9, thigh: 34 },
      { t: 0.9, shin: 0, thigh: 4, torso: 8 },
      { t: 1, shin: 0, thigh: 4, torso: 8 },
    ], BACK_BAR),
  },
  {
    // Front squat: elbows high, torso far more upright, knees travel further forward, hips sit straight down.
    id: 'front_squat',
    durationSec: 3.4,
    props: [
      { kind: 'rack', x: 192, hookY: 58 },
      { kind: 'barbell', plates: 'large' },
    ],
    keyframes: squatKeys(112, [
      { t: 0, shin: 0, thigh: 2 },
      { t: 0.16, shin: 12, thigh: 36 },
      { t: 0.32, shin: 24, thigh: 72 },
      { t: 0.48, shin: 31, thigh: 102 },
      { t: 0.54, shin: 31, thigh: 102 },
      { t: 0.66, shin: 24, thigh: 72 },
      { t: 0.78, shin: 12, thigh: 36 },
      { t: 0.9, shin: 0, thigh: 2 },
      { t: 1, shin: 0, thigh: 2 },
    ], FRONT_RACK),
  },
  {
    // Smith machine: the bar runs in a fixed vertical track; feet set slightly in front of the bar.
    id: 'smith_machine_squat',
    durationSec: 3.2,
    props: [
      { kind: 'smithRails', x: 112 },
      { kind: 'barbell', plates: 'large' },
    ],
    keyframes: squatKeys(122, [
      { t: 0, shin: -3, thigh: 4 },
      { t: 0.16, shin: 4, thigh: 34 },
      { t: 0.32, shin: 10, thigh: 64 },
      { t: 0.48, shin: 14, thigh: 92 },
      { t: 0.54, shin: 14, thigh: 92 },
      { t: 0.68, shin: 10, thigh: 64 },
      { t: 0.8, shin: 4, thigh: 34 },
      { t: 0.92, shin: -3, thigh: 4 },
      { t: 1, shin: -3, thigh: 4 },
    ], BACK_BAR, 112),
  },
  {
    // Goblet squat: dumbbell against the chest, upright torso, sits deep between the heels.
    id: 'goblet_squat',
    durationSec: 3.2,
    props: [{ kind: 'dumbbell', at: 'handNear' }],
    keyframes: squatKeys(112, [
      { t: 0, shin: 0, thigh: 2, torso: 3 },
      { t: 0.16, shin: 12, thigh: 36, torso: 10 },
      { t: 0.32, shin: 24, thigh: 74, torso: 20 },
      { t: 0.5, shin: 30, thigh: 106, torso: 24 },
      { t: 0.56, shin: 30, thigh: 106, torso: 24 },
      { t: 0.68, shin: 24, thigh: 74, torso: 20 },
      { t: 0.8, shin: 12, thigh: 36, torso: 10 },
      { t: 0.92, shin: 0, thigh: 2, torso: 3 },
      { t: 1, shin: 0, thigh: 2, torso: 3 },
    ], GOBLET),
  },
  {
    // Bodyweight squat: arms rise forward as a counterbalance, heels down, thighs to parallel, glutes squeezed at the top.
    id: 'bodyweight_squat',
    durationSec: 3,
    keyframes: squatKeys(
      112,
      [
        { t: 0, shin: 0, thigh: 3, torso: 2 },
        { t: 0.15, shin: 8, thigh: 34, torso: 14 },
        { t: 0.3, shin: 16, thigh: 66, torso: 30 },
        { t: 0.45, shin: 22, thigh: 92, torso: 42 },
        { t: 0.52, shin: 22, thigh: 92, torso: 42 },
        { t: 0.64, shin: 16, thigh: 66, torso: 30 },
        { t: 0.76, shin: 8, thigh: 34, torso: 14 },
        { t: 0.9, shin: 0, thigh: 3, torso: 2 },
        { t: 1, shin: 0, thigh: 3, torso: 2 },
      ],
      [0, 0],
      undefined,
      (_torso, i) => ({ angles: [[6, 40, 80, 88, 88, 82, 50, 6, 6][i]!, [2, 44, 84, 92, 92, 86, 54, 2, 2][i]!] }),
    ),
  },
  {
    // Sit-to-stand: hips reach back to lightly touch the seat (no plopping), lean forward and stand up.
    id: 'box_squat',
    durationSec: 3.4,
    props: [{ kind: 'chair', x: 56, y: 146 }],
    keyframes: squatKeys(
      110,
      [
        { t: 0, shin: 0, thigh: 3, torso: 3 },
        { t: 0.15, shin: 5, thigh: 34, torso: 16 },
        { t: 0.3, shin: 9, thigh: 62, torso: 28 },
        { t: 0.45, shin: 12, thigh: 82, torso: 32 },
        { t: 0.53, shin: 12, thigh: 82, torso: 32 },
        { t: 0.62, shin: 13, thigh: 80, torso: 44 },
        { t: 0.76, shin: 9, thigh: 50, torso: 24 },
        { t: 0.9, shin: 0, thigh: 3, torso: 3 },
        { t: 1, shin: 0, thigh: 3, torso: 3 },
      ],
      [0, 0],
      undefined,
      (torso) => ({ angles: [Math.max(80, torso + 52), Math.max(82, torso + 54)] }),
    ),
  },
  {
    // Rear foot laces-down on a bench, front shin near vertical; the hips drop straight down.
    id: 'bulgarian_split_squat',
    durationSec: 3.4,
    props: [{ kind: 'bench', x: 22, y: 152, w: 46 }],
    keyframes: [
      kf(0, { hip: [112, 104], torso: 6, armNear: { angles: [4, 2] }, legNear: foot(132), legFar: { target: [58, 146] }, footFar: -78 }),
      kf(0.48, { hip: [102, 140], torso: 12, armNear: { angles: [4, 2] }, legNear: foot(132), legFar: { target: [58, 146] }, footFar: -78 }),
      kf(0.54, { hip: [102, 140], torso: 12, armNear: { angles: [4, 2] }, legNear: foot(132), legFar: { target: [58, 146] }, footFar: -78 }),
      kf(0.9, { hip: [112, 104], torso: 6, armNear: { angles: [4, 2] }, legNear: foot(132), legFar: { target: [58, 146] }, footFar: -78 }),
      kf(1, { hip: [112, 104], torso: 6, armNear: { angles: [4, 2] }, legNear: foot(132), legFar: { target: [58, 146] }, footFar: -78 }),
    ],
  },
  {
    // One forward stride per loop: step, drop the back knee toward the floor, drive through the front heel and step through.
    id: 'walking_lunge',
    durationSec: 2.6,
    keyframes: [
      kf(0, { hip: [50, S], torso: 2, armNear: handsOnHips(2), legNear: foot(48), legFar: foot(48) }),
      kf(0.14, { hip: [64, 104], torso: 3, armNear: handsOnHips(3), legNear: { target: [86, 166] }, legFar: foot(48), footNear: 100 }),
      kf(0.28, { hip: [82, 112], torso: 4, armNear: handsOnHips(4), legNear: foot(124), legFar: foot(48), footFar: 70 }),
      kf(0.48, { hip: [88, 140], torso: 4, armNear: handsOnHips(4), legNear: foot(124), legFar: { target: [44, 178] }, footFar: 28 }),
      kf(0.56, { hip: [90, 138], torso: 6, armNear: handsOnHips(6), legNear: foot(124), legFar: { target: [44, 178] }, footFar: 28 }),
      kf(0.74, { hip: [112, 112], torso: 6, armNear: handsOnHips(6), legNear: foot(124), legFar: { target: [86, 166] }, footFar: 40 }),
      kf(0.9, { hip: [126, S], torso: 2, armNear: handsOnHips(2), legNear: foot(124), legFar: foot(124) }),
      kf(1, { hip: [126, S], torso: 2, armNear: handsOnHips(2), legNear: foot(124), legFar: foot(124) }),
    ],
  },
  {
    // Step back onto the ball of the foot, lower until both knees are ~90°, push through the front foot to return.
    id: 'reverse_lunge',
    durationSec: 3,
    keyframes: [
      kf(0, { hip: [126, S], torso: 2, armNear: handsOnHips(2), legNear: foot(124), legFar: foot(124) }),
      kf(0.14, { hip: [118, 106], torso: 4, armNear: handsOnHips(4), legNear: foot(124), legFar: { target: [92, 168] }, footFar: 40 }),
      kf(0.28, { hip: [102, 120], torso: 5, armNear: handsOnHips(5), legNear: foot(124), legFar: { target: [44, 178] }, footFar: 28 }),
      kf(0.5, { hip: [92, 140], torso: 5, armNear: handsOnHips(5), legNear: foot(124), legFar: { target: [44, 178] }, footFar: 28 }),
      kf(0.56, { hip: [92, 140], torso: 5, armNear: handsOnHips(5), legNear: foot(124), legFar: { target: [44, 178] }, footFar: 28 }),
      kf(0.74, { hip: [110, 114], torso: 6, armNear: handsOnHips(6), legNear: foot(124), legFar: { target: [86, 166] }, footFar: 40 }),
      kf(0.88, { hip: [126, S], torso: 2, armNear: handsOnHips(2), legNear: foot(124), legFar: foot(124) }),
      kf(1, { hip: [126, S], torso: 2, armNear: handsOnHips(2), legNear: foot(124), legFar: foot(124) }),
    ],
  },
  {
    // Same as the reverse lunge with dumbbells hanging straight down at the sides.
    id: 'dumbbell_reverse_lunge',
    durationSec: 3.2,
    props: [{ kind: 'dumbbell', at: 'hands' }],
    keyframes: [
      kf(0, { hip: [126, S], torso: 2, armNear: { angles: [2, 0] }, legNear: foot(124), legFar: foot(124) }),
      kf(0.14, { hip: [118, 106], torso: 4, armNear: { angles: [2, 0] }, legNear: foot(124), legFar: { target: [92, 168] }, footFar: 40 }),
      kf(0.28, { hip: [102, 120], torso: 5, armNear: { angles: [2, 0] }, legNear: foot(124), legFar: { target: [44, 178] }, footFar: 28 }),
      kf(0.5, { hip: [92, 140], torso: 5, armNear: { angles: [0, 0] }, legNear: foot(124), legFar: { target: [44, 178] }, footFar: 28 }),
      kf(0.56, { hip: [92, 140], torso: 5, armNear: { angles: [0, 0] }, legNear: foot(124), legFar: { target: [44, 178] }, footFar: 28 }),
      kf(0.74, { hip: [110, 114], torso: 6, armNear: { angles: [2, 0] }, legNear: foot(124), legFar: { target: [86, 166] }, footFar: 40 }),
      kf(0.88, { hip: [126, S], torso: 2, armNear: { angles: [2, 0] }, legNear: foot(124), legFar: foot(124) }),
      kf(1, { hip: [126, S], torso: 2, armNear: { angles: [2, 0] }, legNear: foot(124), legFar: foot(124) }),
    ],
  },
  {
    // Whole working foot on a knee-high box; stand up through it without pushing off the floor, lower slowly.
    id: 'step_up',
    durationSec: 3.4,
    props: [{ kind: 'box', x: 118, y: 146, w: 56, h: 42 }],
    keyframes: [
      kf(0, { hip: [100, 103], torso: 10, armNear: { angles: [10, 14] }, legNear: { target: [138, 142] }, legFar: foot(98) }),
      kf(0.12, { hip: [108, 96], torso: 22, armNear: { angles: [18, 24] }, legNear: { target: [138, 142] }, legFar: foot(98) }),
      kf(0.25, { hip: [122, 78], torso: 16, armNear: { angles: [10, 14] }, legNear: { target: [138, 142] }, legFar: { target: [106, 168] }, footFar: 30 }),
      kf(0.4, { hip: [136, 61], torso: 3, armNear: { angles: [2, 2] }, legNear: { target: [138, 142] }, legFar: { target: [128, 134] }, footFar: 50 }),
      kf(0.48, { hip: [136, 61], torso: 3, armNear: { angles: [2, 2] }, legNear: { target: [138, 142] }, legFar: { target: [128, 134] }, footFar: 50 }),
      kf(0.72, { hip: [120, 82], torso: 14, armNear: { angles: [10, 14] }, legNear: { target: [138, 142] }, legFar: { target: [104, 170] }, footFar: 40 }),
      kf(0.9, { hip: [100, 103], torso: 10, armNear: { angles: [10, 14] }, legNear: { target: [138, 142] }, legFar: foot(98) }),
      kf(1, { hip: [100, 103], torso: 10, armNear: { angles: [10, 14] }, legNear: { target: [138, 142] }, legFar: foot(98) }),
    ],
  },
];
