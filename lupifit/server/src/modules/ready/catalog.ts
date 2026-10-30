/**
 * The ready-workout catalog: the seeds plus everything that can be derived from them (equipment, muscles, length),
 * and the filter / sort the list endpoint uses. Pure: no I/O, no clock, no randomness.
 *
 * Safety for the individual user (injuries, age) is NOT decided here; see `adapt.ts`. This file only answers
 * "does this workout fit the place, the gear and the filters the person picked".
 */
import {
  DIFFICULTIES,
  type Difficulty,
  type Equipment,
  type Muscle,
  type ReadyFocus,
  type TrainingLocation,
  type TrainingMode,
} from '@shared/constants';
import type { ReadyWorkoutSeed } from '@shared/content';
import { compareIds } from './util';
import { deriveEquipment, deriveMuscles, effectiveEquipment, totalSets, workoutMinutes, type ExerciseLookup } from './rules';

export interface CatalogEntry {
  id: string;
  seed: ReadyWorkoutSeed;
  /** Everything the workout needs, derived from its exercises (empty = nothing but your body). */
  equipment: readonly Equipment[];
  /** Muscles trained most, by share of sets (at most 4). */
  muscles: readonly Muscle[];
  totalSets: number;
  exerciseCount: number;
  /** Warm-up included. */
  minutes: number;
}

/** Entries are shared between callers (memoised), so they are frozen. */
const memo = new WeakMap<readonly ReadyWorkoutSeed[], WeakMap<ExerciseLookup, readonly CatalogEntry[]>>();

/**
 * Derives the catalog from the seeds. Memoised per (seeds, lookup) identity: pass the same array and the same
 * lookup and you get the same result object back (do not mutate either afterwards).
 *
 * A workout that names an exercise the lookup does not know is left out: its equipment and length cannot be
 * derived, and guessing "no equipment needed" would offer it to people who cannot do it.
 */
export function buildCatalog(seeds: readonly ReadyWorkoutSeed[], lookup: ExerciseLookup): readonly CatalogEntry[] {
  let byLookup = memo.get(seeds);
  const cached = byLookup?.get(lookup);
  if (cached) return cached;

  const entries: CatalogEntry[] = [];
  for (const seed of seeds) {
    if (!seed.items.length || seed.items.some((it) => !lookup.has(it.exerciseId))) continue;
    entries.push(
      Object.freeze({
        id: seed.id,
        seed,
        equipment: Object.freeze(deriveEquipment(seed.items, lookup)),
        muscles: Object.freeze(deriveMuscles(seed.items, lookup)),
        totalSets: totalSets(seed.items),
        exerciseCount: seed.items.length,
        minutes: workoutMinutes(seed.items, lookup),
      }),
    );
  }
  const result: readonly CatalogEntry[] = Object.freeze(entries);
  if (!byLookup) {
    byLookup = new WeakMap();
    memo.set(seeds, byLookup);
  }
  byLookup.set(lookup, result);
  return result;
}

export interface CatalogFilter {
  location: TrainingLocation;
  /** Gear the person ticked (home / park). `undefined` = the location's default gear. Ignored at the gym (everything is there). */
  equipment?: readonly Equipment[] | undefined;
  mode?: TrainingMode | undefined;
  focus?: ReadyFocus | undefined;
  level?: Difficulty | undefined;
  /** Longest main workout (warm-up included), inclusive. */
  maxMinutes?: number | undefined;
  /** The person's experience. Only used for ordering the result, never for filtering. */
  experience?: Difficulty | undefined;
}

/** Does the entry fit the place and the gear? (No mode / focus / level / length checks.) */
export function fitsPlaceAndGear(entry: CatalogEntry, location: TrainingLocation, equipment: readonly Equipment[] | undefined): boolean {
  return fits(entry, location, new Set(effectiveEquipment(location, equipment)));
}

const fits = (entry: CatalogEntry, location: TrainingLocation, have: ReadonlySet<Equipment>) =>
  entry.seed.places.includes(location) && entry.equipment.every((q) => have.has(q));

const rank = (d: Difficulty) => DIFFICULTIES.indexOf(d);

/**
 * Order of the list: the person's own level first, then the closest levels, then the workouts that need the least
 * gear, then the id. Total and locale-independent, so the same input always gives the same order.
 */
export function compareEntries(experience?: Difficulty): (a: CatalogEntry, b: CatalogEntry) => number {
  const distance = (e: CatalogEntry) => (experience ? Math.abs(rank(e.seed.level) - rank(experience)) : 0);
  return (a, b) => distance(a) - distance(b) || a.equipment.length - b.equipment.length || compareIds(a.id, b.id);
}

/** Filters the entries and returns them in list order. The input is not modified. */
export function filterCatalog(entries: readonly CatalogEntry[], filter: CatalogFilter): CatalogEntry[] {
  const have = new Set(effectiveEquipment(filter.location, filter.equipment));
  const out = entries.filter((e) => {
    if (!fits(e, filter.location, have)) return false;
    if (filter.mode && e.seed.mode !== filter.mode) return false;
    if (filter.focus && e.seed.focus !== filter.focus) return false;
    if (filter.level && e.seed.level !== filter.level) return false;
    if (filter.maxMinutes != null && e.minutes > filter.maxMinutes) return false;
    return true;
  });
  return out.sort(compareEntries(filter.experience));
}

/** Entries per focus (only focuses that have at least one), for the filter chips. */
export function countByFocus(entries: Iterable<Pick<CatalogEntry, 'seed'>>): Partial<Record<ReadyFocus, number>> {
  const out: Partial<Record<ReadyFocus, number>> = {};
  for (const e of entries) out[e.seed.focus] = (out[e.seed.focus] ?? 0) + 1;
  return out;
}
