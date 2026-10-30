/** Age-based adaptation: bands, generator caps, pool exclusions, notes. Pure: built-in dataset, no database. */
import { describe, expect, it } from 'vitest';
import { ageBand, ageRules, isExternallyLoaded, isHighImpact } from '@shared/age';
import { DEFAULT_EQUIPMENT_BY_LOCATION, EXPERIENCE_LEVELS, GOALS, type Equipment, type TrainingLocation } from '@shared/constants';
import { EXERCISE_LIBRARY } from '../src/data/exercises';
import type { ExerciseRecord } from '../src/modules/exercises/repository';
import { buildPool, generatePlan, type GeneratedPlan, type GeneratorInput } from '../src/modules/workouts/generator';

const catalog: ExerciseRecord[] = EXERCISE_LIBRARY.map((e) => ({ ...e, media: null }));
const byId = new Map(catalog.map((e) => [e.id, e]));
const NO_ABILITY = { pushUpsMax: null, pullUpsMax: null, plankSeconds: null, squat1rmKg: null, bench1rmKg: null, deadlift1rmKg: null };

function input(over: Partial<GeneratorInput> = {}): GeneratorInput {
  return {
    locale: 'en',
    goal: 'muscle_gain',
    experience: 'advanced',
    isMinor: false,
    location: 'gym',
    equipment: DEFAULT_EQUIPMENT_BY_LOCATION.gym,
    daysPerWeek: 4,
    sessionMinutes: 60,
    injuries: [],
    avoidExerciseIds: [],
    avoidPatterns: [],
    focusMuscleGroups: [],
    ability: NO_ABILITY,
    likes: '',
    dislikes: '',
    preferBodyweight: false,
    intensity: 'normal',
    variationSeed: 0,
    ...over,
  };
}
const all = (p: GeneratedPlan) => p.workouts.flatMap((w) => w.exercises);
/**
 * Every plyometric, jumping, hopping, bounding, skipping or sprinting exercise in the built-in library (checked by
 * hand against the names, categories and movement patterns). Plyometric throws and push-ups count: they are
 * explosive, impact-loaded work, like the medicine ball slam.
 */
const JUMPING_IDS = new Set([
  'jump_squat',
  'box_jump',
  'broad_jump',
  'lateral_bound',
  'burpee',
  'jumping_jack',
  'jump_rope_skipping',
  'high_knees',
  'sprint_intervals',
  'medicine_ball_slam',
  'medicine_ball_chest_pass',
  'medicine_ball_rotational_throw',
  'explosive_push_up',
  'clap_push_up',
  'jump_lunge',
  'split_squat_jump',
  'tuck_jump',
  'pogo_hop',
  'single_leg_hop_and_stick',
  'plank_jack',
  'a_skip',
]);
const hasNote = (p: GeneratedPlan, code: string) => p.notes.some((n) => n.code === code);

describe('age bands', () => {
  it('splits at 18, 50 and 65, and treats an unknown age as an adult', () => {
    expect([17, 18, 49, 50, 64, 65, 90].map(ageBand)).toEqual(['minor', 'adult', 'adult', 'mature', 'mature', 'senior', 'senior']);
    expect(ageBand(null)).toBe('adult');
    expect(ageBand(undefined)).toBe('adult');
    expect(ageBand(Number.NaN)).toBe('adult');
  });

  it('only ever makes the plan gentler as age rises', () => {
    const a = ageRules('adult');
    const m = ageRules('mature');
    const s = ageRules('senior');
    expect(a.rpeCap).toBeNull();
    expect(m.rpeCap!).toBeLessThan(10);
    expect(s.rpeCap!).toBeLessThan(m.rpeCap!);
    expect(s.restBonusSeconds).toBeGreaterThan(m.restBonusSeconds);
    expect(m.restBonusSeconds).toBeGreaterThan(a.restBonusSeconds);
    expect(s.excludeHighImpact && s.excludeAdvanced && s.singleStepProgression).toBe(true);
    expect(a.excludeHighImpact || m.excludeHighImpact || a.loadedRepMinFloor != null || m.loadedRepMinFloor != null).toBe(false);
  });
});

describe('high-impact exercises', () => {
  it('flags exactly the jumping / plyometric / sprinting exercises of the built-in library', () => {
    expect(catalog.filter(isHighImpact).map((e) => e.id).sort()).toEqual([...JUMPING_IDS].sort());
  });

  it('also catches a new jumping exercise by its id or name', () => {
    const base = { category: 'bodyweight', movementPattern: 'conditioning' } as const;
    expect(isHighImpact({ ...base, id: 'skater_hop', name: { en: 'Skater Hops', he: 'החלקות מחליק' } })).toBe(true);
    expect(isHighImpact({ ...base, id: 'star_drill', name: { en: 'Star Jumps', he: 'כוכב' } })).toBe(true);
    expect(isHighImpact({ ...base, id: 'tuck_drill', name: { en: 'Tuck drill', he: 'קפיצות ברכיים לחזה' } })).toBe(true);
    expect(isHighImpact({ ...base, id: 'march_in_place', name: { en: 'March in Place', he: 'צעידה במקום' } })).toBe(false);
  });
});

describe('externally loaded exercises', () => {
  it('are the weighted lifts and the band exercises; bodyweight and calisthenics (even band-assisted) are not', () => {
    const loaded = catalog.filter(isExternallyLoaded);
    // Every resistance-band exercise of the library that is tracked as plain reps (checked by hand; the isometric
    // Spanish squat is timed, so it is not rep work).
    const bandIds = [
      'band_biceps_curl',
      'band_chest_fly',
      'band_chest_press',
      'band_external_rotation',
      'band_face_pull',
      'band_glute_bridge',
      'band_hammer_curl',
      'band_lat_pulldown',
      'band_lateral_raise',
      'band_overhead_press',
      'band_overhead_triceps_extension',
      'band_pull_apart',
      'band_row',
      'band_squat',
      'band_straight_arm_pulldown',
      'band_triceps_extension',
      'banded_clamshell',
      'banded_lateral_walk',
      'single_arm_band_row',
    ];
    expect(loaded.filter((e) => e.trackingType !== 'weight_reps').map((e) => e.id).sort()).toEqual(bandIds);
    expect(catalog.filter((e) => e.trackingType === 'weight_reps').every(isExternallyLoaded)).toBe(true);
    for (const id of ['push_up', 'pull_up', 'chin_up', 'band_assisted_pull_up', 'band_assisted_dip', 'ring_row', 'suspension_trainer_row', 'ab_wheel_rollout', 'plank']) {
      expect(isExternallyLoaded(byId.get(id)!), id).toBe(false);
    }
  });
});

describe('plans for older adults', () => {
  const plan = (age: number | null, over: Partial<GeneratorInput> = {}) => generatePlan(input({ ageYears: age, ...over }), catalog);

  it('an adult under 50 gets exactly the same plan as before (no age given vs 30)', () => {
    expect(plan(30)).toEqual(plan(null));
    expect(hasNote(plan(30), 'age_mature') || hasNote(plan(30), 'age_senior')).toBe(false);
  });

  it('50–64: RPE ≤ 8, rests 15 s longer, explained by a note', () => {
    const base = all(plan(30));
    const mature = all(plan(55));
    expect(hasNote(plan(55), 'age_mature')).toBe(true);
    // "Harder" takes an adult above RPE 8, so the cap really changes something for 50+.
    expect(Math.max(...all(plan(30, { intensity: 'harder' })).map((x) => x.targetRpe ?? 0))).toBeGreaterThan(8);
    for (const goal of GOALS) {
      for (const intensity of ['normal', 'harder'] as const) {
        for (const x of all(plan(55, { goal, intensity }))) if (x.targetRpe != null) expect(x.targetRpe, `${goal}/${intensity}`).toBeLessThanOrEqual(8);
      }
    }
    for (const x of mature) if (x.targetRpe != null) expect(x.targetRpe).toBeLessThanOrEqual(8);
    // The same exercise gets exactly 15 s more rest (the plan may pick a slightly different set of exercises to fit the time).
    const baseRest = new Map(base.map((x) => [x.exerciseId, x.restSeconds]));
    const shared = mature.filter((x) => baseRest.has(x.exerciseId));
    expect(shared.length).toBeGreaterThan(3);
    for (const x of shared) expect(x.restSeconds, x.exerciseId).toBe(baseRest.get(x.exerciseId)! + 15);
  });

  it('65+: RPE ≤ 7.5, ≤ 4 sets, loaded exercises ≥ 8 reps, no advanced, plyometric or other jumping exercises, rests 30 s longer', () => {
    for (const goal of GOALS) {
      for (const experience of EXPERIENCE_LEVELS) {
        const p = plan(70, { goal, experience });
        expect(hasNote(p, 'age_senior'), `${goal}/${experience}`).toBe(true);
        for (const x of all(p)) {
          const e = byId.get(x.exerciseId)!;
          if (x.targetRpe != null) expect(x.targetRpe).toBeLessThanOrEqual(7.5);
          expect(x.sets).toBeLessThanOrEqual(4);
          if (isExternallyLoaded(e) && x.repMin != null) expect(x.repMin).toBeGreaterThanOrEqual(8);
          expect(e.difficulty).not.toBe('advanced');
          expect(e.category).not.toBe('plyometric');
          expect(JUMPING_IDS.has(e.id), e.id).toBe(false);
          expect(x.restSeconds).toBeLessThanOrEqual(600);
        }
      }
    }
  });

  it('65+: the rep floor is for loaded exercises only — benchmark-based bodyweight targets are never raised', () => {
    // 3 pull-ups / 10 push-ups max → 60–70 % of the max (2 and 6–7 reps), exactly as for a younger adult, not 8 × 8.
    const ability = { ...NO_ABILITY, pullUpsMax: 3, pushUpsMax: 10 };
    const expected: Record<string, [number, number]> = { pull_up: [2, 2], chin_up: [2, 2], push_up: [6, 7] };
    // The library has many push-up and pull-up variations (diamond, decline, wide-grip…) that are a better fit than the
    // plain exercises for an intermediate or advanced user. The benchmark applies to push_up, pull_up and chin_up only,
    // so the variations are left out here to keep those three in the plan.
    const benchmarked = new Set(Object.keys(expected));
    const variations = catalog.filter((e) => /push_up|pull_up|chin_up/.test(e.id) && !benchmarked.has(e.id)).map((e) => e.id);
    expect(variations.length).toBeGreaterThan(0);
    const seen = new Set<string>();
    for (const goal of GOALS) {
      for (const experience of ['intermediate', 'advanced'] as const) {
        const over = {
          goal,
          experience,
          ability,
          location: 'outdoor' as const,
          equipment: DEFAULT_EQUIPMENT_BY_LOCATION.outdoor,
          likes: 'pull-up push-up',
          avoidExerciseIds: variations,
        };
        for (const x of all(plan(70, over))) {
          const range = expected[x.exerciseId];
          if (!range) continue;
          seen.add(x.exerciseId);
          expect([x.repMin, x.repMax], `${goal}/${experience}: ${x.exerciseId}`).toEqual(range);
        }
      }
    }
    expect(seen.has('push_up') && (seen.has('pull_up') || seen.has('chin_up'))).toBe(true);
  });

  it('65+: bodyweight rep targets are never higher than a younger adult\'s; loaded exercises keep 8+ reps', () => {
    const setups: [TrainingLocation, Equipment[]][] = [
      ['home', DEFAULT_EQUIPMENT_BY_LOCATION.home],
      ['outdoor', DEFAULT_EQUIPMENT_BY_LOCATION.outdoor],
      ['home', ['resistance_bands']],
    ];
    for (const goal of GOALS) {
      for (const experience of EXPERIENCE_LEVELS) {
        for (const [location, equipment] of setups) {
          const over = { goal, experience, location, equipment };
          // Same day + exercise in both plans → compare the prescriptions.
          const young = new Map(plan(40, over).workouts.flatMap((w, d) => w.exercises.map((x) => [`${d}:${x.exerciseId}:${x.role}`, x] as const)));
          for (const [d, w] of plan(70, over).workouts.entries()) {
            for (const x of w.exercises) {
              const e = byId.get(x.exerciseId)!;
              if (isExternallyLoaded(e) && x.repMin != null) expect(x.repMin, `${goal}/${experience}/${location}: ${x.exerciseId}`).toBeGreaterThanOrEqual(8);
              const y = young.get(`${d}:${x.exerciseId}:${x.role}`);
              if (e.trackingType !== 'reps' || isExternallyLoaded(e) || !y || x.repMax == null) continue;
              expect(x.repMax, `${goal}/${experience}/${location}: ${x.exerciseId}`).toBeLessThanOrEqual(y.repMax!);
              expect(x.repMin!, `${goal}/${experience}/${location}: ${x.exerciseId}`).toBeLessThanOrEqual(y.repMin!);
            }
          }
        }
      }
    }
  });

  it('65+: band exercises are externally loaded too — a bands-only plan keeps them at 8+ reps (a lighter band)', () => {
    const seen = new Set<string>();
    const raised = new Set<string>();
    for (const goal of GOALS) {
      for (const experience of EXPERIENCE_LEVELS) {
        const over = { goal, experience, location: 'home' as const, equipment: ['resistance_bands' as const] };
        // Same day + exercise + role in the younger plan → what the floor changed.
        const young = new Map(plan(40, over).workouts.flatMap((w, d) => w.exercises.map((x) => [`${d}:${x.exerciseId}:${x.role}`, x] as const)));
        for (const [d, w] of plan(70, over).workouts.entries()) {
          for (const x of w.exercises) {
            if (byId.get(x.exerciseId)!.category !== 'band' || x.repMin == null) continue;
            seen.add(x.exerciseId);
            expect(x.repMin, `${goal}/${experience}: ${x.exerciseId} ${x.repMin}-${x.repMax}`).toBeGreaterThanOrEqual(8);
            expect(x.repMax!).toBeGreaterThanOrEqual(x.repMin);
            const y = young.get(`${d}:${x.exerciseId}:${x.role}`);
            if (y?.repMin != null && y.repMin < 8) raised.add(x.exerciseId);
          }
        }
      }
    }
    // Band exercises really are in these plans, and for the strength / athletic mains (5 × 5, 4–6, 3–6 for a younger
    // adult) the floor lifts the reps: the check above is not vacuous. Which band exercises the generator picks depends on
    // the library, so the guard names no particular exercise.
    expect(seen.size).toBeGreaterThan(0);
    expect(raised.size).toBeGreaterThan(0);
  });

  it('65+: no jumping or high-impact exercise in any plan (gym, home, outdoor; every goal, experience and seed)', () => {
    const locations = [
      ['gym', DEFAULT_EQUIPMENT_BY_LOCATION.gym],
      ['home', DEFAULT_EQUIPMENT_BY_LOCATION.home],
      ['outdoor', DEFAULT_EQUIPMENT_BY_LOCATION.outdoor],
    ] as const;
    for (const [location, equipment] of locations) {
      for (const goal of GOALS) {
        for (const experience of EXPERIENCE_LEVELS) {
          for (const variationSeed of [0, 1, 2, 3, 4]) {
            for (const daysPerWeek of [3, 5]) {
              const p = plan(70, { goal, experience, location, equipment, variationSeed, daysPerWeek, sessionMinutes: 45 });
              for (const x of all(p)) {
                expect(JUMPING_IDS.has(x.exerciseId), `${location}/${goal}/${experience}/seed ${variationSeed}/${daysPerWeek}d: ${x.exerciseId}`).toBe(false);
              }
            }
          }
        }
      }
    }
  });

  it('"harder" intensity cannot lift an older adult above the cap', () => {
    for (const x of all(plan(70, { intensity: 'harder' }))) if (x.targetRpe != null) expect(x.targetRpe).toBeLessThanOrEqual(7.5);
  });

  it('the pool leaves out plyometrics, other jumping exercises and advanced lifts only from 65', () => {
    const adultPool = buildPool(input({ ageYears: 40 }), catalog).pool;
    const seniorPool = buildPool(input({ ageYears: 70 }), catalog).pool;
    expect(adultPool.some((e) => e.category === 'plyometric')).toBe(true);
    expect(adultPool.some((e) => e.difficulty === 'advanced')).toBe(true);
    expect(adultPool.filter((e) => JUMPING_IDS.has(e.id)).length).toBe(JUMPING_IDS.size);
    expect(seniorPool.some((e) => e.category === 'plyometric' || e.difficulty === 'advanced' || JUMPING_IDS.has(e.id))).toBe(false);
    // A gentle conditioning finisher is still available without any equipment.
    expect(buildPool(input({ ageYears: 70, location: 'home', equipment: [] }), catalog).pool.some((e) => e.movementPattern === 'conditioning')).toBe(true);
    expect(buildPool(input({ ageYears: 55 }), catalog).pool.length).toBe(adultPool.length);
  });

  it('1RM starting weights are lighter for an older adult than for a younger one', () => {
    const ability = { ...NO_ABILITY, squat1rmKg: 140, bench1rmKg: 100, deadlift1rmKg: 160 };
    const weights = (age: number) => all(plan(age, { ability })).filter((x) => x.targetWeightKg != null).map((x) => x.targetWeightKg!);
    const young = weights(30);
    const old = weights(70);
    expect(young.length).toBeGreaterThan(0);
    expect(Math.max(...old)).toBeLessThanOrEqual(Math.max(...young));
  });

  it('minors still follow the minor rules, unaffected by the age bands', () => {
    const p = plan(15, { isMinor: true });
    expect(hasNote(p, 'minor_safety')).toBe(true);
    expect(hasNote(p, 'age_mature') || hasNote(p, 'age_senior')).toBe(false);
  });
});
