import { STAND_HIP_Y } from '../engine';
import type { ExerciseAnimation, Keyframe, LimbSpec, Pose, Vec } from '../types';

/* ------------------------------------------------------------------ helpers */

const RAD = Math.PI / 180;
const FLOOR_ANKLE = 184;
const TOES_ANKLE = 180;
const TORSO = 52;
const round = (n: number) => Math.round(n * 10) / 10;

/** Keyframes from [t, pose, ease?] tuples; the first pose is repeated at t=1 when the list does not end there. */
function kf(...items: [number, Pose, Keyframe['ease']?][]): Keyframe[] {
  const out: Keyframe[] = items.map(([t, pose, ease]) => (ease ? { t, pose, ease } : { t, pose }));
  if (out[out.length - 1]!.t !== 1) out.push({ t: 1, pose: out[0]!.pose });
  return out;
}

/** Shoulder position for a hip position and torso angle (side view, facing +x). */
function shoulderOf(hip: Vec, torso: number): Vec {
  return [hip[0] + TORSO * Math.sin(torso * RAD), hip[1] - TORSO * Math.cos(torso * RAD)];
}

/** Straight-body plank pivoting on the toes with the wrist fixed (see chest.ts). */
function plankPose(pivot: Vec, wrist: Vec, reach: number, footNear = 40): Pose {
  const len = 82 + TORSO;
  const sh = (th: number): Vec => [pivot[0] + len * Math.cos(th * RAD), pivot[1] - len * Math.sin(th * RAD)];
  let best = 0;
  let bestY = Infinity;
  let pt = -70;
  let pv = Math.hypot(sh(pt)[0] - wrist[0], sh(pt)[1] - wrist[1]) - reach;
  for (let th = -70; th <= 89; th += 0.1) {
    const s = sh(th);
    const v = Math.hypot(s[0] - wrist[0], s[1] - wrist[1]) - reach;
    if (Math.sign(v) !== Math.sign(pv)) {
      const root = pt + ((th - pt) * pv) / (pv - v);
      if (sh(root)[1] < bestY) {
        bestY = sh(root)[1];
        best = root;
      }
    }
    pv = v;
    pt = th;
  }
  return {
    hip: [round(pivot[0] + 82 * Math.cos(best * RAD)), round(pivot[1] - 82 * Math.sin(best * RAD))],
    torso: round(90 - best),
    armNear: { target: wrist },
    legNear: { target: pivot },
    footNear,
  };
}

/* ------------------------------------------------------------- set-ups */

/** Standing upright (side view). */
const STAND_HIP: Vec = [110, STAND_HIP_Y];
const STAND_FEET: LimbSpec = { target: [112, FLOOR_ANKLE] };

/** Seated on a bench with a back support (side view): seat top y=148. */
const SEAT = { kind: 'seat', x: 78, y: 148, w: 42, back: 64 } as const;
const SEAT_HIP: Vec = [91, 141];
const SEAT_TORSO = -4;
const SEAT_SH = shoulderOf(SEAT_HIP, SEAT_TORSO);
const SEAT_FEET: LimbSpec = { target: [137, FLOOR_ANKLE] };
function seated(arm: LimbSpec, extra: Partial<Pose> = {}): Pose {
  return { hip: SEAT_HIP, torso: SEAT_TORSO, armNear: arm, legNear: SEAT_FEET, ...extra };
}

/** Lying on a flat bench (same set-up as the chest presses). */
const FLAT_BENCH = { kind: 'bench', x: 58, y: 149, w: 94 } as const;
const LIE_HIP: Vec = [142, 140];
const LIE_SH: Vec = [LIE_HIP[0] - TORSO, LIE_HIP[1]];
function lying(arm: LimbSpec): Pose {
  return { hip: LIE_HIP, torso: -90, armNear: arm, legNear: { target: [181, FLOOR_ANKLE] } };
}

/** Front-view standing figure. */
const FRONT_HIP: Vec = [120, STAND_HIP_Y + 1];
const FRONT_LEGS: LimbSpec = { angles: [5, 4] };
function front(arm: LimbSpec, extra: Partial<Pose> = {}): Pose {
  return { hip: FRONT_HIP, torso: 0, armNear: arm, legNear: FRONT_LEGS, ...extra };
}

/** Camera that fits a standing figure with arms locked overhead. */
const OVERHEAD_CAM = { cx: 120, cy: 84, zoom: 0.86 };

/* ------------------------------------------------------------- overhead press */

const OHP_SH = shoulderOf(STAND_HIP, 0);
function ohp(wrist: Vec, torso = 0, head = 0, hipX = STAND_HIP[0]): Pose {
  return { hip: [hipX, STAND_HIP[1]], torso, head, armNear: { target: wrist }, legNear: STAND_FEET };
}

/* ------------------------------------------------------------- push-up variants */

const PIKE_WRIST: Vec = [155, 182];
const PIKE_FEET: LimbSpec = { target: [63, TOES_ANKLE], bend: -1 };

/** Wall handstand: wall at x=150, hands ~15 cm from it, body inverted (torso ≈ 180°, chest facing -x). */
const HS_WRIST: Vec = [134, 182];
function handstand(shoulder: Vec, torso: number, legAngle: number): Pose {
  const dir: Vec = [Math.sin(torso * RAD), -Math.cos(torso * RAD)];
  return {
    hip: [round(shoulder[0] - TORSO * dir[0]), round(shoulder[1] - TORSO * dir[1])],
    torso,
    head: 0,
    armNear: { target: HS_WRIST },
    legNear: { angles: [legAngle, legAngle] },
    footNear: 210,
  };
}

const DIAMOND_PIVOT: Vec = [28, TOES_ANKLE];
const DIAMOND_WRIST: Vec = [149, 182];

/* ------------------------------------------------------------- dips */

const DIP_BARS = { kind: 'dipBars', x: 120, y: 106 } as const;
const DIP_WRIST: Vec = [120, 102];
function dip(shoulder: Vec, torso: number, legs: [number, number]): Pose {
  const dir: Vec = [Math.sin(torso * RAD), -Math.cos(torso * RAD)];
  return {
    hip: [round(shoulder[0] - TORSO * dir[0]), round(shoulder[1] - TORSO * dir[1])],
    torso,
    armNear: { target: DIP_WRIST },
    legNear: { angles: legs },
  };
}
const DIP_TOP = dip([122, DIP_WRIST[1] - 56.9], 8, [-6, -95]);
const DIP_BOTTOM = dip([135, 82], 24, [-2, -98]);

/* ------------------------------------------------------------- pushdowns */

const PD_HIP: Vec = [102, STAND_HIP_Y];
const PD_TORSO = 10;
function pushdown(forearm: number): Pose {
  return { hip: PD_HIP, torso: PD_TORSO, armNear: { angles: [6, forearm] }, legNear: { target: [108, FLOOR_ANKLE] } };
}

/* ------------------------------------------------------------- animations */

export const animations: ExerciseAnimation[] = [
  {
    // From the front rack: head back, bar straight up past the face, head "through the window", lockout over mid-foot.
    id: 'barbell_overhead_press',
    durationSec: 3.4,
    camera: OVERHEAD_CAM,
    props: [{ kind: 'rack', x: 62, hookY: 58 }, { kind: 'barbell', at: 'hands' }],
    keyframes: kf(
      [0, ohp([OHP_SH[0] + 11, OHP_SH[1] + 8], -3, 0, STAND_HIP[0] + 1)],
      [0.18, ohp([OHP_SH[0] + 9, OHP_SH[1] - 24], -5, -14, STAND_HIP[0] + 2)],
      [0.38, ohp([OHP_SH[0] + 4, OHP_SH[1] - 56.9], 0, 6)],
      [0.5, ohp([OHP_SH[0] + 4, OHP_SH[1] - 56.9], 0, 6)],
      [0.75, ohp([OHP_SH[0] + 9, OHP_SH[1] - 24], -5, -14, STAND_HIP[0] + 2)],
    ),
    cues: [
      { t: 0.05, en: 'Head back, press straight up', he: 'ראש לאחור, דחפו ישר למעלה' },
      { t: 0.4, en: 'Head through, bar over mid-foot', he: 'ראש קדימה, מוט מעל אמצע כף הרגל' },
    ],
  },
  {
    // Seated with back support: dumbbells at shoulder height → pressed overhead, slow 2–3 s lowering.
    id: 'dumbbell_shoulder_press',
    durationSec: 3.4,
    props: [SEAT, { kind: 'dumbbell', at: 'hands' }],
    keyframes: kf(
      [0, seated({ target: [SEAT_SH[0] + 13, SEAT_SH[1] + 3] })],
      [0.3, seated({ target: [SEAT_SH[0] + 4, SEAT_SH[1] - 56.9] })],
      [0.4, seated({ target: [SEAT_SH[0] + 4, SEAT_SH[1] - 56.9] })],
    ),
  },
  {
    // Starts like the top of a curl (palms in, elbows in front); elbows sweep out to the sides while pressing.
    id: 'arnold_press',
    durationSec: 3.8,
    props: [SEAT, { kind: 'dumbbell', at: 'hands' }],
    keyframes: kf(
      [0, seated({ angles: [28, 172] })],
      [0.16, seated({ target: [SEAT_SH[0] + 12, SEAT_SH[1] - 6] })],
      [0.38, seated({ target: [SEAT_SH[0] + 4, SEAT_SH[1] - 56.9] })],
      [0.48, seated({ target: [SEAT_SH[0] + 4, SEAT_SH[1] - 56.9] })],
      [0.76, seated({ target: [SEAT_SH[0] + 12, SEAT_SH[1] - 6] })],
    ),
    cues: [
      { t: 0.05, en: 'Rotate palms out as you press', he: 'סובבו כפות החוצה תוך כדי לחיצה' },
      { t: 0.55, en: 'Rotate back to palms facing you', he: 'סובבו חזרה, כפות אליכם' },
    ],
  },
  {
    // One arm: rack position (elbow tucked, forearm vertical) → lockout with biceps by the ear; free hand in a fist.
    id: 'kettlebell_overhead_press',
    durationSec: 3.2,
    camera: OVERHEAD_CAM,
    props: [{ kind: 'kettlebell', at: 'handNear' }],
    keyframes: kf(
      [0, { ...ohp([OHP_SH[0] + 9, OHP_SH[1] + 6]), armFar: { angles: [6, 14] } }],
      [0.36, { ...ohp([OHP_SH[0] + 3, OHP_SH[1] - 56.9]), armFar: { angles: [6, 14] } }],
      [0.48, { ...ohp([OHP_SH[0] + 3, OHP_SH[1] - 56.9]), armFar: { angles: [6, 14] } }],
    ),
  },
  {
    // Inverted V; the head travels down to just in front of the hands while the hips stay high.
    id: 'pike_push_up',
    durationSec: 3,
    props: [{ kind: 'mat', x: 40, w: 150 }],
    keyframes: kf(
      [0, { hip: [96, 105], torso: 115, head: 0, armNear: { target: PIKE_WRIST }, legNear: PIKE_FEET, footNear: 35 }],
      [0.48, { hip: [116, 118], torso: 138, head: 0, armNear: { target: PIKE_WRIST }, legNear: PIKE_FEET, footNear: 35 }],
      [0.55, { hip: [116, 118], torso: 138, head: 0, armNear: { target: PIKE_WRIST }, legNear: PIKE_FEET, footNear: 35 }],
    ),
  },
  {
    // Heels on the wall, straight body; head lowered to the mat in front of the hands (tripod), then pressed up.
    id: 'wall_handstand_push_up',
    durationSec: 3.6,
    view: 'side',
    camera: { cx: 120, cy: 86, zoom: 0.84 },
    props: [{ kind: 'wall', x: 150 }, { kind: 'mat', x: 96, w: 54 }],
    keyframes: kf(
      [0, handstand([HS_WRIST[0], HS_WRIST[1] - 56.9], 184, 176)],
      [0.48, handstand([HS_WRIST[0] - 7, 161], 190, 176)],
      [0.56, handstand([HS_WRIST[0] - 7, 161], 190, 176)],
    ),
  },
  {
    // Front view: arms rise to shoulder height leading with the elbows (slight bend), brief pause, slow lowering.
    id: 'dumbbell_lateral_raise',
    durationSec: 3.2,
    view: 'front',
    props: [{ kind: 'dumbbell', at: 'hands' }],
    keyframes: kf(
      [0, front({ angles: [10, 6] })],
      [0.36, front({ angles: [86, 78] })],
      [0.46, front({ angles: [86, 78] })],
    ),
  },
  {
    // Low pulley on the far side; the cable crosses in front of the body to the near hand. Far hand holds the machine.
    id: 'cable_lateral_raise',
    durationSec: 3.2,
    view: 'front',
    props: [
      { kind: 'weightStack', x: 176, y: 40 },
      { kind: 'cable', anchor: [183, 180], at: 'handNear' },
    ],
    keyframes: kf(
      [0, front({ angles: [-8, -12] }, { armFar: { target: [178, 98] } })],
      [0.38, front({ angles: [86, 80] }, { armFar: { target: [178, 98] } })],
      [0.46, front({ angles: [86, 80] }, { armFar: { target: [178, 98] } })],
    ),
  },
  {
    // Standing on the band; both hands raise to shoulder height against the band.
    id: 'band_lateral_raise',
    durationSec: 3,
    view: 'front',
    props: [{ kind: 'band', anchor: [120, 186], at: 'hands' }],
    keyframes: kf(
      [0, front({ angles: [10, 6] })],
      [0.38, front({ angles: [84, 78] })],
      [0.48, front({ angles: [84, 78] })],
    ),
  },
  {
    // Hinged to ~parallel with a flat back; arms open wide like wings to shoulder level (near arm toward the
    // camera-head side, far arm toward the hips), slight elbow bend, squeeze, slow return.
    id: 'rear_delt_fly',
    durationSec: 3,
    props: [{ kind: 'dumbbell', at: 'hands' }],
    keyframes: kf(
      [0, { hip: [92, 107], torso: 76, head: 0, armNear: { angles: [-4, 4] }, armFar: { angles: [4, -4] }, legNear: { target: [112, FLOOR_ANKLE] } }],
      [0.38, { hip: [92, 107], torso: 76, head: 0, armNear: { angles: [80, 92] }, armFar: { angles: [-80, -92] }, legNear: { target: [112, FLOOR_ANKLE] } }],
      [0.48, { hip: [92, 107], torso: 76, head: 0, armNear: { angles: [80, 92] }, armFar: { angles: [-80, -92] }, legNear: { target: [112, FLOOR_ANKLE] } }],
    ),
    cues: [
      { t: 0.05, en: 'Open the arms wide', he: 'פתחו את הידיים לרווחה' },
      { t: 0.5, en: 'Lower slowly, back flat', he: 'הורידו לאט, גב ישר' },
    ],
  },
  {
    // Rope at upper-chest/eye level; pull to the face with elbows high and wide, hands finishing by the ears.
    id: 'face_pull',
    durationSec: 2.8,
    props: [
      { kind: 'weightStack', x: 214, y: 20 },
      { kind: 'cable', anchor: [214, 44], at: 'hands' },
    ],
    keyframes: kf(
      [0, { hip: [100, STAND_HIP_Y], torso: -5, armNear: { target: [152, 46], bend: 1 }, legNear: { target: [114, FLOOR_ANKLE] }, legFar: { target: [86, FLOOR_ANKLE] } }],
      [0.38, { hip: [100, STAND_HIP_Y], torso: -5, armNear: { target: [100, 30], bend: 1 }, legNear: { target: [114, FLOOR_ANKLE] }, legFar: { target: [86, FLOOR_ANKLE] } }],
      [0.5, { hip: [100, STAND_HIP_Y], torso: -5, armNear: { target: [100, 30], bend: 1 }, legNear: { target: [114, FLOOR_ANKLE] }, legFar: { target: [86, FLOOR_ANKLE] } }],
    ),
  },
  {
    // Front view: band held in front of the chest, pulled apart to a "T" until it touches the chest.
    id: 'band_pull_apart',
    durationSec: 2.6,
    view: 'front',
    props: [{ kind: 'bandBetweenHands' }],
    keyframes: kf(
      [0, front({ target: [105, 68] })],
      [0.2, front({ target: [76, 60] })],
      [0.4, front({ target: [106 - 56.9, 52] })],
      [0.5, front({ target: [106 - 56.9, 52] })],
      [0.7, front({ target: [76, 60] })],
    ),
    cues: [
      { t: 0.05, en: 'Pull the band apart, arms straight', he: 'מתחו את הגומייה לצדדים, ידיים ישרות' },
      { t: 0.5, en: 'Squeeze the shoulder blades', he: 'כווצו את השכמות' },
    ],
  },
  {
    // Supported on straight arms, slight forward lean; elbows travel back until the upper arms are ~parallel.
    id: 'parallel_bar_dip',
    durationSec: 3,
    props: [DIP_BARS],
    keyframes: kf([0, DIP_TOP], [0.48, DIP_BOTTOM], [0.55, DIP_BOTTOM]),
  },
  {
    // Same dip with the shins resting on a band looped across the bars.
    id: 'band_assisted_dip',
    durationSec: 3,
    props: [DIP_BARS, { kind: 'band', anchor: [96, 106], at: 'footNear' }],
    keyframes: kf([0, DIP_TOP], [0.48, DIP_BOTTOM], [0.55, DIP_BOTTOM]),
  },
  {
    // Elbows pinned at the sides; only the forearms move from just above parallel to full extension.
    id: 'triceps_pushdown',
    durationSec: 2.6,
    props: [
      { kind: 'weightStack', x: 150, y: 14 },
      { kind: 'cable', anchor: [150, 16], at: 'hands' },
    ],
    keyframes: kf([0, pushdown(102)], [0.38, pushdown(4)], [0.46, pushdown(4)]),
  },
  {
    // Seated, one dumbbell held in both hands; elbows stay pointing up while the dumbbell lowers behind the head.
    id: 'overhead_dumbbell_triceps_extension',
    durationSec: 3.2,
    props: [{ kind: 'seat', x: 78, y: 148, w: 42, back: 44 }, { kind: 'dumbbell', at: 'handNear' }],
    keyframes: kf(
      [0, seated({ angles: [172, 178] }, { torso: 0 })],
      [0.5, seated({ angles: [168, -32] }, { torso: 0 })],
      [0.58, seated({ angles: [168, -32] }, { torso: 0 })],
    ),
  },
  {
    // Lying; upper arms angled slightly back and fixed, bar lowered toward the forehead / top of the head.
    id: 'ez_bar_skull_crusher',
    durationSec: 3,
    props: [FLAT_BENCH, { kind: 'ezBar', at: 'hands' }],
    keyframes: kf(
      [0, lying({ angles: [196, 192] })],
      [0.48, lying({ angles: [196, 312] })],
      [0.55, lying({ angles: [196, 312] })],
    ),
  },
  {
    // Shoulder-width grip, elbows tucked (~30–45°), bar to the lower chest, lockout over the shoulders.
    id: 'close_grip_bench_press',
    durationSec: 3,
    props: [FLAT_BENCH, { kind: 'barbell', at: 'hands' }],
    keyframes: kf(
      [0, lying({ target: [LIE_SH[0] + 2, 83.2] })],
      [0.45, lying({ target: [LIE_SH[0] + 17, 135] })],
      [0.52, lying({ target: [LIE_SH[0] + 17, 135] })],
    ),
  },
  {
    // Hands together under the sternum, elbows close to the ribs and pointing back.
    id: 'diamond_push_up',
    durationSec: 2.8,
    props: [{ kind: 'mat', x: 20, w: 170 }],
    keyframes: kf(
      [0, plankPose(DIAMOND_PIVOT, DIAMOND_WRIST, 56.8)],
      [0.5, plankPose(DIAMOND_PIVOT, DIAMOND_WRIST, 20)],
      [0.56, plankPose(DIAMOND_PIVOT, DIAMOND_WRIST, 20)],
    ),
  },
  {
    // Band anchored at the top of a door; pushdown pattern with the elbows fixed at the sides.
    id: 'band_triceps_extension',
    durationSec: 2.6,
    props: [{ kind: 'wall', x: 158 }, { kind: 'band', anchor: [157, 12], at: 'hands' }],
    keyframes: kf([0, pushdown(100)], [0.38, pushdown(4)], [0.46, pushdown(4)]),
  },
];
