import type { ExerciseAnimation, LimbSpec, Pose } from '../types';

/** Ankle height when a foot is planted on the floor. */
const FA = 184;
/** Hip / torso line height when lying on the back (torso half-width rests on the floor). */
const LIE_Y = 179.5;

// ---- forearm plank: elbows under shoulders, straight line heels → head, on the toes.
const plank = (dy: number, dt: number): Pose => ({
  hip: [120.5, 164.4 + dy],
  torso: 79 + dt,
  head: 4,
  armNear: { angles: [0, 90] },
  legNear: { target: [40, 180] },
  footNear: 15,
});

// ---- side plank (front view): bottom forearm on the floor, body a straight diagonal line, top arm up.
const sidePlank = (dy: number): Pose => ({
  hip: [122, 153.9 + dy],
  torso: 75,
  armNear: { angles: [180, 180] },
  armFar: { angles: [0, 90] },
  legNear: { angles: [75, 75] },
  legFar: { angles: [-75, -75] },
});

// ---- dead bug: lying on the back, arms to the ceiling, hips/knees at 90°.
const armUp: LimbSpec = { angles: [180, 180] };
const armOverhead: LimbSpec = { angles: [-100, -100] };
const tableTop: LimbSpec = { angles: [180, 90] };
const legLong: LimbSpec = { angles: [95, 95] };
const deadBug = (armNear: LimbSpec, armFar: LimbSpec, legNear: LimbSpec, legFar: LimbSpec): Pose => ({
  hip: [140, LIE_Y],
  torso: -90,
  armNear,
  armFar,
  legNear,
  legFar,
});

// ---- bird dog: quadruped, hands under shoulders, knees under hips.
const BD_HAND: LimbSpec = { target: [150, 179] };
const BD_KNEEL: LimbSpec = { angles: [0, -90] };
const birdDog = (armNear: LimbSpec, armFar: LimbSpec, legNear: LimbSpec, legFar: LimbSpec): Pose => ({
  hip: [100, 140],
  torso: 73.8,
  head: -6,
  armNear,
  armFar,
  legNear,
  legFar,
  footNear: -90,
  footFar: -90,
});

// ---- hanging core work (bar at the top edge, camera zoomed out a little).
const BAR_X = 120;
const BAR_Y = 2;
const HANG_CAM = { cx: 120, cy: 90, zoom: 0.9 };
const grip: LimbSpec = { target: [BAR_X + 2, BAR_Y + 4], bend: -1 };

// ---- crunch / bicycle: hands lightly behind the ears.
const behindHead = (hip: [number, number], torso: number): LimbSpec => {
  const r = (torso * Math.PI) / 180;
  const sx = hip[0] + 52 * Math.sin(r);
  const sy = hip[1] - 52 * Math.cos(r);
  // Head centre is 16.5 units out along the torso line; the wrist sits just behind it.
  return { target: [sx + 17.5 * Math.sin(r), sy - 17.5 * Math.cos(r)], bend: -1 };
};
const crunchPose = (torso: number): Pose => ({
  hip: [130, LIE_Y],
  torso,
  head: torso > -80 ? 10 : 0,
  armNear: behindHead([130, LIE_Y], torso),
  legNear: { target: [172, FA], bend: 1 },
});

const bike = (near: 'in' | 'out', torso: number): Pose => {
  const tuck: LimbSpec = { angles: [-160, 80] };
  const long: LimbSpec = { angles: [125, 125] };
  return {
    hip: [130, LIE_Y],
    torso,
    head: 12,
    armNear: behindHead([130, LIE_Y], torso),
    legNear: near === 'in' ? tuck : long,
    legFar: near === 'in' ? long : tuck,
  };
};

// ---- russian twist: V-sit leaning back ~45°, heels down, hands sweep beside each hip.
const twist = (hands: [number, number], torso: number, farHands?: [number, number]): Pose => ({
  hip: [112, 178],
  torso,
  head: 10,
  armNear: { target: hands, bend: -1 },
  armFar: { target: farHands ?? hands, bend: -1 },
  legNear: { target: [166, 181] },
  footNear: 115,
});

// ---- ab wheel: knees fixed at (65,183); the thigh rotates about the knee as the hips extend.
const KNEE: [number, number] = [65, 183];
const wheel = (thighDeg: number, torso: number, wrist: [number, number]): Pose => {
  const r = (thighDeg * Math.PI) / 180;
  // thigh angle (0 = hip straight above knee, + = hip forward of the knee)
  const hip: [number, number] = [KNEE[0] + 42 * Math.sin(r), KNEE[1] - 42 * Math.cos(r)];
  return { hip, torso, head: -6, armNear: { target: wrist }, legNear: { angles: [-thighDeg, -90] }, footNear: -110 };
};

// ---- mountain climber: high plank, knees drive alternately to the chest.
const MC_HAND: LimbSpec = { target: [153, 178] };
const MC_BACK: LimbSpec = { angles: [-66, -66] };
const MC_IN: LimbSpec = { angles: [50, -80] };
const MC_MID: LimbSpec = { angles: [-8, -92] };

export const animations: ExerciseAnimation[] = [
  {
    // Forearm plank hold with a slow breathing cycle.
    id: 'plank',
    durationSec: 3,
    keyframes: [
      { t: 0, pose: plank(0, 0) },
      { t: 0.5, pose: plank(-1, -0.6) },
      { t: 1, pose: plank(0, 0) },
    ],
  },
  {
    // Side plank seen from the front: forearm under the shoulder, hips up in one line, top arm reaching up.
    id: 'side_plank',
    durationSec: 3,
    view: 'front',
    keyframes: [
      { t: 0, pose: sidePlank(0) },
      { t: 0.5, pose: sidePlank(-1.2) },
      { t: 1, pose: sidePlank(0) },
    ],
  },
  {
    // Opposite arm and leg lower slowly toward the floor while the back stays flat; both sides.
    id: 'dead_bug',
    durationSec: 6,
    keyframes: [
      { t: 0, pose: deadBug(armUp, armUp, tableTop, tableTop) },
      { t: 0.2, pose: deadBug(armOverhead, armUp, tableTop, legLong) },
      { t: 0.28, pose: deadBug(armOverhead, armUp, tableTop, legLong) },
      { t: 0.5, pose: deadBug(armUp, armUp, tableTop, tableTop) },
      { t: 0.7, pose: deadBug(armUp, armOverhead, legLong, tableTop) },
      { t: 0.78, pose: deadBug(armUp, armOverhead, legLong, tableTop) },
      { t: 1, pose: deadBug(armUp, armUp, tableTop, tableTop) },
    ],
  },
  {
    // From all fours: reach one arm forward and the opposite leg back, hold, return; then the other side.
    id: 'bird_dog',
    durationSec: 7,
    keyframes: [
      { t: 0, pose: birdDog(BD_HAND, BD_HAND, BD_KNEEL, BD_KNEEL) },
      { t: 0.18, pose: birdDog({ angles: [94, 94] }, BD_HAND, BD_KNEEL, { angles: [-86, -86] }) },
      { t: 0.32, pose: birdDog({ angles: [94, 94] }, BD_HAND, BD_KNEEL, { angles: [-86, -86] }) },
      { t: 0.5, pose: birdDog(BD_HAND, BD_HAND, BD_KNEEL, BD_KNEEL) },
      { t: 0.68, pose: birdDog(BD_HAND, { angles: [94, 94] }, { angles: [-86, -86] }, BD_KNEEL) },
      { t: 0.82, pose: birdDog(BD_HAND, { angles: [94, 94] }, { angles: [-86, -86] }, BD_KNEEL) },
      { t: 1, pose: birdDog(BD_HAND, BD_HAND, BD_KNEEL, BD_KNEEL) },
    ],
  },
  {
    // Lower back pressed down, shoulders, arms and straight legs hovering; breathing hold.
    id: 'hollow_body_hold',
    durationSec: 3,
    keyframes: [
      { t: 0, pose: { hip: [135, LIE_Y], torso: -78, head: 12, armNear: { angles: [-112, -112] }, legNear: { angles: [108, 108] }, footNear: 120 } },
      { t: 0.5, pose: { hip: [135, LIE_Y], torso: -79.5, head: 12, armNear: { angles: [-110, -110] }, legNear: { angles: [106.5, 106.5] }, footNear: 118 } },
      { t: 1, pose: { hip: [135, LIE_Y], torso: -78, head: 12, armNear: { angles: [-112, -112] }, legNear: { angles: [108, 108] }, footNear: 120 } },
    ],
  },
  {
    // Short-range curl: shoulder blades lift off the floor, lower back stays down.
    id: 'crunch',
    durationSec: 2.6,
    keyframes: [
      { t: 0, pose: crunchPose(-90) },
      { t: 0.35, pose: crunchPose(-62) },
      { t: 0.48, pose: crunchPose(-62) },
      { t: 1, pose: crunchPose(-90) },
    ],
  },
  {
    // Shoulders stay up; knees alternate toward the chest while the other leg extends ~45°.
    id: 'bicycle_crunch',
    durationSec: 2.4,
    keyframes: [
      { t: 0, pose: bike('in', -68) },
      { t: 0.12, pose: bike('in', -68) },
      { t: 0.5, pose: bike('out', -66) },
      { t: 0.62, pose: bike('out', -66) },
      { t: 1, pose: bike('in', -68) },
    ],
  },
  {
    // Straight legs rise to vertical with a small pelvic curl, then lower slowly to just above the floor.
    id: 'lying_leg_raise',
    durationSec: 3.6,
    keyframes: [
      { t: 0, pose: { hip: [130, LIE_Y], torso: -90, armNear: { angles: [90, 90] }, legNear: { angles: [95, 95] }, footNear: 130 } },
      { t: 0.35, pose: { hip: [130, LIE_Y - 2], torso: -87, armNear: { angles: [90, 90] }, legNear: { angles: [176, 176] }, footNear: 210 } },
      { t: 0.45, pose: { hip: [130, LIE_Y - 2], torso: -87, armNear: { angles: [90, 90] }, legNear: { angles: [176, 176] }, footNear: 210 } },
      { t: 1, pose: { hip: [130, LIE_Y], torso: -90, armNear: { angles: [90, 90] }, legNear: { angles: [95, 95] }, footNear: 130 } },
    ],
  },
  {
    // Dead hang, knees drive up to the chest with a pelvic curl, controlled lowering.
    id: 'hanging_knee_raise',
    durationSec: 3,
    camera: HANG_CAM,
    props: [{ kind: 'pullUpBar', x: BAR_X, y: BAR_Y }],
    keyframes: [
      { t: 0, pose: { hip: [122, 113], torso: -9, armNear: grip, legNear: { angles: [32, -45] }, footNear: 0 } },
      { t: 0.35, pose: { hip: [125, 110], torso: -14, armNear: grip, legNear: { angles: [132, 28] }, footNear: 70 } },
      { t: 0.45, pose: { hip: [125, 110], torso: -14, armNear: grip, legNear: { angles: [132, 28] }, footNear: 70 } },
      { t: 1, pose: { hip: [122, 113], torso: -9, armNear: grip, legNear: { angles: [32, -45] }, footNear: 0 } },
    ],
  },
  {
    // Straight legs swing up in a controlled arc past hip height, pelvis curls at the top.
    id: 'hanging_leg_raise',
    durationSec: 3.4,
    camera: HANG_CAM,
    props: [{ kind: 'pullUpBar', x: BAR_X, y: BAR_Y }],
    keyframes: [
      { t: 0, pose: { hip: [122, 113], torso: -9, armNear: grip, legNear: { angles: [38, 38] }, footNear: 120 } },
      { t: 0.38, pose: { hip: [126, 108], torso: -16, armNear: grip, legNear: { angles: [112, 112] }, footNear: 200 } },
      { t: 0.48, pose: { hip: [126, 108], torso: -16, armNear: grip, legNear: { angles: [112, 112] }, footNear: 200 } },
      { t: 1, pose: { hip: [122, 113], torso: -9, armNear: grip, legNear: { angles: [38, 38] }, footNear: 120 } },
    ],
  },
  {
    // Leaning back ~45° with heels down; the hands sweep from one hip to the other through the centre.
    id: 'russian_twist',
    durationSec: 2.4,
    keyframes: [
      { t: 0, pose: twist([120, 140], -45) },
      { t: 0.25, pose: twist([118, 168], -42, [114, 166]) },
      { t: 0.5, pose: twist([120, 140], -45) },
      { t: 0.75, pose: twist([100, 168], -49, [102, 170]) },
      { t: 1, pose: twist([120, 140], -45) },
    ],
  },
  {
    // High-to-low chop from a high pulley, arms long, trunk rotating toward the opposite hip.
    id: 'cable_woodchop',
    durationSec: 2.8,
    view: 'front',
    props: [
      { kind: 'weightStack', x: 214, y: 12 },
      { kind: 'cable', anchor: [216, 14], at: 'handFar' },
    ],
    keyframes: [
      { t: 0, pose: { hip: [120, 105.2], torso: 14, head: -6, armNear: { target: [160, 26] }, armFar: { target: [162, 26] }, legNear: { target: [103, 184] } } },
      { t: 0.2, pose: { hip: [120, 105.2], torso: -2, head: 0, armNear: { target: [148, 76] }, armFar: { target: [150, 76] }, legNear: { target: [103, 184] } } },
      { t: 0.4, pose: { hip: [120, 105.2], torso: -18, head: 8, armNear: { target: [108, 92] }, armFar: { target: [110, 92] }, legNear: { target: [103, 184] } } },
      { t: 0.5, pose: { hip: [120, 105.2], torso: -18, head: 8, armNear: { target: [108, 92] }, armFar: { target: [110, 92] }, legNear: { target: [103, 184] } } },
      { t: 0.74, pose: { hip: [120, 105.2], torso: -2, head: 0, armNear: { target: [148, 76] }, armFar: { target: [150, 76] }, legNear: { target: [103, 184] } } },
      { t: 1, pose: { hip: [120, 105.2], torso: 14, head: -6, armNear: { target: [160, 26] }, armFar: { target: [162, 26] }, legNear: { target: [103, 184] } } },
    ],
  },
  {
    // Cable pulls from the side (stack behind the lifter); press straight out, hold without rotating, return.
    id: 'pallof_press',
    durationSec: 3.2,
    props: [
      { kind: 'weightStack', x: 40, y: 40 },
      { kind: 'cable', anchor: [47, 72], at: 'handNear' },
    ],
    keyframes: [
      { t: 0, pose: { hip: [116, 104], torso: 0, armNear: { target: [126, 76] }, legNear: { target: [122, FA] } } },
      { t: 0.3, pose: { hip: [116, 104], torso: 0, armNear: { target: [168, 64] }, legNear: { target: [122, FA] } } },
      { t: 0.6, pose: { hip: [116, 104], torso: 0, armNear: { target: [168, 64] }, legNear: { target: [122, FA] } } },
      { t: 1, pose: { hip: [116, 104], torso: 0, armNear: { target: [126, 76] }, legNear: { target: [122, FA] } } },
    ],
  },
  {
    // Kneeling: the wheel rolls out as hips and shoulders extend together, then rolls back.
    id: 'ab_wheel_rollout',
    durationSec: 3.6,
    props: [{ kind: 'abWheel' }, { kind: 'mat', x: 10, w: 100 }],
    keyframes: [
      { t: 0, pose: wheel(-3, 55, [110, 167]) },
      { t: 0.11, pose: wheel(13, 62, [140, 169]) },
      { t: 0.22, pose: wheel(30, 68, [169, 171]) },
      { t: 0.335, pose: wheel(45, 74, [189, 169]) },
      { t: 0.45, pose: wheel(60, 80, [207, 168]) },
      { t: 0.55, pose: wheel(60, 80, [207, 168]) },
      { t: 0.665, pose: wheel(45, 74, [189, 169]) },
      { t: 0.78, pose: wheel(30, 68, [169, 171]) },
      { t: 0.89, pose: wheel(13, 62, [140, 169]) },
      { t: 1, pose: wheel(-3, 55, [110, 167]) },
    ],
  },
  {
    // Locked-arm support on parallel bars, straight legs held level with the hips.
    id: 'l_sit',
    durationSec: 3,
    props: [{ kind: 'dipBars', x: 100, y: 110 }],
    keyframes: [
      { t: 0, pose: { hip: [96, 100], torso: 5, armNear: { target: [102, 105] }, legNear: { angles: [90, 90] }, footNear: 95 } },
      { t: 0.5, pose: { hip: [96, 99], torso: 6, armNear: { target: [102, 105] }, legNear: { angles: [88, 88] }, footNear: 95 } },
      { t: 1, pose: { hip: [96, 100], torso: 5, armNear: { target: [102, 105] }, legNear: { angles: [90, 90] }, footNear: 95 } },
    ],
  },
  {
    // High plank, hips level; knees drive alternately toward the chest at running rhythm.
    id: 'mountain_climber',
    durationSec: 0.8,
    keyframes: [
      { t: 0, pose: { hip: [106, 143], torso: 66, armNear: MC_HAND, legNear: MC_IN, legFar: MC_BACK, footNear: 60, footFar: 15 } },
      { t: 0.25, pose: { hip: [106, 140], torso: 70, armNear: MC_HAND, legNear: MC_MID, legFar: MC_MID, footNear: 40, footFar: 40 } },
      { t: 0.5, pose: { hip: [106, 143], torso: 66, armNear: MC_HAND, legNear: MC_BACK, legFar: MC_IN, footNear: 15, footFar: 60 } },
      { t: 0.75, pose: { hip: [106, 140], torso: 70, armNear: MC_HAND, legNear: MC_MID, legFar: MC_MID, footNear: 40, footFar: 40 } },
      { t: 1, pose: { hip: [106, 143], torso: 66, armNear: MC_HAND, legNear: MC_IN, legFar: MC_BACK, footNear: 60, footFar: 15 } },
    ],
  },
];
