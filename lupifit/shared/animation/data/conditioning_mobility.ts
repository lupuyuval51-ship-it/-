import { STAND_HIP_Y } from '../engine';
import type { ExerciseAnimation, Keyframe, LimbSpec, Pose, Vec } from '../types';

/** Ankle height when the foot is flat on the floor. */
const FA = 184;
const H = STAND_HIP_Y;

/** Zoomed-out camera (keeps the floor near the bottom edge) for moves that go overhead or high. */
const wideCam = (cx: number, zoom = 0.82) => ({ cx, cy: 200 - 100 / zoom, zoom });

const tgt = (x: number, y: number, bend?: 1 | -1): LimbSpec => (bend ? { target: [x, y], bend } : { target: [x, y] });
const ang = (a: number, b: number): LimbSpec => ({ angles: [a, b] });

/** Side view: the same pose half a cycle later with near/far limbs swapped. */
function swapSides(p: Pose): Pose {
  return {
    ...p,
    armNear: p.armFar ?? p.armNear,
    armFar: p.armNear,
    legNear: p.legFar ?? p.legNear,
    legFar: p.legNear,
    footNear: p.footFar ?? p.footNear,
    footFar: p.footNear,
  };
}

/** Front view: mirror a pose around the canvas centre line (x = 120), swapping sides. */
function mirrorFront(p: Pose): Pose {
  const m = (s: LimbSpec | undefined): LimbSpec | undefined =>
    !s ? undefined : 'angles' in s ? s : { target: [240 - s.target[0], s.target[1]] as Vec, bend: s.bend };
  return {
    ...p,
    hip: [240 - p.hip[0], p.hip[1]],
    torso: -p.torso,
    armNear: m(p.armFar ?? p.armNear)!,
    armFar: m(p.armNear),
    legNear: m(p.legFar ?? p.legNear)!,
    legFar: m(p.legNear),
  };
}

/** Builds a seamless two-step cycle from the first half (t in [0, 0.5)) by swapping sides. */
function twoStepCycle(half: { t: number; pose: Pose; ease?: Keyframe['ease'] }[], swap: (p: Pose) => Pose): Keyframe[] {
  const out: Keyframe[] = half.map((k) => ({ t: k.t, pose: k.pose, ease: k.ease }));
  for (const k of half) out.push({ t: k.t + 0.5, pose: swap(k.pose), ease: k.ease });
  out.push({ t: 1, pose: half[0]!.pose, ease: half[0]!.ease });
  return out;
}

// ------------------------------------------------------------------ jump squat
const jsStand: Pose = { hip: [112, H], torso: 3, armNear: ang(4, 8), legNear: tgt(116, FA) };
const jsLoad: Pose = { hip: [96, 132], torso: 34, armNear: ang(-70, -60), legNear: tgt(116, FA) };
const jsTakeoff: Pose = { hip: [114, 99], torso: 5, armNear: ang(150, 158), legNear: tgt(118, 178), footNear: 40 };
const jsAir: Pose = { hip: [114, 82], torso: 2, armNear: ang(165, 170), legNear: tgt(117, 162), footNear: 45 };
const jsTouch: Pose = { hip: [113, 101], torso: 6, armNear: ang(95, 105), legNear: tgt(116, 180), footNear: 60 };
const jsLand: Pose = { hip: [98, 128], torso: 30, armNear: ang(40, 60), legNear: tgt(116, FA) };

// ------------------------------------------------------------------ box jump
const BOX_TOP = 148;
const bjOnBox = BOX_TOP - 4;
const bjStand: Pose = { hip: [114, H], torso: 3, armNear: ang(4, 8), legNear: tgt(118, FA) };

// ------------------------------------------------------------------ broad jump (start x 46 → land x 146, walk back)
const brStand = (x: number): Pose => ({ hip: [x - 4, H], torso: 3, armNear: ang(4, 8), legNear: tgt(x, FA) });

// ------------------------------------------------------------------ lateral bound (front view)
const lbLand: Pose = {
  hip: [80, 107],
  torso: -3,
  armNear: ang(30, 35),
  armFar: ang(5, 20),
  legNear: tgt(74, FA),
  legFar: tgt(80, 170),
};
const lbHold: Pose = { ...lbLand, hip: [80, 106], torso: -2, armNear: ang(22, 28), armFar: ang(10, 22) };
const lbLoad: Pose = { ...lbLand, hip: [79, 110], torso: 4, armNear: ang(10, 18), armFar: ang(-8, 8) };
const lbPush: Pose = {
  hip: [96, 100],
  torso: 6,
  armNear: ang(5, 10),
  armFar: ang(50, 55),
  legNear: tgt(78, 182),
  legFar: tgt(116, 172),
};
const lbAir: Pose = {
  hip: [122, 92],
  torso: 4,
  armNear: ang(10, 15),
  armFar: ang(45, 50),
  legNear: tgt(106, 168),
  legFar: tgt(142, 170),
};

// ------------------------------------------------------------------ burpee (hands fixed at x 138)
const BH = tgt(138, 178);
const bpStand: Pose = { hip: [100, H], torso: 3, armNear: ang(4, 8), legNear: tgt(104, FA) };
const bpSquat: Pose = { hip: [90, 146], torso: 68, head: -15, armNear: BH, legNear: tgt(104, 182), footNear: 70 };
const bpPlank: Pose = { hip: [92, 151], torso: 68, armNear: BH, legNear: ang(-68, -68), footNear: 15 };
const bpBottom: Pose = { hip: [97, 173], torso: 84, armNear: BH, legNear: ang(-83, -83), footNear: 15 };
const bpMid: Pose = { hip: [92, 137], torso: 76, armNear: BH, legNear: ang(-30, -100), footNear: 30 };
const bpKick: Pose = { hip: [92, 140], torso: 72, armNear: BH, legNear: ang(45, -80), footNear: 40 };

// ------------------------------------------------------------------ jumping jack (front)
const jjIn: Pose = { hip: [120, H], torso: 0, armNear: ang(6, 6), legNear: tgt(111, FA) };
const jjAir1: Pose = { hip: [120, 95], torso: 0, armNear: ang(80, 90), legNear: tgt(104, 176) };
const jjOut: Pose = { hip: [120, 106], torso: 0, armNear: ang(158, 170), legNear: tgt(95, FA) };
const jjAir2: Pose = { hip: [120, 95], torso: 0, armNear: ang(80, 90), legNear: tgt(104, 176) };

// ------------------------------------------------------------------ high knees (half cycle: near knee up)
const hkNearUp: Pose = {
  hip: [120, 99],
  torso: 2,
  armNear: ang(-40, 40),
  armFar: ang(45, 140),
  legNear: ang(92, 5),
  legFar: tgt(121, 178),
  footNear: 60,
  footFar: 55,
};
const hkSwitch: Pose = {
  hip: [120, 95],
  torso: 2,
  armNear: ang(5, 90),
  armFar: ang(5, 90),
  legNear: ang(40, -5),
  legFar: ang(30, -10),
  footNear: 55,
  footFar: 55,
};

// ------------------------------------------------------------------ walk / jog (half cycle starts with near heel strike)
const wkStrike: Pose = {
  hip: [118, 104],
  torso: 3,
  armNear: ang(-22, -12),
  armFar: ang(22, 45),
  legNear: tgt(140, 182),
  legFar: tgt(98, 180),
  footNear: 105,
  footFar: 55,
};
const wkMid: Pose = {
  hip: [118, 102.5],
  torso: 3,
  armNear: ang(0, 10),
  armFar: ang(0, 15),
  legNear: tgt(120, FA),
  legFar: tgt(114, 168),
  footNear: 90,
  footFar: 70,
};

// ------------------------------------------------------------------ sprint (half cycle: near foot contact)
const spContact: Pose = {
  hip: [116, 103],
  torso: 12,
  head: -8,
  armNear: ang(-45, 40),
  armFar: ang(55, 145),
  legNear: tgt(126, 182),
  legFar: ang(60, -40),
  footNear: 75,
  footFar: 45,
};
const spPush: Pose = {
  hip: [118, 101],
  torso: 12,
  head: -8,
  armNear: ang(-55, 30),
  armFar: ang(65, 150),
  legNear: tgt(96, 180),
  legFar: ang(85, 0),
  footNear: 45,
  footFar: 60,
};
const spFlight: Pose = {
  hip: [118, 95],
  torso: 12,
  head: -8,
  armNear: ang(5, 95),
  armFar: ang(5, 95),
  legNear: ang(-25, -95),
  legFar: ang(60, 25),
  footNear: 40,
  footFar: 80,
};

// ------------------------------------------------------------------ stationary bike
const CRANK: Vec = [134, 160];
const PEDAL_R = 14;
const pedal = (deg: number): LimbSpec => {
  const r = (deg * Math.PI) / 180;
  return tgt(Math.round((CRANK[0] + PEDAL_R * Math.cos(r)) * 10) / 10, Math.round((CRANK[1] + PEDAL_R * Math.sin(r)) * 10) / 10);
};
const bikeFrames = (): Keyframe[] =>
  Array.from({ length: 9 }, (_, i) => {
    const t = i / 8;
    const a = -90 + 360 * t; // screen angle: top → front → bottom → back
    const footAngle = (d: number) => 90 + 12 * Math.sin(((d + 90) * Math.PI) / 180);
    return {
      t,
      ease: 'linear' as const,
      pose: {
        hip: [96, 106 + (i % 4 === 0 ? 0 : 0.6)] as Vec,
        torso: 40,
        head: -18,
        armNear: tgt(160, 98),
        legNear: pedal(a),
        legFar: pedal(a + 180),
        footNear: footAngle(a),
        footFar: footAngle(a + 180),
      },
    };
  });

// ------------------------------------------------------------------ med ball slam
const msTop: Pose = { hip: [107, 99], torso: -3, head: -8, armNear: ang(166, 174), legNear: tgt(110, 178), footNear: 45 };
const msChest: Pose = { hip: [108, H], torso: 2, armNear: ang(-12, 115), legNear: tgt(112, FA) };
const msSlam: Pose = { hip: [88, 140], torso: 52, armNear: ang(55, 55), legNear: tgt(112, FA) };
const msFloor: Pose = { hip: [84, 150], torso: 50, head: -10, armNear: ang(25, 30), legNear: tgt(112, FA) };

// ------------------------------------------------------------------ chest pass
const cpLegs = { legNear: tgt(132, FA), legFar: tgt(98, FA) };
const cpChest: Pose = { hip: [112, 108], torso: 6, armNear: ang(-15, 110), ...cpLegs };
const cpThrow: Pose = { hip: [118, 107], torso: 14, armNear: ang(84, 86), ...cpLegs, legFar: tgt(98, 182), footFar: 50 };

// ------------------------------------------------------------------ cat-cow (quadruped)
const ccLegs = { legNear: tgt(52, 182, 1), footNear: -88 };
const ccNeutral: Pose = { hip: [92, 140], torso: 72, armNear: tgt(144, 176), ...ccLegs };
const ccCow: Pose = { hip: [91, 139], torso: 75, head: -35, armNear: tgt(144, 176), ...ccLegs };
const ccCat: Pose = { hip: [94, 140], torso: 67, head: 45, armNear: tgt(144, 176), ...ccLegs };

// ------------------------------------------------------------------ world's greatest stretch (near = front/right leg)
const wgPlank: Pose = { hip: [92, 151], torso: 68, armNear: tgt(140, 182), legNear: tgt(16, 182), footNear: 15 };
const wgStepping: Pose = {
  hip: [96, 150],
  torso: 64,
  armNear: tgt(140, 182),
  legNear: tgt(84, 160),
  legFar: tgt(22, 182),
  footNear: 60,
  footFar: 15,
};
const wgLunge: Pose = {
  hip: [92, 156],
  torso: 64,
  armNear: tgt(146, 182),
  armFar: tgt(146, 182),
  legNear: tgt(128, FA),
  legFar: tgt(24, 182),
  footFar: 15,
};
const wgElbow: Pose = { ...wgLunge, hip: [90, 162], torso: 74, armNear: ang(5, 95), armFar: tgt(146, 182) };
const wgReach: Pose = { ...wgLunge, hip: [92, 158], torso: 66, head: -30, armNear: ang(178, 178), armFar: tgt(146, 182) };
const wgHam: Pose = {
  hip: [76, 128],
  torso: 82,
  head: 10,
  armNear: tgt(140, 182),
  armFar: tgt(140, 182),
  legNear: tgt(128, FA),
  legFar: tgt(24, 182),
  footNear: 120,
  footFar: 15,
};

// ------------------------------------------------------------------ kneeling hip flexor stretch (near = kneeling leg)
const hfFront = tgt(152, FA);
const hfBase = { legFar: hfFront, footNear: -90 };
// Kneeling leg by angles (thigh near vertical, shin flat on the mat) so the knee rests on the floor instead of sinking into it.
const hfUp: Pose = { hip: [110, 139.5], torso: 0, armNear: ang(5, 5), armFar: tgt(142, 136), legNear: ang(2, -90), ...hfBase };
const hfStretch: Pose = { hip: [120, 139.5], torso: -4, head: 0, armNear: ang(172, 176), armFar: tgt(144, 136), legNear: ang(14, -90), ...hfBase };
const hfBreath: Pose = { ...hfStretch, hip: [121, 139.5], torso: -5, legNear: ang(15, -90) };

// ------------------------------------------------------------------ band dislocate (front)
const bdLegs = { legNear: tgt(110, FA) };
const bdFront: Pose = { hip: [120, H], torso: 0, armNear: ang(38, 40), ...bdLegs };
const bdUp: Pose = { hip: [120, H], torso: 0, armNear: ang(95, 98), ...bdLegs };
const bdTop: Pose = { hip: [120, H], torso: 0, armNear: ang(137, 139), ...bdLegs };
const bdBehind: Pose = { hip: [120, H], torso: 0, armNear: ang(45, 47), ...bdLegs };

export const animations: ExerciseAnimation[] = [
  {
    id: 'jump_squat',
    durationSec: 1.6,
    camera: wideCam(116),
    keyframes: [
      { t: 0, pose: jsStand },
      { t: 0.22, pose: jsLoad },
      { t: 0.29, pose: { hip: [104, 118], torso: 22, armNear: ang(45, 55), legNear: tgt(116, FA) } },
      { t: 0.36, pose: jsTakeoff },
      { t: 0.5, pose: jsAir },
      { t: 0.62, pose: jsTouch },
      { t: 0.76, pose: jsLand },
      { t: 1, pose: jsStand },
    ],
  },
  {
    id: 'box_jump',
    durationSec: 3.4,
    camera: wideCam(136),
    props: [{ kind: 'box', x: 140, y: BOX_TOP, w: 58, h: 188 - BOX_TOP }],
    keyframes: [
      { t: 0, pose: bjStand },
      { t: 0.12, pose: { hip: [104, 124], torso: 32, armNear: ang(-60, -50), legNear: tgt(118, FA) } },
      { t: 0.165, pose: { hip: [112, 114], torso: 22, armNear: ang(45, 55), legNear: tgt(118, FA) } },
      { t: 0.21, pose: { hip: [122, 99], torso: 10, armNear: ang(150, 158), legNear: tgt(124, 178), footNear: 40 }, ease: 'out' },
      { t: 0.25, pose: { hip: [132, 86], torso: 14, armNear: ang(150, 160), legNear: tgt(129, 150), footNear: 60 } },
      { t: 0.31, pose: { hip: [146, 76], torso: 22, armNear: ang(120, 130), legNear: tgt(152, 120), footNear: 75 } },
      { t: 0.4, pose: { hip: [155, 92], torso: 30, armNear: ang(45, 60), legNear: tgt(168, bjOnBox) } },
      { t: 0.52, pose: { hip: [166, 63], torso: 2, armNear: ang(4, 8), legNear: tgt(168, bjOnBox) } },
      { t: 0.62, pose: { hip: [166, 63], torso: 2, armNear: ang(4, 8), legNear: tgt(168, bjOnBox) } },
      { t: 0.66, pose: { hip: [162, 70], torso: 4, armNear: ang(6, 10), legNear: tgt(168, bjOnBox), legFar: ang(-8, -50), footFar: 60 } },
      { t: 0.7, pose: { hip: [158, 78], torso: 8, armNear: ang(8, 12), legNear: tgt(168, bjOnBox), legFar: ang(-14, -55), footFar: 80 } },
      { t: 0.74, pose: { hip: [150, 90], torso: 10, armNear: ang(8, 12), legNear: tgt(168, bjOnBox), legFar: ang(-20, -50), footFar: 70 } },
      { t: 0.78, pose: { hip: [140, 108], torso: 12, armNear: ang(8, 12), legNear: tgt(168, bjOnBox), legFar: tgt(118, FA) } },
      { t: 0.85, pose: { hip: [124, 104], torso: 6, armNear: ang(6, 10), legNear: tgt(138, 140), legFar: tgt(118, FA), footNear: 80 } },
      { t: 0.92, pose: { ...bjStand, legFar: tgt(118, FA) } },
      { t: 1, pose: bjStand },
    ],
  },
  {
    id: 'broad_jump',
    durationSec: 3.8,
    camera: wideCam(100),
    keyframes: [
      { t: 0, pose: brStand(46) },
      { t: 0.1, pose: { hip: [30, 126], torso: 42, armNear: ang(-60, -50), legNear: tgt(46, FA) } },
      { t: 0.14, pose: { hip: [46, 116], torso: 40, armNear: ang(45, 55), legNear: tgt(46, FA) } },
      { t: 0.18, pose: { hip: [64, 104], torso: 38, armNear: ang(128, 136), legNear: tgt(50, 180), footNear: 40 } },
      { t: 0.27, pose: { hip: [100, 84], torso: 22, armNear: ang(120, 128), legNear: tgt(110, 140), footNear: 80 } },
      { t: 0.34, pose: { hip: [124, 118], torso: 30, armNear: ang(80, 85), legNear: tgt(150, 174), footNear: 110 } },
      { t: 0.4, pose: { hip: [122, 140], torso: 46, armNear: ang(75, 82), legNear: tgt(146, FA) } },
      { t: 0.56, pose: { hip: [123, 138], torso: 44, armNear: ang(70, 78), legNear: tgt(146, FA) } },
      { t: 0.66, pose: brStand(146) },
      // walk back to the line
      { t: 0.71, pose: { ...brStand(146), hip: [136, 102], legFar: tgt(128, 174), footFar: 75 } },
      { t: 0.76, pose: { ...brStand(146), hip: [128, 104], legFar: tgt(112, FA) } },
      { t: 0.81, pose: { ...brStand(146), hip: [114, 102], legNear: tgt(112, 174), legFar: tgt(112, FA), footNear: 75 } },
      { t: 0.86, pose: { ...brStand(146), hip: [96, 104], legNear: tgt(79, FA), legFar: tgt(112, FA) } },
      { t: 0.91, pose: { ...brStand(146), hip: [82, 102], legNear: tgt(79, FA), legFar: tgt(79, 174), footFar: 75 } },
      { t: 0.96, pose: { ...brStand(146), hip: [62, 104], legNear: tgt(79, FA), legFar: tgt(46, FA) } },
      { t: 1, pose: brStand(46) },
    ],
  },
  {
    id: 'lateral_bound',
    durationSec: 3,
    view: 'front',
    keyframes: [
      { t: 0, pose: lbLand },
      { t: 0.14, pose: lbHold },
      { t: 0.27, pose: lbLoad },
      { t: 0.35, pose: lbPush, ease: 'out' },
      { t: 0.42, pose: lbAir, ease: 'in' },
      { t: 0.5, pose: mirrorFront(lbLand) },
      { t: 0.64, pose: mirrorFront(lbHold) },
      { t: 0.77, pose: mirrorFront(lbLoad) },
      { t: 0.85, pose: mirrorFront(lbPush), ease: 'out' },
      { t: 0.92, pose: mirrorFront(lbAir), ease: 'in' },
      { t: 1, pose: lbLand },
    ],
  },
  {
    id: 'burpee',
    durationSec: 3.6,
    camera: wideCam(100),
    keyframes: [
      { t: 0, pose: bpStand },
      { t: 0.1, pose: bpSquat },
      { t: 0.15, pose: bpKick },
      { t: 0.2, pose: bpMid },
      { t: 0.26, pose: bpPlank },
      { t: 0.37, pose: bpBottom },
      { t: 0.47, pose: bpPlank },
      { t: 0.52, pose: bpMid },
      { t: 0.57, pose: bpKick },
      { t: 0.63, pose: bpSquat },
      { t: 0.72, pose: { hip: [102, 100], torso: 6, armNear: ang(150, 158), legNear: tgt(105, 178), footNear: 40 } },
      { t: 0.8, pose: { hip: [101, 88], torso: 2, armNear: ang(170, 174), legNear: tgt(104, 166), footNear: 45 } },
      { t: 0.89, pose: { hip: [96, 116], torso: 20, armNear: ang(40, 55), legNear: tgt(104, FA) } },
      { t: 1, pose: bpStand },
    ],
  },
  {
    id: 'jumping_jack',
    durationSec: 1,
    camera: wideCam(120, 0.86),
    view: 'front',
    keyframes: [
      { t: 0, pose: jjIn },
      { t: 0.25, pose: jjAir1 },
      { t: 0.5, pose: jjOut },
      { t: 0.75, pose: jjAir2 },
      { t: 1, pose: jjIn },
    ],
  },
  {
    id: 'jump_rope_skipping',
    durationSec: 0.6,
    view: 'front',
    props: [{ kind: 'jumpRope' }],
    keyframes: [
      { t: 0, pose: { hip: [120, 103], torso: 0, armNear: ang(14, 42), legNear: tgt(114, 182) } },
      { t: 0.5, pose: { hip: [120, 94], torso: 0, armNear: ang(16, 48), legNear: tgt(115, 174) } },
      { t: 1, pose: { hip: [120, 103], torso: 0, armNear: ang(14, 42), legNear: tgt(114, 182) } },
    ],
  },
  {
    id: 'high_knees',
    durationSec: 0.7,
    keyframes: twoStepCycle(
      [
        { t: 0, pose: hkNearUp },
        { t: 0.25, pose: hkSwitch },
      ],
      swapSides,
    ),
  },
  {
    id: 'brisk_walk_jog',
    durationSec: 1.1,
    keyframes: twoStepCycle(
      [
        { t: 0, pose: wkStrike },
        { t: 0.25, pose: wkMid },
      ],
      swapSides,
    ),
  },
  {
    id: 'sprint_intervals',
    durationSec: 0.7,
    keyframes: twoStepCycle(
      [
        { t: 0, pose: spContact },
        { t: 0.17, pose: spPush },
        { t: 0.3, pose: spFlight },
      ],
      swapSides,
    ),
  },
  {
    id: 'cardio_machine_intervals',
    durationSec: 0.8,
    props: [
      { kind: 'bike', x: 150 },
      { kind: 'seat', x: 84, y: 110, w: 24 },
    ],
    keyframes: bikeFrames(),
  },
  {
    id: 'medicine_ball_slam',
    durationSec: 2.4,
    camera: wideCam(112),
    props: [{ kind: 'medicineBall' }],
    keyframes: [
      { t: 0, pose: msChest },
      { t: 0.25, pose: msTop, ease: 'in' },
      { t: 0.4, pose: msSlam },
      { t: 0.5, pose: msFloor },
      { t: 0.62, pose: msFloor },
      { t: 0.85, pose: msChest },
      { t: 1, pose: msChest },
    ],
  },
  {
    id: 'medicine_ball_chest_pass',
    durationSec: 1.5,
    props: [{ kind: 'medicineBall' }],
    keyframes: [
      { t: 0, pose: cpChest },
      { t: 0.15, pose: { ...cpChest, hip: [110, 110], torso: 4 } },
      { t: 0.32, pose: cpThrow, ease: 'out' },
      { t: 0.48, pose: cpThrow },
      { t: 0.75, pose: cpChest },
      { t: 1, pose: cpChest },
    ],
  },
  {
    id: 'cat_cow',
    durationSec: 5,
    props: [{ kind: 'mat', x: 30, w: 140 }],
    keyframes: [
      { t: 0, pose: ccNeutral },
      { t: 0.22, pose: ccCow },
      { t: 0.38, pose: ccCow },
      { t: 0.5, pose: ccNeutral },
      { t: 0.72, pose: ccCat },
      { t: 0.88, pose: ccCat },
      { t: 1, pose: ccNeutral },
    ],
  },
  {
    id: 'worlds_greatest_stretch',
    durationSec: 9,
    props: [{ kind: 'mat', x: 6, w: 160 }],
    keyframes: [
      { t: 0, pose: wgPlank },
      { t: 0.06, pose: wgStepping },
      { t: 0.12, pose: wgLunge },
      { t: 0.22, pose: wgElbow },
      { t: 0.32, pose: wgElbow },
      { t: 0.38, pose: wgLunge },
      { t: 0.48, pose: wgReach },
      { t: 0.58, pose: wgReach },
      { t: 0.64, pose: wgLunge },
      { t: 0.74, pose: wgHam },
      { t: 0.84, pose: wgHam },
      { t: 0.9, pose: wgLunge },
      { t: 0.95, pose: { ...wgStepping, armNear: tgt(146, 182), armFar: tgt(146, 182) } },
      { t: 1, pose: wgPlank },
    ],
  },
  {
    id: 'hip_flexor_stretch',
    durationSec: 6,
    props: [{ kind: 'mat', x: 50, w: 120 }],
    keyframes: [
      { t: 0, pose: hfUp },
      { t: 0.25, pose: hfStretch },
      { t: 0.45, pose: hfBreath },
      { t: 0.65, pose: hfStretch },
      { t: 0.85, pose: hfUp },
      { t: 1, pose: hfUp },
    ],
  },
  {
    id: 'band_shoulder_dislocate',
    durationSec: 4,
    view: 'front',
    props: [{ kind: 'bandBetweenHands' }],
    keyframes: [
      { t: 0, pose: bdFront },
      { t: 0.15, pose: bdUp },
      { t: 0.28, pose: bdTop },
      { t: 0.45, pose: bdBehind },
      { t: 0.55, pose: bdBehind },
      { t: 0.72, pose: bdTop },
      { t: 0.85, pose: bdUp },
      { t: 1, pose: bdFront },
    ],
    cues: [
      { t: 0, en: 'Band in front of hips', he: 'גומייה מול האגן' },
      { t: 0.28, en: 'Straight arms overhead', he: 'ידיים ישרות מעל הראש' },
      { t: 0.45, en: 'Band behind the back', he: 'גומייה מאחורי הגב' },
      { t: 0.72, en: 'Return the same path', he: 'חזרה באותו מסלול' },
    ],
  },
];
