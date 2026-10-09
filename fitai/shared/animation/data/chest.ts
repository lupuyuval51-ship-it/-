import type { ExerciseAnimation, Keyframe, LimbSpec, Pose, Vec } from '../types';

/* ------------------------------------------------------------------ helpers */

const RAD = Math.PI / 180;
/** Ankle y when standing flat on the floor. */
const FLOOR_ANKLE = 184;
/** Ankle y when balanced on the toes (plank / push-up). */
const TOES_ANKLE = 180;
const TORSO = 52;
const SHOULDER_TO_HEAD = 16.5;

/** Shoulder position of a rigid plank of length `len` pivoting at `pivot`, `th` degrees above horizontal (head toward +x). */
function plankShoulder(pivot: Vec, len: number, th: number): Vec {
  return [pivot[0] + len * Math.cos(th * RAD), pivot[1] - len * Math.sin(th * RAD)];
}

/**
 * Rigid-body push-up solver: the body is a straight line pivoting at the feet (or knees) and the hands are
 * fixed on the support. Returns the body angle (deg above horizontal) at which the shoulder is exactly
 * `reach` away from the wrist (56 ≈ locked arms, ~20 = chest by the hands). Picks the highest solution.
 */
function plankAngle(pivot: Vec, len: number, wrist: Vec, reach: number): number {
  const f = (th: number) => {
    const s = plankShoulder(pivot, len, th);
    return Math.hypot(s[0] - wrist[0], s[1] - wrist[1]) - reach;
  };
  let best = 0;
  let bestY = Infinity;
  let prevTh = -70;
  let prev = f(prevTh);
  for (let th = -70; th <= 89; th += 0.1) {
    const v = f(th);
    if (Math.sign(v) !== Math.sign(prev)) {
      const root = prevTh + ((th - prevTh) * prev) / (prev - v);
      const y = plankShoulder(pivot, len, root)[1];
      if (y < bestY) {
        bestY = y;
        best = root;
      }
    }
    prev = v;
    prevTh = th;
  }
  return best;
}

interface PlankOpts {
  /** Ankle (legLen 82) or knee (legLen 42) contact point. */
  pivot: Vec;
  legLen: 82 | 42;
  wrist: Vec;
  reach: number;
  /** Arm spec override (defaults to an IK target on the wrist). */
  armNear?: LimbSpec;
  armFar?: LimbSpec;
  footNear?: number;
  head?: number;
}

/** A straight-body plank pose (push-up family). */
function plankPose(o: PlankOpts): Pose {
  const th = plankAngle(o.pivot, o.legLen + TORSO, o.wrist, o.reach);
  const hip: Vec = [o.pivot[0] + o.legLen * Math.cos(th * RAD), o.pivot[1] - o.legLen * Math.sin(th * RAD)];
  const legNear: LimbSpec = o.legLen === 82 ? { target: o.pivot } : { angles: [th - 90, -100] };
  const pose: Pose = {
    hip: [round(hip[0]), round(hip[1])],
    torso: round(90 - th),
    head: o.head ?? 0,
    armNear: o.armNear ?? { target: o.wrist },
    legNear,
  };
  if (o.armFar) pose.armFar = o.armFar;
  if (o.footNear != null) pose.footNear = o.footNear;
  return pose;
}

const round = (n: number) => Math.round(n * 10) / 10;

/** Keyframes from [t, pose] pairs (the first pose is repeated at t=1 if the list does not end at 1). */
function kf(...items: [number, Pose, Keyframe['ease']?][]): Keyframe[] {
  const out: Keyframe[] = items.map(([t, pose, ease]) => (ease ? { t, pose, ease } : { t, pose }));
  if (out[out.length - 1]!.t !== 1) out.push({ t: 1, pose: out[0]!.pose });
  return out;
}

/* ------------------------------------------------------------ lying setups */

/** Flat bench: pad top y=149; lifter's pelvis on the bench, head toward -x, feet planted at +x. */
const FLAT_BENCH = { kind: 'bench', x: 58, y: 149, w: 94 } as const;
const LIE_HIP: Vec = [142, 140];
const LIE_SHOULDER: Vec = [LIE_HIP[0] - TORSO, LIE_HIP[1]];
const LIE_LEGS: LimbSpec = { target: [181, FLOOR_ANKLE] };

function lying(arm: LimbSpec, extra: Partial<Pose> = {}): Pose {
  return { hip: LIE_HIP, torso: -90, armNear: arm, legNear: LIE_LEGS, ...extra };
}

/** Incline bench (40°): seat at x=100..160, back-rest rising toward -x from x=106. */
const INCLINE = 40;
const INCLINE_BENCH = { kind: 'bench', x: 100, y: 149, w: 60, incline: INCLINE } as const;
const INC_HIP: Vec = [round(106 + 11 * Math.sin(INCLINE * RAD) + 2), round(149 - 11 * Math.cos(INCLINE * RAD))];
const INC_TORSO = -(90 - INCLINE);
const INC_SHOULDER: Vec = [INC_HIP[0] - TORSO * Math.sin((90 - INCLINE) * RAD), INC_HIP[1] - TORSO * Math.cos((90 - INCLINE) * RAD)];
const INC_LEGS: LimbSpec = { target: [166, FLOOR_ANKLE] };

function incline(arm: LimbSpec): Pose {
  return { hip: INC_HIP, torso: INC_TORSO, armNear: arm, legNear: INC_LEGS };
}

/** Lying on the floor (dumbbell floor press). */
const FLOOR_HIP: Vec = [140, 179];
const FLOOR_SHOULDER: Vec = [FLOOR_HIP[0] - TORSO, FLOOR_HIP[1]];

/* ------------------------------------------------------------ push-up family */

const PU_PIVOT: Vec = [30, TOES_ANKLE];
const PU_WRIST: Vec = [152, 182];
const pushTop = plankPose({ pivot: PU_PIVOT, legLen: 82, wrist: PU_WRIST, reach: 56.8, footNear: 40 });
const pushBottom = plankPose({ pivot: PU_PIVOT, legLen: 82, wrist: PU_WRIST, reach: 19, footNear: 40 });

const KNEE_PIVOT: Vec = [66, 182];
const KNEE_WRIST: Vec = [154, 182];
const kneeTop = plankPose({ pivot: KNEE_PIVOT, legLen: 42, wrist: KNEE_WRIST, reach: 56.8 });
const kneeBottom = plankPose({ pivot: KNEE_PIVOT, legLen: 42, wrist: KNEE_WRIST, reach: 19 });

const INC_PU_PIVOT: Vec = [34, TOES_ANKLE];
const INC_PU_WRIST: Vec = [160, 145];
const incPuTop = plankPose({ pivot: INC_PU_PIVOT, legLen: 82, wrist: INC_PU_WRIST, reach: 56.8, footNear: 45 });
const incPuBottom = plankPose({ pivot: INC_PU_PIVOT, legLen: 82, wrist: INC_PU_WRIST, reach: 20, footNear: 45 });

const DEC_PIVOT: Vec = [40, 141];
const DEC_WRIST: Vec = [170, 182];
const decTop = plankPose({ pivot: DEC_PIVOT, legLen: 82, wrist: DEC_WRIST, reach: 56.8, footNear: 55 });
const decBottom = plankPose({ pivot: DEC_PIVOT, legLen: 82, wrist: DEC_WRIST, reach: 23, footNear: 55 });

const RING_WRIST: Vec = [152, 165];
const ringTop = plankPose({ pivot: PU_PIVOT, legLen: 82, wrist: RING_WRIST, reach: 56.8, footNear: 40 });
const ringBottom = plankPose({ pivot: PU_PIVOT, legLen: 82, wrist: RING_WRIST, reach: 16, footNear: 40 });

/* --------------------------------------------------------------- animations */

export const animations: ExerciseAnimation[] = [
  {
    // Bar over the shoulders → lower chest (forearms ~vertical, elbows under the bar) → press up and slightly back.
    id: 'barbell_bench_press',
    durationSec: 3.2,
    props: [FLAT_BENCH, { kind: 'barbell', at: 'hands' }],
    keyframes: kf(
      [0, lying({ target: [LIE_SHOULDER[0] + 1, 83.5] })],
      [0.22, lying({ target: [LIE_SHOULDER[0] + 8, 108] })],
      [0.45, lying({ target: [LIE_SHOULDER[0] + 14, 135] })],
      [0.52, lying({ target: [LIE_SHOULDER[0] + 14, 135] })],
      [0.75, lying({ target: [LIE_SHOULDER[0] + 6, 104] })],
    ),
    cues: [
      { t: 0.05, en: 'Lower to the lower chest', he: 'הורידו לחזה התחתון' },
      { t: 0.55, en: 'Press up over the shoulders', he: 'דחפו למעלה מעל הכתפיים' },
    ],
  },
  {
    // 40° incline: bar travels vertically between lockout over the shoulders and the upper chest.
    id: 'incline_barbell_bench_press',
    durationSec: 3.2,
    props: [INCLINE_BENCH, { kind: 'barbell', at: 'hands' }],
    keyframes: kf(
      [0, incline({ target: [INC_SHOULDER[0] + 1, INC_SHOULDER[1] - 56.5] })],
      [0.45, incline({ target: [INC_SHOULDER[0] + 12, INC_SHOULDER[1] + 4] })],
      [0.52, incline({ target: [INC_SHOULDER[0] + 12, INC_SHOULDER[1] + 4] })],
    ),
  },
  {
    // Dumbbells pressed together over the chest, lowered to the sides of the chest (deeper than a barbell).
    id: 'dumbbell_bench_press',
    durationSec: 3.2,
    props: [FLAT_BENCH, { kind: 'dumbbell', at: 'hands' }],
    keyframes: kf(
      [0, lying({ target: [LIE_SHOULDER[0] + 3, 83.5] })],
      [0.45, lying({ target: [LIE_SHOULDER[0] + 11, 143] })],
      [0.52, lying({ target: [LIE_SHOULDER[0] + 11, 143] })],
    ),
  },
  {
    id: 'incline_dumbbell_press',
    durationSec: 3.2,
    props: [INCLINE_BENCH, { kind: 'dumbbell', at: 'hands' }],
    keyframes: kf(
      [0, incline({ target: [INC_SHOULDER[0] + 2, INC_SHOULDER[1] - 56.5] })],
      [0.45, incline({ target: [INC_SHOULDER[0] + 10, INC_SHOULDER[1] + 10] })],
      [0.53, incline({ target: [INC_SHOULDER[0] + 10, INC_SHOULDER[1] + 10] })],
    ),
  },
  {
    // Lying on the floor, knees bent: the upper arms come to rest on the floor, short pause, press.
    id: 'dumbbell_floor_press',
    durationSec: 3.4,
    props: [{ kind: 'mat', x: 50, w: 140 }, { kind: 'dumbbell', at: 'hands' }],
    keyframes: kf(
      [0, { hip: FLOOR_HIP, torso: -90, armNear: { target: [FLOOR_SHOULDER[0] + 2, 122.5] }, legNear: { target: [170, FLOOR_ANKLE] } }],
      [0.42, { hip: FLOOR_HIP, torso: -90, armNear: { target: [FLOOR_SHOULDER[0] + 27, 154] }, legNear: { target: [170, FLOOR_ANKLE] } }],
      [0.56, { hip: FLOOR_HIP, torso: -90, armNear: { target: [FLOOR_SHOULDER[0] + 27, 154] }, legNear: { target: [170, FLOOR_ANKLE] } }],
    ),
  },
  {
    // Seated, back on the pad; handles at mid-chest pressed forward to almost straight arms.
    id: 'machine_chest_press',
    durationSec: 3,
    props: [
      { kind: 'weightStack', x: 34, y: 62 },
      { kind: 'seat', x: 68, y: 148, w: 40, back: 66 },
      { kind: 'cable', anchor: [100, 26], at: 'hands' },
    ],
    keyframes: kf(
      [0, { hip: [80, 141], torso: -6, armNear: { target: [92, 95] }, legNear: { target: [128, FLOOR_ANKLE] } }],
      [0.4, { hip: [80, 141], torso: -6, armNear: { target: [127, 93] }, legNear: { target: [128, FLOOR_ANKLE] } }],
      [0.47, { hip: [80, 141], torso: -6, armNear: { target: [127, 93] }, legNear: { target: [128, FLOOR_ANKLE] } }],
    ),
  },
  {
    // Smith machine: fixed vertical bar path over the lower chest.
    id: 'smith_machine_bench_press',
    durationSec: 3,
    props: [{ kind: 'smithRails', x: LIE_SHOULDER[0] + 10 }, FLAT_BENCH, { kind: 'barbell', at: 'hands' }],
    keyframes: kf(
      [0, lying({ target: [LIE_SHOULDER[0] + 10, 84.5] })],
      [0.45, lying({ target: [LIE_SHOULDER[0] + 10, 134] })],
      [0.52, lying({ target: [LIE_SHOULDER[0] + 10, 134] })],
    ),
  },
  {
    // Wide arc with a fixed, slight elbow bend: arms over the chest → open until the dumbbells reach chest level.
    // (Side view: the near arm opens toward the camera/feet side, the far arm toward the head side.)
    id: 'dumbbell_fly',
    durationSec: 3.4,
    props: [FLAT_BENCH, { kind: 'dumbbell', at: 'hands' }],
    keyframes: kf(
      [0, lying({ angles: [176, 186] }, { armFar: { angles: [184, 174] } })],
      [0.45, lying({ angles: [100, 116] }, { armFar: { angles: [260, 244] } })],
      [0.53, lying({ angles: [100, 116] }, { armFar: { angles: [260, 244] } })],
    ),
    cues: [
      { t: 0.05, en: 'Open wide, elbows slightly bent', he: 'פתחו לרווחה, מרפקים כפופים מעט' },
      { t: 0.55, en: 'Hug back up over the chest', he: 'חבקו חזרה מעל החזה' },
    ],
  },
  {
    // Front view: pulleys at shoulder height on both sides, arms sweep from open to hands together in front.
    id: 'cable_chest_fly',
    durationSec: 3.2,
    view: 'front',
    props: [
      { kind: 'cable', anchor: [14, 54], at: 'handNear' },
      { kind: 'cable', anchor: [226, 54], at: 'handFar' },
    ],
    keyframes: kf(
      [0, { hip: [120, 103], torso: 0, armNear: { target: [54, 66], bend: 1 }, legNear: { angles: [6, 4] } }],
      [0.38, { hip: [120, 103], torso: 0, armNear: { target: [116, 80], bend: 1 }, legNear: { angles: [6, 4] } }],
      [0.5, { hip: [120, 103], torso: 0, armNear: { target: [116, 80], bend: 1 }, legNear: { angles: [6, 4] } }],
    ),
    cues: [
      { t: 0.05, en: 'Arc the hands together', he: 'קרבו את הידיים בקשת' },
      { t: 0.5, en: 'Open slowly to a stretch', he: 'פתחו לאט עד מתיחה' },
    ],
  },
  {
    // Staggered stance, band anchored behind at chest height; hands from beside the chest to straight arms.
    id: 'band_chest_press',
    durationSec: 2.6,
    props: [{ kind: 'band', anchor: [36, 64], at: 'hands' }],
    keyframes: kf(
      [0, { hip: [116, 106], torso: 8, armNear: { target: [131, 66] }, legNear: { target: [140, FLOOR_ANKLE] }, legFar: { target: [90, FLOOR_ANKLE] }, footFar: 70 }],
      [0.4, { hip: [116, 106], torso: 8, armNear: { target: [176, 63] }, legNear: { target: [140, FLOOR_ANKLE] }, legFar: { target: [90, FLOOR_ANKLE] }, footFar: 70 }],
      [0.48, { hip: [116, 106], torso: 8, armNear: { target: [176, 63] }, legNear: { target: [140, FLOOR_ANKLE] }, legFar: { target: [90, FLOOR_ANKLE] }, footFar: 70 }],
    ),
  },
  {
    // Rigid line knees→head pivoting on the knees.
    id: 'knee_push_up',
    durationSec: 2.6,
    props: [{ kind: 'mat', x: 20, w: 170 }],
    keyframes: kf([0, kneeTop], [0.5, kneeBottom], [0.56, kneeBottom]),
  },
  {
    // Hands on a bench edge, body straight; chest lowered to the edge.
    id: 'incline_push_up',
    durationSec: 2.6,
    props: [{ kind: 'bench', x: 152, y: 149, w: 60 }],
    keyframes: kf([0, incPuTop], [0.5, incPuBottom], [0.56, incPuBottom]),
  },
  {
    // Rigid plank rotating around the toes; hands planted under the shoulders, elbows ~45° back.
    id: 'push_up',
    durationSec: 2.6,
    props: [{ kind: 'mat', x: 14, w: 170 }],
    keyframes: kf([0, pushTop], [0.5, pushBottom], [0.56, pushBottom]),
  },
  {
    // Feet on a box, hands on the floor; head-down plank.
    id: 'decline_push_up',
    durationSec: 2.8,
    props: [{ kind: 'box', x: 14, y: 150, w: 44, h: 38 }],
    keyframes: kf([0, decTop], [0.5, decBottom], [0.56, decBottom]),
  },
  {
    // Seen from above (front view rotated): hands twice shoulder width; the body shifts toward the bending near arm
    // while the far arm stays straight, then presses back to the centre.
    id: 'archer_push_up',
    durationSec: 3.2,
    view: 'front',
    props: [{ kind: 'mat', x: 10, w: 220 }],
    keyframes: kf(
      [0, archer(0)],
      [0.45, archer(1)],
      [0.55, archer(1)],
    ),
    cues: [
      { t: 0.05, en: 'Shift toward the bending arm', he: 'העבירו משקל ליד המתכופפת' },
      { t: 0.55, en: 'Far arm stays straight', he: 'היד הרחוקה נשארת ישרה' },
    ],
  },
  {
    // Rings hang just above the floor from straps; rings stay tight to the body.
    id: 'ring_push_up',
    durationSec: 2.8,
    props: [{ kind: 'strap', anchor: [RING_WRIST[0] + 4, 4], at: 'hands', style: 'rings' }],
    keyframes: kf([0, ringTop], [0.5, ringBottom], [0.56, ringBottom]),
  },
];

/** Archer push-up seen from above: p=0 centred, p=1 shifted onto the near (upper) hand with the chest lowered. */
function archer(p: number): Pose {
  const shift = 12 * p;
  // Torso lies along +x (head to the right); "near" side is up the screen, far side down.
  return {
    hip: [96, 104 - shift],
    torso: 90,
    armNear: { target: [150, 44], bend: -1 },
    armFar: { target: [150, 164], bend: 1 },
    legNear: { angles: [97, 90] },
    legFar: { angles: [-97, -90] },
  };
}
