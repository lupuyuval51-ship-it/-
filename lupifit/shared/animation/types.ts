/**
 * Exercise demonstration animations: a 2D articulated figure posed by keyframes.
 *
 * Coordinate system: SVG viewBox 0 0 240 200, y grows downward, the floor is at y = 188.
 * The figure faces +x (to the right) unless `facing: -1`.
 *
 * Angle conventions (degrees, absolute — not relative to the parent segment):
 * - torso: 0 = upright, +90 = leaning fully forward (horizontal, head toward +x), -90 = lying back.
 * - limbs (upperArm, forearm, thigh, shin): 0 = pointing straight down, +90 = pointing forward
 *   (toward +x), 180 = straight up, -90 = pointing backward.
 * In `view: 'front'` the figure faces the viewer; limb angles mean abduction (+ = away from the
 * body's midline) and the far side mirrors the near side unless given explicitly.
 */

export type Vec = [number, number];

/** A limb posed either by absolute segment angles or by an IK target for the hand/ankle. */
export type LimbSpec =
  | { angles: [number, number] }
  | {
      /** Point the hand (arms) or ankle (legs) should reach. */
      target: Vec;
      /** Which IK solution: 1 = middle joint toward the facing direction (for a downward chain), -1 = away. Default: elbows back (-1), knees forward (1). If a joint bends the wrong way (e.g. arm reaching up), flip it. */
      bend?: 1 | -1;
    };

export interface Pose {
  /** Pelvis (hip joint) position. */
  hip: Vec;
  /** Torso angle (see conventions). */
  torso: number;
  /** Head tilt relative to the torso (+ = chin down/forward). Default 0. */
  head?: number;
  armNear: LimbSpec;
  armFar?: LimbSpec;
  legNear: LimbSpec;
  legFar?: LimbSpec;
  /** Absolute foot angles (90 = flat, toes forward). Default: flat when the ankle is near the floor. */
  footNear?: number;
  footFar?: number;
}

export interface Keyframe {
  /** 0..1 position in the loop. Must start at 0 and end at 1 (usually equal to the first pose). */
  t: number;
  pose: Pose;
  /** Optional hold/ease hint for the segment that STARTS at this keyframe. */
  ease?: 'inOut' | 'linear' | 'in' | 'out';
}

export type HandRef = 'hands' | 'handNear' | 'handFar';
export type FootRef = 'feet' | 'footNear' | 'footFar';

export type Prop =
  // Loads carried by the hands
  | { kind: 'barbell'; at?: 'hands'; plates?: 'small' | 'large' }
  | { kind: 'dumbbell'; at: HandRef }
  | { kind: 'kettlebell'; at: HandRef }
  | { kind: 'medicineBall'; at?: 'hands' }
  | { kind: 'ezBar'; at?: 'hands' }
  | { kind: 'abWheel'; at?: 'hands' }
  | { kind: 'jumpRope'; at?: 'hands' }
  | { kind: 'handle'; at: HandRef }
  // Cables / bands / straps from a fixed anchor to the hands (or feet)
  | { kind: 'cable'; anchor: Vec; at: HandRef | FootRef }
  | { kind: 'band'; anchor: Vec; at: HandRef | FootRef }
  | { kind: 'bandBetweenHands' }
  | { kind: 'strap'; anchor: Vec; at: HandRef; style: 'rings' | 'trx' }
  // Static equipment
  | { kind: 'bench'; x: number; y: number; w: number; /** degrees of back-rest incline, 0 = flat */ incline?: number; decline?: boolean }
  | { kind: 'pullUpBar'; x: number; y: number }
  | { kind: 'dipBars'; x: number; y: number }
  | { kind: 'box'; x: number; y: number; w: number; h: number }
  | { kind: 'rack'; x: number; hookY: number }
  | { kind: 'wall'; x: number }
  | { kind: 'mat'; x: number; w: number }
  | { kind: 'chair'; x: number; y: number }
  | { kind: 'seat'; x: number; y: number; w: number; back?: number }
  | { kind: 'legPressSled'; at?: 'feet' }
  | { kind: 'machinePad'; at: 'shins' | 'ankles' | 'thighs' | 'hands' }
  | { kind: 'weightStack'; x: number; y: number }
  | { kind: 'smithRails'; x: number }
  | { kind: 'treadmill'; x: number; w: number }
  | { kind: 'bike'; x: number }
  | { kind: 'rower'; x: number };

export interface ExerciseAnimation {
  /** Exercise id (matches the library). */
  id: string;
  /** Length of one loop in seconds (one repetition, or one cycle). */
  durationSec: number;
  view?: 'side' | 'front';
  facing?: 1 | -1;
  keyframes: Keyframe[];
  props?: Prop[];
  /** Optional camera framing override (centre x/y and zoom); default frames the whole 240×200 canvas. */
  camera?: { cx: number; cy: number; zoom: number; /** Track the hip horizontally (travelling movements such as walking lunges); the floor is drawn dashed so motion stays visible and the loop is seamless. */ followX?: boolean };
  /**
   * Declares that this exercise intentionally shares (near-)identical joint motion with another one
   * (e.g. the same lift with a different implement). `differs` names the visible element that tells
   * them apart; the QA checks that the props or view really do differ.
   */
  sharedMotionWith?: { id: string; differs: string };
  /** Short caption keys shown under the animation per phase (optional). */
  cues?: { t: number; en: string; he: string }[];
}
