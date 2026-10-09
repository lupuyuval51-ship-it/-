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
    // The camera tracks the hip over a dashed floor, so the travelling stride loops seamlessly.
    camera: { cx: 120, cy: 100, zoom: 1, followX: true },
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
    camera: { cx: 120, cy: 80, zoom: 0.86 },
    props: [{ kind: 'box', x: 118, y: 151, w: 58, h: 37 }],
    keyframes: [
      kf(0, { hip: [100, 103], torso: 9, armNear: { angles: [6, 10] }, legNear: { target: [140, 147] }, legFar: foot(98) }),
      kf(0.12, { hip: [110, 98], torso: 22, armNear: { angles: [14, 20] }, legNear: { target: [140, 147] }, legFar: foot(98) }),
      kf(0.26, { hip: [126, 82], torso: 13, armNear: { angles: [8, 12] }, legNear: { target: [140, 147] }, legFar: { target: [110, 168] }, footFar: 40 }),
      kf(0.4, { hip: [139, 66], torso: 2, armNear: { angles: [2, 2] }, legNear: { target: [140, 147] }, legFar: { target: [127, 140] }, footFar: 50 }),
      kf(0.48, { hip: [139, 66], torso: 2, armNear: { angles: [2, 2] }, legNear: { target: [140, 147] }, legFar: { target: [127, 140] }, footFar: 50 }),
      kf(0.7, { hip: [124, 84], torso: 13, armNear: { angles: [8, 12] }, legNear: { target: [140, 147] }, legFar: { target: [108, 170] }, footFar: 45 }),
      kf(0.88, { hip: [100, 103], torso: 9, armNear: { angles: [6, 10] }, legNear: { target: [140, 147] }, legFar: foot(98) }),
      kf(1, { hip: [100, 103], torso: 9, armNear: { angles: [6, 10] }, legNear: { target: [140, 147] }, legFar: foot(98) }),
    ],
  },
  {
    // Front view: shift into one deep side squat (heel down) while the other leg straightens, then switch sides.
    id: 'cossack_squat',
    durationSec: 5,
    view: 'front',
    keyframes: (() => {
      const L: Vec = [72, FLOOR_ANKLE];
      const R: Vec = [168, FLOOR_ANKLE];
      const p = (hip: Vec, torso: number): Pose => ({
        hip,
        torso,
        armNear: { target: [hip[0] - 3, hip[1] - 26], bend: 1 },
        legNear: { target: L },
        legFar: { target: R },
      });
      return [
        kf(0, p([120, 112], 0)),
        kf(0.1, p([110, 118], -3)),
        kf(0.24, p([86, 150], -8)),
        kf(0.3, p([86, 150], -8)),
        kf(0.42, p([110, 118], -3)),
        kf(0.5, p([120, 112], 0)),
        kf(0.6, p([130, 118], 3)),
        kf(0.74, p([154, 150], 8)),
        kf(0.8, p([154, 150], 8)),
        kf(0.92, p([130, 118], 3)),
        kf(1, p([120, 112], 0)),
      ];
    })(),
  },
  {
    // Single-leg squat to full depth: free leg held straight out in front, arms reach forward to counterbalance.
    id: 'pistol_squat',
    durationSec: 4,
    keyframes: (() => {
      const steps: [number, number, number, number, [number, number]][] = [
        // t, shin, thigh, torso, free leg
        [0, 0, 4, 4, [36, 28]],
        [0.18, 14, 50, 22, [62, 60]],
        [0.36, 26, 96, 38, [86, 86]],
        [0.5, 32, 122, 44, [98, 100]],
        [0.56, 32, 122, 44, [98, 100]],
        [0.72, 26, 96, 38, [86, 86]],
        [0.86, 14, 50, 22, [62, 60]],
        [1, 0, 4, 4, [36, 28]],
      ];
      return steps.map(([t, shin, thigh, torso, free]) =>
        kf(t, {
          hip: hipFrom([112, FLOOR_ANKLE], shin, thigh),
          torso,
          armNear: { angles: [Math.min(88, 40 + torso * 1.2), Math.min(92, 44 + torso * 1.2)] },
          legNear: foot(112),
          legFar: { angles: free },
          footFar: 100,
        }),
      );
    })(),
  },
  {
    // 45° leg press: back flat on the reclined pad, the sled travels on its rail; knees come toward the chest
    // without the hips curling off the pad, then press out without locking the knees.
    id: 'leg_press',
    durationSec: 3.4,
    props: [
      { kind: 'bench', x: 54, y: 150, w: 44, incline: 42 },
      { kind: 'legPressSled' },
    ],
    keyframes: (() => {
      const top: Vec = [146, 84];
      const bottom: Vec = [114, 112];
      const p = (f: Vec): Pose => ({ hip: [70, 143], torso: -48, head: 10, armNear: rel(-48, 6, 40), legNear: { target: f, bend: 1 }, footNear: -132 });
      return [kf(0, p(top)), kf(0.45, p(bottom)), kf(0.52, p(bottom)), kf(0.88, p(top)), kf(1, p(top))];
    })(),
  },
  {
    // Seated, knee at the machine pivot, pad above the ankles: extend to near-straight, squeeze, lower slowly.
    id: 'leg_extension',
    durationSec: 3.2,
    props: [
      { kind: 'weightStack', x: 22, y: 70 },
      { kind: 'seat', x: 62, y: 142, w: 54, back: 56 },
      { kind: 'handle', at: 'handNear' },
      { kind: 'machinePad', at: 'ankles' },
    ],
    keyframes: (() => {
      const p = (shin: number): Pose => ({ hip: [80, 135], torso: -10, armNear: { angles: [6, 70] }, legNear: { angles: [90, shin] }, footNear: shin + 80 });
      return [kf(0, p(4)), kf(0.3, p(84)), kf(0.4, p(84)), kf(0.9, p(4)), kf(1, p(4))];
    })(),
  },
  {
    // Prone on the bench, knees just off the edge, pad above the heels: curl toward the glutes with hips down.
    id: 'lying_leg_curl',
    durationSec: 3.2,
    props: [
      { kind: 'bench', x: 70, y: 141, w: 116 },
      { kind: 'machinePad', at: 'ankles' },
      { kind: 'handle', at: 'handNear' },
    ],
    keyframes: (() => {
      const p = (shin: number, foot: number): Pose => ({ hip: [112, 132], torso: 90, head: -10, armNear: { angles: [24, 100] }, legNear: { angles: [-90, shin] }, footNear: foot });
      return [kf(0, p(-92, -4)), kf(0.32, p(-215, -125)), kf(0.42, p(-215, -125)), kf(0.9, p(-92, -4)), kf(1, p(-92, -4))];
    })(),
  },
  {
    // Balls of the feet on a step edge, heels sink below it, rise as high as possible, pause, lower slowly.
    id: 'standing_calf_raise',
    durationSec: 3,
    props: [
      { kind: 'box', x: 128, y: 172, w: 54, h: 16 },
      { kind: 'wall', x: 196 },
    ],
    keyframes: (() => {
      const p = (ankle: Vec, footAngle: number): Pose => ({
        hip: [ankle[0] - 1, ankle[1] - 81.6],
        torso: 2,
        armNear: { target: [186, ankle[1] - 110] },
        legNear: { target: ankle },
        footNear: footAngle,
      });
      const low = p([120, 176], 112);
      const mid = p([121.5, 170.5], 80);
      const high = p([123, 163.5], 46);
      return [kf(0, low), kf(0.15, mid), kf(0.3, high), kf(0.45, high), kf(0.7, mid), kf(0.92, low), kf(1, low)];
    })(),
  },
  {
    // One foot on the step edge, other leg bent behind and clear; full stretch at the bottom, full rise at the top.
    id: 'single_leg_calf_raise',
    durationSec: 3.2,
    props: [
      { kind: 'box', x: 128, y: 172, w: 54, h: 16 },
      { kind: 'wall', x: 196 },
    ],
    keyframes: (() => {
      const p = (ankle: Vec, footAngle: number): Pose => ({
        hip: [ankle[0] - 1, ankle[1] - 81.6],
        torso: 2,
        armNear: { target: [186, ankle[1] - 110] },
        legNear: { target: ankle },
        legFar: { angles: [6, -62] },
        footNear: footAngle,
        footFar: 20,
      });
      const low = p([120, 176], 112);
      const mid = p([121.5, 170.5], 80);
      const high = p([123, 163.5], 46);
      return [kf(0, low), kf(0.15, mid), kf(0.3, high), kf(0.45, high), kf(0.7, mid), kf(0.92, low), kf(1, low)];
    })(),
  },
  {
    // Isometric hold: back and head flat on the wall, knees at 90° directly over the ankles; slow breathing.
    id: 'wall_sit',
    durationSec: 3.2,
    props: [{ kind: 'wall', x: 56 }],
    keyframes: (() => {
      const p = (dy: number, head: number): Pose => ({
        hip: [72, 144 + dy],
        torso: 0,
        head,
        armNear: { target: [100, 141 + dy * 0.5], bend: -1 },
        legNear: foot(114),
      });
      return [kf(0, p(0, 0)), kf(0.5, p(-1.2, -2)), kf(1, p(0, 0))];
    })(),
  },
];
