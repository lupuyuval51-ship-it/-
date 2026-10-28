/**
 * Demo manifest: one record per exercise animation (view, review status, phases, tempo).
 * `phases` and `tempo` are derived from the keyframes so they cannot drift from the motion;
 * `status` is explicit: an exercise is `verified` only when it is listed in VERIFIED (QA clean AND
 * its contact sheet was reviewed by a person/agent, see docs) and `blocked` only with a written reason.
 */
import { QA_VERSION } from './qa';
import { computeFrame, type Joints } from './engine';
import { ANIMATIONS } from './data/index';
import { BLOCKED } from './status';
import type { ExerciseAnimation } from './types';

export type DemoStatus = 'verified' | 'draft' | 'blocked';
export type DemoView = 'side' | 'front' | 'dual';

export type PhaseKey = 'start' | 'lowering' | 'bottom' | 'lifting' | 'top' | 'pull' | 'squeeze' | 'release' | 'press' | 'lockout' | 'return' | 'rotate' | 'hold' | 'cycle';

export interface DemoPhase {
  /** Loop position (0..1) where the phase begins. */
  t: number;
  /** Suffix of the i18n key `exercises.animation.phase.<key>`. */
  labelKey: PhaseKey;
}

export type DemoTempo =
  | { ecc: number; pauseBottom: number; con: number; pauseTop: number }
  | { holdSec: number };

export interface ManifestEntry {
  animationId: string;
  view: DemoView;
  status: DemoStatus;
  /** ISO date of the visual review, or null when nobody looked at it. */
  reviewedAt: string | null;
  qaVersion: number;
  phases: DemoPhase[];
  tempo: DemoTempo;
  /** Why an exercise is blocked. */
  blockedReason?: string;
}

/** id -> ISO review date. Add an id only after QA passes and its contact sheet was viewed. */
export const VERIFIED: Record<string, string> = Object.fromEntries(
  [
    'barbell_bench_press',
    'incline_barbell_bench_press',
    'dumbbell_bench_press',
    'incline_dumbbell_press',
    'dumbbell_floor_press',
    'machine_chest_press',
    'smith_machine_bench_press',
    'dumbbell_fly',
    'cable_chest_fly',
    'band_chest_press',
    'knee_push_up',
    'incline_push_up',
    'push_up',
    'decline_push_up',
    'archer_push_up',
    'ring_push_up',
    'barbell_overhead_press',
    'dumbbell_shoulder_press',
    'arnold_press',
    'kettlebell_overhead_press',
    'pike_push_up',
    'wall_handstand_push_up',
    'dumbbell_lateral_raise',
    'cable_lateral_raise',
    'band_lateral_raise',
    'rear_delt_fly',
    'face_pull',
    'band_pull_apart',
    'parallel_bar_dip',
    'band_assisted_dip',
    'triceps_pushdown',
    'overhead_dumbbell_triceps_extension',
    'ez_bar_skull_crusher',
    'close_grip_bench_press',
    'diamond_push_up',
    'band_triceps_extension',
    'pull_up',
    'chin_up',
    'band_assisted_pull_up',
    'negative_pull_up',
    'muscle_up',
    'lat_pulldown',
    'barbell_bent_over_row',
    'one_arm_dumbbell_row',
    'seated_cable_row',
    'inverted_row',
    'suspension_trainer_row',
    'ring_row',
    'band_row',
    'barbell_curl',
    'dumbbell_curl',
    'hammer_curl',
    'cable_biceps_curl',
    'band_biceps_curl',
    'barbell_back_squat',
    'front_squat',
    'smith_machine_squat',
    'goblet_squat',
    'bodyweight_squat',
    'box_squat',
    'bulgarian_split_squat',
    'walking_lunge',
    'reverse_lunge',
    'dumbbell_reverse_lunge',
    'step_up',
    'cossack_squat',
    'pistol_squat',
    'leg_press',
    'leg_extension',
    'lying_leg_curl',
    'standing_calf_raise',
    'single_leg_calf_raise',
    'wall_sit',
    'deadlift',
    'romanian_deadlift',
    'dumbbell_romanian_deadlift',
    'single_leg_romanian_deadlift',
    'kettlebell_swing',
    'cable_pull_through',
    'glute_bridge',
    'single_leg_glute_bridge',
    'barbell_hip_thrust',
    'nordic_hamstring_curl',
    'superman',
    'farmer_carry',
    'plank',
    'side_plank',
    'dead_bug',
    'bird_dog',
    'hollow_body_hold',
    'crunch',
    'bicycle_crunch',
    'lying_leg_raise',
    'hanging_knee_raise',
    'hanging_leg_raise',
    'cable_woodchop',
    'pallof_press',
    'ab_wheel_rollout',
    'l_sit',
    'mountain_climber',
    'jump_squat',
    'broad_jump',
    'lateral_bound',
    'burpee',
    'jumping_jack',
    'jump_rope_skipping',
    'high_knees',
    'brisk_walk_jog',
    'sprint_intervals',
    'cardio_machine_intervals',
    'medicine_ball_slam',
    'medicine_ball_chest_pass',
    'hip_flexor_stretch',
    'band_shoulder_dislocate',
    'dumbbell_shrug',
    'box_jump',
  ].map((id) => [id, '2026-10-28']),
);


/**
 * Draft on purpose (QA clean, but the contact sheet showed that the 2D side view cannot show the point of the exercise):
 * russian_twist (the rotation is invisible in profile) and cat_cow (a rigid torso cannot flex the spine).
 * worlds_greatest_stretch is blocked (see status.ts).
 */

// ------------------------------------------------------------------ phase / tempo derivation

type PhaseKind = 'vertical' | 'pull' | 'push' | 'rotate' | 'cycle' | 'hold';

const PULL = new Set(['lat_pulldown', 'seated_cable_row', 'band_row', 'inverted_row', 'suspension_trainer_row', 'ring_row', 'barbell_bent_over_row', 'one_arm_dumbbell_row', 'face_pull', 'band_pull_apart', 'cable_pull_through', 'pull_up', 'chin_up', 'band_assisted_pull_up', 'muscle_up', 'rear_delt_fly']);
const PUSH = new Set(['triceps_pushdown', 'band_triceps_extension', 'pallof_press', 'medicine_ball_chest_pass', 'band_chest_press', 'leg_press', 'leg_extension']);
const ROTATE = new Set(['russian_twist', 'cable_woodchop', 'worlds_greatest_stretch', 'band_shoulder_dislocate']);
const HOLD = new Set(['wall_sit', 'plank', 'side_plank', 'hollow_body_hold', 'l_sit']);
const CYCLE = new Set(['cossack_squat', 'walking_lunge', 'mountain_climber', 'jumping_jack', 'jump_rope_skipping', 'high_knees', 'brisk_walk_jog', 'sprint_intervals', 'cardio_machine_intervals', 'burpee', 'bicycle_crunch', 'lateral_bound', 'farmer_carry', 'bird_dog', 'dead_bug', 'cat_cow']);

const TRACK: (keyof Joints)[] = ['hip', 'shoulder', 'wristNear', 'wristFar', 'kneeNear', 'ankleNear', 'ankleFar', 'elbowNear'];
const HELD = new Set(['barbell', 'ezBar', 'dumbbell', 'kettlebell', 'medicineBall', 'handle', 'cable', 'band', 'strap']);

function effortCurve(anim: ExerciseAnimation, n = 60): { effort: number[]; load: number[]; maxJoint: number } {
  const base = computeFrame(anim, 0).joints;
  const held = (anim.props ?? []).some((p) => HELD.has(p.kind));
  const effort: number[] = [];
  const load: number[] = [];
  let maxJoint = 0;
  for (let i = 0; i <= n; i++) {
    const j = computeFrame(anim, Math.min(i / n, 0.99999)).joints;
    let e = 0;
    for (const k of TRACK) {
      const d = Math.hypot(j[k][0] - base[k][0], j[k][1] - base[k][1]);
      e += d;
      maxJoint = Math.max(maxJoint, d);
    }
    effort.push(e / TRACK.length);
    load.push(held ? (j.wristNear[1] + j.wristFar[1]) / 2 : j.hip[1]);
  }
  return { effort, load, maxJoint };
}

function kindOf(anim: ExerciseAnimation, maxJoint: number): PhaseKind {
  if (CYCLE.has(anim.id)) return 'cycle';
  if (HOLD.has(anim.id)) return 'hold';
  if (maxJoint < 1.5) return 'hold';
  if (ROTATE.has(anim.id)) return 'rotate';
  if (PULL.has(anim.id)) return 'pull';
  if (PUSH.has(anim.id)) return 'push';
  return 'vertical';
}

const r2 = (x: number) => Math.round(x * 100) / 100;
const r1 = (x: number) => Math.round(x * 10) / 10;

export function deriveDemo(anim: ExerciseAnimation): Pick<ManifestEntry, 'phases' | 'tempo'> {
  const { effort, load, maxJoint } = effortCurve(anim);
  const n = effort.length - 1;
  const max = Math.max(...effort);
  const kind = kindOf(anim, maxJoint);
  if (kind === 'hold') return { phases: [{ t: 0, labelKey: 'hold' }], tempo: { holdSec: r1(anim.durationSec) } };
  if (kind === 'cycle') return { phases: [{ t: 0, labelKey: 'cycle' }], tempo: { holdSec: r1(anim.durationSec) } };
  const first = effort.findIndex((e) => e > max * 0.04);
  const peakStart = effort.findIndex((e) => e >= max * 0.96);
  let peakEnd = peakStart;
  for (let i = peakStart; i <= n; i++) if ((effort[i] ?? 0) >= max * 0.96) peakEnd = i;
  const tA = r2(Math.max(0, first - 1) / n);
  const tB = r2(peakStart / n);
  const tC = r2(Math.min(n, peakEnd + 1) / n);
  const downFirst = (load[peakStart] ?? 0) > (load[0] ?? 0);
  const labels: Record<PhaseKind, [PhaseKey, PhaseKey, PhaseKey]> = {
    vertical: downFirst ? ['lowering', 'bottom', 'lifting'] : ['lifting', 'top', 'lowering'],
    pull: ['pull', 'squeeze', 'release'],
    push: ['press', 'lockout', 'return'],
    rotate: ['rotate', 'hold', 'return'],
    cycle: ['cycle', 'cycle', 'cycle'],
    hold: ['hold', 'hold', 'hold'],
  };
  const [la, lb, lc] = labels[kind];
  const phases: DemoPhase[] = [{ t: 0, labelKey: 'start' }];
  const push = (t: number, labelKey: PhaseKey) => {
    const last = phases[phases.length - 1]!;
    if (t > last.t + 0.005) phases.push({ t, labelKey });
    else last.labelKey = labelKey;
  };
  push(tA, la);
  push(tB, lb);
  push(tC, lc);
  const d = anim.durationSec;
  const outSec = r1(Math.max(0.1, (tB - tA) * d));
  const backSec = r1(Math.max(0.1, (1 - tC) * d + 0));
  const pausePeak = r1(Math.max(0, (tC - tB) * d));
  const pauseStart = r1(Math.max(0, tA * d));
  // Eccentric = the lowering leg; pauses sit at the two ends.
  const tempo: DemoTempo = downFirst && kind === 'vertical'
    ? { ecc: outSec, pauseBottom: pausePeak, con: backSec, pauseTop: pauseStart }
    : { ecc: backSec, pauseBottom: pauseStart, con: outSec, pauseTop: pausePeak };
  return { phases, tempo };
}

const cache = new Map<string, ManifestEntry>();

/** Manifest record for an exercise id (null when it has no animation). */
export function getManifestEntry(id: string): ManifestEntry | null {
  const hit = cache.get(id);
  if (hit) return hit;
  const anim = ANIMATIONS.get(id);
  if (!anim) return null;
  const blocked = BLOCKED[id];
  const reviewed = VERIFIED[id];
  const entry: ManifestEntry = {
    animationId: id,
    view: anim.view === 'front' ? 'front' : 'side',
    status: blocked ? 'blocked' : reviewed ? 'verified' : 'draft',
    reviewedAt: reviewed ?? null,
    qaVersion: QA_VERSION,
    ...deriveDemo(anim),
    ...(blocked ? { blockedReason: blocked } : {}),
  };
  cache.set(id, entry);
  return entry;
}

export function allManifestEntries(): ManifestEntry[] {
  return [...ANIMATIONS.keys()].map((id) => getManifestEntry(id)!);
}

/** The phase active at loop position t. */
export function phaseAt(entry: Pick<ManifestEntry, 'phases'>, t: number): DemoPhase {
  let cur = entry.phases[0]!;
  for (const p of entry.phases) if (t >= p.t) cur = p;
  return cur;
}
