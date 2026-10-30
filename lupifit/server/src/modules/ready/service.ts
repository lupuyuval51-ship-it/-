/**
 * Ready-made workouts, server side: the list and preview endpoints and the plan a session is started from.
 *
 * The data (workouts, sport blocks) is curated and shipped with the server; the exercises come from the database
 * copy of the library, so a workout can only ever name an exercise that exists. Everything that depends on the
 * person (age, minors, injuries, the gear they have) is decided by `adapt.ts`; this file loads the facts, calls the
 * pure helpers and shapes the answers.
 *
 * Nothing here is random and nothing is stored: the same person and the same query always give the same answer.
 */
import { ageBand, type AgeBand } from '@shared/age';
import {
  ADULT_AGE,
  type Difficulty,
  type Equipment,
  type InjuryArea,
  type Locale,
  type SportId,
  type TrainingLocation,
} from '@shared/constants';
import type { ReadyItemSeed, ReadyWorkoutSeed, SportBlockSeed } from '@shared/content';
import type { ReadyDetailQueryInput, ReadyListQueryInput } from '@shared/schemas/ready';
import type {
  GenerationNote,
  ReadyDetailResponse,
  ReadyItemDTO,
  ReadyListResponse,
  ReadyWorkoutSummaryDTO,
  SportBlockDTO,
} from '@shared/types';
import { READY_WORKOUTS } from '../../data/ready-workouts/index';
import { SPORT_BLOCKS } from '../../data/sport-blocks/index';
import type { Sql } from '../../db/pool';
import { conflict, notFound } from '../../lib/errors';
import { getExerciseMap, toExerciseSummary, type ExerciseRecord } from '../exercises/repository';
import { currentAge } from '../profile/repository';
import { adaptWorkout, pickSportBlock, type AdaptContext, type AdaptedItem, type AdaptedWorkout, type SportPick } from './adapt';
import { buildCatalog, countByFocus, filterCatalog, fitsPlaceAndGear, type CatalogEntry } from './catalog';
import {
  READY_WARMUP_MINUTES,
  blockSeconds,
  deriveEquipment,
  deriveMuscles,
  effectiveEquipment,
  totalSets,
  workoutMinutes,
  type ExerciseLookup,
} from './rules';
import { pickLocale } from './util';

/** The signed-in person as the ready workouts need them (the locale picks the language of names and notes). */
export interface ReadyUser {
  id: string;
  locale: Locale;
}

/** One exercise row of a session started from a ready workout. */
export interface ReadySessionRow {
  exerciseId: string;
  sets: number;
  repMin: number | null;
  repMax: number | null;
  targetSeconds: number | null;
  restSeconds: number;
  targetRpe: number | null;
  /** The coaching cue in the user's language, or ''. Stored as the exercise's note. */
  notes: string;
  /** The sport of the finisher block this row belongs to, or null for the main workout. */
  sport: SportId | null;
}

export interface PlannedReadySession {
  /** The workout name in the user's language. */
  name: string;
  /** Main workout first, then the sport block; the position of a row is its index. */
  rows: ReadySessionRow[];
}

/** What `POST /api/sessions` sends to start a ready workout (see `startReadyWorkoutFields`). */
export interface StartReadyInput {
  readyWorkoutId: string;
  sport?: SportId | undefined;
  location?: TrainingLocation | undefined;
  equipment?: Equipment[] | undefined;
}

// ---------------------------------------------------------------- Data (swappable for tests)

interface ReadyData {
  workouts: readonly ReadyWorkoutSeed[];
  blocks: readonly SportBlockSeed[];
}

let data: ReadyData = { workouts: READY_WORKOUTS, blocks: SPORT_BLOCKS };

/**
 * Tests only: serve these workouts and sport blocks instead of the shipped data. Returns the function that puts the
 * previous data back. Keep the same arrays between calls so the memoised catalog is reused.
 */
export function useReadyDataForTests(workouts: readonly ReadyWorkoutSeed[], blocks: readonly SportBlockSeed[]): () => void {
  const previous = data;
  data = { workouts, blocks };
  return () => {
    data = previous;
  };
}

// ---------------------------------------------------------------- The person

interface UserFacts {
  ageBand: AgeBand;
  isMinor: boolean;
  injuries: InjuryArea[];
  /** Exercises the person asked never to get (profile "avoid" list). */
  avoid: string[];
  /** Experience on record; only used to order the list. */
  experience: Difficulty | undefined;
}

/**
 * Age (from the age they gave and the day they gave it), injuries, the exercises they asked never to get and
 * experience, read the same way the plan generator and the progression rules read them. A person without a profile
 * is treated as an adult with no injuries, exactly as the generator does.
 */
async function loadFacts(sql: Sql, userId: string): Promise<UserFacts> {
  const row = await sql.maybeOne<{
    injuries: InjuryArea[] | null;
    avoid_exercise_ids: string[] | null;
    experience_level: Difficulty | null;
    age_years: number | null;
    age_recorded_on: string | null;
    timezone: string;
  }>(
    `SELECT p.injuries, p.avoid_exercise_ids, p.experience_level, p.age_years, p.age_recorded_on, u.timezone
       FROM users u LEFT JOIN profiles p ON p.user_id = u.id
      WHERE u.id = $1`,
    [userId],
  );
  const age = row ? currentAge(row) : null;
  return {
    ageBand: ageBand(age),
    isMinor: age != null && age < ADULT_AGE,
    injuries: row?.injuries ?? [],
    avoid: row?.avoid_exercise_ids ?? [],
    experience: row?.experience_level ?? undefined,
  };
}

const contextOf = (facts: UserFacts, user: ReadyUser, location: TrainingLocation, equipment: readonly Equipment[] | undefined): AdaptContext => ({
  ageBand: facts.ageBand,
  isMinor: facts.isMinor,
  injuries: facts.injuries,
  avoid: facts.avoid,
  equipment: effectiveEquipment(location, equipment),
  locale: user.locale,
});

// ---------------------------------------------------------------- Shaping

/** An adapted item as the seed shape the length / equipment helpers of `rules.ts` read. */
const seedItemOf = (it: AdaptedItem): ReadyItemSeed => ({
  exerciseId: it.exerciseId,
  sets: it.sets,
  restSeconds: it.restSeconds,
  ...(it.targetSeconds != null ? { seconds: it.targetSeconds } : {}),
  ...(it.repMin != null && it.repMax != null ? { reps: [it.repMin, it.repMax] as [number, number] } : {}),
});

/**
 * The card of a workout as THIS person will do it: equipment, muscles, sets and length come from the adapted items
 * (a swapped exercise or a longer rest changes them), not from the workout as designed.
 */
function summaryOf(entry: CatalogEntry, items: readonly AdaptedItem[], lookup: ExerciseLookup): ReadyWorkoutSummaryDTO {
  const seeds = items.map(seedItemOf);
  const w = entry.seed;
  return {
    id: entry.id,
    name: { en: w.name.en, he: w.name.he },
    description: { en: w.description.en, he: w.description.he },
    focus: w.focus,
    mode: w.mode,
    level: w.level,
    places: [...w.places],
    equipment: deriveEquipment(seeds, lookup),
    muscles: deriveMuscles(seeds, lookup),
    exerciseCount: seeds.length,
    totalSets: totalSets(seeds),
    estimatedMinutes: workoutMinutes(seeds, lookup),
  };
}

function itemDTO(it: AdaptedItem, exercises: ReadonlyMap<string, ExerciseRecord>): ReadyItemDTO {
  const exercise = exercises.get(it.exerciseId);
  // The adapted items only name exercises the lookup knows (unknown ones are dropped), so this cannot happen.
  if (!exercise) throw new Error(`Exercise ${it.exerciseId} is missing from the library`);
  return {
    exercise: toExerciseSummary(exercise),
    sets: it.sets,
    repMin: it.repMin,
    repMax: it.repMax,
    targetSeconds: it.targetSeconds,
    restSeconds: it.restSeconds,
    targetRpe: it.targetRpe,
    cue: it.cue ? { en: it.cue.en, he: it.cue.he } : null,
    substitutedFrom: it.substitutedFrom,
  };
}

function sportDTO(pick: SportPick, exercises: ReadonlyMap<string, ExerciseRecord>): SportBlockDTO | null {
  const block = pick.block;
  if (!block) return null;
  return {
    id: block.id,
    sport: block.sport,
    variant: block.variant,
    name: { en: block.name.en, he: block.name.he },
    description: { en: block.description.en, he: block.description.he },
    estimatedMinutes: Math.round(blockSeconds(pick.items.map(seedItemOf), exercises) / 60),
    items: pick.items.map((it) => itemDTO(it, exercises)),
  };
}

/** Notes in order, each code + params only once. */
function mergeNotes(...lists: readonly (readonly GenerationNote[])[]): GenerationNote[] {
  const seen = new Set<string>();
  const out: GenerationNote[] = [];
  for (const n of lists.flat()) {
    const key = n.code + JSON.stringify(n.params ?? {});
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(n);
  }
  return out;
}

// ---------------------------------------------------------------- List

/**
 * `GET /api/ready-workouts`. Filters by place, gear, mode, focus and level; every candidate is adapted to the person
 * and the ones that cannot be made safe for them are left out (and counted in `hiddenForSafety`).
 *
 * `maxMinutes` is checked against the length of the workout AS ADAPTED (a longer rest for an older adult counts),
 * so the list never shows a workout longer than the person asked for. Workouts that are hidden for safety have no
 * adapted length; their designed length is used to decide whether they would have matched.
 */
export async function listReady(sql: Sql, user: ReadyUser, query: ReadyListQueryInput): Promise<ReadyListResponse> {
  const lookup = await getExerciseMap();
  const facts = await loadFacts(sql, user.id);
  const ctx = contextOf(facts, user, query.location, query.equipment);

  const candidates = filterCatalog(buildCatalog(data.workouts, lookup), {
    location: query.location,
    equipment: query.equipment,
    mode: query.mode,
    level: query.level,
    experience: facts.experience,
  });

  const fits = (minutes: number) => query.maxMinutes == null || minutes <= query.maxMinutes;
  const available: { entry: CatalogEntry; summary: ReadyWorkoutSummaryDTO }[] = [];
  let hidden: CatalogEntry[] = [];
  for (const entry of candidates) {
    const adapted = adaptWorkout(entry.seed, lookup, ctx);
    if (!adapted.available) {
      if (fits(entry.minutes)) hidden.push(entry);
      continue;
    }
    const summary = summaryOf(entry, adapted.items, lookup);
    if (fits(summary.estimatedMinutes)) available.push({ entry, summary });
  }

  const matching = query.focus ? available.filter((x) => x.entry.seed.focus === query.focus) : available;
  if (query.focus) hidden = hidden.filter((e) => e.seed.focus === query.focus);

  const start = (query.page - 1) * query.pageSize;
  return {
    workouts: matching.slice(start, start + query.pageSize).map((x) => x.summary),
    total: matching.length,
    facets: countByFocus(available.map((x) => x.entry)),
    hiddenForSafety: hidden.length,
  };
}

// ---------------------------------------------------------------- One workout

interface Resolved {
  entry: CatalogEntry;
  exercises: ReadonlyMap<string, ExerciseRecord>;
  main: AdaptedWorkout;
  /** Present when a sport was asked; `pick.block` is null when no block is safe for this person. */
  sport: SportPick | null;
  notes: GenerationNote[];
}

/**
 * The workout for this person, place, gear and sport. The preview and the session start share this, so what is
 * shown is exactly what is started. Throws 404 for an unknown id and 409 `ready_workout_unavailable` when the
 * workout does not fit the place / gear or cannot be made safe for this person.
 */
async function resolve(
  sql: Sql,
  user: ReadyUser,
  id: string,
  options: { location: TrainingLocation; equipment: readonly Equipment[] | undefined; sport: SportId | undefined },
): Promise<Resolved> {
  const exercises = await getExerciseMap();
  const entry = buildCatalog(data.workouts, exercises).find((e) => e.id === id);
  if (!entry) throw notFound('ready_workout_not_found', 'Ready workout not found');
  if (!fitsPlaceAndGear(entry, options.location, options.equipment)) {
    throw conflict('ready_workout_unavailable', 'This workout does not fit the chosen place and equipment', { reason: 'place_or_equipment' });
  }

  const facts = await loadFacts(sql, user.id);
  const ctx = contextOf(facts, user, options.location, options.equipment);
  const main = adaptWorkout(entry.seed, exercises, ctx);
  if (!main.available) {
    throw conflict('ready_workout_unavailable', 'This workout cannot be made safe for you', { reason: 'safety' });
  }
  const sport = options.sport ? pickSportBlock(options.sport, data.blocks, exercises, ctx, entry.seed.mode) : null;
  return { entry, exercises, main, sport, notes: mergeNotes(main.notes, sport?.notes ?? []) };
}

/** `GET /api/ready-workouts/:id` */
export async function getReady(sql: Sql, user: ReadyUser, id: string, query: ReadyDetailQueryInput): Promise<ReadyDetailResponse> {
  const r = await resolve(sql, user, id, { location: query.location, equipment: query.equipment, sport: query.sport });
  const summary = summaryOf(r.entry, r.main.items, r.exercises);
  const sport = r.sport ? sportDTO(r.sport, r.exercises) : null;
  return {
    workout: {
      ...summary,
      warmupMinutes: READY_WARMUP_MINUTES,
      items: r.main.items.map((it) => itemDTO(it, r.exercises)),
      sport,
      totalMinutes: summary.estimatedMinutes + (sport?.estimatedMinutes ?? 0),
      notes: r.notes,
    },
  };
}

// ---------------------------------------------------------------- Starting a session

/**
 * The session a ready workout starts: its name and one row per exercise, main workout first, then the sport block
 * (when a sport was chosen and a block is safe for this person; otherwise the session simply has no finisher).
 * `sessions/service.ts` writes the rows. The location defaults to `home`, like the preview does.
 */
export async function planReadySession(sql: Sql, user: ReadyUser, input: StartReadyInput): Promise<PlannedReadySession> {
  const r = await resolve(sql, user, input.readyWorkoutId, { location: input.location ?? 'home', equipment: input.equipment, sport: input.sport });
  const rowOf = (it: AdaptedItem, sport: SportId | null): ReadySessionRow => ({
    exerciseId: it.exerciseId,
    sets: it.sets,
    repMin: it.repMin,
    repMax: it.repMax,
    targetSeconds: it.targetSeconds,
    restSeconds: it.restSeconds,
    targetRpe: it.targetRpe,
    notes: it.cue ? pickLocale(it.cue, user.locale) : '',
    sport,
  });
  const block = r.sport?.block ?? null;
  return {
    name: pickLocale(r.entry.seed.name, user.locale),
    rows: [...r.main.items.map((it) => rowOf(it, null)), ...(block && r.sport ? r.sport.items.map((it) => rowOf(it, block.sport)) : [])],
  };
}
