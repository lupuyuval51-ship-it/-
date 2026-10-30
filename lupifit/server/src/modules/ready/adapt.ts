/**
 * The safety layer of the ready workouts: makes a curated workout fit one person (reported injuries, age, minors,
 * the gear they have) and picks the sport finisher block that is safe for them. Pure: no I/O, no clock, no randomness.
 *
 * Principles (same as the plan generator):
 *  - The rules only ever make a workout easier, never harder.
 *  - An exercise the person should not do is swapped for an easier alternative of the same muscle, or left out; the
 *    workout is hidden entirely when too much would have to change. A changed workout always says so in `notes`.
 *  - General conservative defaults, not medical advice.
 */
import { ageRules, isExternallyLoaded, isHighImpact, type AgeBand } from '@shared/age';
import type { Difficulty, Equipment, InjuryArea, Locale, SportBlockVariant, SportId, TrainingMode } from '@shared/constants';
import type { LocalizedText, ReadyItemSeed, ReadyWorkoutSeed, SportBlockSeed } from '@shared/content';
import type { GenerationNote } from '@shared/types';
import { READY_MIN_ITEMS, type ExerciseFacts, type ExerciseLookup } from './rules';
import { clamp, pickLocale } from './util';

export interface AdaptContext {
  ageBand: AgeBand;
  isMinor: boolean;
  /** Body areas the person reported as injured. */
  injuries: readonly InjuryArea[];
  /** Gear the person has: what they ticked at home / in the park, everything at the gym (`effectiveEquipment`). */
  equipment: readonly Equipment[];
  locale: Locale;
}

/** One exercise of an adapted workout or sport block, ready to be shown or written to a session. */
export interface AdaptedItem {
  exerciseId: string;
  sets: number;
  repMin: number | null;
  repMax: number | null;
  targetSeconds: number | null;
  restSeconds: number;
  targetRpe: number | null;
  cue: LocalizedText | null;
  /** Id of the exercise this one replaced for this person, or null. */
  substitutedFrom: string | null;
}

export interface AdaptedWorkout {
  /** False when the workout cannot be made safe for this person. Such a workout is never listed or started. */
  available: boolean;
  /** Empty when the workout is not available, so it cannot be used by mistake. */
  items: AdaptedItem[];
  notes: GenerationNote[];
  /** Exercises that were substituted or dropped. */
  changed: number;
}

export interface SportPick {
  block: SportBlockSeed | null;
  items: AdaptedItem[];
  notes: GenerationNote[];
}

// ---------------------------------------------------------------- Constants

/** Longest chain of "easier alternative of an easier alternative" the search follows. */
export const SUBSTITUTE_MAX_DEPTH = 3;
/** More changed exercises than this and the workout is no longer the workout that was designed. */
export const MAX_CHANGED_ITEMS = 3;
/** Prescription of a substitute whose tracking type differs from the exercise it replaces. */
export const SUBSTITUTE_REPS: readonly [number, number] = [8, 12];
export const SUBSTITUTE_SECONDS = 30;
/** Target effort of a rep-tracked exercise, by the level of the workout. Timed exercises have none. */
export const RPE_BY_LEVEL: Readonly<Record<Difficulty, number>> = { beginner: 6, intermediate: 7, advanced: 8 };
/** Minors never train above this effort and never do heavy low-rep loaded sets. */
export const MINOR_RPE_CAP = 7;
export const MINOR_LOADED_REP_FLOOR = 6;
/** Target effort of rep-tracked sport-block exercises. At or below every age cap, so no cap ever has to touch a block. */
export const SPORT_BLOCK_RPE = 7;
/** A reported injury in one of these areas makes the lower-impact (gentle) sport block the first choice. */
export const SPORT_JOINT_AREAS: readonly InjuryArea[] = ['knee', 'ankle', 'hip', 'lower_back'];

/** The only note codes this module produces (the client renders them as i18n `ready.notes.<code>`). */
export const READY_NOTE_CODES = ['minor', 'age_mature', 'age_senior', 'substituted', 'dropped', 'sport_gentle', 'sport_none_fit'] as const;

// ---------------------------------------------------------------- Suitability

export type UnsuitableReason = 'equipment' | 'injury' | 'advanced' | 'high_impact';

const minorOf = (ctx: Pick<AdaptContext, 'isMinor' | 'ageBand'>) => ctx.isMinor || ctx.ageBand === 'minor';

/** Why the person should not do this exercise (empty = suitable). */
export function unsuitableReasons(e: ExerciseFacts, ctx: AdaptContext): UnsuitableReason[] {
  const rules = ageRules(ctx.ageBand);
  const out: UnsuitableReason[] = [];
  if (!e.equipment.every((q) => ctx.equipment.includes(q))) out.push('equipment');
  if (e.contraindications.some((c) => ctx.injuries.includes(c))) out.push('injury');
  if ((minorOf(ctx) || rules.excludeAdvanced) && e.difficulty === 'advanced') out.push('advanced');
  if (rules.excludeHighImpact && isHighImpact(e)) out.push('high_impact');
  return out;
}

export const isSuitable = (e: ExerciseFacts, ctx: AdaptContext): boolean => unsuitableReasons(e, ctx).length === 0;

// ---------------------------------------------------------------- Substitution

const DIFFICULTY_RANK: readonly Difficulty[] = ['beginner', 'intermediate', 'advanced'];

/**
 * The first suitable exercise on the "easier alternative" tree of `original`, searched breadth first (depth up to
 * `SUBSTITUTE_MAX_DEPTH`, listed order within a level). It must also work at least one of the same primary muscles,
 * must not already be part of the workout and must not be harder than the exercise it replaces (a mislabelled
 * "easier" alternative never makes a workout harder). Unsuitable alternatives are walked through (their own easier
 * alternatives may be fine) but never chosen.
 */
export function findSubstitute(original: ExerciseFacts, lookup: ExerciseLookup, ctx: AdaptContext, taken: ReadonlySet<string>): ExerciseFacts | null {
  const seen = new Set<string>([original.id]);
  const ceiling = DIFFICULTY_RANK.indexOf(original.difficulty);
  let level: ExerciseFacts[] = [original];
  for (let depth = 1; depth <= SUBSTITUTE_MAX_DEPTH && level.length; depth++) {
    const next: ExerciseFacts[] = [];
    for (const parent of level) {
      for (const id of parent.easierAlternatives) {
        if (seen.has(id)) continue;
        seen.add(id);
        const alt = lookup.get(id);
        if (!alt) continue;
        const fits =
          !taken.has(id) &&
          DIFFICULTY_RANK.indexOf(alt.difficulty) <= ceiling &&
          isSuitable(alt, ctx) &&
          alt.primaryMuscles.some((m) => original.primaryMuscles.includes(m));
        if (fits) return alt;
        next.push(alt);
      }
    }
    level = next;
  }
  return null;
}

// ---------------------------------------------------------------- Prescription

interface Prescription {
  sets: number;
  repMin: number | null;
  repMax: number | null;
  targetSeconds: number | null;
  restSeconds: number;
  targetRpe: number | null;
}

type LoadFacts = Pick<ExerciseFacts, 'trackingType' | 'category'>;

/** Rep range / hold time of a seed item for its exercise, with the sets and rest as designed. */
function designed(item: ReadyItemSeed, e: Pick<ExerciseFacts, 'trackingType'>, rpe: number | null): Prescription {
  const timed = e.trackingType === 'time';
  const [lo, hi] = item.reps ?? SUBSTITUTE_REPS;
  return {
    sets: item.sets,
    repMin: timed ? null : lo,
    repMax: timed ? null : Math.max(lo, hi),
    targetSeconds: timed ? (item.seconds ?? SUBSTITUTE_SECONDS) : null,
    restSeconds: item.restSeconds,
    targetRpe: timed ? null : rpe,
  };
}

/**
 * Lowest rep count of an externally loaded set (more reps mean a lighter weight or band). Never applied to bodyweight
 * reps, where more reps would make a set harder, nor to timed holds.
 */
function raiseLoadedReps(rx: Prescription, e: LoadFacts, floor: number | null): Prescription {
  if (floor == null || rx.repMin == null || !isExternallyLoaded(e)) return rx;
  const repMin = Math.max(floor, rx.repMin);
  return { ...rx, repMin, repMax: Math.max(repMin, rx.repMax ?? repMin) };
}

const bounded = (rx: Prescription): Prescription => ({
  ...rx,
  sets: clamp(rx.sets, 1, 10),
  restSeconds: clamp(rx.restSeconds, 0, 600),
  targetRpe: rx.targetRpe == null ? null : clamp(rx.targetRpe, 1, 10),
});

/**
 * Minor and age rules for one main-workout exercise, exactly like the plan generator's `applyModifiers`: lower top
 * effort, more rest, fewer sets, and a rep floor on loaded sets only. Every step can only make the set easier.
 */
export function capPrescription(rx: Prescription, e: LoadFacts, ctx: AdaptContext): Prescription {
  let out = { ...rx };
  if (minorOf(ctx)) {
    if (out.targetRpe != null) out.targetRpe = Math.min(MINOR_RPE_CAP, out.targetRpe);
    out = raiseLoadedReps(out, e, MINOR_LOADED_REP_FLOOR);
  }
  const age = ageRules(ctx.ageBand);
  if (age.rpeCap != null && out.targetRpe != null) out.targetRpe = Math.min(age.rpeCap, out.targetRpe);
  if (age.setsCap != null) out.sets = Math.min(out.sets, age.setsCap);
  out = raiseLoadedReps(out, e, age.loadedRepMinFloor);
  out.restSeconds += age.restBonusSeconds;
  return bounded(out);
}

/**
 * Sport blocks are timed to about ten minutes and the gentle variant is their age adaptation, so the effort, set and
 * rest caps are not applied to them. Only the loaded-rep floors are: they change the weight, not the clock.
 */
function blockPrescription(item: ReadyItemSeed, e: ExerciseFacts, ctx: AdaptContext): Prescription {
  const rx = designed(item, e, SPORT_BLOCK_RPE);
  const floor = Math.max(minorOf(ctx) ? MINOR_LOADED_REP_FLOOR : 0, ageRules(ctx.ageBand).loadedRepMinFloor ?? 0);
  return bounded(raiseLoadedReps(rx, e, floor || null));
}

const toItem = (exerciseId: string, rx: Prescription, cue: LocalizedText | null, substitutedFrom: string | null): AdaptedItem => ({
  exerciseId,
  sets: rx.sets,
  repMin: rx.repMin,
  repMax: rx.repMax,
  targetSeconds: rx.targetSeconds,
  restSeconds: rx.restSeconds,
  targetRpe: rx.targetRpe,
  cue,
  substitutedFrom,
});

const copyCue = (cue: LocalizedText | undefined): LocalizedText | null => (cue ? { en: cue.en, he: cue.he } : null);

// ---------------------------------------------------------------- Workouts

/** The seed item for a substitute: sets and rest stay; reps / seconds stay unless the tracking type changed. The cue was about the other exercise. */
function carryOver(item: ReadyItemSeed, from: ExerciseFacts, to: ExerciseFacts): ReadyItemSeed {
  const base = { exerciseId: to.id, sets: item.sets, restSeconds: item.restSeconds };
  if (from.trackingType === to.trackingType) return { ...base, ...(item.reps ? { reps: item.reps } : {}), ...(item.seconds != null ? { seconds: item.seconds } : {}) };
  return to.trackingType === 'time' ? { ...base, seconds: SUBSTITUTE_SECONDS } : { ...base, reps: [SUBSTITUTE_REPS[0], SUBSTITUTE_REPS[1]] };
}

function addNote(notes: GenerationNote[], code: string, params?: Record<string, string | number>) {
  const key = code + JSON.stringify(params ?? {});
  if (notes.some((n) => n.code + JSON.stringify(n.params ?? {}) === key)) return;
  notes.push(params ? { code, params } : { code });
}

/**
 * Fits a ready workout to one person. See the file header. Steps: swap or drop what they should not do, decide
 * whether what is left is still a real workout, then apply the easier-only prescription rules.
 */
export function adaptWorkout(seed: ReadyWorkoutSeed, lookup: ExerciseLookup, ctx: AdaptContext): AdaptedWorkout {
  const taken = new Set(seed.items.map((it) => it.exerciseId));
  const kept: { item: ReadyItemSeed; exercise: ExerciseFacts; from: string | null; cue: LocalizedText | null }[] = [];
  const changes: GenerationNote[] = [];
  let changed = 0;

  for (const item of seed.items) {
    const exercise = lookup.get(item.exerciseId);
    if (exercise && isSuitable(exercise, ctx)) {
      kept.push({ item, exercise, from: null, cue: copyCue(item.cue) });
      continue;
    }
    changed++;
    const substitute = exercise ? findSubstitute(exercise, lookup, ctx, taken) : null;
    if (!exercise || !substitute) {
      addNote(changes, 'dropped', { name: exercise ? pickLocale(exercise.name, ctx.locale) : item.exerciseId });
      continue;
    }
    taken.add(substitute.id);
    kept.push({ item: carryOver(item, exercise, substitute), exercise: substitute, from: exercise.id, cue: null });
    addNote(changes, 'substituted', { from: pickLocale(exercise.name, ctx.locale), to: pickLocale(substitute.name, ctx.locale) });
  }

  const notes: GenerationNote[] = [];
  if (minorOf(ctx)) addNote(notes, 'minor');
  if (ctx.ageBand === 'mature') addNote(notes, 'age_mature');
  if (ctx.ageBand === 'senior') addNote(notes, 'age_senior');
  for (const n of changes) addNote(notes, n.code, n.params);

  const available = kept.length >= READY_MIN_ITEMS && changed <= MAX_CHANGED_ITEMS;
  if (!available) return { available: false, items: [], notes, changed };

  const rpe = RPE_BY_LEVEL[seed.level];
  const items = kept.map((k) => toItem(k.exercise.id, capPrescription(designed(k.item, k.exercise, rpe), k.exercise, ctx), k.cue, k.from));
  return { available: true, items, notes, changed };
}

// ---------------------------------------------------------------- Sport blocks

/**
 * The block variants to try, in order. Older adults and people with a knee, ankle, hip or lower-back complaint start
 * with the low-impact block. Gear blocks are only ever offered in weights mode.
 */
export function sportVariantOrder(ctx: Pick<AdaptContext, 'ageBand' | 'injuries'>, mode: TrainingMode): SportBlockVariant[] {
  const gentleFirst = ctx.ageBand === 'senior' || ctx.injuries.some((i) => SPORT_JOINT_AREAS.includes(i));
  if (gentleFirst) return mode === 'weights' ? ['gentle', 'bodyweight', 'gear'] : ['gentle', 'bodyweight'];
  return mode === 'weights' ? ['gear', 'bodyweight', 'gentle'] : ['bodyweight', 'gentle'];
}

/** A block is used whole or not at all: one unsuitable exercise rules the whole block out. */
function blockIsSuitable(block: SportBlockSeed, lookup: ExerciseLookup, ctx: AdaptContext): boolean {
  return block.items.length > 0 && block.items.every((it) => {
    const e = lookup.get(it.exerciseId);
    return e != null && isSuitable(e, ctx);
  });
}

/**
 * Chooses the sport finisher for this person: the first variant in `sportVariantOrder` whose exercises are all
 * suitable. No suitable block means no finisher (never an unsafe one) and a note that says so.
 */
export function pickSportBlock(sport: SportId, blocks: readonly SportBlockSeed[], lookup: ExerciseLookup, ctx: AdaptContext, mode: TrainingMode): SportPick {
  const order = sportVariantOrder(ctx, mode);
  for (const variant of order) {
    const block = blocks.find((b) => b.sport === sport && b.variant === variant);
    if (!block || !blockIsSuitable(block, lookup, ctx)) continue;
    const notes: GenerationNote[] = [];
    if (variant === 'gentle' && order[0] !== 'gentle') addNote(notes, 'sport_gentle');
    const items = block.items.map((it) => {
      const e = lookup.get(it.exerciseId)!;
      return toItem(e.id, blockPrescription(it, e, ctx), copyCue(it.cue), null);
    });
    return { block, items, notes };
  }
  return { block: null, items: [], notes: [{ code: 'sport_none_fit', params: { sport } }] };
}
