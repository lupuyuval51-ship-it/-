import { BODY, STAND_HIP_Y } from '../engine';
import type { ExerciseAnimation, LimbSpec, Pose } from '../types';

/** Ankle height when a foot is planted on the floor. */
const FA = 184;

// ---- hanging pulls: the bar sits at the top edge and the camera zooms out so the hang is a true
// straight-arm dead hang and the chin clearly clears the bar at the top.
const BAR_Y = 2;
const BAR_X = 120;
const HANG_CAM = { cx: 120, cy: 84, zoom: 0.88 };
const grip: LimbSpec = { target: [BAR_X + 2, BAR_Y + 4], bend: -1 };
/** Knees softly bent, feet just behind so they clear the floor. */
const hangBottom: Pose = { hip: [123, 114], torso: -9, armNear: grip, legNear: { angles: [22, -62] }, footNear: -35 };
const hangTop: Pose = { hip: [128, 56], torso: -24, head: -6, armNear: grip, legNear: { angles: [24, -58] }, footNear: -32 };

// Muscle-up: zoomed out further so dead hang and straight-arm support both fit.
// Poses are specified by the shoulder position (the hands never leave the bar) and torso lean;
// one elbow bend direction is used throughout so the IK never flips mid-movement.
const MU_X = 118;
const MU_Y = 10;
const MU_CAM = { cx: 120, cy: 56, zoom: 0.72 };
/** Pose from the shoulder position, torso lean and the wrist's height relative to the bar (the grip rolls over the bar). */
const muPose = (sx: number, sy: number, torso: number, wristDy: number, legs: [number, number], foot?: number): Pose => ({
  hip: [sx - BODY.torso * Math.sin((torso * Math.PI) / 180), sy + BODY.torso * Math.cos((torso * Math.PI) / 180)],
  torso,
  head: torso < 0 ? -4 : 6,
  armNear: { target: [MU_X, MU_Y + wristDy], bend: -1 },
  legNear: { angles: legs },
  ...(foot != null ? { footNear: foot } : {}),
});
const MU_HANG = muPose(118, 70, -3, 4, [22, -72], -40);
const MU_SUPPORT = muPose(114, -51, 8, -5, [14, 4]);

export const animations: ExerciseAnimation[] = [
  {
    // Dead hang → chin clears the bar; elbows drive down to the ribs, slow 2 s eccentric.
    id: 'pull_up',
    durationSec: 3.6,
    camera: HANG_CAM,
    props: [{ kind: 'pullUpBar', x: BAR_X, y: BAR_Y }],
    keyframes: [
      { t: 0, pose: hangBottom },
      { t: 0.06, pose: hangBottom },
      { t: 0.44, pose: hangTop },
      { t: 0.54, pose: hangTop },
      { t: 1, pose: hangBottom },
    ],
  },
  {
    // Underhand, shoulder-width grip; legs slightly forward, chin clearly over the bar with a pause.
    id: 'chin_up',
    durationSec: 3.6,
    camera: HANG_CAM,
    props: [{ kind: 'pullUpBar', x: BAR_X, y: BAR_Y }],
    keyframes: [
      { t: 0, pose: { ...hangBottom, legNear: { angles: [40, -50] }, footNear: 0 } },
      { t: 0.08, pose: { ...hangBottom, legNear: { angles: [40, -50] }, footNear: 0 } },
      { t: 0.4, pose: { ...hangTop, legNear: { angles: [40, -38] }, footNear: 14 } },
      { t: 0.52, pose: { ...hangTop, legNear: { angles: [40, -38] }, footNear: 14 } },
      { t: 1, pose: { ...hangBottom, legNear: { angles: [40, -50] }, footNear: 0 } },
    ],
  },
  {
    // Band looped on the bar, one knee in the loop: the band stretches at the bottom and helps at the top.
    id: 'band_assisted_pull_up',
    sharedMotionWith: { id: 'pull_up', differs: 'the resistance band looped over the bar under the knee' },
    durationSec: 3.6,
    camera: HANG_CAM,
    props: [
      { kind: 'pullUpBar', x: BAR_X, y: BAR_Y },
      { kind: 'band', anchor: [BAR_X - 2, BAR_Y], at: 'footNear' },
      { kind: 'band', anchor: [BAR_X + 3, BAR_Y], at: 'footNear' },
    ],
    keyframes: [
      { t: 0, pose: hangBottom },
      { t: 0.06, pose: hangBottom },
      { t: 0.44, pose: hangTop },
      { t: 0.54, pose: hangTop },
      { t: 1, pose: hangBottom },
    ],
  },
  {
    // Step up to the top position from a box, then a slow 3–4 s lowering to a full hang.
    id: 'negative_pull_up',
    durationSec: 5.5,
    camera: HANG_CAM,
    props: [
      { kind: 'pullUpBar', x: BAR_X, y: BAR_Y },
      { kind: 'box', x: 48, y: 160, w: 38, h: 28 },
    ],
    keyframes: [
      { t: 0, pose: hangTop },
      { t: 0.1, pose: hangTop },
      { t: 0.7, pose: hangBottom },
      { t: 0.76, pose: hangBottom },
      { t: 0.87, pose: { hip: [124, 90], torso: -16, head: -4, armNear: grip, legNear: { angles: [26, -42] }, footNear: -25 } },
      { t: 1, pose: hangTop },
    ],
  },
  {
    // Kip swing → explosive pull to the lower chest → lean over the bar → press out to straight-arm support.
    id: 'muscle_up',
    durationSec: 3.6,
    camera: MU_CAM,
    props: [{ kind: 'pullUpBar', x: MU_X, y: MU_Y }],
    keyframes: [
      { t: 0, pose: MU_HANG },
      { t: 0.08, pose: muPose(124, 67, -14, 4, [55, -30]) },
      { t: 0.17, pose: muPose(122, 62, -25, 4, [60, 10]) },
      { t: 0.34, pose: muPose(110, 32, -18, 3, [45, 20]) },
      { t: 0.4, pose: muPose(100, 17, 4, 2, [44, 12]) },
      { t: 0.46, pose: muPose(99, 3, 22, 0, [40, 0]) },
      { t: 0.58, pose: MU_SUPPORT },
      { t: 0.7, pose: MU_SUPPORT },
      { t: 0.82, pose: muPose(99, 3, 24, 0, [34, -6]) },
      { t: 0.88, pose: muPose(100, 17, 4, 2, [38, -10]) },
      { t: 0.94, pose: muPose(114, 56, -8, 3, [30, -40]) },
      { t: 1, pose: MU_HANG },
    ],
  },
  {
    // Seated, thighs under the pad: bar from overhead to the upper chest with a slight lean back.
    id: 'lat_pulldown',
    durationSec: 3.4,
    props: [
      { kind: 'weightStack', x: 196, y: 40 },
      { kind: 'cable', anchor: [126, 6], at: 'handNear' },
      { kind: 'seat', x: 82, y: 150, w: 40 },
      { kind: 'machinePad', at: 'thighs' },
    ],
    keyframes: [
      { t: 0, pose: { hip: [104, 144], torso: -10, armNear: { target: [118, 46], bend: -1 }, legNear: { target: [146, FA] } } },
      { t: 0.35, pose: { hip: [104, 144], torso: -16, armNear: { target: [106, 106], bend: -1 }, legNear: { target: [146, FA] } } },
      { t: 0.45, pose: { hip: [104, 144], torso: -16, armNear: { target: [106, 106], bend: -1 }, legNear: { target: [146, FA] } } },
      { t: 1, pose: { hip: [104, 144], torso: -10, armNear: { target: [118, 46], bend: -1 }, legNear: { target: [146, FA] } } },
    ],
  },
  {
    // Hinged ~35° above horizontal, flat back, soft knees; bar rows from below the shoulders to the lower ribs.
    id: 'barbell_bent_over_row',
    durationSec: 3,
    props: [{ kind: 'barbell', plates: 'large' }],
    keyframes: [
      { t: 0, pose: { hip: [90, 110], torso: 56, head: -10, armNear: { target: [130, 134] }, legNear: { target: [118, FA] } } },
      { t: 0.35, pose: { hip: [90, 110], torso: 56, head: -10, armNear: { target: [116, 102] }, legNear: { target: [118, FA] } } },
      { t: 0.45, pose: { hip: [90, 110], torso: 56, head: -10, armNear: { target: [116, 102] }, legNear: { target: [118, FA] } } },
      { t: 1, pose: { hip: [90, 110], torso: 56, head: -10, armNear: { target: [130, 134] }, legNear: { target: [118, FA] } } },
    ],
  },
  {
    // Knee and hand on the bench, back flat; the dumbbell rows from a dead hang toward the hip.
    id: 'one_arm_dumbbell_row',
    durationSec: 3,
    props: [
      { kind: 'bench', x: 46, y: 155, w: 116 },
      { kind: 'dumbbell', at: 'handNear' },
    ],
    keyframes: [
      { t: 0, pose: { hip: [95, 108], torso: 76, head: -15, armNear: { target: [146, 150] }, armFar: { target: [148, 150] }, legNear: { target: [114, FA] }, legFar: { angles: [0, -90] } } },
      { t: 0.35, pose: { hip: [95, 108], torso: 76, head: -15, armNear: { target: [122, 112] }, armFar: { target: [148, 150] }, legNear: { target: [114, FA] }, legFar: { angles: [0, -90] } } },
      { t: 0.45, pose: { hip: [95, 108], torso: 76, head: -15, armNear: { target: [122, 112] }, armFar: { target: [148, 150] }, legNear: { target: [114, FA] }, legFar: { angles: [0, -90] } } },
      { t: 1, pose: { hip: [95, 108], torso: 76, head: -15, armNear: { target: [146, 150] }, armFar: { target: [148, 150] }, legNear: { target: [114, FA] }, legFar: { angles: [0, -90] } } },
    ],
  },
  {
    // Tall seated torso, feet on the plate; the V-handle comes to the lower ribs, shoulder blades squeeze.
    id: 'seated_cable_row',
    durationSec: 3,
    props: [
      { kind: 'seat', x: 66, y: 162, w: 44 },
      { kind: 'box', x: 176, y: 136, w: 6, h: 52 },
      { kind: 'weightStack', x: 212, y: 60 },
      { kind: 'cable', anchor: [214, 146], at: 'handNear' },
    ],
    keyframes: [
      { t: 0, pose: { hip: [88, 156], torso: 10, armNear: { target: [150, 120] }, legNear: { target: [170, 152] }, footNear: 170 } },
      { t: 0.35, pose: { hip: [88, 156], torso: -4, armNear: { target: [100, 124] }, legNear: { target: [170, 152] }, footNear: 170 } },
      { t: 0.45, pose: { hip: [88, 156], torso: -4, armNear: { target: [100, 124] }, legNear: { target: [170, 152] }, footNear: 170 } },
      { t: 1, pose: { hip: [88, 156], torso: 10, armNear: { target: [150, 120] }, legNear: { target: [170, 152] }, footNear: 170 } },
    ],
  },
  {
    // Under parallel bars, heels on the floor, body rigid; chest rises to the bar.
    id: 'inverted_row',
    durationSec: 3,
    props: [{ kind: 'dipBars', x: 106, y: 104 }],
    keyframes: [
      { t: 0, pose: { hip: [136, 168.5], torso: -80, armNear: { target: [106, 108] }, legNear: { target: [216, 182] }, footNear: 175 } },
      { t: 0.35, pose: { hip: [145, 146], torso: -64, armNear: { target: [106, 108] }, legNear: { target: [216, 182] }, footNear: 165 } },
      { t: 0.45, pose: { hip: [145, 146], torso: -64, armNear: { target: [106, 108] }, legNear: { target: [216, 182] }, footNear: 165 } },
      { t: 1, pose: { hip: [136, 168.5], torso: -80, armNear: { target: [106, 108] }, legNear: { target: [216, 182] }, footNear: 175 } },
    ],
  },
  {
    // Leaning back on the straps with a rigid plank; pull the chest to the handles.
    id: 'suspension_trainer_row',
    durationSec: 3,
    props: [{ kind: 'strap', anchor: [196, 8], at: 'hands', style: 'trx' }],
    keyframes: [
      { t: 0, pose: { hip: [97.4, 121.3], torso: -40, armNear: { target: [113.5, 54.6] }, legNear: { target: [150, FA] } } },
      { t: 0.35, pose: { hip: [114, 110], torso: -26, armNear: { target: [108, 70], bend: -1 }, legNear: { target: [150, FA] } } },
      { t: 0.45, pose: { hip: [114, 110], torso: -26, armNear: { target: [108, 70], bend: -1 }, legNear: { target: [150, FA] } } },
      { t: 1, pose: { hip: [97.4, 121.3], torso: -40, armNear: { target: [113.5, 54.6] }, legNear: { target: [150, FA] } } },
    ],
  },
  {
    // Rings at waist height, body straight from head to heels; rings come to the ribs.
    id: 'ring_row',
    durationSec: 3,
    props: [{ kind: 'strap', anchor: [122, 4], at: 'hands', style: 'rings' }],
    keyframes: [
      { t: 0, pose: { hip: [127.8, 145.6], torso: -62, armNear: { target: [108, 72] }, legNear: { target: [200, FA] } } },
      { t: 0.35, pose: { hip: [142, 126], torso: -45, armNear: { target: [122, 93] }, legNear: { target: [200, FA] } } },
      { t: 0.45, pose: { hip: [142, 126], torso: -45, armNear: { target: [122, 93] }, legNear: { target: [200, FA] } } },
      { t: 1, pose: { hip: [127.8, 145.6], torso: -62, armNear: { target: [108, 72] }, legNear: { target: [200, FA] } } },
    ],
  },
  {
    // Standing row against a band anchored at chest height in a door.
    id: 'band_row',
    durationSec: 2.8,
    props: [
      { kind: 'wall', x: 222 },
      { kind: 'band', anchor: [222, 68], at: 'hands' },
    ],
    keyframes: [
      { t: 0, pose: { hip: [112, 103], torso: 4, armNear: { target: [166, 68] }, legNear: { target: [118, FA] } } },
      { t: 0.4, pose: { hip: [112, 103], torso: 1, armNear: { target: [118, 82] }, legNear: { target: [118, FA] } } },
      { t: 0.52, pose: { hip: [112, 103], torso: 1, armNear: { target: [118, 82] }, legNear: { target: [118, FA] } } },
      { t: 1, pose: { hip: [112, 103], torso: 4, armNear: { target: [166, 68] }, legNear: { target: [118, FA] } } },
    ],
  },
  {
    // Straight arms, shoulders lift toward the ears and hold.
    id: 'dumbbell_shrug',
    durationSec: 2.8,
    view: 'front',
    props: [{ kind: 'dumbbell', at: 'hands' }],
    keyframes: [
      { t: 0, pose: { hip: [120, STAND_HIP_Y], torso: 0, armNear: { angles: [6, 6] }, legNear: { angles: [4, 4] } } },
      { t: 0.35, pose: { hip: [120, STAND_HIP_Y], torso: 0, shoulderRise: 7, armNear: { angles: [4, 4] }, legNear: { angles: [4, 4] } } },
      { t: 0.6, pose: { hip: [120, STAND_HIP_Y], torso: 0, shoulderRise: 7, armNear: { angles: [4, 4] }, legNear: { angles: [4, 4] } } },
      { t: 1, pose: { hip: [120, STAND_HIP_Y], torso: 0, armNear: { angles: [6, 6] }, legNear: { angles: [4, 4] } } },
    ],
  },
  ...curls(),
];

/**
 * Five curl variants that differ in grip, path and view (never copies of one keyframe set):
 * - barbell: straight bar, supinated grip, elbows pinned, both arms together (side view).
 * - dumbbell: alternating arms, the resting arm stays down (side view).
 * - hammer: neutral grip (dumbbells drawn as bars pointing forward), both arms together, lower elbow range.
 * - cable: low pulley, staggered stance, elbow drifts slightly forward, visible cable line (side view).
 * - band: stands on the band, short range, band stretches taut at the top (side view).
 */
function curls(): ExerciseAnimation[] {
  const stand = (x: number, rest: Pose) => ({ ...rest, hip: [x, STAND_HIP_Y] as [number, number], torso: rest.torso ?? 0 });
  const legsAt = (x: number): Pick<Pose, 'legNear'> => ({ legNear: { target: [x + 2, FA] } });
  const barDown: Pose = stand(116, { hip: [116, 0], torso: 0, ...legsAt(116), armNear: { angles: [2, 4] } });
  const barUp: Pose = stand(116, { hip: [116, 0], torso: 0, ...legsAt(116), armNear: { angles: [12, 150] } });
  const alt = (near: LimbSpec, far: LimbSpec): Pose => ({ hip: [116, STAND_HIP_Y], torso: 0, ...legsAt(116), armNear: near, armFar: far });
  const rest: LimbSpec = { angles: [2, 6] };
  const curled: LimbSpec = { angles: [10, 146] };
  const cable = (arm: LimbSpec, torso: number): Pose => ({ hip: [112, STAND_HIP_Y + 2], torso, armNear: arm, legNear: { target: [128, FA] }, legFar: { target: [98, FA] } });
  const band = (arm: LimbSpec): Pose => ({ hip: [118, STAND_HIP_Y + 2], torso: 0, armNear: arm, legNear: { target: [122, FA] }, legFar: { target: [108, FA] } });
  return [
    {
      id: 'barbell_curl',
      durationSec: 3.2,
      props: [{ kind: 'barbell', plates: 'small' }],
      keyframes: [
        { t: 0, pose: barDown },
        { t: 0.4, pose: barUp },
        { t: 0.5, pose: barUp },
        { t: 1, pose: barDown },
      ],
    },
    {
      id: 'dumbbell_curl',
      durationSec: 4.4,
      props: [{ kind: 'dumbbell', at: 'hands' }],
      keyframes: [
        { t: 0, pose: alt(rest, rest) },
        { t: 0.2, pose: alt(curled, rest) },
        { t: 0.27, pose: alt(curled, rest) },
        { t: 0.5, pose: alt(rest, rest) },
        { t: 0.7, pose: alt(rest, curled) },
        { t: 0.77, pose: alt(rest, curled) },
        { t: 1, pose: alt(rest, rest) },
      ],
    },
    {
      // Neutral (palms-in) grip: the dumbbells point forward and read as bars, unlike the end-on supinated curl.
      id: 'hammer_curl',
      durationSec: 3.6,
      props: [{ kind: 'dumbbell', at: 'hands', grip: 'neutral' }],
      keyframes: [
        { t: 0, pose: { hip: [116, STAND_HIP_Y], torso: 0, ...legsAt(116), armNear: { angles: [-2, 6] } } },
        { t: 0.34, pose: { hip: [116, STAND_HIP_Y], torso: 0, ...legsAt(116), armNear: { angles: [4, 138] } } },
        { t: 0.52, pose: { hip: [116, STAND_HIP_Y], torso: 0, ...legsAt(116), armNear: { angles: [4, 138] } } },
        { t: 1, pose: { hip: [116, STAND_HIP_Y], torso: 0, ...legsAt(116), armNear: { angles: [-2, 6] } } },
      ],
    },
    {
      id: 'cable_biceps_curl',
      durationSec: 3.8,
      props: [
        { kind: 'weightStack', x: 214, y: 70 },
        { kind: 'cable', anchor: [200, 182], at: 'handNear' },
      ],
      keyframes: [
        { t: 0, pose: cable({ angles: [-2, 14] }, 3) },
        { t: 0.36, pose: cable({ angles: [20, 148] }, -2) },
        { t: 0.46, pose: cable({ angles: [20, 148] }, -2) },
        { t: 1, pose: cable({ angles: [-2, 14] }, 3) },
      ],
    },
    {
      id: 'band_biceps_curl',
      durationSec: 2.8,
      props: [{ kind: 'band', anchor: [116, 186], at: 'hands' }],
      keyframes: [
        { t: 0, pose: band({ angles: [0, 6] }) },
        { t: 0.45, pose: band({ angles: [6, 128] }) },
        { t: 0.6, pose: band({ angles: [6, 128] }) },
        { t: 1, pose: band({ angles: [0, 6] }) },
      ],
    },
  ];
}
