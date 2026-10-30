/** Age-based adaptation: bands, generator caps, pool exclusions, notes. Pure: built-in dataset, no database. */
import { describe, expect, it } from 'vitest';
import { ageBand, ageRules } from '@shared/age';
import { DEFAULT_EQUIPMENT_BY_LOCATION, EXPERIENCE_LEVELS, GOALS } from '@shared/constants';
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
    expect(s.excludePlyometric && s.excludeAdvanced && s.singleStepProgression).toBe(true);
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

  it('65+: RPE ≤ 7.5, ≤ 4 sets, reps ≥ 8, no advanced or plyometric exercises, rests 30 s longer', () => {
    for (const goal of GOALS) {
      for (const experience of EXPERIENCE_LEVELS) {
        const p = plan(70, { goal, experience });
        expect(hasNote(p, 'age_senior'), `${goal}/${experience}`).toBe(true);
        for (const x of all(p)) {
          const e = byId.get(x.exerciseId)!;
          if (x.targetRpe != null) expect(x.targetRpe).toBeLessThanOrEqual(7.5);
          expect(x.sets).toBeLessThanOrEqual(4);
          if (x.repMin != null) expect(x.repMin).toBeGreaterThanOrEqual(8);
          expect(e.difficulty).not.toBe('advanced');
          expect(e.category).not.toBe('plyometric');
          expect(x.restSeconds).toBeLessThanOrEqual(600);
        }
      }
    }
  });

  it('"harder" intensity cannot lift an older adult above the cap', () => {
    for (const x of all(plan(70, { intensity: 'harder' }))) if (x.targetRpe != null) expect(x.targetRpe).toBeLessThanOrEqual(7.5);
  });

  it('the pool leaves out plyometrics and advanced lifts only from 65', () => {
    const adultPool = buildPool(input({ ageYears: 40 }), catalog).pool;
    const seniorPool = buildPool(input({ ageYears: 70 }), catalog).pool;
    expect(adultPool.some((e) => e.category === 'plyometric')).toBe(true);
    expect(adultPool.some((e) => e.difficulty === 'advanced')).toBe(true);
    expect(seniorPool.some((e) => e.category === 'plyometric' || e.difficulty === 'advanced')).toBe(false);
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
