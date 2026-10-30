/**
 * Rules for the ready-made workouts and the sport finisher blocks: how long they take, what they need, which muscles
 * they train, and the validation every dataset entry must pass (`npm run validate:content`, server/tests/ready-*.test.ts).
 *
 * Pure: no I/O. Everything that can be derived from the exercises (equipment, muscles, minutes) is derived here and
 * never typed into the data, so it cannot drift from the library.
 */
import {
  DEFAULT_EQUIPMENT_BY_LOCATION,
  DIFFICULTIES,
  EQUIPMENT,
  LOCATIONS,
  MUSCLE_TO_GROUP,
  READY_FOCUSES,
  SPORTS,
  SPORT_BLOCK_MINUTES,
  SPORT_BLOCK_VARIANTS,
  TRAINING_MODES,
  type Difficulty,
  type Equipment,
  type Muscle,
  type MuscleGroup,
  type ReadyFocus,
  type SportBlockVariant,
  type SportId,
  type TrainingLocation,
} from '@shared/constants';
import type { ExerciseSeed, ReadyItemSeed, ReadyWorkoutSeed, SportBlockSeed } from '@shared/content';
import { isExternallyLoaded, isHighImpact } from '@shared/age';

/** What the rules need to know about an exercise. Both the seed list and the database records fit. */
export type ExerciseFacts = Pick<
  ExerciseSeed,
  | 'id'
  | 'name'
  | 'primaryMuscles'
  | 'secondaryMuscles'
  | 'equipment'
  | 'category'
  | 'movementPattern'
  | 'difficulty'
  | 'trackingType'
  | 'unilateral'
  | 'isCompound'
  | 'contraindications'
  | 'easierAlternatives'
  | 'harderAlternatives'
>;
export type ExerciseLookup = ReadonlyMap<string, ExerciseFacts>;

export const lookupOf = (list: readonly ExerciseFacts[]): ExerciseLookup => new Map(list.map((e) => [e.id, e]));

// ---------------------------------------------------------------- Places and gear

/** Equipment a person can reasonably have at home. */
export const HOME_GEAR: readonly Equipment[] = [
  'dumbbells', 'kettlebell', 'resistance_bands', 'pull_up_bar', 'bench', 'jump_rope', 'ab_wheel', 'suspension_trainer', 'medicine_ball', 'gymnastic_rings',
];
/** Fixed bars in a park / street-workout area plus what can be carried there. */
export const PARK_GEAR: readonly Equipment[] = [
  'pull_up_bar', 'dip_bars', 'bench', 'dumbbells', 'kettlebell', 'resistance_bands', 'jump_rope', 'medicine_ball', 'suspension_trainer', 'gymnastic_rings',
];
/** Gear that makes a workout "weights" rather than "bodyweight". */
export const RESISTANCE_GEAR: readonly Equipment[] = [
  'barbell', 'dumbbells', 'kettlebell', 'ez_bar', 'cable_machine', 'lat_pulldown_machine', 'leg_press_machine', 'leg_curl_machine',
  'leg_extension_machine', 'chest_press_machine', 'smith_machine', 'resistance_bands', 'medicine_ball',
];
/** Light gear a sport block of variant `gear` may use. */
export const SPORT_GEAR: readonly Equipment[] = ['dumbbells', 'kettlebell', 'resistance_bands', 'pull_up_bar', 'medicine_ball', 'jump_rope', 'bench'];

export const gearOfPlace = (place: TrainingLocation): readonly Equipment[] =>
  place === 'gym' ? DEFAULT_EQUIPMENT_BY_LOCATION.gym : place === 'home' ? HOME_GEAR : PARK_GEAR;

/** Equipment a user is assumed to have: what they ticked at home / in the park, everything at the gym. */
export function effectiveEquipment(location: TrainingLocation, chosen: readonly Equipment[] | undefined): Equipment[] {
  if (location === 'gym') return [...DEFAULT_EQUIPMENT_BY_LOCATION.gym];
  const base = chosen ?? DEFAULT_EQUIPMENT_BY_LOCATION[location];
  return sortEquipment(Array.from(new Set(base)));
}

export const sortEquipment = (list: readonly Equipment[]): Equipment[] => [...list].sort((a, b) => EQUIPMENT.indexOf(a) - EQUIPMENT.indexOf(b));

// ---------------------------------------------------------------- Time model (same numbers as the plan generator)

/** Warm-up time counted in a ready workout's length (the app shows a warm-up tip, not warm-up exercises). */
export const READY_WARMUP_MINUTES = 6;
/** Seconds of work per rep-tracked set (the plan generator's figure). */
export const REP_SET_SECONDS = 40;
const TRANSITION_SECONDS = 60;

/** Seconds one set of the item takes. One-sided exercises are done on both sides. */
export function workSeconds(item: ReadyItemSeed, e: Pick<ExerciseFacts, 'unilateral' | 'trackingType'>): number {
  if (e.trackingType === 'time') return (item.seconds ?? 30) * (e.unilateral ? 2 : 1);
  return REP_SET_SECONDS * (e.unilateral ? 1.5 : 1);
}

/** sets x (work + rest) + a 60 s transition, exactly as `exerciseSeconds` in the plan generator. */
export function itemSeconds(item: ReadyItemSeed, e: Pick<ExerciseFacts, 'unilateral' | 'trackingType'>): number {
  return item.sets * (workSeconds(item, e) + item.restSeconds) + TRANSITION_SECONDS;
}

export function workoutMinutes(items: readonly ReadyItemSeed[], lookup: ExerciseLookup): number {
  const seconds = items.reduce((sum, it) => {
    const e = lookup.get(it.exerciseId);
    return e ? sum + itemSeconds(it, e) : sum;
  }, 0);
  return READY_WARMUP_MINUTES + Math.ceil(seconds / 60);
}

/** A sport block has no per-exercise transition: the last rest of an exercise is the change-over. */
export function blockSeconds(items: readonly ReadyItemSeed[], lookup: ExerciseLookup): number {
  return items.reduce((sum, it) => {
    const e = lookup.get(it.exerciseId);
    return e ? sum + it.sets * (workSeconds(it, e) + it.restSeconds) : sum;
  }, 0);
}

// ---------------------------------------------------------------- Derived facts

export function deriveEquipment(items: readonly ReadyItemSeed[], lookup: ExerciseLookup): Equipment[] {
  const set = new Set<Equipment>();
  for (const it of items) for (const q of lookup.get(it.exerciseId)?.equipment ?? []) set.add(q);
  return sortEquipment([...set]);
}

export const totalSets = (items: readonly ReadyItemSeed[]): number => items.reduce((n, it) => n + it.sets, 0);

/** Muscles trained most, by share of sets (each set counts once for every primary muscle of its exercise). */
export function deriveMuscles(items: readonly ReadyItemSeed[], lookup: ExerciseLookup, max = 4): Muscle[] {
  const tally = new Map<Muscle, number>();
  for (const it of items) for (const m of lookup.get(it.exerciseId)?.primaryMuscles ?? []) tally.set(m, (tally.get(m) ?? 0) + it.sets);
  return [...tally.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, max).map(([m]) => m);
}

/** Share of sets (0-1) whose exercise has a primary muscle in `muscles`. */
export function setShare(items: readonly ReadyItemSeed[], lookup: ExerciseLookup, muscles: readonly Muscle[]): number {
  const total = totalSets(items);
  if (!total) return 0;
  const hit = items.reduce((n, it) => (lookup.get(it.exerciseId)?.primaryMuscles.some((m) => muscles.includes(m)) ? n + it.sets : n), 0);
  return hit / total;
}

const itemHas = (it: ReadyItemSeed, lookup: ExerciseLookup, muscles: readonly Muscle[]) =>
  lookup.get(it.exerciseId)?.primaryMuscles.some((m) => muscles.includes(m)) ?? false;

export function muscleGroupsOf(items: readonly ReadyItemSeed[], lookup: ExerciseLookup): Set<MuscleGroup> {
  const groups = new Set<MuscleGroup>();
  for (const it of items) for (const m of lookup.get(it.exerciseId)?.primaryMuscles ?? []) groups.add(MUSCLE_TO_GROUP[m]);
  return groups;
}

// ---------------------------------------------------------------- Focus rules

const PUSH: Muscle[] = ['chest', 'shoulders', 'triceps'];
const PULL: Muscle[] = ['lats', 'upper_back', 'biceps', 'rear_delts', 'traps'];
const LOWER: Muscle[] = ['quadriceps', 'hamstrings', 'glutes', 'calves', 'adductors'];
const CORE: Muscle[] = ['abs', 'obliques', 'lower_back', 'hip_flexors'];

interface FocusRule {
  /** Muscles that count for the focus. */
  muscles: Muscle[];
  /** Smallest share of sets that must train them. */
  minShare: number;
  /** Extra requirement checked on top of the share; returns an error text or null. */
  extra?: (items: readonly ReadyItemSeed[], lookup: ExerciseLookup) => string | null;
}

const distinctItems = (items: readonly ReadyItemSeed[], lookup: ExerciseLookup, muscles: readonly Muscle[]) =>
  items.filter((it) => itemHas(it, lookup, muscles)).length;

export const FOCUS_RULES: Record<ReadyFocus, FocusRule> = {
  chest: { muscles: ['chest'], minShare: 0.55 },
  back: { muscles: ['lats', 'upper_back', 'traps', 'lower_back', 'rear_delts'], minShare: 0.7 },
  shoulders: { muscles: ['shoulders', 'rear_delts', 'traps'], minShare: 0.65 },
  biceps: { muscles: ['biceps', 'forearms'], minShare: 0.7, extra: (i, l) => (setShare(i, l, ['biceps']) >= 0.5 ? null : 'at least half of the sets must train the biceps') },
  triceps: { muscles: ['triceps'], minShare: 0.6 },
  arms: {
    muscles: ['biceps', 'triceps', 'forearms'],
    minShare: 0.8,
    extra: (i, l) => (distinctItems(i, l, ['biceps']) >= 1 && distinctItems(i, l, ['triceps']) >= 1 ? null : 'needs at least one biceps and one triceps exercise'),
  },
  abs: { muscles: ['abs', 'obliques', 'hip_flexors'], minShare: 0.8, extra: (i, l) => (setShare(i, l, ['abs']) >= 0.5 ? null : 'at least half of the sets must train the abs') },
  core: {
    muscles: CORE,
    minShare: 0.8,
    extra: (i, l) => (distinctItems(i, l, ['obliques']) + distinctItems(i, l, ['lower_back']) >= 1 && distinctItems(i, l, ['abs']) >= 1 ? null : 'a core workout needs abs plus obliques or lower back'),
  },
  glutes: { muscles: ['glutes'], minShare: 0.6 },
  quads: { muscles: ['quadriceps'], minShare: 0.55 },
  hamstrings: {
    muscles: ['hamstrings', 'glutes', 'lower_back'],
    minShare: 0.7,
    extra: (i, l) => (setShare(i, l, ['hamstrings']) >= 0.35 ? null : 'at least a third of the sets must train the hamstrings'),
  },
  legs: {
    muscles: [...LOWER, 'hip_flexors'],
    minShare: 0.85,
    extra: (i, l) => ((['quadriceps', 'hamstrings', 'glutes'] as Muscle[]).every((m) => distinctItems(i, l, [m]) >= 1) ? null : 'a legs workout needs quads, hamstrings and glutes exercises'),
  },
  upper_body: {
    muscles: [...PUSH, ...PULL, 'forearms'],
    minShare: 0.85,
    extra: (i, l) => (distinctItems(i, l, ['chest', 'shoulders']) >= 1 && distinctItems(i, l, ['lats', 'upper_back']) >= 1 ? null : 'an upper-body workout needs a push (chest or shoulders) and a pull (lats or upper back)'),
  },
  full_body: {
    muscles: [...PUSH, ...PULL, ...LOWER, ...CORE],
    minShare: 0.9,
    extra: (i, l) => {
      const need: [string, Muscle[]][] = [['push', PUSH], ['pull', PULL], ['lower body', LOWER], ['core', CORE]];
      const missing = need.filter(([, m]) => distinctItems(i, l, m) < 1).map(([n]) => n);
      return missing.length ? `a full-body workout needs ${missing.join(', ')}` : null;
    },
  },
  cardio: { muscles: [], minShare: 0 },
};

const isConditioning = (e: ExerciseFacts) =>
  e.category === 'cardio' || e.category === 'plyometric' || e.movementPattern === 'conditioning' || e.movementPattern === 'jump' || isHighImpact(e);

// ---------------------------------------------------------------- Validation helpers

const HEBREW = /[֐-׿]/;
const SLUG = /^[a-z0-9]+(?:_[a-z0-9]+)*$/;
const rank = (d: Difficulty) => DIFFICULTIES.indexOf(d);

export interface Findings {
  errors: string[];
  warnings: string[];
}

function localized(ctx: string, field: string, v: { en: string; he: string } | undefined, min: number, max: number, out: string[]) {
  if (!v) return void out.push(`${ctx}: missing ${field}`);
  if (typeof v.en !== 'string' || v.en.trim().length < min || v.en.trim().length > max) out.push(`${ctx}: ${field}.en must be ${min}-${max} characters`);
  if (typeof v.he !== 'string' || !HEBREW.test(v.he) || v.he.trim().length < Math.min(min, 3) || v.he.trim().length > max) out.push(`${ctx}: ${field}.he must be Hebrew text of at most ${max} characters`);
}

/** Checks the rep / time prescription of one item against its exercise. */
function checkItem(ctx: string, it: ReadyItemSeed, e: ExerciseFacts | undefined, out: string[], opts: { maxSets: number }) {
  if (!e) return void out.push(`${ctx}: unknown exercise "${it.exerciseId}"`);
  if (!Number.isInteger(it.sets) || it.sets < 1 || it.sets > opts.maxSets) out.push(`${ctx}: ${it.exerciseId} sets must be 1-${opts.maxSets}`);
  if (!Number.isInteger(it.restSeconds) || it.restSeconds < 10 || it.restSeconds > 180) out.push(`${ctx}: ${it.exerciseId} restSeconds must be 10-180`);
  if (e.trackingType === 'time') {
    if (it.reps) out.push(`${ctx}: ${it.exerciseId} is timed, use "seconds" not "reps"`);
    if (!Number.isInteger(it.seconds) || (it.seconds ?? 0) < 10 || (it.seconds ?? 0) > 120) out.push(`${ctx}: ${it.exerciseId} seconds must be 10-120`);
  } else {
    if (it.seconds != null) out.push(`${ctx}: ${it.exerciseId} is rep-tracked, use "reps" not "seconds"`);
    const r = it.reps;
    if (!r || r.length !== 2 || !Number.isInteger(r[0]) || !Number.isInteger(r[1]) || r[0] < 1 || r[1] > 50 || r[0] > r[1]) out.push(`${ctx}: ${it.exerciseId} reps must be [min, max] with 1 <= min <= max <= 50`);
    else if (isExternallyLoaded(e) && r[0] < 5) out.push(`${ctx}: ${it.exerciseId} is loaded, minimum reps must be at least 5 (no heavy singles in ready workouts)`);
  }
  if (it.cue) localized(ctx, `${it.exerciseId} cue`, it.cue, 3, 140, out);
}

// ---------------------------------------------------------------- Ready workouts

export const READY_MIN_ITEMS = 4;
export const READY_MAX_ITEMS = 9;
export const READY_MIN_MINUTES = 20;
export const READY_MAX_MINUTES = 75;

export function validateReadyWorkout(w: ReadyWorkoutSeed, lookup: ExerciseLookup): Findings {
  const ctx = `ready workout ${w.id}`;
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!SLUG.test(w.id)) errors.push(`${ctx}: id must be snake_case`);
  localized(ctx, 'name', w.name, 4, 60, errors);
  localized(ctx, 'description', w.description, 30, 260, errors);
  if (!(READY_FOCUSES as readonly string[]).includes(w.focus)) errors.push(`${ctx}: focus "${w.focus}" is not valid`);
  if (!(TRAINING_MODES as readonly string[]).includes(w.mode)) errors.push(`${ctx}: mode "${w.mode}" is not valid`);
  if (!(DIFFICULTIES as readonly string[]).includes(w.level)) errors.push(`${ctx}: level "${w.level}" is not valid`);
  if (!Array.isArray(w.places) || w.places.length < 1) errors.push(`${ctx}: needs at least one place`);
  else {
    if (new Set(w.places).size !== w.places.length) errors.push(`${ctx}: duplicate places`);
    for (const p of w.places) if (!(LOCATIONS as readonly string[]).includes(p)) errors.push(`${ctx}: place "${p}" is not valid`);
  }
  if (!Array.isArray(w.items) || w.items.length < READY_MIN_ITEMS || w.items.length > READY_MAX_ITEMS) {
    errors.push(`${ctx}: needs ${READY_MIN_ITEMS}-${READY_MAX_ITEMS} exercises (has ${w.items?.length ?? 0})`);
    return { errors, warnings };
  }
  const seen = new Set<string>();
  for (const it of w.items) {
    if (seen.has(it.exerciseId)) errors.push(`${ctx}: ${it.exerciseId} appears twice`);
    seen.add(it.exerciseId);
    checkItem(ctx, it, lookup.get(it.exerciseId), errors, { maxSets: 5 });
  }
  if (errors.some((e) => e.includes('unknown exercise'))) return { errors, warnings };

  const exercises = w.items.map((it) => lookup.get(it.exerciseId)!);
  const equipment = deriveEquipment(w.items, lookup);

  // Mode: bodyweight = no external load at all; weights = mostly externally loaded work with real resistance gear.
  const loadedItems = exercises.filter((e) => isExternallyLoaded(e)).length;
  if (w.mode === 'bodyweight') {
    if (loadedItems > 0) errors.push(`${ctx}: mode bodyweight but ${loadedItems} exercise(s) use external load (${exercises.filter((e) => isExternallyLoaded(e)).map((e) => e.id).join(', ')})`);
    const gear = equipment.filter((q) => RESISTANCE_GEAR.includes(q));
    if (gear.length) errors.push(`${ctx}: mode bodyweight but needs ${gear.join(', ')}`);
  } else {
    if (!equipment.some((q) => RESISTANCE_GEAR.includes(q))) errors.push(`${ctx}: mode weights but no resistance equipment is used`);
    if (loadedItems < Math.ceil(w.items.length / 2)) errors.push(`${ctx}: mode weights needs at least half of the exercises loaded (has ${loadedItems} of ${w.items.length})`);
  }

  // Places: every place must really have the gear the workout needs.
  for (const p of w.places ?? []) {
    const missing = equipment.filter((q) => !gearOfPlace(p).includes(q));
    if (missing.length) errors.push(`${ctx}: place ${p} does not have ${missing.join(', ')}`);
  }

  // Level.
  const maxDifficulty = exercises.reduce((m, e) => Math.max(m, rank(e.difficulty)), 0);
  if (maxDifficulty > rank(w.level)) errors.push(`${ctx}: level ${w.level} but contains a ${DIFFICULTIES[maxDifficulty]} exercise (${exercises.filter((e) => rank(e.difficulty) === maxDifficulty).map((e) => e.id).join(', ')})`);
  if (w.level !== 'beginner' && maxDifficulty < rank(w.level)) warnings.push(`${ctx}: level ${w.level} but every exercise is easier`);
  if (w.level === 'beginner') {
    if (w.items.some((it) => it.sets > 3)) errors.push(`${ctx}: beginner workouts use at most 3 sets per exercise`);
    if (exercises.some((e) => e.category === 'plyometric')) errors.push(`${ctx}: beginner workouts have no plyometric exercises`);
    if (w.items.some((it, i) => exercises[i]!.trackingType === 'time' && (it.seconds ?? 0) > 60)) errors.push(`${ctx}: beginner holds are at most 60 seconds`);
  }

  // Focus.
  const rule = FOCUS_RULES[w.focus];
  if (rule) {
    if (w.focus === 'cardio') {
      const conditioning = exercises.filter(isConditioning).length;
      if (conditioning / exercises.length < 0.6) errors.push(`${ctx}: a cardio workout needs at least 60% conditioning exercises (cardio, plyometric, jumping); has ${conditioning} of ${exercises.length}`);
    } else {
      const share = setShare(w.items, lookup, rule.muscles);
      if (share < rule.minShare) errors.push(`${ctx}: focus ${w.focus} needs ${Math.round(rule.minShare * 100)}% of the sets on ${rule.muscles.join('/')}; has ${Math.round(share * 100)}%`);
      const extra = rule.extra?.(w.items, lookup);
      if (extra) errors.push(`${ctx}: focus ${w.focus}: ${extra}`);
    }
  }

  // Length.
  const minutes = workoutMinutes(w.items, lookup);
  if (minutes < READY_MIN_MINUTES || minutes > READY_MAX_MINUTES) errors.push(`${ctx}: estimated ${minutes} min, must be ${READY_MIN_MINUTES}-${READY_MAX_MINUTES} (add or remove sets / exercises)`);

  // Order: big multi-joint work first, finishing with isolation / core / conditioning.
  const firstIsolation = exercises.findIndex((e) => !e.isCompound);
  if (firstIsolation >= 0 && exercises.slice(firstIsolation).some((e, i) => e.isCompound && e.difficulty !== 'beginner' && e.category !== 'cardio' && i > 1)) {
    warnings.push(`${ctx}: demanding multi-joint exercises come after isolation work; put them first`);
  }
  if (w.places.length === 1 && w.places[0] === 'outdoor' && exercises.some((e) => /^(lying|supine|prone)/.test(e.id.replace(/_/g, ' ')))) {
    warnings.push(`${ctx}: floor work in a park-only workout; mention a mat or towel in a cue`);
  }
  // A workout that fits another place by its equipment should say so (more places = easier to find).
  for (const p of LOCATIONS) {
    if (!w.places.includes(p) && equipment.every((q) => gearOfPlace(p).includes(q))) warnings.push(`${ctx}: could also be offered in ${p}`);
  }
  return { errors, warnings };
}

// ---------------------------------------------------------------- Sport blocks

export const SPORT_BLOCK_MIN_ITEMS = 4;
export const SPORT_BLOCK_MAX_ITEMS = 6;
/** Allowed length of a block, in seconds (10 minutes, give or take one minute). */
export const SPORT_BLOCK_SECONDS: readonly [number, number] = [(SPORT_BLOCK_MINUTES - 1) * 60, (SPORT_BLOCK_MINUTES + 1) * 60];

export function validateSportBlock(b: SportBlockSeed, lookup: ExerciseLookup): Findings {
  const ctx = `sport block ${b.id}`;
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!SLUG.test(b.id)) errors.push(`${ctx}: id must be snake_case`);
  if (!(SPORTS as readonly string[]).includes(b.sport)) errors.push(`${ctx}: sport "${b.sport}" is not valid`);
  if (!(SPORT_BLOCK_VARIANTS as readonly string[]).includes(b.variant)) errors.push(`${ctx}: variant "${b.variant}" is not valid`);
  if (b.id !== `${b.sport}_${b.variant}`) errors.push(`${ctx}: id must be "${b.sport}_${b.variant}"`);
  localized(ctx, 'name', b.name, 4, 70, errors);
  localized(ctx, 'description', b.description, 30, 260, errors);
  if (!Array.isArray(b.items) || b.items.length < SPORT_BLOCK_MIN_ITEMS || b.items.length > SPORT_BLOCK_MAX_ITEMS) {
    errors.push(`${ctx}: needs ${SPORT_BLOCK_MIN_ITEMS}-${SPORT_BLOCK_MAX_ITEMS} exercises (has ${b.items?.length ?? 0})`);
    return { errors, warnings };
  }
  const seen = new Set<string>();
  for (const it of b.items) {
    if (seen.has(it.exerciseId)) errors.push(`${ctx}: ${it.exerciseId} appears twice`);
    seen.add(it.exerciseId);
    checkItem(ctx, it, lookup.get(it.exerciseId), errors, { maxSets: 3 });
  }
  if (errors.some((e) => e.includes('unknown exercise'))) return { errors, warnings };

  const exercises = b.items.map((it) => lookup.get(it.exerciseId)!);
  const equipment = deriveEquipment(b.items, lookup);
  const seconds = blockSeconds(b.items, lookup);
  if (seconds < SPORT_BLOCK_SECONDS[0] || seconds > SPORT_BLOCK_SECONDS[1]) {
    errors.push(`${ctx}: takes ${(seconds / 60).toFixed(1)} min, must be ${SPORT_BLOCK_MINUTES - 1}-${SPORT_BLOCK_MINUTES + 1} (sets x (work + rest) summed over the exercises)`);
  }
  if (exercises.some((e) => e.category === 'mobility')) errors.push(`${ctx}: mobility exercises belong to the warm-up, not to a sport block`);
  if (exercises.some((e) => e.difficulty === 'advanced')) errors.push(`${ctx}: sport blocks use no advanced exercises`);

  if (b.variant === 'bodyweight') {
    if (equipment.length) errors.push(`${ctx}: variant bodyweight needs no equipment (uses ${equipment.join(', ')})`);
  } else if (b.variant === 'gear') {
    if (!equipment.length) errors.push(`${ctx}: variant gear must use some equipment`);
    const bad = equipment.filter((q) => !SPORT_GEAR.includes(q));
    if (bad.length) errors.push(`${ctx}: variant gear may only use ${SPORT_GEAR.join(', ')} (uses ${bad.join(', ')})`);
  } else {
    // gentle: low impact, easy, kind to the lower-body joints; used for older adults and joint complaints.
    if (equipment.length) errors.push(`${ctx}: variant gentle needs no equipment (uses ${equipment.join(', ')})`);
    for (const e of exercises) {
      if (isHighImpact(e)) errors.push(`${ctx}: variant gentle contains high-impact exercise ${e.id}`);
      if (e.difficulty !== 'beginner') errors.push(`${ctx}: variant gentle contains non-beginner exercise ${e.id}`);
      const joints = e.contraindications.filter((c) => c === 'knee' || c === 'ankle' || c === 'hip' || c === 'lower_back');
      if (joints.length) errors.push(`${ctx}: variant gentle contains ${e.id}, which is contraindicated for ${joints.join('/')}`);
    }
  }
  return { errors, warnings };
}

// ---------------------------------------------------------------- Whole catalog

export function jaccard(a: ReadonlySet<string>, b: ReadonlySet<string>): number {
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

/** Highest overlap between two workouts of the same focus that is accepted (share of exercises in common). */
export const MAX_SIMILARITY = 0.7;
export const WARN_SIMILARITY = 0.55;

export interface CatalogStats {
  workouts: number;
  blocks: number;
  byFocus: Record<string, number>;
  byMode: Record<string, number>;
  byLevel: Record<string, number>;
  byPlace: Record<string, number>;
  /** Workouts that need nothing but the body (no equipment at all). */
  noEquipment: number;
  /** Distinct exercises used by at least one workout / block. */
  exercisesUsed: number;
}

export function validateReadyCatalog(workouts: readonly ReadyWorkoutSeed[], blocks: readonly SportBlockSeed[], lookup: ExerciseLookup): Findings & { stats: CatalogStats } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const ids = new Set<string>();
  const namesEn = new Set<string>();
  const namesHe = new Set<string>();
  const signatures = new Map<string, string>();
  const sets = new Map<string, Set<string>>();

  for (const w of workouts) {
    const f = validateReadyWorkout(w, lookup);
    errors.push(...f.errors);
    warnings.push(...f.warnings);
    if (ids.has(w.id)) errors.push(`ready workout ${w.id}: duplicate id`);
    ids.add(w.id);
    const en = w.name?.en?.trim().toLowerCase();
    const he = w.name?.he?.trim();
    if (en && namesEn.has(en)) errors.push(`ready workout ${w.id}: duplicate English name "${w.name.en}"`);
    if (he && namesHe.has(he)) errors.push(`ready workout ${w.id}: duplicate Hebrew name "${w.name.he}"`);
    if (en) namesEn.add(en);
    if (he) namesHe.add(he);
    const exerciseSet = new Set(w.items.map((it) => it.exerciseId));
    sets.set(w.id, exerciseSet);
    const signature = [...exerciseSet].sort().join('|');
    const twin = signatures.get(signature);
    if (twin) errors.push(`ready workout ${w.id}: same exercises as ${twin}`);
    else signatures.set(signature, w.id);
  }

  // Near-duplicates inside one focus.
  const byFocus = new Map<ReadyFocus, ReadyWorkoutSeed[]>();
  for (const w of workouts) byFocus.set(w.focus, [...(byFocus.get(w.focus) ?? []), w]);
  for (const list of byFocus.values()) {
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const sim = jaccard(sets.get(list[i]!.id)!, sets.get(list[j]!.id)!);
        if (sim > MAX_SIMILARITY) errors.push(`ready workouts ${list[i]!.id} vs ${list[j]!.id}: they share ${Math.round(sim * 100)}% of their exercises (max ${Math.round(MAX_SIMILARITY * 100)}%)`);
        else if (sim > WARN_SIMILARITY) warnings.push(`ready workouts ${list[i]!.id} vs ${list[j]!.id}: they share ${Math.round(sim * 100)}% of their exercises`);
      }
    }
  }

  const blockIds = new Set<string>();
  const used = new Set<string>();
  for (const b of blocks) {
    const f = validateSportBlock(b, lookup);
    errors.push(...f.errors);
    warnings.push(...f.warnings);
    if (blockIds.has(b.id)) errors.push(`sport block ${b.id}: duplicate id`);
    blockIds.add(b.id);
    for (const it of b.items) used.add(it.exerciseId);
  }
  for (const w of workouts) for (const it of w.items) used.add(it.exerciseId);

  const count = <T extends string>(keys: readonly T[], pick: (w: ReadyWorkoutSeed) => T[]) => {
    const out: Record<string, number> = Object.fromEntries(keys.map((k) => [k, 0]));
    for (const w of workouts) for (const k of pick(w)) out[k] = (out[k] ?? 0) + 1;
    return out;
  };
  const stats: CatalogStats = {
    workouts: workouts.length,
    blocks: blocks.length,
    byFocus: count(READY_FOCUSES, (w) => [w.focus]),
    byMode: count(TRAINING_MODES, (w) => [w.mode]),
    byLevel: count(DIFFICULTIES, (w) => [w.level]),
    byPlace: count(LOCATIONS, (w) => w.places),
    noEquipment: workouts.filter((w) => deriveEquipment(w.items, lookup).length === 0).length,
    exercisesUsed: used.size,
  };
  return { errors, warnings, stats };
}

/** Which of the 13 x 3 sport blocks exist (used by the coverage report and tests). */
export function missingSportBlocks(blocks: readonly SportBlockSeed[]): `${SportId}_${SportBlockVariant}`[] {
  const have = new Set(blocks.map((b) => b.id));
  const out: `${SportId}_${SportBlockVariant}`[] = [];
  for (const s of SPORTS) for (const v of SPORT_BLOCK_VARIANTS) if (!have.has(`${s}_${v}`)) out.push(`${s}_${v}`);
  return out;
}

export { isConditioning };
