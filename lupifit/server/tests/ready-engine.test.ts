/**
 * Ready workouts, engine part: catalog derivation / filtering / sorting and the safety layer (injuries, minors, older
 * adults, sport finisher choice). Pure: fixtures are built from the original 119 exercises of the library (and a few
 * synthetic ones where an exact search order must be pinned down); nothing here depends on the shipped workout data.
 *
 * Every rule of the engine has an assertion here that fails when the rule is removed.
 */
import { describe, expect, it } from 'vitest';
import { ageRules, isExternallyLoaded, isHighImpact, type AgeBand } from '@shared/age';
import { INJURY_AREAS, SPORTS, type Equipment, type InjuryArea } from '@shared/constants';
import type { ReadyItemSeed, ReadyWorkoutSeed, SportBlockSeed } from '@shared/content';
import { EXERCISE_LIBRARY } from '../src/data/exercises/index';
import {
  READY_NOTE_CODES,
  RPE_BY_LEVEL,
  SPORT_BLOCK_RPE,
  adaptWorkout,
  capPrescription,
  findSubstitute,
  isSuitable,
  pickSportBlock,
  sportVariantOrder,
  unsuitableReasons,
  type AdaptContext,
} from '../src/modules/ready/adapt';
import { buildCatalog, compareEntries, countByFocus, filterCatalog, fitsPlaceAndGear } from '../src/modules/ready/catalog';
import {
  RESISTANCE_GEAR,
  deriveEquipment,
  deriveMuscles,
  effectiveEquipment,
  lookupOf,
  totalSets,
  workoutMinutes,
  type ExerciseFacts,
} from '../src/modules/ready/rules';
import { compareIds } from '../src/modules/ready/util';

// ---------------------------------------------------------------- Fixtures

/** The library before the *_extra files were appended (the extras are written by other people while this runs). */
const ORIGINAL = EXERCISE_LIBRARY.slice(0, 119);
const lookup = lookupOf(ORIGINAL);
const GYM = effectiveEquipment('gym', undefined);
const NONE: Equipment[] = [];

const reps = (exerciseId: string, sets = 3, r: [number, number] = [8, 12], restSeconds = 60, cue?: ReadyItemSeed['cue']): ReadyItemSeed =>
  cue ? { exerciseId, sets, reps: r, restSeconds, cue } : { exerciseId, sets, reps: r, restSeconds };
const hold = (exerciseId: string, seconds = 30, sets = 3, restSeconds = 45): ReadyItemSeed => ({ exerciseId, sets, seconds, restSeconds });

/** Exercises with no equipment, no contraindication, beginner and low impact: safe filler for any person and any gear. */
const FILLER = ['glute_bridge', 'dead_bug', 'bird_dog', 'box_squat'];
const filler = (n: number): ReadyItemSeed[] => FILLER.slice(0, n).map((id) => reps(id));

const seed = (id: string, over: Partial<ReadyWorkoutSeed> = {}): ReadyWorkoutSeed => ({
  id,
  name: { en: `Workout ${id}`, he: `אימון ${id}` },
  description: { en: 'A fixture workout for the engine tests.', he: 'אימון לדוגמה לבדיקות המנוע.' },
  focus: 'chest',
  mode: 'bodyweight',
  level: 'beginner',
  places: ['home', 'outdoor', 'gym'],
  items: [reps('incline_push_up'), reps('knee_push_up'), reps('push_up', 3, [6, 10]), hold('plank')],
  ...over,
});

const ctxOf = (over: Partial<AdaptContext> = {}): AdaptContext => ({ ageBand: 'adult', isMinor: false, injuries: [], equipment: GYM, locale: 'en', ...over });
const MINOR: Partial<AdaptContext> = { ageBand: 'minor', isMinor: true };
const MATURE: Partial<AdaptContext> = { ageBand: 'mature' };
const SENIOR: Partial<AdaptContext> = { ageBand: 'senior' };

const byId = (items: { exerciseId: string }[]) => items.map((i) => i.exerciseId);
const adapt = (w: ReadyWorkoutSeed, c: AdaptContext = ctxOf()) => adaptWorkout(w, lookup, c);
const noteCodes = (notes: { code: string }[]) => notes.map((n) => n.code);
const nameEn = (id: string) => lookup.get(id)!.name.en;

const HEBREW = /[֐-׿]/;

// ---------------------------------------------------------------- Catalog

describe('catalog derivation', () => {
  const w = seed('derive', {
    focus: 'legs',
    mode: 'weights',
    level: 'intermediate',
    items: [reps('goblet_squat', 3, [8, 12]), reps('dumbbell_romanian_deadlift', 4), reps('walking_lunge', 2), hold('wall_sit', 40)],
  });

  it('derives equipment, muscles, sets, count and minutes from the exercises, never from typed values', () => {
    const [entry] = buildCatalog([w], lookup);
    expect(entry!.id).toBe('derive');
    expect(entry!.seed).toBe(w);
    expect(entry!.equipment).toEqual(deriveEquipment(w.items, lookup));
    expect(entry!.equipment).toEqual(['dumbbells']);
    expect(entry!.muscles).toEqual(deriveMuscles(w.items, lookup));
    expect(entry!.totalSets).toBe(totalSets(w.items));
    expect(entry!.totalSets).toBe(12);
    expect(entry!.exerciseCount).toBe(4);
    expect(entry!.minutes).toBe(workoutMinutes(w.items, lookup));
    expect(entry!.minutes).toBeGreaterThan(6);
  });

  it('is memoised per (seeds, lookup) identity', () => {
    const seeds = [w];
    const a = buildCatalog(seeds, lookup);
    expect(buildCatalog(seeds, lookup)).toBe(a);
    expect(buildCatalog([w], lookup)).not.toBe(a);
    expect(buildCatalog(seeds, lookupOf(ORIGINAL))).not.toBe(a);
    expect(buildCatalog(seeds, lookupOf(ORIGINAL))[0]!.equipment).toEqual(a[0]!.equipment);
  });

  it('follows the exercise data of the lookup it is given', () => {
    const noDumbbells = lookupOf(ORIGINAL.map((e) => (e.id === 'goblet_squat' ? { ...e, equipment: ['kettlebell' as const] } : e)));
    expect(buildCatalog([w], noDumbbells)[0]!.equipment).toEqual(['dumbbells', 'kettlebell']);
  });

  it('leaves out a workout that names an exercise nobody knows, instead of offering it as "no equipment"', () => {
    const broken = seed('broken', { items: [...seed('x').items, reps('no_such_exercise')] });
    const empty = seed('empty', { items: [] });
    const entries = buildCatalog([seed('ok'), broken, empty], lookup);
    expect(entries.map((e) => e.id)).toEqual(['ok']);
  });

  it('hands out frozen, shared entries so one caller cannot corrupt another', () => {
    const entries = buildCatalog([w], lookup);
    expect(Object.isFrozen(entries)).toBe(true);
    expect(Object.isFrozen(entries[0])).toBe(true);
    expect(Object.isFrozen(entries[0]!.equipment)).toBe(true);
  });
});

describe('catalog filtering', () => {
  const bwChest = seed('bw_chest');
  const parkOnly = seed('park_only', { places: ['outdoor'] });
  const gymBarbell = seed('gym_barbell', {
    places: ['gym'],
    mode: 'weights',
    level: 'advanced',
    focus: 'legs',
    items: [reps('barbell_back_squat', 3, [5, 8]), reps('deadlift', 3, [5, 8]), reps('barbell_hip_thrust', 3, [8, 10]), reps('lying_leg_curl')],
  });
  const dumbbells = seed('db_home', {
    mode: 'weights',
    level: 'intermediate',
    focus: 'legs',
    items: [reps('goblet_squat'), reps('dumbbell_romanian_deadlift'), reps('dumbbell_reverse_lunge'), reps('dumbbell_shoulder_press')],
  });
  const dumbbellBench = seed('db_bench', {
    mode: 'weights',
    level: 'intermediate',
    items: [reps('dumbbell_bench_press'), reps('incline_dumbbell_press'), reps('dumbbell_fly'), reps('one_arm_dumbbell_row')],
  });
  const pullAnywhere = seed('pull_anywhere', {
    focus: 'back',
    level: 'intermediate',
    items: [reps('pull_up', 3, [4, 8]), reps('negative_pull_up', 3, [3, 5]), reps('hanging_knee_raise'), reps('chin_up', 3, [3, 6])],
  });
  const parkPull = seed('park_pull', {
    focus: 'back',
    level: 'intermediate',
    places: ['outdoor', 'gym'],
    items: [reps('pull_up', 3, [4, 8]), reps('inverted_row'), reps('negative_pull_up', 3, [3, 5]), reps('hanging_knee_raise')],
  });
  const all = buildCatalog([bwChest, parkOnly, gymBarbell, dumbbells, dumbbellBench, pullAnywhere, parkPull], lookup);
  const ids = (list: { id: string }[]) => list.map((e) => e.id).sort();

  it('derived fixtures need what we expect (guards the tests below)', () => {
    const e = (id: string) => all.find((x) => x.id === id)!;
    expect(e('bw_chest').equipment).toEqual([]);
    expect(e('db_home').equipment).toEqual(['dumbbells']);
    expect(e('db_bench').equipment).toEqual(['dumbbells', 'bench']);
    expect(e('pull_anywhere').equipment).toEqual(['pull_up_bar']);
    expect(e('park_pull').equipment).toEqual(['pull_up_bar', 'dip_bars']);
    expect(e('gym_barbell').equipment).toEqual(['barbell', 'squat_rack', 'bench', 'leg_curl_machine']);
  });

  it('keeps only workouts that list the place', () => {
    expect(ids(filterCatalog(all, { location: 'home' }))).toEqual(['bw_chest']);
    // park_only needs no gear but is a park-only workout
    expect(ids(filterCatalog(all, { location: 'outdoor' }))).toEqual(['bw_chest', 'park_only', 'park_pull', 'pull_anywhere']);
    expect(ids(filterCatalog(all, { location: 'outdoor', equipment: ['pull_up_bar', 'dip_bars', 'dumbbells', 'bench'] }))).toContain('db_bench');
    expect(ids(filterCatalog(all, { location: 'home' }))).not.toContain('park_only');
    expect(ids(filterCatalog(all, { location: 'gym' }))).not.toContain('park_only');
  });

  it('requires every piece of gear the workout needs, from what the person ticked', () => {
    expect(ids(filterCatalog(all, { location: 'home', equipment: ['dumbbells'] }))).toEqual(['bw_chest', 'db_home']);
    // dumbbells alone is not enough for dumbbells + bench
    expect(ids(filterCatalog(all, { location: 'home', equipment: ['dumbbells'] }))).not.toContain('db_bench');
    expect(ids(filterCatalog(all, { location: 'home', equipment: ['dumbbells', 'bench'] }))).toEqual(['bw_chest', 'db_bench', 'db_home']);
    expect(ids(filterCatalog(all, { location: 'home', equipment: ['pull_up_bar'] }))).toEqual(['bw_chest', 'pull_anywhere']);
    // a duplicated tick changes nothing
    expect(ids(filterCatalog(all, { location: 'home', equipment: ['dumbbells', 'dumbbells'] }))).toEqual(['bw_chest', 'db_home']);
  });

  it('uses the default gear of the place when no equipment is given', () => {
    // park: pull-up bar + dip bars are built in
    expect(ids(filterCatalog(all, { location: 'outdoor' }))).toContain('park_pull');
    expect(ids(filterCatalog(all, { location: 'outdoor', equipment: undefined }))).toContain('pull_anywhere');
    // an explicit empty list means "I brought nothing" and is different from "not given" in the park
    expect(ids(filterCatalog(all, { location: 'outdoor', equipment: [] }))).toEqual(['bw_chest', 'park_only']);
    // home: nothing is assumed
    expect(ids(filterCatalog(all, { location: 'home', equipment: undefined }))).toEqual(['bw_chest']);
  });

  it('assumes the whole gym at the gym and ignores what was ticked there', () => {
    const atGym = ids(filterCatalog(all, { location: 'gym', equipment: [] }));
    expect(atGym).toEqual(['bw_chest', 'db_bench', 'db_home', 'gym_barbell', 'park_pull', 'pull_anywhere']);
    expect(ids(filterCatalog(all, { location: 'gym', equipment: ['dumbbells'] }))).toEqual(atGym);
    expect(ids(filterCatalog(all, { location: 'gym' }))).toEqual(atGym);
    // ...but a gym-only workout is not offered at home even with the same gear ticked
    expect(ids(filterCatalog(all, { location: 'home', equipment: ['barbell', 'squat_rack', 'bench', 'leg_curl_machine'] }))).not.toContain('gym_barbell');
  });

  it('filters by mode, focus and level exactly', () => {
    const gym = (extra: object) => ids(filterCatalog(all, { location: 'gym', ...extra }));
    expect(gym({ mode: 'weights' })).toEqual(['db_bench', 'db_home', 'gym_barbell']);
    expect(gym({ mode: 'bodyweight' })).toEqual(['bw_chest', 'park_pull', 'pull_anywhere']);
    expect(gym({ focus: 'legs' })).toEqual(['db_home', 'gym_barbell']);
    expect(gym({ focus: 'back' })).toEqual(['park_pull', 'pull_anywhere']);
    expect(gym({ focus: 'cardio' })).toEqual([]);
    expect(gym({ level: 'advanced' })).toEqual(['gym_barbell']);
    expect(gym({ level: 'beginner' })).toEqual(['bw_chest']);
    expect(gym({ mode: 'weights', focus: 'legs', level: 'intermediate' })).toEqual(['db_home']);
  });

  it('applies the length limit inclusively', () => {
    const entry = all.find((e) => e.id === 'db_home')!;
    const gym = (maxMinutes: number) => ids(filterCatalog(all, { location: 'gym', maxMinutes }));
    expect(gym(entry.minutes)).toContain('db_home');
    expect(gym(entry.minutes - 1)).not.toContain('db_home');
    expect(gym(1)).toEqual([]);
    expect(gym(500)).toHaveLength(6);
    expect(filterCatalog(all, { location: 'gym', maxMinutes: undefined })).toHaveLength(6);
  });

  it('answers the same as fitsPlaceAndGear for the place and gear part', () => {
    for (const e of all) {
      for (const location of ['gym', 'home', 'outdoor'] as const) {
        for (const equipment of [undefined, [], ['dumbbells'], ['pull_up_bar', 'dip_bars']] as (Equipment[] | undefined)[]) {
          const listed = filterCatalog(all, { location, equipment }).some((x) => x.id === e.id);
          expect(listed).toBe(fitsPlaceAndGear(e, location, equipment));
        }
      }
    }
  });

  it('counts workouts per focus, only for focuses that have any', () => {
    expect(countByFocus(all)).toEqual({ chest: 3, legs: 2, back: 2 });
    expect(countByFocus([])).toEqual({});
  });
});

describe('catalog ordering', () => {
  const mk = (id: string, level: ReadyWorkoutSeed['level'], withGear = false) =>
    seed(id, {
      level,
      ...(withGear ? { mode: 'weights' as const, items: [reps('goblet_squat'), reps('dumbbell_curl'), reps('hammer_curl'), reps('dumbbell_shrug')] } : {}),
    });
  const make = (list: ReadyWorkoutSeed[]) => buildCatalog(list, lookup);
  const order = (list: ReadyWorkoutSeed[], experience?: ReadyWorkoutSeed['level']) =>
    filterCatalog(make(list), { location: 'gym', experience }).map((e) => e.id);

  it('puts the exact level of the person first, then the nearest levels', () => {
    const list = [mk('a_adv', 'advanced'), mk('b_beg', 'beginner'), mk('c_int', 'intermediate')];
    expect(order(list, 'beginner')).toEqual(['b_beg', 'c_int', 'a_adv']);
    expect(order(list, 'advanced')).toEqual(['a_adv', 'c_int', 'b_beg']);
    expect(order(list, 'intermediate')[0]).toBe('c_int');
    // distance, not an "easier first" rule: an advanced person sees intermediate before beginner
    expect(order([mk('z_beg', 'beginner'), mk('y_int', 'intermediate')], 'advanced')).toEqual(['y_int', 'z_beg']);
  });

  it('breaks level ties by the gear needed (less first), then by id', () => {
    const list = [mk('a_geared', 'beginner', true), mk('z_bare', 'beginner'), mk('m_bare', 'beginner')];
    expect(order(list, 'beginner')).toEqual(['m_bare', 'z_bare', 'a_geared']);
    // equal distance on both sides of the level: gear decides before the id
    expect(order([mk('a_adv_geared', 'advanced', true), mk('z_beg_bare', 'beginner')], 'intermediate')).toEqual(['z_beg_bare', 'a_adv_geared']);
  });

  it('does not rank levels when the person has no experience on record', () => {
    const list = [mk('c_adv', 'advanced'), mk('a_beg', 'beginner', true), mk('b_int', 'intermediate')];
    expect(order(list, undefined)).toEqual(['b_int', 'c_adv', 'a_beg']);
  });

  it('orders ids by code unit, never by the locale', () => {
    const list = [mk('a_x', 'beginner'), mk('B_x', 'beginner'), mk('a_b', 'beginner')];
    expect(order(list, 'beginner')).toEqual(['B_x', 'a_b', 'a_x']);
    expect(compareIds('B', 'a')).toBeLessThan(0);
    expect('B'.localeCompare('a')).toBeGreaterThan(0);
    expect(compareIds('a', 'a')).toBe(0);
  });

  it('is deterministic whatever order the data arrives in, and never reorders its input', () => {
    const list = [
      mk('e_beg', 'beginner'), mk('d_int_gear', 'intermediate', true), mk('c_adv', 'advanced'), mk('b_int', 'intermediate'),
      mk('a_beg_gear', 'beginner', true), mk('f_adv_gear', 'advanced', true), mk('g_int', 'intermediate'),
    ];
    const entries = make(list);
    const before = entries.map((e) => e.id);
    const reference = filterCatalog(entries, { location: 'gym', experience: 'intermediate' }).map((e) => e.id);
    let state = 12345;
    const next = () => ((state = (state * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    for (let round = 0; round < 25; round++) {
      const shuffled = [...list].sort(() => next() - 0.5);
      expect(order(shuffled, 'intermediate')).toEqual(reference);
    }
    expect(entries.map((e) => e.id)).toEqual(before);
    // intermediate first (no gear before gear), then the beginner / advanced tie by gear and id, geared ones last
    expect(reference).toEqual(['b_int', 'g_int', 'd_int_gear', 'c_adv', 'e_beg', 'a_beg_gear', 'f_adv_gear']);
    const cmp = compareEntries('intermediate');
    const [x, y] = [entries[0]!, entries[1]!];
    expect(Math.sign(cmp(x, y))).toBe(-Math.sign(cmp(y, x)));
    expect(cmp(x, x)).toBe(0);
  });
});

// ---------------------------------------------------------------- Suitability

describe('unsuitable exercises', () => {
  const e = (id: string) => lookup.get(id)!;

  it('flags missing equipment (all of it must be there)', () => {
    expect(unsuitableReasons(e('dumbbell_bench_press'), ctxOf({ equipment: ['dumbbells', 'bench'] }))).toEqual([]);
    expect(unsuitableReasons(e('dumbbell_bench_press'), ctxOf({ equipment: ['dumbbells'] }))).toEqual(['equipment']);
    expect(unsuitableReasons(e('dumbbell_bench_press'), ctxOf({ equipment: NONE }))).toEqual(['equipment']);
    expect(unsuitableReasons(e('push_up'), ctxOf({ equipment: NONE }))).toEqual([]);
    expect(isSuitable(e('barbell_back_squat'), ctxOf({ equipment: GYM }))).toBe(true);
  });

  it('flags a contraindication that matches any reported injury, and only those', () => {
    expect(unsuitableReasons(e('push_up'), ctxOf({ injuries: ['wrist'] }))).toEqual(['injury']);
    expect(unsuitableReasons(e('push_up'), ctxOf({ injuries: ['knee', 'ankle'] }))).toEqual([]);
    expect(unsuitableReasons(e('barbell_back_squat'), ctxOf({ injuries: ['lower_back'] }))).toEqual(['injury']);
    expect(unsuitableReasons(e('barbell_back_squat'), ctxOf({ injuries: ['neck', 'lower_back'] }))).toEqual(['injury']);
    for (const area of INJURY_AREAS) {
      for (const ex of ORIGINAL) expect(unsuitableReasons(ex, ctxOf({ injuries: [area] })).includes('injury')).toBe(ex.contraindications.includes(area));
    }
  });

  it('removes advanced exercises for minors and for 65+, not for adults or the 50-64 band', () => {
    const archer = e('archer_push_up');
    expect(archer.difficulty).toBe('advanced');
    expect(unsuitableReasons(archer, ctxOf(MINOR))).toEqual(['advanced']);
    expect(unsuitableReasons(archer, ctxOf(SENIOR))).toEqual(['advanced']);
    expect(unsuitableReasons(archer, ctxOf())).toEqual([]);
    expect(unsuitableReasons(archer, ctxOf(MATURE))).toEqual([]);
    expect(unsuitableReasons(e('pull_up'), ctxOf(MINOR))).toEqual([]);
    // the minor flag alone, and the minor band alone, are both enough
    expect(unsuitableReasons(archer, ctxOf({ isMinor: true }))).toEqual(['advanced']);
    expect(unsuitableReasons(archer, ctxOf({ ageBand: 'minor' }))).toEqual(['advanced']);
  });

  it('removes jumping and other high-impact exercises from 65 only', () => {
    for (const id of ['jump_squat', 'box_jump', 'burpee', 'jumping_jack', 'jump_rope_skipping', 'high_knees']) {
      expect(isHighImpact(e(id))).toBe(true);
      expect(unsuitableReasons(e(id), ctxOf(SENIOR))).toContain('high_impact');
      expect(unsuitableReasons(e(id), ctxOf()).includes('high_impact')).toBe(false);
      expect(unsuitableReasons(e(id), ctxOf(MATURE)).includes('high_impact')).toBe(false);
      expect(unsuitableReasons(e(id), ctxOf(MINOR)).includes('high_impact')).toBe(false);
    }
    expect(unsuitableReasons(e('brisk_walk_jog'), ctxOf(SENIOR))).toEqual([]);
  });

  it('reports every reason at once', () => {
    expect(unsuitableReasons(e('sprint_intervals'), ctxOf({ ...SENIOR, injuries: ['knee'] }))).toEqual(['injury', 'advanced', 'high_impact']);
    expect(unsuitableReasons(e('front_squat'), ctxOf({ ...MINOR, injuries: ['wrist'], equipment: NONE }))).toEqual(['equipment', 'injury', 'advanced']);
    expect(unsuitableReasons(e('front_squat'), ctxOf({ ...MINOR, injuries: ['wrist'], equipment: NONE, avoid: ['front_squat'] }))).toEqual(['equipment', 'injury', 'advanced', 'avoided']);
  });

  it('flags an exercise the person asked never to get (the profile avoid list), and only that one', () => {
    expect(unsuitableReasons(e('push_up'), ctxOf({ avoid: ['push_up'] }))).toEqual(['avoided']);
    expect(unsuitableReasons(e('push_up'), ctxOf({ avoid: ['pull_up', 'plank'] }))).toEqual([]);
    expect(unsuitableReasons(e('push_up'), ctxOf({ avoid: [] }))).toEqual([]);
    expect(unsuitableReasons(e('push_up'), ctxOf())).toEqual([]);
    expect(isSuitable(e('push_up'), ctxOf({ avoid: ['push_up'] }))).toBe(false);
  });
});

// ---------------------------------------------------------------- Substitution

describe('finding a substitute', () => {
  const syn = (id: string, over: Partial<ExerciseFacts> = {}): ExerciseFacts => ({
    id,
    name: { en: `Move ${id}`, he: `תנועה ${id}` },
    primaryMuscles: ['chest'],
    secondaryMuscles: [],
    equipment: [],
    category: 'bodyweight',
    movementPattern: 'horizontal_push',
    difficulty: 'beginner',
    trackingType: 'reps',
    unilateral: false,
    isCompound: true,
    contraindications: [],
    easierAlternatives: [],
    harderAlternatives: [],
    ...over,
  });
  /** `bad` exercises are contraindicated for the knee, which the context reports. */
  const bad = (id: string, easier: string[], over: Partial<ExerciseFacts> = {}) => syn(id, { contraindications: ['knee'], easierAlternatives: easier, ...over });
  const knee = ctxOf({ injuries: ['knee'] });
  const find = (list: ExerciseFacts[], from: string, ctx = knee, taken: string[] = []) => findSubstitute(list.find((x) => x.id === from)!, lookupOf(list), ctx, new Set(taken))?.id ?? null;

  it('searches breadth first: a nearer suitable alternative beats a deeper one that is listed earlier', () => {
    const list = [bad('o', ['u', 's1']), bad('u', ['s2']), syn('s1'), syn('s2')];
    expect(find(list, 'o')).toBe('s1');
  });

  it('takes the first one in listed order within a level', () => {
    expect(find([bad('o', ['s_b', 's_a']), syn('s_a'), syn('s_b')], 'o')).toBe('s_b');
    // listed order of the parents decides on the next level
    const list = [bad('o', ['u1', 'u2']), bad('u1', ['s_x']), bad('u2', ['s_y']), syn('s_x'), syn('s_y')];
    expect(find(list, 'o')).toBe('s_x');
    expect(find([bad('o', ['u2', 'u1']), ...list.slice(1)], 'o')).toBe('s_y');
  });

  it('follows chains of easier alternatives up to three steps and no further', () => {
    const three = [bad('o', ['u1']), bad('u1', ['u2']), bad('u2', ['s3']), syn('s3')];
    expect(find(three, 'o')).toBe('s3');
    const four = [bad('o', ['u1']), bad('u1', ['u2']), bad('u2', ['u3']), bad('u3', ['s4']), syn('s4')];
    expect(find(four, 'o')).toBeNull();
  });

  it('only accepts an alternative that works at least one of the same primary muscles, but walks through the others', () => {
    const list = [bad('o', ['other', 'chest_alt']), syn('other', { primaryMuscles: ['lats'], easierAlternatives: ['deep'] }), syn('chest_alt', { primaryMuscles: ['lats', 'chest'] }), syn('deep')];
    expect(find(list, 'o')).toBe('chest_alt');
    const onlyOther = [bad('o', ['other']), syn('other', { primaryMuscles: ['lats'], easierAlternatives: ['deep'] }), syn('deep', { primaryMuscles: ['chest'] })];
    expect(find(onlyOther, 'o')).toBe('deep');
    expect(find([bad('o', ['other']), syn('other', { primaryMuscles: ['lats'] })], 'o')).toBeNull();
    // secondary muscles do not count
    expect(find([bad('o', ['other']), syn('other', { primaryMuscles: ['lats'], secondaryMuscles: ['chest'] })], 'o')).toBeNull();
  });

  it('never picks an exercise already in the workout', () => {
    const list = [bad('o', ['s1', 's2']), syn('s1'), syn('s2')];
    expect(find(list, 'o', knee, ['s1'])).toBe('s2');
    expect(find(list, 'o', knee, ['s1', 's2'])).toBeNull();
    // ...but still walks through it: its own easier alternatives may be fine
    expect(find([bad('o', ['t']), syn('t', { easierAlternatives: ['s_deep'] }), syn('s_deep')], 'o', knee, ['t'])).toBe('s_deep');
  });

  it('never picks something the person should not do either', () => {
    const base = (alt: Partial<ExerciseFacts>) => [bad('o', ['alt']), syn('alt', alt)];
    expect(find(base({ contraindications: ['knee'] }), 'o')).toBeNull();
    expect(find(base({ equipment: ['kettlebell'] }), 'o', ctxOf({ injuries: ['knee'], equipment: NONE }))).toBeNull();
    expect(find(base({ equipment: ['kettlebell'] }), 'o', ctxOf({ injuries: ['knee'], equipment: ['kettlebell'] }))).toBe('alt');
    expect(find(base({ difficulty: 'advanced' }), 'o', ctxOf({ ...MINOR, injuries: ['knee'] }))).toBeNull();
    expect(find(base({ category: 'plyometric', movementPattern: 'jump' }), 'o', ctxOf({ ...SENIOR, injuries: ['knee'] }))).toBeNull();
    expect(find(base({ category: 'plyometric', movementPattern: 'jump' }), 'o', ctxOf({ injuries: ['knee'] }))).toBe('alt');
  });

  it('never makes the exercise harder than the one it replaces', () => {
    const list = [bad('o', ['hard', 'ok'], { difficulty: 'intermediate' }), syn('hard', { difficulty: 'advanced' }), syn('ok', { difficulty: 'intermediate' })];
    expect(find(list, 'o')).toBe('ok');
    expect(find([bad('o', ['hard']), syn('hard', { difficulty: 'intermediate' })], 'o')).toBeNull();
  });

  it('keeps a bodyweight workout bodyweight: no loaded exercise and no resistance gear as the substitute', () => {
    const loaded = syn('loaded', { category: 'free_weight', trackingType: 'weight_reps', equipment: ['dumbbells'] });
    const banded = syn('banded', { category: 'calisthenics', equipment: ['resistance_bands'] });
    const list = [bad('o', ['loaded', 'banded', 'ok']), loaded, banded, syn('ok')];
    const has = ctxOf({ injuries: ['knee'], equipment: ['dumbbells', 'resistance_bands'] });
    const pickFor = (mode?: 'bodyweight' | 'weights') => findSubstitute(list[0]!, lookupOf(list), has, new Set(['o']), mode)?.id ?? null;
    expect(pickFor('bodyweight')).toBe('ok');
    expect(pickFor('weights')).toBe('loaded');
    expect(pickFor()).toBe('loaded');
    // a loaded alternative is walked through: its own easier alternative may be a bodyweight one
    const deep = [bad('o', ['loaded']), { ...loaded, easierAlternatives: ['ok'] }, syn('ok')];
    expect(findSubstitute(deep[0]!, lookupOf(deep), has, new Set(['o']), 'bodyweight')?.id).toBe('ok');
    expect(findSubstitute(deep[0]!, lookupOf(deep), has, new Set(['o']), 'weights')?.id).toBe('loaded');
  });

  it('survives loops and alternatives that are missing from the library', () => {
    expect(find([bad('o', ['a']), bad('a', ['o', 'a'])], 'o')).toBeNull();
    expect(find([bad('o', ['ghost', 's']), syn('s')], 'o')).toBe('s');
  });
});

// ---------------------------------------------------------------- Adapting a workout

describe('adapting a workout: injuries', () => {
  const legs = seed('legs_gym', {
    focus: 'legs',
    mode: 'weights',
    level: 'intermediate',
    places: ['gym'],
    items: [
      reps('barbell_back_squat', 4, [6, 10], 120, { en: 'Brace the core', he: 'לשמור על בטן מכווצת' }),
      reps('leg_press', 3, [8, 12], 90),
      reps('dumbbell_romanian_deadlift', 3, [8, 12], 90),
      reps('lying_leg_curl', 3, [10, 12], 60),
      reps('standing_calf_raise', 3, [12, 15], 45),
      hold('plank', 40, 3, 45),
    ],
  });

  it('changes nothing for a person with no limits at the gym', () => {
    const r = adapt(legs);
    expect(r.available).toBe(true);
    expect(r.changed).toBe(0);
    expect(byId(r.items)).toEqual(byId(legs.items));
    expect(r.items.every((i) => i.substitutedFrom === null)).toBe(true);
    expect(r.notes).toEqual([]);
    expect(r.items[0]!.cue).toEqual({ en: 'Brace the core', he: 'לשמור על בטן מכווצת' });
    expect(r.items[0]!.cue).not.toBe(legs.items[0]!.cue);
  });

  it('swaps contraindicated exercises for easier ones of the same muscle, searching deeper than one step', () => {
    const r = adapt(legs, ctxOf({ injuries: ['knee'] }));
    expect(r.available).toBe(true);
    // back squat: goblet squat, smith squat and leg press are all knee exercises -> bodyweight squat (second step)
    // leg press: goblet squat is a knee exercise, bodyweight squat is taken -> box squat
    expect(byId(r.items)).toEqual(['bodyweight_squat', 'box_squat', 'dumbbell_romanian_deadlift', 'lying_leg_curl', 'standing_calf_raise', 'plank']);
    expect(r.items.map((i) => i.substitutedFrom)).toEqual(['barbell_back_squat', 'leg_press', null, null, null, null]);
    expect(r.changed).toBe(2);
    // weight-tracked squat (6-10 reps, 4 sets, 120 s) became a body-weight one: the tracking type changed, so the
    // default 8-12 reps apply while sets and rest stay as designed
    expect(r.items[0]).toMatchObject({ sets: 4, repMin: 8, repMax: 12, restSeconds: 120, cue: null });
    expect(r.notes).toEqual([
      { code: 'substituted', params: { from: nameEn('barbell_back_squat'), to: nameEn('bodyweight_squat') } },
      { code: 'substituted', params: { from: nameEn('leg_press'), to: nameEn('box_squat') } },
    ]);
  });

  it('keeps sets and rest, drops the cue of the replaced exercise, and keeps reps when the tracking type is the same', () => {
    const w = seed('press', {
      focus: 'chest',
      mode: 'weights',
      items: [reps('dumbbell_bench_press', 5, [10, 15], 75, { en: 'Flat back', he: 'גב שטוח' }), ...filler(3)],
    });
    const r = adapt(w, ctxOf({ injuries: ['shoulder'] }));
    const item = r.items[0]!;
    expect(item.exerciseId).toBe('dumbbell_floor_press');
    expect(item.substitutedFrom).toBe('dumbbell_bench_press');
    expect({ sets: item.sets, repMin: item.repMin, repMax: item.repMax, rest: item.restSeconds }).toEqual({ sets: 5, repMin: 10, repMax: 15, rest: 75 });
    expect(item.cue).toBeNull();
  });

  it('uses 8-12 reps or 30 seconds when the substitute is tracked differently', () => {
    const toReps = adapt(seed('carry', { mode: 'weights', items: [{ exerciseId: 'farmer_carry', sets: 4, seconds: 45, restSeconds: 70 }, ...filler(3)] }), ctxOf({ injuries: ['wrist'] }));
    expect(toReps.items[0]).toMatchObject({ exerciseId: 'dumbbell_shrug', substitutedFrom: 'farmer_carry', sets: 4, restSeconds: 70, repMin: 8, repMax: 12, targetSeconds: null });
    const toTime = adapt(seed('twist', { items: [reps('russian_twist', 3, [12, 20], 50), ...filler(3)] }), ctxOf({ injuries: ['lower_back'] }));
    expect(toTime.items[0]).toMatchObject({ exerciseId: 'side_plank', substitutedFrom: 'russian_twist', sets: 3, restSeconds: 50, repMin: null, repMax: null, targetSeconds: 30, targetRpe: null });
    // same type keeps the designed hold time
    const holds = adapt(seed('climb', { items: [hold('mountain_climber', 40, 3, 30), ...filler(3)] }), ctxOf({ injuries: ['wrist'] }));
    expect(holds.items[0]).toMatchObject({ exerciseId: 'plank', substitutedFrom: 'mountain_climber', targetSeconds: 40, repMin: null });
  });

  it('only suggests exercises the person has the gear for', () => {
    const w = seed('chest_db', { mode: 'weights', items: [reps('dumbbell_bench_press'), reps('dumbbell_floor_press'), reps('push_up'), reps('band_chest_press')] });
    // floor press and push-up are already in the workout; the chest press machine is not available at home
    const home = adapt(w, ctxOf({ injuries: ['shoulder'], equipment: ['dumbbells', 'bench', 'resistance_bands'] }));
    expect(byId(home.items)).toEqual(['knee_push_up', 'dumbbell_floor_press', 'push_up', 'band_chest_press']);
    expect(home.items[0]!.substitutedFrom).toBe('dumbbell_bench_press');
    // with the machine available it is the first suitable alternative at the first step
    const gym = adapt(w, ctxOf({ injuries: ['shoulder'], equipment: [...GYM] }));
    expect(gym.items[0]!.exerciseId).toBe('machine_chest_press');
  });

  it('keeps a bodyweight workout bodyweight when it swaps an exercise, even for a person who has the gear', () => {
    // decline push-up under a wrist complaint: the only easier alternative left is a dumbbell press
    const items = [reps('decline_push_up', 3, [6, 10]), ...filler(4)];
    const weights = adapt(seed('w_wrist', { mode: 'weights', level: 'intermediate', items }), ctxOf({ injuries: ['wrist'] }));
    expect(weights.items[0]).toMatchObject({ exerciseId: 'incline_dumbbell_press', substitutedFrom: 'decline_push_up' });
    const bodyweight = adapt(seed('bw_wrist', { mode: 'bodyweight', level: 'intermediate', items }), ctxOf({ injuries: ['wrist'] }));
    expect(byId(bodyweight.items)).toEqual(FILLER);
    expect(bodyweight.notes).toEqual([{ code: 'dropped', params: { name: nameEn('decline_push_up') } }]);
    // a bodyweight swap is still a swap: advanced -> the next bodyweight alternative, not the leg curl machine
    const minor = (mode: 'bodyweight' | 'weights') => adapt(seed(`nordic_${mode}`, { mode, level: 'advanced', items: [reps('nordic_hamstring_curl', 3, [4, 6]), ...filler(4)] }), ctxOf(MINOR));
    expect(minor('weights').items[0]).toMatchObject({ exerciseId: 'lying_leg_curl', substitutedFrom: 'nordic_hamstring_curl' });
    expect(minor('bodyweight').items[0]).toMatchObject({ exerciseId: 'single_leg_romanian_deadlift', substitutedFrom: 'nordic_hamstring_curl' });
  });

  it('drops an exercise nothing can replace', () => {
    // push-up: both easier variants are wrist exercises too
    const w = seed('wrist', { items: [reps('push_up'), ...filler(4)] });
    const r = adapt(w, ctxOf({ injuries: ['wrist'] }));
    expect(r.available).toBe(true);
    expect(byId(r.items)).toEqual(FILLER);
    expect(r.changed).toBe(1);
    expect(r.notes).toEqual([{ code: 'dropped', params: { name: nameEn('push_up') } }]);
  });

  it('drops an exercise when the person has no gear for any of its easier variations', () => {
    // nothing to hang from: every easier pull-up variation needs the bar or a machine that is not there
    const w = seed('pull', { focus: 'back', items: [reps('pull_up', 3, [4, 8]), ...filler(4)] });
    const noBar = adapt(w, ctxOf({ equipment: NONE }));
    expect(noBar.changed).toBe(1);
    expect(noBar.notes).toEqual([{ code: 'dropped', params: { name: nameEn('pull_up') } }]);
  });

  it('swaps an exercise from the avoid list for an easier one, and never brings an avoided one back as the substitute', () => {
    const r = adapt(legs, ctxOf({ avoid: ['barbell_back_squat'] }));
    expect(byId(r.items)).toEqual(['goblet_squat', 'leg_press', 'dumbbell_romanian_deadlift', 'lying_leg_curl', 'standing_calf_raise', 'plank']);
    expect(r.items[0]).toMatchObject({ substitutedFrom: 'barbell_back_squat', sets: 4, repMin: 6, repMax: 10, restSeconds: 120, cue: null });
    expect(r.notes).toEqual([{ code: 'substituted', params: { from: nameEn('barbell_back_squat'), to: nameEn('goblet_squat') } }]);
    // the first easier alternative is avoided as well: the next one in listed order is taken
    const second = adapt(legs, ctxOf({ avoid: ['barbell_back_squat', 'goblet_squat'] }));
    expect(second.items[0]!.exerciseId).toBe('smith_machine_squat');
    for (const avoid of [['barbell_back_squat', 'goblet_squat'], ['leg_press', 'plank', 'lying_leg_curl']]) {
      for (const it of adapt(legs, ctxOf({ avoid })).items) expect(avoid, it.exerciseId).not.toContain(it.exerciseId);
    }
    // nothing on the list: nothing changes
    expect(adapt(legs, ctxOf({ avoid: [] })).changed).toBe(0);
  });

  it('drops an avoided exercise when every easier alternative is avoided too', () => {
    const w = seed('avoid_drop', { items: [reps('push_up'), ...filler(4)] });
    const r = adapt(w, ctxOf({ avoid: ['push_up', 'knee_push_up', 'incline_push_up'] }));
    expect(byId(r.items)).toEqual(FILLER);
    expect(r.notes).toEqual([{ code: 'dropped', params: { name: nameEn('push_up') } }]);
  });

  it('treats an exercise missing from the library as unsafe and drops it', () => {
    const w = seed('ghost', { items: [reps('ghost_move'), ...filler(4)] });
    const r = adapt(w);
    expect(byId(r.items)).toEqual(FILLER);
    expect(r.notes).toEqual([{ code: 'dropped', params: { name: 'ghost_move' } }]);
  });

  it('never leaves an exercise the person should not do, for every single injury area', () => {
    const mixed = seed('mixed', {
      focus: 'full_body',
      mode: 'weights',
      level: 'intermediate',
      places: ['gym'],
      items: [
        reps('barbell_bench_press', 3, [6, 10]), reps('triceps_pushdown'), reps('push_up'), reps('crunch'), reps('cossack_squat'),
        reps('single_leg_calf_raise'), reps('barbell_back_squat', 3, [6, 10]), hold('plank'), reps('glute_bridge'),
      ],
    });
    for (const area of INJURY_AREAS) {
      expect(mixed.items.some((it) => lookup.get(it.exerciseId)!.contraindications.includes(area)), `fixture touches ${area}`).toBe(true);
      const r = adapt(mixed, ctxOf({ injuries: [area] }));
      expect(r.available, area).toBe(true);
      expect(r.changed, area).toBeGreaterThan(0);
      expect(r.notes.some((n) => n.code === 'substituted' || n.code === 'dropped'), area).toBe(true);
      for (const it of r.items) expect(lookup.get(it.exerciseId)!.contraindications, `${area}: ${it.exerciseId}`).not.toContain(area);
    }
  });

  it('knows the substitutes for the common areas', () => {
    // the other three exercises never collide with a substitute
    const others = ['glute_bridge', 'bird_dog', 'box_squat'].map((id) => reps(id));
    const first = (item: ReadyItemSeed, area: InjuryArea) => adapt(seed('single', { mode: 'weights', items: [item, ...others] }), ctxOf({ injuries: [area] })).items[0]!.exerciseId;
    expect(first(reps('barbell_bench_press', 3, [6, 10]), 'shoulder')).toBe('machine_chest_press');
    expect(first(reps('triceps_pushdown'), 'elbow')).toBe('band_triceps_extension');
    expect(first(reps('crunch'), 'neck')).toBe('dead_bug');
    expect(first(reps('single_leg_calf_raise'), 'ankle')).toBe('standing_calf_raise');
    expect(first(reps('deadlift', 3, [5, 8]), 'lower_back')).toBe('cable_pull_through');
    expect(first(reps('cossack_squat'), 'hip')).toBe('reverse_lunge');
  });
});

describe('adapting a workout: when a workout is no longer available', () => {
  // Synthetic library: "bad" exercises have no alternatives, so they are dropped; "swap" ones are replaced by their easier twin.
  const mkEx = (id: string, over: Partial<ExerciseFacts> = {}): ExerciseFacts => ({
    ...lookup.get('push_up')!,
    id,
    name: { en: `Synthetic ${id}`, he: `סינתטי ${id}` },
    contraindications: [],
    easierAlternatives: [],
    ...over,
  });
  const good = Array.from({ length: 8 }, (_, i) => mkEx(`good${i}`));
  const badOnes = Array.from({ length: 8 }, (_, i) => mkEx(`bad${i}`, { contraindications: ['knee'] }));
  const swappable = Array.from({ length: 8 }, (_, i) => mkEx(`swap${i}`, { contraindications: ['knee'], easierAlternatives: [`twin${i}`] }));
  const twins = Array.from({ length: 8 }, (_, i) => mkEx(`twin${i}`));
  const lib = lookupOf([...good, ...badOnes, ...swappable, ...twins]);
  const knee = ctxOf({ injuries: ['knee'], equipment: NONE });
  const w = (ids: string[]) => seed('syn', { items: ids.map((id) => reps(id)) });
  const run = (ids: string[]) => adaptWorkout(w(ids), lib, knee);
  const g = (n: number) => good.slice(0, n).map((x) => x.id);
  const b = (n: number) => badOnes.slice(0, n).map((x) => x.id);
  const s = (n: number) => swappable.slice(0, n).map((x) => x.id);

  it('is available with exactly three dropped and four left', () => {
    const r = run([...g(4), ...b(3)]);
    expect(r.changed).toBe(3);
    expect(r.items).toHaveLength(4);
    expect(r.available).toBe(true);
  });

  it('is unavailable when fewer than four exercises remain', () => {
    const r = run([...g(3), ...b(1)]); // one change only, but 3 left
    expect(r.changed).toBe(1);
    expect(r.available).toBe(false);
    expect(run([...g(4), ...b(1)]).available).toBe(true);
    expect(run(g(3)).available).toBe(false);
  });

  it('is unavailable when more than three exercises changed, even if enough remain', () => {
    const r = run([...g(4), ...b(4)]);
    expect(r.items).toHaveLength(0); // unavailable workouts hand out nothing
    expect(r.changed).toBe(4);
    expect(r.available).toBe(false);
  });

  it('counts substitutions as changes too', () => {
    expect(run([...g(4), ...s(3)]).available).toBe(true);
    expect(run([...g(4), ...s(3)]).changed).toBe(3);
    const four = run([...g(4), ...s(4)]);
    expect(four.changed).toBe(4);
    expect(four.available).toBe(false);
    const mixed = run([...g(5), ...s(2), ...b(2)]);
    expect(mixed.changed).toBe(4);
    expect(mixed.available).toBe(false);
  });

  it('still says what happened when a workout is unavailable', () => {
    const r = run([...g(3), ...b(2)]);
    expect(r.available).toBe(false);
    expect(r.notes.filter((n) => n.code === 'dropped')).toHaveLength(2);
  });
});

describe('adapting a workout: prescription', () => {
  const rx = (exerciseId: string, sets: number, r: [number, number], restSeconds: number): ReadyItemSeed => ({ exerciseId, sets, reps: r, restSeconds });
  /** Loaded (dumbbell, band), bodyweight rep and timed work in one workout. */
  const mixedItems = [rx('dumbbell_curl', 5, [5, 8], 60), rx('band_row', 3, [4, 10], 45), rx('push_up', 3, [2, 5], 60), rx('pull_up', 3, [2, 4], 90), hold('plank', 40, 3, 45)];
  const w = (level: ReadyWorkoutSeed['level'], items = mixedItems) => seed('rx', { level, mode: 'weights', items });
  const home = (over: Partial<AdaptContext> = {}) => ctxOf({ equipment: ['dumbbells', 'resistance_bands', 'pull_up_bar'], ...over });

  it('targets an effort by workout level on rep-tracked work, none on timed work', () => {
    for (const level of ['beginner', 'intermediate', 'advanced'] as const) {
      const r = adapt(w(level), home());
      expect(r.items.map((i) => i.targetRpe)).toEqual([RPE_BY_LEVEL[level], RPE_BY_LEVEL[level], RPE_BY_LEVEL[level], RPE_BY_LEVEL[level], null]);
    }
    expect(RPE_BY_LEVEL).toEqual({ beginner: 6, intermediate: 7, advanced: 8 });
    const plank = adapt(w('advanced'), home()).items[4]!;
    expect(plank).toMatchObject({ targetSeconds: 40, repMin: null, repMax: null, targetRpe: null });
    const curl = adapt(w('advanced'), home()).items[0]!;
    expect(curl).toMatchObject({ targetSeconds: null, repMin: 5, repMax: 8, sets: 5, restSeconds: 60 });
  });

  it('leaves an adult (18-49) exactly as designed', () => {
    const r = adapt(w('advanced'), home());
    expect(r.items.map((i) => [i.sets, i.repMin == null ? null : [i.repMin, i.repMax], i.restSeconds])).toEqual([
      [5, [5, 8], 60], [3, [4, 10], 45], [3, [2, 5], 60], [3, [2, 4], 90], [3, null, 45],
    ]);
    expect(r.notes).toEqual([]);
  });

  describe('minors', () => {
    const c = home(MINOR);
    const r = adapt(w('advanced'), c);

    it('cap the effort at 7 and say so', () => {
      expect(r.items.map((i) => i.targetRpe)).toEqual([7, 7, 7, 7, null]);
      expect(r.notes).toEqual([{ code: 'minor' }]);
      expect(adapt(w('beginner'), c).items[0]!.targetRpe).toBe(6);
      expect(adapt(w('intermediate'), c).items[0]!.targetRpe).toBe(7);
    });

    it('raise a loaded rep minimum to 6 (and the max with it), never touch bodyweight reps or holds', () => {
      expect(r.items.map((i) => [i.repMin, i.repMax])).toEqual([[6, 8], [6, 10], [2, 5], [2, 4], [null, null]]);
      expect(r.items[4]!.targetSeconds).toBe(40);
      const narrow = adapt(w('beginner', [rx('dumbbell_curl', 3, [5, 5], 60), rx('band_row', 3, [3, 4], 60), ...filler(2)]), c);
      expect(narrow.items.map((i) => [i.repMin, i.repMax]).slice(0, 2)).toEqual([[6, 6], [6, 6]]);
      // already at 6 or above: unchanged
      expect(adapt(w('beginner', [rx('dumbbell_curl', 3, [8, 12], 60), ...filler(3)]), c).items[0]).toMatchObject({ repMin: 8, repMax: 12 });
    });

    it('get no extra rest, no set cap and no age note', () => {
      expect(r.items.map((i) => [i.sets, i.restSeconds])).toEqual([[5, 60], [3, 45], [3, 60], [3, 90], [3, 45]]);
    });

    it('are recognised by the age band alone as well as by the flag', () => {
      for (const flags of [{ isMinor: true }, { ageBand: 'minor' as AgeBand }, MINOR]) {
        const x = adapt(w('advanced'), home(flags));
        expect(x.items[0]).toMatchObject({ targetRpe: 7, repMin: 6 });
        expect(noteCodes(x.notes)).toEqual(['minor']);
      }
    });

    it('lose advanced exercises (replaced by an easier one) and keep high-impact ones', () => {
      const archer = seed('archer', { level: 'advanced', items: [rx('archer_push_up', 3, [4, 6], 90), ...filler(3)] });
      const m = adapt(archer, ctxOf(MINOR));
      expect(m.items[0]).toMatchObject({ exerciseId: 'decline_push_up', substitutedFrom: 'archer_push_up' });
      expect(adapt(archer, ctxOf()).items[0]!.exerciseId).toBe('archer_push_up');
      const jumps = seed('jumps', { level: 'intermediate', items: [rx('jump_squat', 3, [8, 10], 60), ...filler(3)] });
      expect(adapt(jumps, ctxOf(MINOR)).items[0]!.exerciseId).toBe('jump_squat');
    });
  });

  describe('50-64 (mature)', () => {
    const c = home(MATURE);
    const r = adapt(w('advanced'), c);

    it('add 15 seconds of rest to every exercise, timed ones included, and say so', () => {
      expect(r.items.map((i) => i.restSeconds)).toEqual([75, 60, 75, 105, 60]);
      expect(r.notes).toEqual([{ code: 'age_mature' }]);
    });

    it('cap the effort at 8 and change nothing else', () => {
      expect(r.items.map((i) => i.targetRpe)).toEqual([8, 8, 8, 8, null]);
      expect(r.items.map((i) => i.sets)).toEqual([5, 3, 3, 3, 3]);
      expect(r.items.map((i) => [i.repMin, i.repMax])).toEqual([[5, 8], [4, 10], [2, 5], [2, 4], [null, null]]);
      // the cap itself, with an effort above it
      const base = { sets: 3, repMin: 8, repMax: 12, targetSeconds: null, restSeconds: 60, targetRpe: 9 };
      expect(capPrescription(base, lookup.get('dumbbell_curl')!, c).targetRpe).toBe(8);
      expect(capPrescription({ ...base, targetRpe: 7 }, lookup.get('dumbbell_curl')!, c).targetRpe).toBe(7);
      expect(capPrescription(base, lookup.get('dumbbell_curl')!, ctxOf()).targetRpe).toBe(9);
    });

    it('keep advanced and jumping exercises', () => {
      const keep = seed('keep', { level: 'advanced', items: [rx('archer_push_up', 3, [4, 6], 90), rx('jump_squat', 3, [8, 10], 60), ...filler(2)] });
      expect(byId(adapt(keep, ctxOf(MATURE)).items)).toEqual(['archer_push_up', 'jump_squat', ...FILLER.slice(0, 2)]);
    });
  });

  describe('65+ (senior)', () => {
    const c = home(SENIOR);
    const r = adapt(w('advanced'), c);

    it('cap the effort at 7.5, never raising a lower one, and say so', () => {
      expect(r.items.map((i) => i.targetRpe)).toEqual([7.5, 7.5, 7.5, 7.5, null]);
      expect(adapt(w('intermediate'), c).items[0]!.targetRpe).toBe(7);
      expect(adapt(w('beginner'), c).items[0]!.targetRpe).toBe(6);
      expect(r.notes).toEqual([{ code: 'age_senior' }]);
    });

    it('add 30 seconds of rest and allow at most 4 sets', () => {
      expect(r.items.map((i) => i.restSeconds)).toEqual([90, 75, 90, 120, 75]);
      expect(r.items.map((i) => i.sets)).toEqual([4, 3, 3, 3, 3]);
    });

    it('raise the rep minimum to 8 on loaded work only (weights, bands), never on bodyweight reps or holds', () => {
      expect(r.items.map((i) => [i.repMin, i.repMax])).toEqual([[8, 8], [8, 10], [2, 5], [2, 4], [null, null]]);
      expect(isExternallyLoaded(lookup.get('band_row')!)).toBe(true);
      expect(isExternallyLoaded(lookup.get('pull_up')!)).toBe(false);
      expect(adapt(w('beginner', [rx('dumbbell_curl', 3, [10, 15], 60), ...filler(3)]), c).items[0]).toMatchObject({ repMin: 10, repMax: 15 });
      expect(r.items[4]!.targetSeconds).toBe(40);
    });

    it('lose advanced and high-impact exercises, and never gain either through a substitute', () => {
      const w2 = seed('senior', {
        level: 'advanced',
        items: [rx('archer_push_up', 3, [4, 6], 90), rx('jump_squat', 3, [8, 10], 60), rx('burpee', 3, [6, 8], 60), rx('push_up', 3, [8, 10], 60), ...filler(2)],
      });
      const x = adapt(w2, ctxOf(SENIOR));
      expect(x.available).toBe(true);
      expect(x.changed).toBe(3);
      for (const it of x.items) {
        const e = lookup.get(it.exerciseId)!;
        expect(isHighImpact(e), it.exerciseId).toBe(false);
        expect(e.difficulty, it.exerciseId).not.toBe('advanced');
      }
      expect(x.items[0]).toMatchObject({ exerciseId: 'decline_push_up', substitutedFrom: 'archer_push_up' });
      expect(x.items[1]).toMatchObject({ exerciseId: 'bodyweight_squat', substitutedFrom: 'jump_squat' });
    });

    it('apply the same caps through capPrescription', () => {
      const base = { sets: 6, repMin: 4, repMax: 6, targetSeconds: null, restSeconds: 590, targetRpe: 9 };
      expect(capPrescription(base, lookup.get('dumbbell_curl')!, c)).toEqual({ sets: 4, repMin: 8, repMax: 8, targetSeconds: null, restSeconds: 600, targetRpe: 7.5 });
      expect(capPrescription(base, lookup.get('push_up')!, c)).toMatchObject({ sets: 4, repMin: 4, repMax: 6 });
      const timed = { sets: 3, repMin: null, repMax: null, targetSeconds: 40, restSeconds: 45, targetRpe: null };
      expect(capPrescription(timed, lookup.get('plank')!, c)).toEqual({ ...timed, restSeconds: 75 });
    });
  });

  it('never makes any set harder than designed, whatever the age', () => {
    for (const band of [ctxOf(), ctxOf(MINOR), ctxOf(MATURE), ctxOf(SENIOR)]) {
      const r = adapt(w('advanced'), home(band));
      r.items.forEach((it, i) => {
        const designed = mixedItems[i]!;
        expect(it.sets).toBeLessThanOrEqual(designed.sets);
        expect(it.restSeconds).toBeGreaterThanOrEqual(designed.restSeconds);
        if (it.targetRpe != null) expect(it.targetRpe).toBeLessThanOrEqual(8);
        if (designed.reps) expect(it.repMin).toBeGreaterThanOrEqual(designed.reps[0]);
      });
    }
  });

  it('keeps sets between 1 and 10 and rest between 0 and 600 seconds', () => {
    const c = home(SENIOR);
    const crazy = { sets: 99, repMin: 8, repMax: 12, targetSeconds: null, restSeconds: 9999, targetRpe: 99 };
    expect(capPrescription(crazy, lookup.get('push_up')!, ctxOf())).toMatchObject({ sets: 10, restSeconds: 600, targetRpe: 10 });
    const low = { sets: -3, repMin: 8, repMax: 12, targetSeconds: null, restSeconds: -50, targetRpe: -2 };
    expect(capPrescription(low, lookup.get('push_up')!, ctxOf())).toMatchObject({ sets: 1, restSeconds: 0, targetRpe: 1 });
    expect(capPrescription(crazy, lookup.get('push_up')!, c)).toMatchObject({ sets: 4, restSeconds: 600 });
  });
});

describe('adapting a workout: notes', () => {
  const sub = seed('notes', { items: [reps('push_up'), reps('crunch'), reps('glute_bridge'), reps('bird_dog'), reps('box_squat')] });

  it('writes the exercise names in the language of the user', () => {
    const he = adapt(sub, ctxOf({ injuries: ['wrist', 'neck'], locale: 'he' }));
    const en = adapt(sub, ctxOf({ injuries: ['wrist', 'neck'], locale: 'en' }));
    expect(en.notes).toEqual([
      { code: 'dropped', params: { name: nameEn('push_up') } },
      { code: 'substituted', params: { from: nameEn('crunch'), to: nameEn('dead_bug') } },
    ]);
    const heNames = he.notes.flatMap((n) => Object.values(n.params ?? {}).map(String));
    expect(heNames).toHaveLength(3);
    for (const name of heNames) expect(name).toMatch(HEBREW);
    expect(heNames).toContain(lookup.get('push_up')!.name.he);
    expect(heNames).toContain(lookup.get('crunch')!.name.he);
    expect(heNames).toContain(lookup.get('dead_bug')!.name.he);
  });

  it('puts the person-level notes first, then the changes in workout order, and repeats nothing', () => {
    const r = adapt(sub, ctxOf({ ...SENIOR, injuries: ['wrist', 'neck'] }));
    expect(noteCodes(r.notes)).toEqual(['age_senior', 'dropped', 'substituted']);
    const minor = adapt(sub, ctxOf({ ...MINOR, injuries: ['neck'] }));
    expect(noteCodes(minor.notes)).toEqual(['minor', 'substituted']);
    const keys = r.notes.map((n) => JSON.stringify(n));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('says nothing when nothing needed to change', () => {
    expect(adapt(sub).notes).toEqual([]);
  });

  it('only ever uses the note codes the client knows how to render', () => {
    expect(READY_NOTE_CODES).toEqual(['minor', 'age_mature', 'age_senior', 'substituted', 'dropped', 'sport_gentle', 'sport_none_fit']);
  });

  it('keeps params to strings and numbers', () => {
    const r = adapt(sub, ctxOf({ injuries: ['wrist', 'neck'] }));
    for (const n of r.notes) for (const v of Object.values(n.params ?? {})) expect(['string', 'number']).toContain(typeof v);
  });
});

describe('adapting a workout: determinism and purity', () => {
  const w = seed('pure', {
    level: 'intermediate',
    mode: 'weights',
    items: [reps('barbell_back_squat', 5, [4, 6], 100, { en: 'Brace', he: 'לכווץ בטן' }), reps('leg_press'), reps('jump_squat'), reps('archer_push_up'), reps('crunch'), hold('plank')],
  });

  it('gives identical results for identical input and never modifies its input', () => {
    const c = ctxOf({ ...SENIOR, injuries: ['knee', 'neck'], locale: 'he' });
    const before = JSON.stringify([w, c]);
    const libBefore = JSON.stringify([...lookup.values()]);
    const a = adapt(w, c);
    const b = adapt(structuredClone(w), structuredClone(c));
    expect(b).toEqual(a);
    expect(JSON.stringify([w, c])).toBe(before);
    expect(JSON.stringify([...lookup.values()])).toBe(libBefore);
    expect(a.items.every((i) => i.cue == null || !w.items.some((s) => s.cue === i.cue))).toBe(true);
  });
});

describe('adapting a workout: invariants over every injury combination and age band', () => {
  const fixtures: ReadyWorkoutSeed[] = [
    seed('inv_gym', {
      focus: 'full_body',
      mode: 'weights',
      level: 'advanced',
      places: ['gym'],
      items: [
        reps('barbell_back_squat', 5, [4, 6], 120), reps('barbell_bench_press', 5, [4, 6], 120), reps('pull_up', 4, [3, 6], 90), reps('deadlift', 4, [4, 6], 150),
        reps('jump_squat', 3, [6, 8], 60), reps('archer_push_up', 3, [3, 5], 90), hold('plank', 60, 3, 45), reps('band_row', 3, [3, 8], 60),
      ],
    }),
    seed('inv_home', {
      focus: 'upper_body',
      mode: 'weights',
      level: 'intermediate',
      items: [reps('dumbbell_bench_press', 4, [5, 8], 75), reps('one_arm_dumbbell_row', 4, [5, 8], 75), reps('goblet_squat', 3, [5, 8], 75), reps('burpee', 3, [6, 8], 60), reps('push_up', 3, [3, 6], 60), hold('mountain_climber', 40, 3, 30)],
    }),
    seed('inv_bw_upper', {
      focus: 'upper_body',
      level: 'advanced',
      items: [reps('decline_push_up', 3, [6, 10]), reps('pike_push_up', 3, [5, 8]), reps('diamond_push_up', 3, [5, 8]), reps('pull_up', 3, [3, 6]), reps('nordic_hamstring_curl', 3, [3, 5]), hold('plank')],
    }),
    seed('inv_bw', {
      focus: 'abs',
      level: 'beginner',
      items: [reps('crunch'), reps('bicycle_crunch'), reps('russian_twist'), reps('lying_leg_raise'), hold('plank'), hold('side_plank'), reps('superman')],
    }),
  ];
  const equipments: Equipment[][] = [GYM, ['dumbbells', 'bench', 'resistance_bands', 'pull_up_bar'], NONE];
  const bands: Partial<AdaptContext>[] = [{}, MINOR, MATURE, SENIOR];
  const subsets: InjuryArea[][] = Array.from({ length: 1 << INJURY_AREAS.length }, (_, mask) => INJURY_AREAS.filter((_, i) => mask & (1 << i)));

  it('only returns exercises that are safe for the person, written independently of the engine', () => {
    let available = 0;
    let unavailable = 0;
    for (const f of fixtures) {
      for (const equipment of equipments) {
        for (const band of bands) {
          for (const injuries of subsets) {
            const c = ctxOf({ ...band, injuries, equipment });
            const rules = ageRules(band.ageBand ?? 'adult');
            const minor = band.ageBand === 'minor';
            const label = `${f.id} ${band.ageBand ?? 'adult'} ${injuries.join('+') || 'none'} ${equipment.length}`;
            const r = adapt(f, c);
            if (!r.available) {
              unavailable++;
              expect(r.items, label).toEqual([]);
              continue;
            }
            available++;
            expect(r.items.length, label).toBeGreaterThanOrEqual(4);
            expect(r.changed, label).toBeLessThanOrEqual(3);
            expect(new Set(byId(r.items)).size, label).toBe(r.items.length);
            for (const it of r.items) {
              const e = lookup.get(it.exerciseId)!;
              expect(e.equipment.every((q) => equipment.includes(q)), `${label} gear ${e.id}`).toBe(true);
              expect(e.contraindications.some((x) => injuries.includes(x)), `${label} injury ${e.id}`).toBe(false);
              if (minor || rules.excludeAdvanced) expect(e.difficulty, `${label} advanced ${e.id}`).not.toBe('advanced');
              if (rules.excludeHighImpact) expect(isHighImpact(e), `${label} impact ${e.id}`).toBe(false);
              if (f.mode === 'bodyweight' && it.substitutedFrom != null) {
                expect(isExternallyLoaded(e), `${label} loaded substitute ${e.id}`).toBe(false);
                expect(e.equipment.filter((q) => RESISTANCE_GEAR.includes(q)), `${label} resistance gear ${e.id}`).toEqual([]);
              }
              if (it.targetRpe != null) {
                if (minor) expect(it.targetRpe, label).toBeLessThanOrEqual(7);
                if (rules.rpeCap != null) expect(it.targetRpe, label).toBeLessThanOrEqual(rules.rpeCap);
              }
              if (rules.setsCap != null) expect(it.sets, label).toBeLessThanOrEqual(rules.setsCap);
              if (it.repMin != null && isExternallyLoaded(e)) {
                if (minor) expect(it.repMin, label).toBeGreaterThanOrEqual(6);
                if (rules.loadedRepMinFloor != null) expect(it.repMin, label).toBeGreaterThanOrEqual(rules.loadedRepMinFloor);
              }
              expect(it.repMax == null || it.repMin == null || it.repMax >= it.repMin, label).toBe(true);
              expect((e.trackingType === 'time') === (it.targetSeconds != null), `${label} tracking ${e.id}`).toBe(true);
              if (e.trackingType === 'time') expect(it.targetRpe, label).toBeNull();
              expect(it.sets, label).toBeGreaterThanOrEqual(1);
              expect(it.sets, label).toBeLessThanOrEqual(10);
              expect(it.restSeconds, label).toBeLessThanOrEqual(600);
              const origin = f.items.find((s) => s.exerciseId === (it.substitutedFrom ?? it.exerciseId))!;
              expect(origin, `${label} origin ${it.exerciseId}`).toBeDefined();
              expect(it.sets, label).toBeLessThanOrEqual(origin.sets);
            }
            for (const n of r.notes) expect(READY_NOTE_CODES as readonly string[], label).toContain(n.code);
            expect(adapt(f, c), label).toEqual(r);
          }
        }
      }
    }
    expect(available).toBeGreaterThan(1000);
    expect(unavailable).toBeGreaterThan(100);
  });
});

// ---------------------------------------------------------------- Sport finisher

describe('sport finisher', () => {
  const item = (id: string): ReadyItemSeed => (lookup.get(id)?.trackingType === 'time' ? hold(id, 30, 2, 20) : reps(id, 2, [10, 15], 20));
  const block = (variant: SportBlockSeed['variant'], ids: string[], sport: SportBlockSeed['sport'] = 'soccer'): SportBlockSeed => ({
    id: `${sport}_${variant}`,
    sport,
    variant,
    name: { en: `${sport} ${variant}`, he: `ספורט ${variant}` },
    description: { en: 'Fixture block.', he: 'בלוק לדוגמה.' },
    items: ids.map(item),
  });
  // bodyweight block: mountain climbers hurt wrists, jumping jacks hurt knees/ankles and are high impact
  const BODYWEIGHT = ['bodyweight_squat', 'glute_bridge', 'mountain_climber', 'jumping_jack', 'plank'];
  // gear block: kettlebell swing (lower back) and goblet squat (knee) need gear and healthy joints; farmer carry hurts wrists
  const GEAR = ['kettlebell_swing', 'goblet_squat', 'band_row', 'dumbbell_curl'];
  const GENTLE = ['glute_bridge', 'dead_bug', 'bird_dog', 'plank', 'wall_sit'];
  const blocks = [block('bodyweight', BODYWEIGHT), block('gear', GEAR), block('gentle', GENTLE)];
  const gearAll: Equipment[] = ['kettlebell', 'dumbbells', 'resistance_bands'];
  const pick = (c: Partial<AdaptContext> = {}, mode: 'bodyweight' | 'weights' = 'bodyweight', list = blocks, sport: SportBlockSeed['sport'] = 'soccer') =>
    pickSportBlock(sport, list, lookup, ctxOf({ equipment: gearAll, ...c }), mode);
  const variant = (c: Partial<AdaptContext> = {}, mode: 'bodyweight' | 'weights' = 'bodyweight', list = blocks) => pick(c, mode, list).block?.variant ?? null;

  it('has fixtures that are what the tests say they are', () => {
    for (const id of [...BODYWEIGHT, ...GEAR, ...GENTLE]) expect(lookup.has(id), id).toBe(true);
    expect(unsuitableReasons(lookup.get('mountain_climber')!, ctxOf({ injuries: ['wrist'] }))).toEqual(['injury']);
    expect(unsuitableReasons(lookup.get('jumping_jack')!, ctxOf(SENIOR))).toContain('high_impact');
    for (const id of GENTLE) {
      const e = lookup.get(id)!;
      expect(isHighImpact(e) || e.difficulty !== 'beginner' || e.equipment.length > 0 || e.contraindications.some((c) => ['knee', 'ankle', 'hip', 'lower_back'].includes(c)), id).toBe(false);
    }
  });

  describe('which variants are tried, in which order', () => {
    it('adults: bodyweight, then gentle; with weights: gear, bodyweight, gentle', () => {
      expect(sportVariantOrder(ctxOf(), 'bodyweight')).toEqual(['bodyweight', 'gentle']);
      expect(sportVariantOrder(ctxOf(), 'weights')).toEqual(['gear', 'bodyweight', 'gentle']);
      expect(sportVariantOrder(ctxOf(MATURE), 'weights')).toEqual(['gear', 'bodyweight', 'gentle']);
      expect(sportVariantOrder(ctxOf(MINOR), 'bodyweight')).toEqual(['bodyweight', 'gentle']);
    });

    it('65+ and knee / ankle / hip / lower-back complaints start with the gentle block', () => {
      expect(sportVariantOrder(ctxOf(SENIOR), 'weights')).toEqual(['gentle', 'bodyweight', 'gear']);
      for (const area of ['knee', 'ankle', 'hip', 'lower_back'] as const) {
        expect(sportVariantOrder(ctxOf({ injuries: [area] }), 'weights'), area).toEqual(['gentle', 'bodyweight', 'gear']);
        expect(sportVariantOrder(ctxOf({ injuries: ['neck', area] }), 'bodyweight'), area).toEqual(['gentle', 'bodyweight']);
      }
      for (const area of ['neck', 'shoulder', 'elbow', 'wrist'] as const) {
        expect(sportVariantOrder(ctxOf({ injuries: [area] }), 'weights')[0], area).toBe('gear');
        expect(sportVariantOrder(ctxOf({ injuries: [area] }), 'bodyweight')[0], area).toBe('bodyweight');
      }
    });

    it('never offers a gear block in bodyweight mode', () => {
      for (const c of [ctxOf(), ctxOf(SENIOR), ctxOf(MINOR), ctxOf({ injuries: ['knee'] }), ctxOf({ injuries: ['wrist'] })]) {
        expect(sportVariantOrder(c, 'bodyweight')).not.toContain('gear');
      }
    });
  });

  describe('which block is chosen', () => {
    it('adult in bodyweight mode gets the bodyweight block, with weights the gear block', () => {
      expect(variant({}, 'bodyweight')).toBe('bodyweight');
      expect(variant({}, 'weights')).toBe('gear');
      expect(pick({}, 'weights').block).toBe(blocks[1]);
    });

    it('65+ gets the gentle block in either mode, with no extra note', () => {
      for (const mode of ['bodyweight', 'weights'] as const) {
        const r = pick(SENIOR, mode);
        expect(r.block?.variant, mode).toBe('gentle');
        expect(r.notes, mode).toEqual([]);
      }
    });

    it('a knee, ankle, hip or lower-back complaint gets the gentle block', () => {
      for (const area of ['knee', 'ankle', 'hip', 'lower_back'] as const) {
        for (const mode of ['bodyweight', 'weights'] as const) {
          const r = pick({ injuries: [area] }, mode);
          expect(r.block?.variant, `${area} ${mode}`).toBe('gentle');
          expect(r.notes, `${area} ${mode}`).toEqual([]);
        }
      }
    });

    it('other complaints keep the normal order and skip blocks that contain what hurts', () => {
      // wrist: gear block fine in this fixture? farmer carry is not in it, but mountain climbers are in the bodyweight block
      expect(variant({ injuries: ['wrist'] }, 'weights')).toBe('gear');
      const r = pick({ injuries: ['wrist'] }, 'bodyweight');
      expect(r.block?.variant).toBe('gentle');
      expect(r.notes).toEqual([{ code: 'sport_gentle' }]);
    });

    it('skips a block that contains an exercise the person asked never to get', () => {
      const r = pick({ avoid: ['jumping_jack'] }, 'bodyweight');
      expect(r.block?.variant).toBe('gentle');
      expect(r.notes).toEqual([{ code: 'sport_gentle' }]);
      expect(pick({ avoid: ['jumping_jack', 'dead_bug'] }, 'bodyweight').block).toBeNull();
      expect(variant({ avoid: [] }, 'bodyweight')).toBe('bodyweight');
    });

    it('says sport_gentle only when the gentle block was a fall-back', () => {
      // weights mode: gear needs a kettlebell the person lacks, bodyweight block hurts the wrist -> gentle, with the note
      const r = pick({ injuries: ['wrist'], equipment: NONE }, 'weights');
      expect(r.block?.variant).toBe('gentle');
      expect(r.notes).toEqual([{ code: 'sport_gentle' }]);
      // falling back to the bodyweight block is not worth a note
      const bw = pick({ equipment: NONE }, 'weights');
      expect(bw.block?.variant).toBe('bodyweight');
      expect(bw.notes).toEqual([]);
    });

    it('a gear block needs all its equipment', () => {
      expect(variant({ equipment: ['kettlebell', 'dumbbells'] }, 'weights')).toBe('bodyweight');
      expect(variant({ equipment: ['kettlebell', 'dumbbells', 'resistance_bands'] }, 'weights')).toBe('gear');
      expect(variant({ equipment: [...GYM] }, 'weights')).toBe('gear');
    });

    it('never chooses a gear block in bodyweight mode, even as a last resort', () => {
      const onlyGear = [blocks[1]!];
      expect(variant({}, 'bodyweight', onlyGear)).toBeNull();
      expect(variant(SENIOR, 'bodyweight', onlyGear)).toBeNull();
      expect(variant({ injuries: ['knee'] }, 'bodyweight', onlyGear)).toBeNull();
      // it is the last resort in weights mode for those who start gentle
      expect(variant(SENIOR, 'weights', onlyGear)).toBe('gear');
      const noOthers = [block('bodyweight', ['plank', 'jumping_jack', 'mountain_climber', 'glute_bridge']), blocks[1]!, block('gentle', ['glute_bridge', 'dead_bug', 'bird_dog', 'plank', 'jumping_jack'])];
      expect(variant({ injuries: ['wrist', 'knee'] }, 'bodyweight', noOthers)).toBeNull();
    });

    it('uses a block whole or not at all: one unsuitable exercise rules the whole block out', () => {
      const almost = [block('bodyweight', ['bodyweight_squat', 'glute_bridge', 'plank', 'dead_bug', 'push_up']), blocks[2]!];
      expect(variant({ injuries: ['wrist'] }, 'bodyweight', almost)).toBe('gentle');
      expect(variant({}, 'bodyweight', almost)).toBe('bodyweight');
      const r = pick({ injuries: ['wrist'] }, 'bodyweight', almost);
      expect(byId(r.items)).toEqual(GENTLE);
    });

    it('checks the exercises at run time and does not trust the variant name', () => {
      // a "gentle" block that contains a jumping exercise must not reach a 65+ person
      const dirty = [block('gentle', ['glute_bridge', 'dead_bug', 'bird_dog', 'jumping_jack'])];
      expect(variant(SENIOR, 'bodyweight', dirty)).toBeNull();
      // nor an advanced one a minor
      const advanced = [block('bodyweight', ['bodyweight_squat', 'glute_bridge', 'plank', 'archer_push_up'])];
      expect(variant(MINOR, 'bodyweight', advanced)).toBeNull();
      expect(variant({}, 'bodyweight', advanced)).toBe('bodyweight');
      // nor an unknown one
      expect(variant({}, 'bodyweight', [block('bodyweight', ['bodyweight_squat', 'glute_bridge', 'plank', 'nope'])])).toBeNull();
      // nor an empty one
      expect(variant({}, 'bodyweight', [{ ...blocks[0]!, items: [] }])).toBeNull();
    });

    it('chooses nothing, and says so, when no block is suitable', () => {
      const hopeless = { injuries: ['knee', 'wrist', 'lower_back'] as InjuryArea[], equipment: NONE };
      for (const mode of ['bodyweight', 'weights'] as const) {
        const r = pick(hopeless, mode, [blocks[0]!, blocks[1]!]);
        expect(r.block).toBeNull();
        expect(r.items).toEqual([]);
        expect(r.notes).toEqual([{ code: 'sport_none_fit', params: { sport: 'soccer' } }]);
      }
      expect(pick({}, 'bodyweight', [], 'soccer').notes).toEqual([{ code: 'sport_none_fit', params: { sport: 'soccer' } }]);
    });

    it('only looks at blocks of the asked sport', () => {
      const mixed = [block('bodyweight', BODYWEIGHT, 'basketball'), block('gentle', GENTLE, 'basketball'), blocks[0]!];
      expect(pick({}, 'bodyweight', mixed, 'soccer').block?.id).toBe('soccer_bodyweight');
      expect(pick({}, 'bodyweight', mixed, 'basketball').block?.id).toBe('basketball_bodyweight');
      expect(pick({}, 'bodyweight', mixed, 'running').block).toBeNull();
      expect(pick({}, 'bodyweight', mixed, 'running').notes).toEqual([{ code: 'sport_none_fit', params: { sport: 'running' } }]);
      for (const sport of SPORTS) expect(pick({}, 'bodyweight', [], sport).notes[0]!.params).toEqual({ sport });
    });
  });

  describe('prescription of the chosen block', () => {
    it('lists the block items in order with their designed sets, rest and hold times', () => {
      const r = pick(SENIOR, 'bodyweight');
      expect(byId(r.items)).toEqual(GENTLE);
      expect(r.items.every((i) => i.substitutedFrom === null)).toBe(true);
      expect(r.items.map((i) => i.sets)).toEqual([2, 2, 2, 2, 2]);
      expect(r.items.map((i) => i.restSeconds)).toEqual([20, 20, 20, 20, 20]);
      expect(r.items.find((i) => i.exerciseId === 'plank')).toMatchObject({ targetSeconds: 30, repMin: null, repMax: null, targetRpe: null });
      expect(r.items.find((i) => i.exerciseId === 'wall_sit')).toMatchObject({ targetSeconds: 30, targetRpe: null });
      expect(r.items.find((i) => i.exerciseId === 'dead_bug')).toMatchObject({ targetSeconds: null, repMin: 10, repMax: 15, targetRpe: SPORT_BLOCK_RPE });
    });

    it('is not touched by the age caps (the gentle block is the age adaptation)', () => {
      // 65+: no +30 s rest, no cap on sets, effort stays at the block effort which is below every cap
      const senior = pick(SENIOR, 'bodyweight');
      expect(senior.items.map((i) => i.restSeconds)).toEqual([20, 20, 20, 20, 20]);
      const long = [block('gentle', GENTLE).items.length ? { ...block('gentle', GENTLE), items: GENTLE.map((id) => ({ ...item(id), sets: 3 })) } : blocks[2]!];
      expect(pick(SENIOR, 'bodyweight', long).items.every((i) => i.sets === 3)).toBe(true);
      expect(pick(MATURE, 'bodyweight', long).items.map((i) => i.restSeconds)).toEqual([20, 20, 20, 20, 20]);
      expect(SPORT_BLOCK_RPE).toBeLessThanOrEqual(7);
      expect(SPORT_BLOCK_RPE).toBeLessThanOrEqual(ageRules('senior').rpeCap!);
      expect(SPORT_BLOCK_RPE).toBeLessThanOrEqual(ageRules('mature').rpeCap!);
      for (const c of [{}, MINOR, MATURE, SENIOR]) {
        for (const i of pick(c, 'bodyweight').items) if (i.targetSeconds != null) expect(i.targetRpe).toBeNull();
        else expect(i.targetRpe).toBe(SPORT_BLOCK_RPE);
      }
    });

    it('still keeps loaded reps off the heavy end for minors (6+) and 65+ (8+): weight, not clock', () => {
      const loaded = block('gear', ['goblet_squat', 'band_row', 'dumbbell_curl', 'push_up']);
      const heavy = { ...loaded, items: loaded.items.map((it) => ({ ...it, reps: [4, 6] as [number, number] })) };
      const adult = pickSportBlock('soccer', [heavy], lookup, ctxOf({ equipment: gearAll }), 'weights');
      expect(adult.items.map((i) => [i.repMin, i.repMax])).toEqual([[4, 6], [4, 6], [4, 6], [4, 6]]);
      const minor = pickSportBlock('soccer', [heavy], lookup, ctxOf({ ...MINOR, equipment: gearAll }), 'weights');
      expect(minor.items.map((i) => [i.repMin, i.repMax])).toEqual([[6, 6], [6, 6], [6, 6], [4, 6]]);
      const senior = pickSportBlock('soccer', [heavy], lookup, ctxOf({ ...SENIOR, equipment: gearAll }), 'weights');
      expect(senior.block?.variant).toBe('gear');
      expect(senior.items.map((i) => [i.repMin, i.repMax])).toEqual([[8, 8], [8, 8], [8, 8], [4, 6]]);
      expect(senior.items.map((i) => i.restSeconds)).toEqual([20, 20, 20, 20]);
      expect(senior.items.map((i) => i.sets)).toEqual([2, 2, 2, 2]);
    });

    it('carries the cues over unchanged', () => {
      const cued = { ...blocks[2]!, items: [{ ...item('glute_bridge'), cue: { en: 'Squeeze at the top', he: 'לכווץ למעלה' } }, ...blocks[2]!.items.slice(1)] };
      const r = pick(SENIOR, 'bodyweight', [cued]);
      expect(r.items[0]!.cue).toEqual({ en: 'Squeeze at the top', he: 'לכווץ למעלה' });
      expect(r.items[1]!.cue).toBeNull();
    });
  });

  describe('determinism and safety over every injury combination', () => {
    const subsets: InjuryArea[][] = Array.from({ length: 1 << INJURY_AREAS.length }, (_, mask) => INJURY_AREAS.filter((_, i) => mask & (1 << i)));

    it('never returns a block with an exercise that is unsafe for the person', () => {
      let chosen = 0;
      let none = 0;
      // the full set always has a gentle block for anyone; without it there are people nothing fits
      for (const list of [blocks, [blocks[0]!, blocks[1]!]]) for (const band of [{}, MINOR, MATURE, SENIOR] as Partial<AdaptContext>[]) {
        for (const mode of ['bodyweight', 'weights'] as const) {
          for (const equipment of [NONE, gearAll, GYM]) {
            for (const injuries of subsets) {
              const c = ctxOf({ ...band, injuries, equipment });
              const rules = ageRules(band.ageBand ?? 'adult');
              const r = pickSportBlock('soccer', list, lookup, c, mode);
              const label = `${list.length} ${band.ageBand ?? 'adult'} ${mode} ${injuries.join('+') || 'none'} ${equipment.length}`;
              expect(pickSportBlock('soccer', list, lookup, c, mode), label).toEqual(r);
              if (!r.block) {
                none++;
                expect(r.items, label).toEqual([]);
                expect(noteCodes(r.notes), label).toEqual(['sport_none_fit']);
                continue;
              }
              chosen++;
              if (mode === 'bodyweight') expect(r.block.variant, label).not.toBe('gear');
              expect(r.items.length, label).toBe(r.block.items.length);
              for (const it of r.items) {
                const e = lookup.get(it.exerciseId)!;
                expect(e.equipment.every((q) => equipment.includes(q)), `${label} gear ${e.id}`).toBe(true);
                expect(e.contraindications.some((x) => injuries.includes(x)), `${label} injury ${e.id}`).toBe(false);
                if (band.ageBand === 'minor' || rules.excludeAdvanced) expect(e.difficulty, label).not.toBe('advanced');
                if (rules.excludeHighImpact) expect(isHighImpact(e), `${label} impact ${e.id}`).toBe(false);
              }
              for (const n of r.notes) expect(['sport_gentle'], label).toContain(n.code);
            }
          }
        }
      }
      expect(chosen).toBeGreaterThan(1000);
      expect(none).toBeGreaterThan(100);
    });
  });
});
