/**
 * LUPU-FIT training engine — `rules-1.0`.
 *
 * A pure, deterministic and explainable workout-plan generator. Given resolved inputs
 * (profile + overrides + interpreted preferences) and the exercise catalog it returns a
 * complete weekly plan plus `generation_notes` explaining every non-obvious decision.
 * No I/O, no randomness: the same input (including `variationSeed`) always yields the
 * same plan; a different seed changes tie-breaks so "regenerate" brings variety.
 *
 * RULES (each one is covered by server/tests/generator.test.ts):
 *
 * 1. Candidate pool — an exercise is eligible only if
 *    - every piece of equipment it needs is in the user's equipment (bodyweight `[]` is always allowed);
 *    - none of its contraindications matches a reported injury area;
 *    - it is not in the avoid list (profile + preferences) and its movement pattern is not avoided;
 *    - difficulty fits: beginner → beginner (intermediate only when a slot has no beginner option),
 *      intermediate → beginner|intermediate, advanced → all;
 *    - minors (<18) never get `advanced` exercises, never get 1RM-based loads, RPE ≤ 7 and reps ≥ 6;
 *    - mobility exercises are never used in training slots (they belong to the warm-up).
 * 2. Split by days/week: 1 → full body; 2 → full body A/B; 3 → full body A/B/C (beginners,
 *    general fitness, fat loss, athletic) or push/pull/legs (intermediate+ muscle gain/strength);
 *    4 → upper/lower ×2; 5 → upper/lower/push/pull/legs (intermediate+ muscle gain/strength) or
 *    upper/lower/full/upper/lower; 6 → push/pull/legs ×2; 7 → capped at 6 days + `rest_day_recommended`.
 *    Day order minimises consecutive days that load the same muscle group with main lifts.
 * 3. Slot templates per focus (movement patterns in priority order) + goal modifiers: athletic
 *    performance adds an explosive `jump` slot first on lower-body days and a conditioning finisher;
 *    fat loss & general fitness add a time-based conditioning finisher; focus muscle groups add one
 *    extra accessory slot per day for a covered group.
 * 4. Time budget: per exercise ≈ sets × (work + rest) + 60 s transition (work = 40 s per set, the
 *    target time for timed sets, ×1.5/×2 for unilateral work); 6–8 min warm-up reserved; slots are
 *    filled in priority order while they fit (min 3, max 8 exercises); `estimated_minutes` stored.
 * 5. Selection: per slot candidates are scored — compound & loadable lifts for main slots,
 *    difficulty closest to experience, focus-group bonus, likes bonus / dislikes penalty (EN+HE
 *    names), benchmark fit, penalty for repeating an exercise used on another day — and ties are
 *    broken by a seeded hash of (seed, slot, exercise). A pattern without candidates is skipped
 *    with a note (`no_pulling_equipment`, `pattern_unavailable`, `pattern_avoided`).
 * 6. Prescription by goal & role (see `GOAL_TABLE`), beginners ≤ 3 sets, minors RPE ≤ 7 and
 *    reps ≥ 6, time-tracked exercises get `targetSeconds`, bodyweight reps use ability
 *    benchmarks, 1RM benchmarks give adults a %1RM starting weight rounded to the load increment.
 * 7. Weekly balance: weekly sets per muscle group (`low_volume_group` / `high_volume_group`),
 *    plan-level notes for warm-up, progression rule, rest days, injury exclusions, equipment
 *    limits and minor safety.
 * 8. Output: localized names/description, split, workouts with prescriptions, notes, resolved
 *    input (no PII, no free text) and `generator_version`.
 */
import {
  DEFAULT_EQUIPMENT_BY_LOCATION,
  MUSCLE_TO_GROUP,
  type Difficulty,
  type Equipment,
  type ExperienceLevel,
  type Goal,
  type InjuryArea,
  type Locale,
  type MovementPattern,
  type MuscleGroup,
  type SplitType,
  type TrainingLocation,
} from '@shared/constants';
import type { WorkoutFocus } from '@shared/schemas/workouts';
import { chooseSplit, type SplitChoice } from '@shared/split';
import type { AbilityBenchmarks, GenerationNote, PlanGenerationInput, PreferenceIntensity, PreferenceInterpreter } from '@shared/types';
import type { ExerciseRecord } from '../exercises/repository';
import { fill, strings, workoutNameFor } from './i18n';

export const GENERATOR_VERSION = 'rules-1.0';
export const MIN_EXERCISES = 3;
export const MAX_EXERCISES = 8;
export const MAX_TRAINING_DAYS = 6;
const BUDGET_TOLERANCE_SECONDS = 120;

// ---------------------------------------------------------------- Inputs & outputs

export interface GeneratorInput {
  locale: Locale;
  goal: Goal;
  experience: ExperienceLevel;
  isMinor: boolean;
  location: TrainingLocation;
  equipment: Equipment[];
  /** Requested days per week (1–7). */
  daysPerWeek: number;
  sessionMinutes: number;
  injuries: InjuryArea[];
  avoidExerciseIds: string[];
  avoidPatterns: MovementPattern[];
  focusMuscleGroups: MuscleGroup[];
  ability: AbilityBenchmarks;
  likes: string;
  dislikes: string;
  preferBodyweight: boolean;
  intensity: PreferenceIntensity;
  variationSeed: number;
  /** Custom plan name (otherwise a localized default is used). */
  planName?: string | null;
  /** Which interpreter produced the preference options (recorded in generation_input). */
  preferenceInterpreter?: PreferenceInterpreter | null;
  /** Subset of `focusMuscleGroups` / avoid options that came from free-text preferences. */
  preferenceOptions?: PlanGenerationInput['preferences'];
}

export type ExerciseRole = 'power' | 'main' | 'accessory' | 'core' | 'conditioning';

export interface GeneratedExercise {
  exerciseId: string;
  role: ExerciseRole;
  sets: number;
  repMin: number | null;
  repMax: number | null;
  targetSeconds: number | null;
  restSeconds: number;
  targetRpe: number | null;
  targetWeightKg: number | null;
  notes: string;
}

export interface GeneratedWorkout {
  focus: WorkoutFocus;
  name: string;
  notes: string;
  estimatedMinutes: number;
  exercises: GeneratedExercise[];
}

export interface GeneratedPlan {
  name: string;
  description: string;
  goal: Goal;
  splitType: SplitType;
  /** Training days actually planned (≤ 6). */
  daysPerWeek: number;
  sessionMinutes: number;
  workouts: GeneratedWorkout[];
  notes: GenerationNote[];
  input: PlanGenerationInput;
  generatorVersion: string;
}

// ---------------------------------------------------------------- Small helpers

const LEVEL: Record<Difficulty, number> = { beginner: 0, intermediate: 1, advanced: 2 };

/** FNV-1a 32-bit → [0, 1). Deterministic tie-break jitter. */
export function seededUnit(...parts: (string | number)[]): number {
  let h = 0x811c9dc5;
  const s = parts.join('|');
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  // final avalanche
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b) >>> 0;
  h ^= h >>> 13;
  return (h >>> 0) / 0x100000000;
}

export function muscleGroupsOf(e: Pick<ExerciseRecord, 'primaryMuscles'>): MuscleGroup[] {
  return Array.from(new Set(e.primaryMuscles.map((m) => MUSCLE_TO_GROUP[m])));
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Lowercases, strips Hebrew niqqud/diacritics and punctuation → space-separated words. */
export function normalizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[֑-ׇ]/g, '')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .split(' ')
    .filter(Boolean);
}

const STOP_WORDS = new Set([
  'the', 'and', 'with', 'like', 'love', 'enjoy', 'really', 'more', 'less', 'some', 'any', 'for', 'very', 'lot', 'lots', 'not', 'dont',
  'hate', 'dislike', 'exercises', 'exercise', 'training', 'workout', 'workouts', 'אני', 'אוהב', 'אוהבת', 'עם', 'בלי', 'את', 'של', 'מאוד',
  'שונא', 'שונאת', 'תרגילים', 'תרגיל', 'אימון', 'אימונים', 'הרבה', 'יותר', 'פחות', 'לא',
]);

/** Singular-ish stem for EN/HE plural matching ("squats" → "squat", "סקוואטים" → "סקוואט"). */
export function stem(word: string): string {
  if (/^[a-z]+$/.test(word)) {
    if (word.length > 4 && word.endsWith('es') && /(sh|ch|x|s)es$/.test(word)) return word.slice(0, -2);
    if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
    return word;
  }
  if (word.length > 4 && (word.endsWith('ים') || word.endsWith('ות'))) return word.slice(0, -2);
  return word;
}

/** Keywords from likes/dislikes free text (≥ 3 letters, stop words removed, stemmed). */
export function keywordsOf(text: string): string[] {
  return Array.from(new Set(normalizeWords(text).filter((w) => w.length >= 3 && !STOP_WORDS.has(w)).map(stem)));
}

const nameWordCache = new WeakMap<ExerciseRecord, string[]>();
function nameWords(e: ExerciseRecord): string[] {
  let words = nameWordCache.get(e);
  if (!words) {
    words = Array.from(new Set([...normalizeWords(e.name.en), ...normalizeWords(e.name.he)].map(stem)));
    nameWordCache.set(e, words);
  }
  return words;
}

/** Inflection endings tolerated when a keyword is longer than a name word ("squatting" → "squat"). */
const INFLECTION = /^(s|es|ing|ting|ning|ed|er|ers|ים|ות)$/;

/**
 * True when any keyword matches a word of the exercise's English or Hebrew name: exact, a
 * typed prefix of the word ("lung" → "lunge"), or the word plus an inflection ending. A
 * longer compound keyword never matches a shorter name word ("deadlift" ≠ "dead" bug).
 */
export function nameMatches(e: ExerciseRecord, keywords: string[]): boolean {
  if (!keywords.length) return false;
  const words = nameWords(e);
  return keywords.some((k) =>
    words.some((w) => w === k || (Math.min(w.length, k.length) >= 4 && (w.startsWith(k) || (k.startsWith(w) && INFLECTION.test(k.slice(w.length)))))),
  );
}

// ---------------------------------------------------------------- Split (rule 2)

type FocusBase = 'full_body' | 'upper' | 'lower' | 'push' | 'pull' | 'legs';

export { chooseSplit, type SplitChoice };

export function focusBase(focus: string): FocusBase {
  const m = /^(full_body|upper|lower|push|pull|legs)/.exec(focus);
  return (m?.[1] as FocusBase | undefined) ?? 'full_body';
}

function focusVariant(focus: string): number {
  if (focus.endsWith('_b')) return 1;
  if (focus.endsWith('_c')) return 2;
  return 0;
}

// ---------------------------------------------------------------- Slot templates (rule 3)

type SlotKind = 'main' | 'accessory' | 'core' | 'power' | 'finisher';

interface SlotDef {
  patterns: MovementPattern[];
  kind: SlotKind;
  /** Restricts candidates (e.g. rear-delt work). */
  filter?: (e: ExerciseRecord) => boolean;
  /** Extra preference score. */
  prefer?: (e: ExerciseRecord) => number;
}

interface Slot extends SlotDef {
  key: string;
  displayOrder: number;
}

const has = (m: ExerciseRecord['primaryMuscles'][number]) => (e: ExerciseRecord) => e.primaryMuscles.includes(m);
const M = (...patterns: MovementPattern[]): SlotDef => ({ patterns, kind: 'main' });
const A = (...patterns: MovementPattern[]): SlotDef => ({ patterns, kind: 'accessory' });
const CORE: SlotDef = { patterns: ['core', 'rotation'], kind: 'core' };
const LATERAL: SlotDef = { patterns: ['shoulder_raise'], kind: 'accessory', filter: has('shoulders') };
const REAR_DELT: SlotDef = {
  patterns: ['horizontal_pull', 'shoulder_raise'],
  kind: 'accessory',
  filter: has('rear_delts'),
};

/** Variants A/B/C per focus. Patterns listed in priority order (first = preferred). */
const TEMPLATES: Record<FocusBase, SlotDef[][]> = {
  full_body: [
    [M('squat', 'lunge'), M('horizontal_push'), M('hinge', 'hip_thrust'), A('horizontal_pull', 'vertical_pull'), A('vertical_push', 'lunge'), CORE],
    [M('hinge', 'hip_thrust'), M('vertical_push', 'horizontal_push'), M('lunge', 'squat'), A('vertical_pull', 'horizontal_pull'), A('horizontal_push', 'chest_fly'), CORE],
    [M('squat', 'lunge'), M('horizontal_pull', 'vertical_pull'), M('hip_thrust', 'hinge'), A('horizontal_push', 'vertical_push'), A('elbow_flexion', 'elbow_extension'), CORE],
  ],
  upper: [
    [M('horizontal_push'), M('horizontal_pull'), A('vertical_push'), A('vertical_pull'), A('elbow_flexion'), A('elbow_extension'), LATERAL],
    [M('vertical_push', 'horizontal_push'), M('vertical_pull', 'horizontal_pull'), A('horizontal_push'), A('horizontal_pull'), A('elbow_extension'), A('elbow_flexion'), REAR_DELT],
  ],
  lower: [
    [M('squat'), M('hinge'), A('lunge'), A('knee_flexion', 'hip_thrust'), A('calf_raise'), CORE],
    [M('hinge'), M('squat', 'lunge'), A('hip_thrust', 'lunge'), A('knee_extension', 'knee_flexion'), A('calf_raise'), CORE],
  ],
  push: [
    [M('horizontal_push'), M('vertical_push'), A('chest_fly'), LATERAL, A('elbow_extension')],
    [M('vertical_push'), M('horizontal_push'), A('elbow_extension'), LATERAL, A('chest_fly', 'horizontal_push')],
  ],
  pull: [
    [M('vertical_pull'), M('horizontal_pull'), REAR_DELT, A('elbow_flexion'), CORE],
    [M('horizontal_pull'), M('vertical_pull'), A('elbow_flexion'), REAR_DELT, CORE],
  ],
  legs: [
    [M('squat'), M('hinge'), A('lunge'), A('knee_extension', 'knee_flexion'), A('calf_raise')],
    [M('hinge'), M('squat', 'lunge'), A('lunge', 'hip_thrust'), A('knee_flexion', 'knee_extension'), A('calf_raise')],
  ],
};

/** Extra slots used only when the template leaves time unused (e.g. missing equipment). */
const FILLERS: Record<FocusBase, SlotDef[]> = {
  full_body: [A('calf_raise'), LATERAL, A('elbow_extension', 'elbow_flexion'), A('carry'), CORE],
  upper: [CORE, A('chest_fly'), A('carry'), { patterns: ['core', 'rotation'], kind: 'core' }],
  lower: [A('lunge', 'hip_thrust'), A('carry'), { patterns: ['rotation', 'core'], kind: 'core' }],
  push: [CORE, A('horizontal_push', 'vertical_push'), A('elbow_extension')],
  // Without pulling equipment a pull day falls back to posterior-chain and trunk work (explained by `no_pulling_equipment`).
  pull: [
    A('carry'),
    A('elbow_flexion'),
    { patterns: ['shoulder_raise'], kind: 'accessory', filter: has('traps') },
    { patterns: ['rotation', 'core'], kind: 'core' },
    A('hinge', 'hip_thrust'),
    { patterns: ['core'], kind: 'core', filter: has('lower_back') },
  ],
  legs: [CORE, A('hip_thrust', 'lunge'), { patterns: ['rotation', 'core'], kind: 'core' }],
};

/** Which muscle groups a day of this focus naturally trains (for focus-group slots). */
const COVERS: Record<FocusBase, MuscleGroup[]> = {
  full_body: ['chest', 'back', 'shoulders', 'arms', 'core', 'legs'],
  upper: ['chest', 'back', 'shoulders', 'arms', 'core'],
  lower: ['legs', 'core'],
  push: ['chest', 'shoulders', 'arms'],
  pull: ['back', 'arms', 'core'],
  legs: ['legs', 'core'],
};

function focusGroupSlot(group: MuscleGroup, base: FocusBase, dayIndex: number): SlotDef {
  const inGroup = (e: ExerciseRecord) => muscleGroupsOf(e).includes(group);
  switch (group) {
    case 'chest':
      return { patterns: ['chest_fly', 'horizontal_push'], kind: 'accessory', filter: inGroup };
    case 'back':
      return { patterns: ['horizontal_pull', 'vertical_pull'], kind: 'accessory', filter: inGroup };
    case 'shoulders':
      return { patterns: ['shoulder_raise', 'vertical_push'], kind: 'accessory', filter: inGroup };
    case 'arms': {
      const flexFirst = base === 'pull' || (base !== 'push' && dayIndex % 2 === 0);
      return { patterns: flexFirst ? ['elbow_flexion', 'elbow_extension'] : ['elbow_extension', 'elbow_flexion'], kind: 'accessory', filter: inGroup };
    }
    case 'core':
      return { patterns: ['core', 'rotation'], kind: 'core', filter: inGroup };
    case 'legs':
      return { patterns: ['lunge', 'hip_thrust', 'knee_flexion', 'knee_extension', 'calf_raise'], kind: 'accessory', filter: inGroup };
  }
}

const PATTERN_GROUP: Partial<Record<MovementPattern, MuscleGroup>> = {
  squat: 'legs',
  hinge: 'legs',
  lunge: 'legs',
  hip_thrust: 'legs',
  knee_extension: 'legs',
  knee_flexion: 'legs',
  calf_raise: 'legs',
  jump: 'legs',
  horizontal_push: 'chest',
  chest_fly: 'chest',
  vertical_push: 'shoulders',
  shoulder_raise: 'shoulders',
  horizontal_pull: 'back',
  vertical_pull: 'back',
  elbow_flexion: 'arms',
  elbow_extension: 'arms',
  core: 'core',
  rotation: 'core',
};

/** Muscle groups loaded by a focus' main lifts (template level). */
export function mainGroupsOfFocus(focus: string): Set<MuscleGroup> {
  const base = focusBase(focus);
  const template = TEMPLATES[base][focusVariant(focus) % TEMPLATES[base].length]!;
  const groups = new Set<MuscleGroup>();
  for (const s of template) if (s.kind === 'main') {
    const g = PATTERN_GROUP[s.patterns[0]!];
    if (g) groups.add(g);
  }
  return groups;
}

function consecutiveConflicts(order: string[]): number {
  let conflicts = 0;
  for (let i = 1; i < order.length; i++) {
    const a = mainGroupsOfFocus(order[i - 1]!);
    for (const g of mainGroupsOfFocus(order[i]!)) if (a.has(g)) {
      conflicts++;
      break;
    }
  }
  return conflicts;
}

function permutations<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items];
  const out: T[][] = [];
  items.forEach((item, i) => {
    for (const rest of permutations([...items.slice(0, i), ...items.slice(i + 1)])) out.push([item, ...rest]);
  });
  return out;
}

/** Day order with the fewest consecutive main-lift muscle-group overlaps (canonical order wins ties). */
export function orderFocuses(focuses: WorkoutFocus[]): WorkoutFocus[] {
  let best = focuses;
  let bestScore = consecutiveConflicts(focuses);
  if (bestScore === 0) return focuses;
  for (const p of permutations(focuses)) {
    const score = consecutiveConflicts(p);
    if (score < bestScore) {
      best = p;
      bestScore = score;
    }
  }
  return best;
}

// ---------------------------------------------------------------- Prescriptions (rule 6)

interface Prescription {
  role: ExerciseRole;
  sets: number;
  repMin: number | null;
  repMax: number | null;
  targetSeconds: number | null;
  restSeconds: number;
  targetRpe: number | null;
  targetWeightKg: number | null;
  noteParts: string[];
}

interface RepScheme {
  sets: number;
  repMin: number;
  repMax: number;
  rest: number;
  rpe: number;
}

/**
 * Goal table (rule 6). `main` = compound lift in a main slot, `accessory` = everything else
 * that is rep-based. Beginners: ≤ 3 sets (strength mains 3 × 5 @ RPE 7).
 */
export function goalScheme(goal: Goal, role: 'power' | 'main' | 'accessory', experience: ExperienceLevel, isolation: boolean): RepScheme {
  const beginner = experience === 'beginner';
  const advanced = experience === 'advanced';
  switch (goal) {
    case 'strength':
      if (role === 'main') return beginner ? { sets: 3, repMin: 5, repMax: 5, rest: 150, rpe: 7 } : { sets: advanced ? 5 : 4, repMin: advanced ? 3 : 4, repMax: 6, rest: 180, rpe: advanced ? 8 : 7.5 };
      return { sets: 3, repMin: 8, repMax: 12, rest: 90, rpe: 7.5 };
    case 'muscle_gain':
      if (role === 'main') return { sets: beginner ? 3 : 4, repMin: 6, repMax: 10, rest: 120, rpe: beginner ? 7 : advanced ? 8 : 7.5 };
      return { sets: 3, repMin: 10, repMax: 15, rest: isolation ? 60 : 90, rpe: beginner ? 7 : 8 };
    case 'general_fitness':
      return { sets: 3, repMin: 8, repMax: 12, rest: role === 'main' ? 90 : 60, rpe: beginner ? 6 : 7 };
    case 'fat_loss':
      return { sets: 3, repMin: 10, repMax: 15, rest: 60, rpe: 7 };
    case 'athletic_performance':
      if (role === 'power') return { sets: advanced ? 4 : 3, repMin: 3, repMax: 5, rest: 120, rpe: 7 };
      if (role === 'main') return { sets: beginner ? 3 : 4, repMin: 4, repMax: 6, rest: 150, rpe: beginner ? 7 : 8 };
      return { sets: 3, repMin: 8, repMax: 10, rest: 90, rpe: 7 };
  }
}

/** Default hold time for timed exercises by experience (plank 20–30 s beginner … 40–60 s advanced). */
function defaultHoldSeconds(experience: ExperienceLevel): number {
  return experience === 'beginner' ? 30 : experience === 'intermediate' ? 40 : 50;
}

const PUSH_UP_IDS = new Set(['push_up', 'decline_push_up', 'diamond_push_up', 'archer_push_up', 'ring_push_up']);
const EASY_PUSH_UP_IDS = new Set(['knee_push_up', 'incline_push_up']);
const PULL_UP_IDS = new Set(['pull_up', 'chin_up', 'muscle_up']);
const ASSISTED_PULL_IDS = new Set(['band_assisted_pull_up', 'negative_pull_up']);

/**
 * 1RM benchmark that applies to an exercise (squat → barbell squat patterns, bench → barbell
 * horizontal push, deadlift → barbell hinge), with a conservative factor for variants.
 */
export function oneRmFor(e: ExerciseRecord, ability: AbilityBenchmarks): { benchmarkKg: number; estimatedKg: number; lift: 'squat' | 'bench' | 'deadlift' } | null {
  if (!e.equipment.includes('barbell') || e.trackingType !== 'weight_reps') return null;
  const factor: Record<string, number> = { front_squat: 0.8, incline_barbell_bench_press: 0.8, close_grip_bench_press: 0.85, romanian_deadlift: 0.7 };
  const f = factor[e.id] ?? 1;
  const lift = e.movementPattern === 'squat' ? 'squat' : e.movementPattern === 'horizontal_push' ? 'bench' : e.movementPattern === 'hinge' ? 'deadlift' : null;
  if (!lift) return null;
  const benchmark = lift === 'squat' ? ability.squat1rmKg : lift === 'bench' ? ability.bench1rmKg : ability.deadlift1rmKg;
  return benchmark && benchmark > 0 ? { benchmarkKg: benchmark, estimatedKg: benchmark * f, lift } : null;
}

/** Fraction of 1RM for a rep target with (10 − RPE) reps in reserve (inverse Epley): 8 reps @ RPE 8 ≈ 75 %. */
export function percentOfOneRm(reps: number, rpe: number): number {
  const rir = Math.max(0, 10 - rpe);
  return 1 / (1 + (reps + rir) / 30);
}

export function roundToIncrement(kg: number, increment: number | null): number {
  const inc = increment && increment > 0 ? increment : 2.5;
  return Math.round(Math.round(kg / inc) * inc * 100) / 100;
}

interface Ctx {
  input: GeneratorInput;
  pool: ExerciseRecord[];
  likes: string[];
  dislikes: string[];
  /** Exercise id → number of other days it is already used on. */
  usedElsewhere: Map<string, number>;
  /** Exercises to move away from (regenerating an existing day). */
  discourage: Set<string>;
  notes: NoteSink;
}

function prescribe(e: ExerciseRecord, slot: Slot, ctx: Ctx): Prescription {
  const { goal, experience, isMinor, ability, locale } = ctx.input;
  const t = strings(locale).exercise;
  const noteParts: string[] = [];
  const role: ExerciseRole =
    slot.kind === 'power' ? 'power' : slot.kind === 'finisher' ? 'conditioning' : slot.kind === 'core' ? 'core' : slot.kind === 'main' && e.isCompound ? 'main' : 'accessory';
  const isolation = !e.isCompound;
  let rx: Prescription;

  if (role === 'conditioning') {
    const rounds = goal === 'fat_loss' && experience !== 'beginner' ? 4 : 3;
    const seconds = experience === 'beginner' ? 30 : experience === 'intermediate' ? 40 : 45;
    const rest = experience === 'beginner' ? 45 : 30;
    rx = e.trackingType === 'time'
      ? { role, sets: rounds, repMin: null, repMax: null, targetSeconds: seconds, restSeconds: rest, targetRpe: goal === 'athletic_performance' ? 8 : 7, targetWeightKg: null, noteParts }
      : { role, sets: rounds, repMin: 8, repMax: 12, targetSeconds: null, restSeconds: rest, targetRpe: 7, targetWeightKg: null, noteParts };
    noteParts.push(t.finisher);
  } else if (e.trackingType === 'time') {
    let seconds = defaultHoldSeconds(experience);
    if (e.movementPattern === 'core' && ability.plankSeconds && ability.plankSeconds > 0) {
      const factor = e.id === 'plank' ? 0.6 : e.id === 'side_plank' ? 0.4 : 0.35;
      seconds = clamp(Math.round((ability.plankSeconds * factor) / 5) * 5, 15, 90);
      noteParts.push(fill(t.benchmarkSeconds, { max: ability.plankSeconds }));
    }
    const scheme = goalScheme(goal, 'accessory', experience, true);
    rx = { role, sets: 3, repMin: null, repMax: null, targetSeconds: seconds, restSeconds: experience === 'beginner' ? 60 : 45, targetRpe: scheme.rpe, targetWeightKg: null, noteParts };
  } else {
    const scheme = goalScheme(goal, role === 'power' ? 'power' : role === 'main' ? 'main' : 'accessory', experience, isolation);
    rx = { role, sets: scheme.sets, repMin: scheme.repMin, repMax: scheme.repMax, targetSeconds: null, restSeconds: scheme.rest, targetRpe: scheme.rpe, targetWeightKg: null, noteParts };
    if (role === 'accessory' && e.trackingType === 'reps' && e.isCompound) {
      // Bodyweight compounds (pull-ups, dips…) are hard to do for 10–15 reps: use the main rep range.
      const main = goalScheme(goal, 'main', experience, false);
      rx.repMin = main.repMin;
      rx.repMax = main.repMax;
    }
    if (role === 'core') {
      rx.sets = 3;
      rx.repMin = 10;
      rx.repMax = 15;
      rx.restSeconds = 60;
    }
    if (role === 'power') noteParts.push(t.power);

    // Bodyweight benchmarks: target ≈ 60–70 % of the reported max.
    if (e.trackingType === 'reps') {
      const max = PUSH_UP_IDS.has(e.id) || e.id === 'knee_push_up' || e.id === 'incline_push_up' ? ability.pushUpsMax : PULL_UP_IDS.has(e.id) ? ability.pullUpsMax : null;
      if (max != null && max > 0 && (e.id === 'push_up' || e.id === 'pull_up' || e.id === 'chin_up')) {
        const lo = Math.max(1, Math.round(max * 0.6));
        const hi = Math.max(lo, Math.round(max * 0.7));
        rx.repMin = Math.min(lo, 30);
        rx.repMax = Math.min(hi, 30);
        noteParts.push(fill(t.benchmarkReps, { max }));
      }
    }
  }
  if (e.unilateral) noteParts.push(rx.targetSeconds != null ? t.perSideTime : t.perSide);

  applyModifiers(rx, ctx.input);

  // %1RM starting weight for adults with a matching benchmark. Computed after the modifiers so
  // the load matches the final rep target and RPE (e.g. an "easier" plan lowers RPE → lighter load).
  if (!isMinor && role !== 'conditioning' && e.trackingType === 'weight_reps' && rx.repMax != null && rx.targetRpe != null) {
    const oneRm = oneRmFor(e, ability);
    if (oneRm) {
      const kg = roundToIncrement(oneRm.estimatedKg * percentOfOneRm(rx.repMax, rx.targetRpe), e.loadIncrementKg);
      if (kg > 0) {
        rx.targetWeightKg = kg;
        noteParts.unshift(fill(t.oneRm, { pct: Math.round((kg / oneRm.benchmarkKg) * 100), lift: t.lifts[oneRm.lift] }));
        ctx.notes.oneRmUsed++;
      }
    }
  }
  return rx;
}

/** Intensity preference, short sessions, beginner and minor caps, DB bounds — always applied last. */
function applyModifiers(rx: Prescription, input: GeneratorInput) {
  if (input.intensity === 'easier') {
    rx.sets = Math.max(2, rx.sets - 1);
    if (rx.targetRpe != null) rx.targetRpe = Math.max(5, rx.targetRpe - 1);
  } else if (input.intensity === 'harder' && (rx.role === 'main' || rx.role === 'power')) {
    rx.sets += 1;
    if (rx.targetRpe != null) rx.targetRpe = Math.min(9, rx.targetRpe + 0.5);
  }
  if (input.sessionMinutes < 30) {
    rx.sets = Math.min(rx.sets, 3);
    if (rx.role !== 'power') rx.restSeconds = Math.min(rx.restSeconds, 60);
  }
  if (input.experience === 'beginner') rx.sets = Math.min(rx.sets, 3);
  if (input.isMinor) {
    if (rx.targetRpe != null) rx.targetRpe = Math.min(7, rx.targetRpe);
    if (rx.repMin != null) {
      rx.repMin = Math.max(6, rx.repMin);
      rx.repMax = Math.max(rx.repMin, rx.repMax ?? rx.repMin);
    }
    rx.targetWeightKg = null;
  }
  rx.sets = clamp(rx.sets, 1, 10);
  rx.restSeconds = clamp(rx.restSeconds, 0, 600);
  if (rx.targetRpe != null) rx.targetRpe = clamp(rx.targetRpe, 1, 10);
}

// ---------------------------------------------------------------- Time model (rule 4)

export function warmupMinutes(sessionMinutes: number | null | undefined): number {
  const m = sessionMinutes ?? 60;
  return m <= 30 ? 6 : m <= 60 ? 7 : 8;
}

/** Seconds an exercise takes: sets × (work + rest) + 60 s transition. */
export function exerciseSeconds(
  rx: { sets: number; targetSeconds: number | null; restSeconds: number },
  e: Pick<ExerciseRecord, 'unilateral'> | null | undefined,
): number {
  const unilateral = e?.unilateral ?? false;
  const work = rx.targetSeconds != null ? rx.targetSeconds * (unilateral ? 2 : 1) : 40 * (unilateral ? 1.5 : 1);
  return rx.sets * (work + rx.restSeconds) + 60;
}

/** Estimated workout length in minutes including the warm-up (null for an empty day). */
export function estimateWorkoutMinutes(
  rows: { exerciseId: string; sets: number; targetSeconds: number | null; restSeconds: number }[],
  catalog: Map<string, Pick<ExerciseRecord, 'unilateral'>>,
  sessionMinutes: number | null | undefined,
): number | null {
  if (!rows.length) return null;
  const seconds = rows.reduce((sum, r) => sum + exerciseSeconds(r, catalog.get(r.exerciseId)), 0);
  return warmupMinutes(sessionMinutes) + Math.ceil(seconds / 60);
}

// ---------------------------------------------------------------- Notes

class NoteSink {
  readonly list: GenerationNote[] = [];
  oneRmUsed = 0;
  relaxed = new Set<MovementPattern>();
  unavailable = new Set<MovementPattern>();
  avoided = new Set<MovementPattern>();
  noPulling = false;

  add(code: string, params?: Record<string, string | number>) {
    const key = code + JSON.stringify(params ?? {});
    if (this.list.some((n) => n.code + JSON.stringify(n.params ?? {}) === key)) return;
    this.list.push(params ? { code, params } : { code });
  }
}

// ---------------------------------------------------------------- Candidate pool (rule 1)

export interface PoolResult {
  pool: ExerciseRecord[];
  /** Injury area → number of otherwise-eligible exercises excluded because of it. */
  injuryExclusions: Map<InjuryArea, number>;
  avoidListExclusions: number;
}

export function buildPool(input: GeneratorInput, catalog: ExerciseRecord[]): PoolResult {
  const equipment = new Set(input.equipment);
  const avoid = new Set(input.avoidExerciseIds);
  const avoidPatterns = new Set(input.avoidPatterns);
  const injuryExclusions = new Map<InjuryArea, number>();
  let avoidListExclusions = 0;
  const pool: ExerciseRecord[] = [];
  for (const e of catalog) {
    if (e.movementPattern === 'mobility' || e.category === 'mobility') continue;
    if (!e.equipment.every((q) => equipment.has(q))) continue;
    if (input.isMinor && e.difficulty === 'advanced') continue;
    const conflicts = e.contraindications.filter((c) => input.injuries.includes(c));
    if (conflicts.length) {
      for (const c of conflicts) injuryExclusions.set(c, (injuryExclusions.get(c) ?? 0) + 1);
      continue;
    }
    if (avoid.has(e.id)) {
      avoidListExclusions++;
      continue;
    }
    if (avoidPatterns.has(e.movementPattern)) continue;
    pool.push(e);
  }
  return { pool, injuryExclusions, avoidListExclusions };
}

function allowedDifficulties(experience: ExperienceLevel, isMinor: boolean, relaxed: boolean): Difficulty[] {
  if (experience === 'beginner') return relaxed ? ['beginner', 'intermediate'] : ['beginner'];
  if (experience === 'intermediate') return ['beginner', 'intermediate'];
  return isMinor ? ['beginner', 'intermediate'] : ['beginner', 'intermediate', 'advanced'];
}

// ---------------------------------------------------------------- Selection (rule 5)

function scoreCandidate(e: ExerciseRecord, slot: Slot, ctx: Ctx): number {
  const { input } = ctx;
  let s = 0;
  const idx = slot.patterns.indexOf(e.movementPattern);
  s += idx === 0 ? 3 : idx === 1 ? 1.5 : 0.5;
  if (slot.kind === 'main' || slot.kind === 'power') {
    s += e.isCompound ? 4 : -3;
    if (slot.kind === 'main' && e.trackingType === 'weight_reps') s += input.goal === 'strength' ? 2.5 : 1.5;
    if (e.trackingType === 'time') s -= 3;
  }
  if (slot.kind === 'finisher') s += e.trackingType === 'time' ? 4 : 0;
  if (slot.kind === 'accessory' && e.trackingType === 'time') s -= 1;
  // Difficulty closest to experience: easier exercises cost a little, harder ones a lot.
  const levelGap = LEVEL[e.difficulty] - LEVEL[input.experience];
  s -= levelGap > 0 ? 2.5 * levelGap : -levelGap;
  const loadFocused = input.goal === 'muscle_gain' || input.goal === 'strength' || input.goal === 'athletic_performance';
  if (slot.kind === 'accessory' && loadFocused && e.trackingType === 'weight_reps') s += 1;
  // Advanced bodyweight skills (muscle-up, archer push-up, pistol…) only when nothing loadable fits better.
  if (e.difficulty === 'advanced' && e.trackingType === 'reps' && !input.preferBodyweight) s -= 1.5;
  if (input.focusMuscleGroups.length && muscleGroupsOf(e).some((g) => input.focusMuscleGroups.includes(g))) s += 1.5;
  if (nameMatches(e, ctx.likes)) s += 3;
  if (nameMatches(e, ctx.dislikes)) s -= 6;
  if (input.preferBodyweight) s += e.equipment.length === 0 ? 3 : 0;

  // Ability benchmarks (bodyweight progressions).
  const { pushUpsMax, pullUpsMax } = input.ability;
  if (pullUpsMax != null) {
    const tooHard = pullUpsMax === 0 || (input.isMinor && pullUpsMax < 8);
    if (PULL_UP_IDS.has(e.id) && tooHard) s -= 6;
    if (ASSISTED_PULL_IDS.has(e.id) && pullUpsMax === 0) s += 2;
    if (ASSISTED_PULL_IDS.has(e.id) && pullUpsMax >= 8) s -= 2;
  }
  if (e.id === 'muscle_up' && (pullUpsMax ?? 0) < 10) s -= 4;
  if (pushUpsMax != null) {
    if (pushUpsMax < 5 && PUSH_UP_IDS.has(e.id)) s -= 4;
    if (pushUpsMax < 5 && EASY_PUSH_UP_IDS.has(e.id)) s += 2;
    if (pushUpsMax >= 30 && (EASY_PUSH_UP_IDS.has(e.id) || e.id === 'push_up')) s -= 2;
  }

  s -= 4 * (ctx.usedElsewhere.get(e.id) ?? 0);
  if (ctx.discourage.has(e.id)) s -= 3;
  if (slot.prefer) s += slot.prefer(e);
  s += seededUnit(input.variationSeed, slot.key, e.id) * 1.5;
  return s;
}

function pickForSlot(slot: Slot, ctx: Ctx, dayUsed: Set<string>, allowRelax: boolean): ExerciseRecord | null {
  const base = ctx.pool.filter((e) => slot.patterns.includes(e.movementPattern) && !dayUsed.has(e.id) && (!slot.filter || slot.filter(e)));
  let allowed = allowedDifficulties(ctx.input.experience, ctx.input.isMinor, false);
  let candidates = base.filter((e) => allowed.includes(e.difficulty));
  if (!candidates.length && allowRelax && ctx.input.experience === 'beginner') {
    allowed = allowedDifficulties('beginner', ctx.input.isMinor, true);
    candidates = base.filter((e) => allowed.includes(e.difficulty));
  }
  if (!candidates.length) return null;
  let best: ExerciseRecord | null = null;
  let bestScore = -Infinity;
  for (const e of [...candidates].sort((a, b) => a.id.localeCompare(b.id))) {
    const sc = scoreCandidate(e, slot, ctx);
    if (sc > bestScore) {
      best = e;
      bestScore = sc;
    }
  }
  return best;
}

const PULL_PATTERNS: MovementPattern[] = ['horizontal_pull', 'vertical_pull'];

/** True when the pool has any exercise of the pattern at a difficulty this user may get. */
function patternAvailable(p: MovementPattern, ctx: Ctx): boolean {
  const allowed = allowedDifficulties(ctx.input.experience, ctx.input.isMinor, true);
  return ctx.pool.some((e) => e.movementPattern === p && allowed.includes(e.difficulty));
}

function recordMissingSlot(slot: Slot, ctx: Ctx) {
  const avoided = slot.patterns.filter((p) => ctx.input.avoidPatterns.includes(p));
  if (slot.kind === 'finisher') {
    for (const p of avoided) ctx.notes.avoided.add(p);
    return;
  }
  if (slot.patterns.some((p) => PULL_PATTERNS.includes(p)) && !ctx.pool.some((e) => PULL_PATTERNS.includes(e.movementPattern))) {
    ctx.notes.noPulling = true;
    return;
  }
  for (const p of slot.patterns) {
    if (avoided.includes(p)) ctx.notes.avoided.add(p);
    // Specific slots (lateral/rear-delt/focus extras) and patterns whose candidates are merely
    // used elsewhere in the day are skipped silently; only a truly missing pattern is explained.
    else if (!patternAvailable(p, ctx) && !PULL_PATTERNS.includes(p)) ctx.notes.unavailable.add(p);
  }
}

/** Builds the ordered slot list for a day: priority order + display order. */
function slotsForDay(focus: WorkoutFocus, dayIndex: number, input: GeneratorInput): { priority: Slot[]; fillers: Slot[] } {
  const base = focusBase(focus);
  const variants = TEMPLATES[base];
  const template = variants[focusVariant(focus) % variants.length]!;
  const mk = (def: SlotDef, key: string, displayOrder: number): Slot => ({ ...def, key: `${focus}:${key}`, displayOrder });
  const templateSlots = template.map((d, i) => mk(d, `t${i}`, i));
  const lastMain = templateSlots.reduce((acc, s, i) => (s.kind === 'main' ? i : acc), -1);
  const mains = templateSlots.slice(0, lastMain + 1);
  const rest = templateSlots.slice(lastMain + 1);
  const priority: Slot[] = [];

  const lowerBodyDay = base === 'full_body' || base === 'lower' || base === 'legs';
  if (input.goal === 'athletic_performance' && lowerBodyDay) priority.push(mk({ patterns: ['jump'], kind: 'power' }, 'power', -1));
  // Goal modifier: the conditioning finisher is part of the goal. From 30 min on its time is reserved
  // before the main lifts (they lose a set rather than the finisher being dropped); shorter sessions
  // keep the main lifts first. It is always shown last.
  const finisherGoal = input.goal === 'fat_loss' || input.goal === 'general_fitness' || input.goal === 'athletic_performance';
  const finisher = mk({ patterns: ['conditioning'], kind: 'finisher' }, 'finisher', 100);
  if (finisherGoal && input.sessionMinutes >= 30) priority.push(finisher);
  priority.push(...mains);
  if (finisherGoal && input.sessionMinutes < 30) priority.push(finisher);
  // The first accessory is usually the antagonist pattern (e.g. a pull on a full-body day): keep it ahead of extras.
  if (rest[0]) priority.push(rest[0]);
  const covered = input.focusMuscleGroups.filter((g) => COVERS[base].includes(g));
  if (covered.length) {
    const group = covered[dayIndex % covered.length]!;
    priority.push(mk(focusGroupSlot(group, base, dayIndex), `focus_${group}`, lastMain + 1.5));
  }
  priority.push(...rest.slice(1));
  const fillers = FILLERS[base].map((d, i) => mk(d, `f${i}`, 50 + i));
  return { priority, fillers };
}

function buildWorkout(focus: WorkoutFocus, dayIndex: number, ctx: Ctx): GeneratedWorkout {
  const { input } = ctx;
  const { priority, fillers } = slotsForDay(focus, dayIndex, input);
  const warmup = warmupMinutes(input.sessionMinutes);
  const budget = Math.max(0, (input.sessionMinutes - warmup) * 60);
  // Optional slots may overrun the budget slightly (sessions vary; estimate stays ≤ minutes + 2).
  const softBudget = budget + BUDGET_TOLERANCE_SECONDS;
  const fullBody = focusBase(focus) === 'full_body';
  let mainsPlaced = 0;
  const chosen: { slot: Slot; exercise: ExerciseRecord; rx: Prescription; seconds: number }[] = [];
  const dayUsed = new Set<string>();
  let used = 0;

  const tryAdd = (slot: Slot, filler: boolean) => {
    if (chosen.length >= MAX_EXERCISES) return;
    const e = pickForSlot(slot, ctx, dayUsed, !filler);
    if (!e) {
      if (!filler) recordMissingSlot(slot, ctx);
      return;
    }
    const rx = prescribe(e, slot, ctx);
    // Full-body days have three main lifts: keep the first at full volume, the rest at ≥ 3 sets.
    if (fullBody && rx.role === 'main' && mainsPlaced++ > 0) rx.sets = Math.max(Math.min(3, rx.sets), rx.sets - 1);
    let seconds = exerciseSeconds(rx, e);
    if (used + seconds > budget) {
      if (chosen.length < MIN_EXERCISES) {
        // Guarantee a minimum workout: compress to 2 sets with short rests and holds.
        const short = input.sessionMinutes <= 20;
        rx.sets = Math.min(rx.sets, 2);
        rx.restSeconds = Math.min(rx.restSeconds, rx.role === 'power' ? 60 : short ? 30 : 45);
        if (rx.targetSeconds != null && short) rx.targetSeconds = Math.min(rx.targetSeconds, 30);
        seconds = exerciseSeconds(rx, e);
      } else {
        while (rx.sets > 2 && used + seconds > softBudget) {
          rx.sets -= 1;
          seconds = exerciseSeconds(rx, e);
        }
        if (used + seconds > softBudget) return;
      }
    }
    chosen.push({ slot, exercise: e, rx, seconds });
    if (input.experience === 'beginner' && e.difficulty !== 'beginner') ctx.notes.relaxed.add(e.movementPattern);
    dayUsed.add(e.id);
    used += seconds;
  };

  for (const slot of priority) tryAdd(slot, false);
  for (const slot of fillers) tryAdd(slot, true);

  // The guaranteed minimum may overrun very short sessions: trim sets (≥ 2), then rests (≥ 30 s).
  const roleRank: Record<ExerciseRole, number> = { core: 0, conditioning: 1, accessory: 2, power: 3, main: 4 };
  while (used > softBudget) {
    const bySets = chosen.filter((c) => c.rx.sets > 2).sort((a, b) => b.rx.sets - a.rx.sets || roleRank[a.rx.role] - roleRank[b.rx.role]);
    const byRest = chosen.filter((c) => c.rx.restSeconds > 30).sort((a, b) => b.rx.restSeconds - a.rx.restSeconds);
    const target = bySets[0] ?? byRest[0];
    if (!target) break;
    if (bySets[0]) target.rx.sets -= 1;
    else target.rx.restSeconds = Math.max(30, target.rx.restSeconds - 15);
    used -= target.seconds;
    target.seconds = exerciseSeconds(target.rx, target.exercise);
    used += target.seconds;
  }

  chosen.sort((a, b) => a.slot.displayOrder - b.slot.displayOrder);
  return {
    focus,
    name: workoutNameFor(focus, input.locale),
    notes: '',
    estimatedMinutes: warmup + Math.ceil(used / 60),
    exercises: chosen.map(({ exercise, rx }) => ({
      exerciseId: exercise.id,
      role: rx.role,
      sets: rx.sets,
      repMin: rx.targetSeconds != null ? null : rx.repMin,
      repMax: rx.targetSeconds != null ? null : rx.repMax,
      targetSeconds: rx.targetSeconds,
      restSeconds: rx.restSeconds,
      targetRpe: rx.targetRpe,
      targetWeightKg: rx.targetWeightKg,
      notes: rx.noteParts.join(' · ').slice(0, 500),
    })),
  };
}

// ---------------------------------------------------------------- Weekly balance (rule 7)

/** ~20 hard sets per muscle per week; groups spanning several muscles get proportionally more. */
const HIGH_VOLUME: Record<MuscleGroup, number> = { chest: 20, back: 25, shoulders: 22, arms: 30, core: 20, legs: 36 };
const LOW_VOLUME = 6;

/** Weekly sets per muscle group (each exercise counts once per primary muscle group). */
export function weeklySetsByGroup(workouts: GeneratedWorkout[], byId: Map<string, ExerciseRecord>): Record<MuscleGroup, number> {
  const out: Record<MuscleGroup, number> = { chest: 0, back: 0, shoulders: 0, arms: 0, core: 0, legs: 0 };
  for (const w of workouts) {
    for (const x of w.exercises) {
      const e = byId.get(x.exerciseId);
      if (!e || x.role === 'conditioning') continue;
      for (const g of muscleGroupsOf(e)) out[g] += x.sets;
    }
  }
  return out;
}

// ---------------------------------------------------------------- Public API

function newCtx(input: GeneratorInput, catalog: ExerciseRecord[], notes: NoteSink, pool?: ExerciseRecord[]): Ctx {
  return {
    input,
    pool: pool ?? buildPool(input, catalog).pool,
    likes: keywordsOf(input.likes),
    dislikes: keywordsOf(input.dislikes),
    usedElsewhere: new Map(),
    discourage: new Set(),
    notes,
  };
}

function flushSlotNotes(notes: NoteSink) {
  if (notes.noPulling) notes.add('no_pulling_equipment');
  for (const p of notes.avoided) notes.add('pattern_avoided', { pattern: p });
  for (const p of notes.unavailable) if (!notes.avoided.has(p)) notes.add('pattern_unavailable', { pattern: p });
  for (const p of notes.relaxed) notes.add('beginner_difficulty_relaxed', { pattern: p });
}

export function resolvedInput(input: GeneratorInput, trainingDays: number): PlanGenerationInput {
  return {
    goal: input.goal,
    experience: input.experience,
    location: input.location,
    equipment: [...input.equipment],
    daysPerWeek: input.daysPerWeek,
    trainingDays,
    sessionMinutes: input.sessionMinutes,
    focusMuscleGroups: [...input.focusMuscleGroups],
    minorSafetyRules: input.isMinor,
    preferences: input.preferenceOptions ?? {
      interpreter: input.preferenceInterpreter ?? null,
      focusMuscleGroups: [],
      avoidExerciseIds: [],
      avoidPatterns: [...input.avoidPatterns],
      preferBodyweight: input.preferBodyweight,
      intensity: input.intensity,
    },
    variationSeed: input.variationSeed,
    generatorVersion: GENERATOR_VERSION,
  };
}

/** Generates a complete weekly plan (pure). */
export function generatePlan(input: GeneratorInput, catalog: ExerciseRecord[]): GeneratedPlan {
  const notes = new NoteSink();
  const byId = new Map(catalog.map((e) => [e.id, e]));
  const { pool, injuryExclusions, avoidListExclusions } = buildPool(input, catalog);
  const split = chooseSplit(input.daysPerWeek, input.experience, input.goal);
  const focuses = orderFocuses(split.focuses);
  const trainingDays = focuses.length;
  const ctx = newCtx(input, catalog, notes, pool);

  notes.add(split.noteCode, { days: trainingDays });
  if (input.daysPerWeek > MAX_TRAINING_DAYS) notes.add('rest_day_recommended', { requested: input.daysPerWeek, days: trainingDays });

  const workouts: GeneratedWorkout[] = [];
  focuses.forEach((focus, i) => {
    const w = buildWorkout(focus, i, ctx);
    for (const x of w.exercises) ctx.usedElsewhere.set(x.exerciseId, (ctx.usedElsewhere.get(x.exerciseId) ?? 0) + 1);
    workouts.push(w);
  });
  flushSlotNotes(notes);

  // Plan-level guidance & explanations.
  notes.add('warm_up', { minutes: warmupMinutes(input.sessionMinutes) });
  if (input.goal === 'athletic_performance') notes.add('power_first');
  if (input.goal === 'fat_loss' || input.goal === 'general_fitness' || input.goal === 'athletic_performance') notes.add('conditioning_finisher');
  notes.add('progression_double');
  notes.add('rest_days', { days: 7 - trainingDays });
  if (input.sessionMinutes < 30) notes.add('short_session');
  for (const [area, count] of injuryExclusions) notes.add('excluded_for_injury', { area, count });
  if (avoidListExclusions > 0) notes.add('avoid_list_applied', { count: avoidListExclusions });
  if (input.equipment.length === 0) notes.add('bodyweight_plan');
  else if (input.location !== 'gym' && input.equipment.length < DEFAULT_EQUIPMENT_BY_LOCATION.gym.length / 3) notes.add('equipment_limited');
  for (const g of input.focusMuscleGroups) notes.add('focus_group', { group: g });
  if (input.likes.trim() || input.dislikes.trim()) notes.add('likes_considered');
  if (input.isMinor) notes.add('minor_safety');
  if (notes.oneRmUsed > 0) notes.add('one_rm_used', { count: notes.oneRmUsed });
  const hasBenchmarks = input.ability.pushUpsMax != null || input.ability.pullUpsMax != null || input.ability.plankSeconds != null;
  if (hasBenchmarks) notes.add('benchmarks_used');
  const unloaded = workouts.some((w) => w.exercises.some((x) => x.targetWeightKg == null && byId.get(x.exerciseId)?.trackingType === 'weight_reps'));
  if (unloaded) notes.add('choose_weight_by_rpe');
  if (input.intensity !== 'normal') notes.add(input.intensity === 'easier' ? 'intensity_easier' : 'intensity_harder');

  const volume = weeklySetsByGroup(workouts, byId);
  for (const g of Object.keys(volume) as MuscleGroup[]) {
    if (volume[g] > HIGH_VOLUME[g]) notes.add('high_volume_group', { group: g, sets: volume[g] });
    else if (g !== 'core' && volume[g] < LOW_VOLUME) notes.add('low_volume_group', { group: g, sets: volume[g] });
  }

  const s = strings(input.locale);
  const name = input.planName?.trim() || fill(s.planName, { goal: s.goal[input.goal], split: s.split[split.splitType] });
  const description = fill(s.planDescription, {
    days: trainingDays,
    experience: s.experience[input.experience],
    location: s.location[input.location],
    minutes: input.sessionMinutes,
  });

  return {
    name: name.slice(0, 120),
    description,
    goal: input.goal,
    splitType: split.splitType,
    daysPerWeek: trainingDays,
    sessionMinutes: input.sessionMinutes,
    workouts,
    notes: notes.list,
    input: resolvedInput(input, trainingDays),
    generatorVersion: GENERATOR_VERSION,
  };
}

/**
 * Regenerates one day of an existing plan with the same focus (pure). Exercises used on the
 * plan's other days are penalised (variety across the week) and the day's current exercises
 * are discouraged so a new seed actually brings change.
 */
export function generateWorkout(
  input: GeneratorInput,
  catalog: ExerciseRecord[],
  focus: WorkoutFocus,
  opts: { dayIndex: number; usedElsewhere: string[]; currentIds: string[] },
): { workout: GeneratedWorkout; notes: GenerationNote[] } {
  const notes = new NoteSink();
  const ctx = newCtx(input, catalog, notes);
  for (const id of opts.usedElsewhere) ctx.usedElsewhere.set(id, (ctx.usedElsewhere.get(id) ?? 0) + 1);
  for (const id of opts.currentIds) ctx.discourage.add(id);
  const workout = buildWorkout(focus, opts.dayIndex, ctx);
  flushSlotNotes(notes);
  return { workout, notes: notes.list };
}
