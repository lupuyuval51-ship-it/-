import { STAND_HIP_Y } from '../engine';
import type { ExerciseAnimation, LimbSpec, Pose } from '../types';

/** Ankle height when a foot is planted on the floor. */
const FA = 184;

// ---- hanging pulls (bar at y=22 so the head can clear it at the top while the bent legs clear the floor)
const BAR_Y = 24;
const BAR_X = 120;
const grip: LimbSpec = { target: [BAR_X + 2, BAR_Y + 4], bend: -1 };
/** Knees bent, feet crossed behind so they clear the floor in a dead hang. */
const hangLegs: LimbSpec = { angles: [34, -96] };
const hangBottom: Pose = { hip: [124, 137], torso: -3, armNear: grip, legNear: hangLegs, footNear: -70 };
const hangTop: Pose = { hip: [122, 76], torso: -12, head: -4, armNear: grip, legNear: { angles: [38, -90] }, footNear: -65 };

// Muscle-up: bar lower so the straight-arm support fits; the loop starts from the hollow (feet-forward) kip swing.
const MU_X = 118;
const MU_Y = 92;
const MU_HOLLOW: Pose = { hip: [137, 170], torso: -60, armNear: { target: [MU_X + 2, MU_Y + 4], bend: -1 }, legNear: { angles: [100, 100] } };
const MU_SUPPORT: Pose = { hip: [115, 81], torso: 10, armNear: { target: [MU_X - 2, MU_Y - 5], bend: 1 }, legNear: { angles: [14, 4] } };

export const animations: ExerciseAnimation[] = [
  {
    // Dead hang → chin clears the bar; elbows drive down to the ribs, slow 2 s eccentric.
    id: 'pull_up',
    durationSec: 3.6,
    props: [{ kind: 'pullUpBar', x: BAR_X, y: BAR_Y }],
    keyframes: [
      { t: 0, pose: hangBottom },
      { t: 0.08, pose: hangBottom },
      { t: 0.4, pose: hangTop },
      { t: 0.5, pose: hangTop },
      { t: 1, pose: hangBottom },
    ],
  },
  {
    // Underhand, shoulder-width grip; legs slightly forward, chin clearly over the bar with a pause.
    id: 'chin_up',
    durationSec: 3.6,
    props: [{ kind: 'pullUpBar', x: BAR_X, y: BAR_Y }],
    keyframes: [
      { t: 0, pose: { ...hangBottom, legNear: { angles: [48, -60] }, footNear: -30 } },
      { t: 0.08, pose: { ...hangBottom, legNear: { angles: [48, -60] }, footNear: -30 } },
      { t: 0.4, pose: { ...hangTop, legNear: { angles: [52, -55] }, footNear: -25 } },
      { t: 0.52, pose: { ...hangTop, legNear: { angles: [52, -55] }, footNear: -25 } },
      { t: 1, pose: { ...hangBottom, legNear: { angles: [48, -60] }, footNear: -30 } },
    ],
  },
  {
    // Band looped on the bar, one knee in the loop: the band stretches at the bottom and helps at the top.
    id: 'band_assisted_pull_up',
    durationSec: 3.6,
    props: [
      { kind: 'pullUpBar', x: BAR_X, y: BAR_Y },
      { kind: 'band', anchor: [BAR_X - 2, BAR_Y], at: 'footNear' },
      { kind: 'band', anchor: [BAR_X + 3, BAR_Y], at: 'footNear' },
    ],
    keyframes: [
      { t: 0, pose: hangBottom },
      { t: 0.08, pose: hangBottom },
      { t: 0.4, pose: hangTop },
      { t: 0.5, pose: hangTop },
      { t: 1, pose: hangBottom },
    ],
  },
  {
    // Step up to the top position from a box, then a slow 3–4 s lowering to a full hang.
    id: 'negative_pull_up',
    durationSec: 5.5,
    props: [
      { kind: 'pullUpBar', x: BAR_X, y: BAR_Y },
      { kind: 'box', x: 58, y: 158, w: 38, h: 30 },
    ],
    keyframes: [
      { t: 0, pose: hangTop },
      { t: 0.1, pose: hangTop, ease: 'linear' },
      { t: 0.75, pose: hangBottom },
      { t: 0.8, pose: hangBottom },
      { t: 0.88, pose: { hip: [118, 112], torso: -6, armNear: grip, legNear: { target: [84, 154] } } },
      { t: 1, pose: hangTop },
    ],
  },
  {
    // Kip swing → explosive pull to the lower chest → lean over the bar → press out to straight-arm support.
    id: 'muscle_up',
    durationSec: 3.4,
    props: [{ kind: 'pullUpBar', x: MU_X, y: MU_Y }],
    keyframes: [
      { t: 0, pose: MU_HOLLOW },
      { t: 0.3, pose: { hip: [123, 134], torso: -15, armNear: { target: [MU_X + 2, MU_Y + 4], bend: -1 }, legNear: { angles: [72, 58] } }, ease: 'out' },
      { t: 0.42, pose: { hip: [100, 121], torso: 30, head: 8, armNear: { target: [MU_X - 2, MU_Y - 5], bend: 1 }, legNear: { angles: [50, -60] } } },
      { t: 0.62, pose: MU_SUPPORT },
      { t: 0.76, pose: MU_SUPPORT },
      { t: 1, pose: MU_HOLLOW },
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
      { t: 0, pose: { hip: [104, 144], torso: -10, armNear: { target: [122, 34], bend: -1 }, legNear: { target: [146, FA] } } },
      { t: 0.35, pose: { hip: [104, 144], torso: -16, armNear: { target: [100, 104], bend: -1 }, legNear: { target: [146, FA] } } },
      { t: 0.45, pose: { hip: [104, 144], torso: -16, armNear: { target: [100, 104], bend: -1 }, legNear: { target: [146, FA] } } },
      { t: 1, pose: { hip: [104, 144], torso: -10, armNear: { target: [122, 34], bend: -1 }, legNear: { target: [146, FA] } } },
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
    props: [{ kind: 'dipBars', x: 112, y: 104 }],
    keyframes: [
      { t: 0, pose: { hip: [126, 168], torso: -80, armNear: { target: [112, 108], bend: 1 }, legNear: { target: [206, 182] }, footNear: 175 } },
      { t: 0.35, pose: { hip: [132, 150], torso: -64, armNear: { target: [112, 108], bend: 1 }, legNear: { target: [206, 182] }, footNear: 165 } },
      { t: 0.45, pose: { hip: [132, 150], torso: -64, armNear: { target: [112, 108], bend: 1 }, legNear: { target: [206, 182] }, footNear: 165 } },
      { t: 1, pose: { hip: [126, 168], torso: -80, armNear: { target: [112, 108], bend: 1 }, legNear: { target: [206, 182] }, footNear: 175 } },
    ],
  },
  {
    // Leaning back on the straps with a rigid plank; pull the chest to the handles.
    id: 'suspension_trainer_row',
    durationSec: 3,
    props: [{ kind: 'strap', anchor: [196, 8], at: 'hands', style: 'trx' }],
    keyframes: [
      { t: 0, pose: { hip: [98, 122], torso: -40, armNear: { target: [112, 58] }, legNear: { target: [150, FA] } } },
      { t: 0.35, pose: { hip: [114, 110], torso: -26, armNear: { target: [108, 70], bend: -1 }, legNear: { target: [150, FA] } } },
      { t: 0.45, pose: { hip: [114, 110], torso: -26, armNear: { target: [108, 70], bend: -1 }, legNear: { target: [150, FA] } } },
      { t: 1, pose: { hip: [98, 122], torso: -40, armNear: { target: [112, 58] }, legNear: { target: [150, FA] } } },
    ],
  },
  {
    // Rings at waist height, body straight from head to heels; rings come to the ribs.
    id: 'ring_row',
    durationSec: 3,
    props: [{ kind: 'strap', anchor: [140, 4], at: 'hands', style: 'rings' }],
    keyframes: [
      { t: 0, pose: { hip: [128, 158], torso: -68, armNear: { target: [128, 98] }, legNear: { target: [200, FA] } } },
      { t: 0.35, pose: { hip: [136, 140], torso: -55, armNear: { target: [116, 96], bend: 1 }, legNear: { target: [200, FA] } } },
      { t: 0.45, pose: { hip: [136, 140], torso: -55, armNear: { target: [116, 96], bend: 1 }, legNear: { target: [200, FA] } } },
      { t: 1, pose: { hip: [128, 158], torso: -68, armNear: { target: [128, 98] }, legNear: { target: [200, FA] } } },
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
      { t: 0, pose: { hip: [120, STAND_HIP_Y + 1.5], torso: 0, armNear: { angles: [6, 6] }, legNear: { angles: [4, 4] } } },
      { t: 0.35, pose: { hip: [120, STAND_HIP_Y - 1.5], torso: 0, head: 0, armNear: { angles: [4, 4] }, legNear: { angles: [4, 4] } } },
      { t: 0.6, pose: { hip: [120, STAND_HIP_Y - 1.5], torso: 0, armNear: { angles: [4, 4] }, legNear: { angles: [4, 4] } } },
      { t: 1, pose: { hip: [120, STAND_HIP_Y + 1.5], torso: 0, armNear: { angles: [6, 6] }, legNear: { angles: [4, 4] } } },
    ],
  },
  ...curl('barbell_curl', [{ kind: 'barbell', plates: 'small' }]),
  ...curl('dumbbell_curl', [{ kind: 'dumbbell', at: 'hands' }]),
  ...curl('hammer_curl', [{ kind: 'dumbbell', at: 'hands' }]),
  ...curl('cable_biceps_curl', [
    { kind: 'weightStack', x: 214, y: 70 },
    { kind: 'cable', anchor: [214, 178], at: 'handNear' },
  ]),
  ...curl('band_biceps_curl', [{ kind: 'band', anchor: [124, 186], at: 'hands' }]),
];

/** Standing curl: elbows pinned at the sides, only the forearm moves; slower lowering. */
function curl(id: string, props: ExerciseAnimation['props']): ExerciseAnimation[] {
  const base = { hip: [116, STAND_HIP_Y] as [number, number], torso: 0, legNear: { target: [118, FA] } as LimbSpec };
  const down: Pose = { ...base, armNear: { angles: [2, 4] } };
  const up: Pose = { ...base, armNear: { angles: [10, 150] } };
  return [
    {
      id,
      durationSec: 3,
      props,
      keyframes: [
        { t: 0, pose: down },
        { t: 0.35, pose: up },
        { t: 0.45, pose: up },
        { t: 1, pose: down },
      ],
    },
  ];
}
