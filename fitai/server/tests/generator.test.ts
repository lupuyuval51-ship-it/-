/**
 * Training-engine invariants, checked across a matrix of profiles (every location ×
 * experience × goal × 1–7 days × equipment sets × injuries × minors) plus targeted cases.
 * Pure: uses the built-in dataset directly, no database.
 */
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_EQUIPMENT_BY_LOCATION,
  EXPERIENCE_LEVELS,
  GOALS,
  LOCATIONS,
  type Equipment,
  type ExperienceLevel,
  type Goal,
  type InjuryArea,
  type TrainingLocation,
} from '@shared/constants';
import { EXERCISE_LIBRARY } from '../src/data/exercises';
import type { ExerciseRecord } from '../src/modules/exercises/repository';
import {
  chooseSplit,
  estimateWorkoutMinutes,
  generatePlan,
  generateWorkout,
  goalScheme,
  mainGroupsOfFocus,
  nameMatches,
  percentOfOneRm,
  roundToIncrement,
  seededUnit,
  stem,
  weeklySetsByGroup,
  type GeneratedPlan,
  type GeneratorInput,
} from '../src/modules/workouts/generator';

const catalog: ExerciseRecord[] = EXERCISE_LIBRARY.map((e) => ({ ...e, media: null }));
const byId = new Map(catalog.map((e) => [e.id, e]));
const NO_ABILITY = { pushUpsMax: null, pullUpsMax: null, plankSeconds: null, squat1rmKg: null, bench1rmKg: null, deadlift1rmKg: null };

function input(over: Partial<GeneratorInput> = {}): GeneratorInput {
  return {
    locale: 'en',
    goal: 'muscle_gain',
    experience: 'intermediate',
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

const allExercises = (p: GeneratedPlan) => p.workouts.flatMap((w) => w.exercises);
const hasNote = (p: GeneratedPlan, code: string, params?: Record<string, string | number>) =>
  p.notes.some((n) => n.code === code && (!params || Object.entries(params).every(([k, v]) => n.params?.[k] === v)));

const EQUIPMENT_SETS: Record<string, Equipment[]> = {
  none: [],
  homeBasic: ['dumbbells', 'resistance_bands'],
  park: ['pull_up_bar', 'dip_bars'],
  gym: DEFAULT_EQUIPMENT_BY_LOCATION.gym,
};
const INJURY_SETS: InjuryArea[][] = [[], ['knee', 'shoulder']];
const MINUTES_BY_DAYS: Record<number, number> = { 1: 90, 2: 75, 3: 60, 4: 45, 5: 30, 6: 20, 7: 15 };

interface Case {
  location: TrainingLocation;
  experience: ExperienceLevel;
  goal: Goal;
  days: number;
  equipment: string;
  injuries: InjuryArea[];
  isMinor: boolean;
}

const MATRIX: Case[] = [];
for (const location of LOCATIONS)
  for (const experience of EXPERIENCE_LEVELS)
    for (const goal of GOALS)
      for (let days = 1; days <= 7; days++)
        for (const equipment of Object.keys(EQUIPMENT_SETS))
          for (const injuries of INJURY_SETS)
            for (const isMinor of [false, true]) MATRIX.push({ location, experience, goal, days, equipment, injuries, isMinor });

function inputFor(c: Case): GeneratorInput {
  return input({
    location: c.location,
    experience: c.experience,
    goal: c.goal,
    daysPerWeek: c.days,
    sessionMinutes: MINUTES_BY_DAYS[c.days]!,
    equipment: EQUIPMENT_SETS[c.equipment]!,
    injuries: c.injuries,
    isMinor: c.isMinor,
    ability: { ...NO_ABILITY, squat1rmKg: 100, bench1rmKg: 80, deadlift1rmKg: 120 },
    variationSeed: c.days,
  });
}

describe('generator invariants across the profile matrix', () => {
  const plans = MATRIX.map((c) => ({ c, inp: inputFor(c), plan: generatePlan(inputFor(c), catalog) }));

  it(`covers ${MATRIX.length} profiles`, () => {
    expect(plans.length).toBe(3 * 3 * 5 * 7 * 4 * 2 * 2);
  });

  it('only uses available equipment, never contraindicated, avoided-mobility or duplicate exercises', () => {
    for (const { c, plan, inp } of plans) {
      for (const w of plan.workouts) {
        const ids = w.exercises.map((x) => x.exerciseId);
        expect(new Set(ids).size, `${JSON.stringify(c)} duplicates in ${w.focus}`).toBe(ids.length);
        for (const x of w.exercises) {
          const e = byId.get(x.exerciseId)!;
          expect(e, x.exerciseId).toBeDefined();
          expect(e.equipment.every((q) => inp.equipment.includes(q)), `${x.exerciseId} equipment for ${c.equipment}`).toBe(true);
          expect(e.contraindications.filter((a) => inp.injuries.includes(a)), `${x.exerciseId} injuries`).toEqual([]);
          expect(e.movementPattern).not.toBe('mobility');
        }
      }
    }
  });

  it('respects difficulty rules (beginners: beginner unless explained; never advanced below advanced; minors never advanced)', () => {
    for (const { c, plan } of plans) {
      for (const x of allExercises(plan)) {
        const e = byId.get(x.exerciseId)!;
        if (c.isMinor || c.experience !== 'advanced') expect(e.difficulty, `${x.exerciseId} ${JSON.stringify(c)}`).not.toBe('advanced');
        if (c.experience === 'beginner' && e.difficulty !== 'beginner') {
          expect(hasNote(plan, 'beginner_difficulty_relaxed', { pattern: e.movementPattern }), `${x.exerciseId} relaxed note`).toBe(true);
        }
      }
    }
  });

  it('applies minor safety: RPE ≤ 7, reps ≥ 6, no 1RM loads, safety note', () => {
    for (const { c, plan } of plans.filter((p) => p.c.isMinor)) {
      expect(hasNote(plan, 'minor_safety')).toBe(true);
      for (const x of allExercises(plan)) {
        if (x.targetRpe != null) expect(x.targetRpe, JSON.stringify(c)).toBeLessThanOrEqual(7);
        if (x.repMin != null) expect(x.repMin).toBeGreaterThanOrEqual(6);
        expect(x.targetWeightKg).toBeNull();
      }
    }
  });

  it('caps beginners at 3 sets', () => {
    for (const { plan } of plans.filter((p) => p.c.experience === 'beginner')) {
      for (const x of allExercises(plan)) expect(x.sets).toBeLessThanOrEqual(3);
    }
  });

  it('maps days per week to the split (7 → 6 training days + rest-day note)', () => {
    for (const { c, plan } of plans) {
      const expected = chooseSplit(c.days, c.experience, c.goal);
      expect(plan.splitType).toBe(expected.splitType);
      expect(plan.workouts).toHaveLength(Math.min(c.days, 6));
      expect(plan.daysPerWeek).toBe(Math.min(c.days, 6));
      expect(hasNote(plan, 'rest_day_recommended')).toBe(c.days === 7);
      expect(plan.generatorVersion).toBe('rules-1.0');
    }
  });

  it('respects the time budget (estimate ≤ minutes + 5), 3–8 exercises, consistent estimates', () => {
    for (const { c, plan, inp } of plans) {
      for (const w of plan.workouts) {
        expect(w.estimatedMinutes, `${JSON.stringify(c)} ${w.focus}`).toBeLessThanOrEqual(inp.sessionMinutes + 5);
        expect(w.exercises.length, `${JSON.stringify(c)} ${w.focus}`).toBeGreaterThanOrEqual(3);
        expect(w.exercises.length).toBeLessThanOrEqual(8);
        expect(estimateWorkoutMinutes(w.exercises, byId, inp.sessionMinutes)).toBe(w.estimatedMinutes);
      }
    }
  });

  it('prescribes by goal table and tracking type', () => {
    for (const { c, plan } of plans) {
      for (const x of allExercises(plan)) {
        const e = byId.get(x.exerciseId)!;
        expect(x.sets).toBeGreaterThanOrEqual(2);
        expect(x.sets).toBeLessThanOrEqual(6);
        if (x.targetSeconds != null) {
          expect(x.repMin).toBeNull();
          expect(x.repMax).toBeNull();
          expect(e.trackingType).toBe('time');
        } else {
          expect(x.repMin).not.toBeNull();
          expect(x.repMin!).toBeLessThanOrEqual(x.repMax!);
        }
        const benchmarkBased = x.notes.includes('Based on your max');
        if ((x.role === 'main' || (x.role === 'accessory' && e.trackingType === 'weight_reps')) && !benchmarkBased && x.targetSeconds == null) {
          const scheme = goalScheme(c.goal, x.role === 'main' ? 'main' : 'accessory', c.experience, !e.isCompound);
          const repMin = c.isMinor ? Math.max(6, scheme.repMin) : scheme.repMin;
          expect([x.repMin, x.repMax], `${x.exerciseId} ${JSON.stringify(c)}`).toEqual([repMin, Math.max(repMin, scheme.repMax)]);
          expect(x.targetRpe).toBe(c.isMinor ? Math.min(7, scheme.rpe) : scheme.rpe);
          expect(x.restSeconds).toBeLessThanOrEqual(scheme.rest);
          expect(x.sets).toBeLessThanOrEqual(Math.min(scheme.sets, c.experience === 'beginner' ? 3 : 10));
        }
        if (x.role === 'power') expect(byId.get(x.exerciseId)!.movementPattern).toBe('jump');
        if (x.role === 'conditioning') expect(e.movementPattern).toBe('conditioning');
      }
    }
  });

  it('adds goal modifiers: finishers for fat loss / general fitness / athletic, power first for athletic lower days', () => {
    for (const { c, plan } of plans) {
      const finisherGoal = c.goal === 'fat_loss' || c.goal === 'general_fitness' || c.goal === 'athletic_performance';
      for (const w of plan.workouts) {
        const conditioning = w.exercises.filter((x) => x.role === 'conditioning');
        if (!finisherGoal) expect(conditioning).toHaveLength(0);
        else if (MINUTES_BY_DAYS[c.days]! >= 45) {
          expect(conditioning, `${JSON.stringify(c)} ${w.focus}`).toHaveLength(1);
          expect(w.exercises.at(-1)!.role).toBe('conditioning');
        }
        const power = w.exercises.filter((x) => x.role === 'power');
        if (c.goal !== 'athletic_performance') expect(power).toHaveLength(0);
        else if (power.length) expect(w.exercises[0]!.role).toBe('power');
      }
      if (c.goal === 'athletic_performance' && c.injuries.includes('knee')) {
        // every jump loads the knees → the slot is skipped and explained
        expect(allExercises(plan).some((x) => x.role === 'power')).toBe(false);
        expect(hasNote(plan, 'pattern_unavailable', { pattern: 'jump' })).toBe(true);
      }
    }
  });

  it('sets adult 1RM-based loads rounded to the load increment', () => {
    let loaded = 0;
    for (const { c, plan } of plans.filter((p) => !p.c.isMinor && p.c.equipment === 'gym')) {
      for (const x of allExercises(plan)) {
        if (x.targetWeightKg == null) continue;
        loaded++;
        const e = byId.get(x.exerciseId)!;
        expect(e.equipment).toContain('barbell');
        const inc = e.loadIncrementKg ?? 2.5;
        expect(Math.abs(x.targetWeightKg / inc - Math.round(x.targetWeightKg / inc)), `${x.exerciseId} ${x.targetWeightKg}`).toBeLessThan(1e-9);
        expect(x.notes).toMatch(/1RM/);
      }
      if (allExercises(plan).some((x) => x.targetWeightKg != null)) expect(hasNote(plan, 'one_rm_used'), JSON.stringify(c)).toBe(true);
    }
    expect(loaded).toBeGreaterThan(100);
  });

  it('home / no equipment always yields a complete bodyweight plan with explanations', () => {
    for (const { c, plan } of plans.filter((p) => p.c.equipment === 'none')) {
      expect(hasNote(plan, 'bodyweight_plan')).toBe(true);
      expect(hasNote(plan, 'no_pulling_equipment'), JSON.stringify(c)).toBe(true);
      for (const w of plan.workouts) {
        expect(w.exercises.length).toBeGreaterThanOrEqual(3);
        for (const x of w.exercises) expect(byId.get(x.exerciseId)!.equipment).toEqual([]);
      }
    }
  });

  it('records injury exclusions and keeps consecutive split days off the same main muscle group', () => {
    for (const { c, plan } of plans) {
      for (const area of c.injuries) expect(hasNote(plan, 'excluded_for_injury', { area }), `${area} ${JSON.stringify(c)}`).toBe(true);
      if (plan.splitType === 'upper_lower' || plan.splitType === 'push_pull_legs' || (plan.splitType === 'upper_lower_full' && c.experience !== 'beginner')) {
        const focuses = plan.workouts.map((w) => w.focus);
        for (let i = 1; i < focuses.length; i++) {
          const prev = mainGroupsOfFocus(focuses[i - 1]!);
          const overlap = [...mainGroupsOfFocus(focuses[i]!)].filter((g) => prev.has(g));
          expect(overlap, `${focuses.join(',')}`).toEqual([]);
        }
      }
    }
  });

  it('reports weekly volume outside the 6–20 set range', () => {
    for (const { plan } of plans.slice(0, 400)) {
      const volume = weeklySetsByGroup(plan.workouts, byId);
      for (const n of plan.notes.filter((x) => x.code === 'low_volume_group' || x.code === 'high_volume_group')) {
        const g = n.params!.group as keyof typeof volume;
        expect(n.params!.sets).toBe(volume[g]);
        if (n.code === 'low_volume_group') expect(volume[g]).toBeLessThan(6);
        else expect(volume[g]).toBeGreaterThan(20);
      }
    }
  });

  it('localizes names and keeps generation_input free of PII and free text', () => {
    const plan = generatePlan(input({ locale: 'he', likes: 'my secret likes', planName: null }), catalog);
    expect(plan.name).toBe('בניית שריר · עליון / תחתון');
    expect(plan.workouts[0]!.name).toBe('פלג גוף עליון A');
    expect(JSON.stringify(plan.input)).not.toContain('secret');
    expect(plan.input).toMatchObject({ goal: 'muscle_gain', experience: 'intermediate', trainingDays: 4, generatorVersion: 'rules-1.0' });
    const named = generatePlan(input({ planName: 'My spring block' }), catalog);
    expect(named.name).toBe('My spring block');
    expect(generatePlan(input(), catalog).workouts.map((w) => w.name)).toEqual(['Upper body A', 'Lower body A', 'Upper body B', 'Lower body B']);
  });
});

describe('generator targeted rules', () => {
  it('is deterministic for a seed and varies with the seed', () => {
    const a = generatePlan(input({ variationSeed: 3 }), catalog);
    const b = generatePlan(input({ variationSeed: 3 }), catalog);
    expect(a).toEqual(b);
    const ids = (p: GeneratedPlan) => allExercises(p).map((x) => x.exerciseId).join(',');
    const variants = new Set([0, 1, 2, 3, 4, 5, 6, 7].map((seed) => ids(generatePlan(input({ variationSeed: seed }), catalog))));
    expect(variants.size).toBeGreaterThan(1);
    // Input order of the catalog does not matter.
    expect(ids(generatePlan(input({ variationSeed: 3 }), [...catalog].reverse()))).toBe(ids(a));
  });

  it('chooses splits per the table', () => {
    expect(chooseSplit(1, 'beginner', 'fat_loss').focuses).toEqual(['full_body']);
    expect(chooseSplit(2, 'advanced', 'strength').focuses).toEqual(['full_body_a', 'full_body_b']);
    expect(chooseSplit(3, 'beginner', 'muscle_gain').splitType).toBe('full_body');
    expect(chooseSplit(3, 'intermediate', 'general_fitness').splitType).toBe('full_body');
    expect(chooseSplit(3, 'intermediate', 'fat_loss').splitType).toBe('full_body');
    expect(chooseSplit(3, 'intermediate', 'muscle_gain').focuses).toEqual(['push', 'pull', 'legs']);
    expect(chooseSplit(3, 'advanced', 'strength').splitType).toBe('push_pull_legs');
    expect(chooseSplit(4, 'beginner', 'fat_loss').splitType).toBe('upper_lower');
    expect(chooseSplit(5, 'advanced', 'muscle_gain').focuses).toEqual(['upper', 'lower', 'push', 'pull', 'legs']);
    expect(chooseSplit(5, 'beginner', 'general_fitness').splitType).toBe('upper_lower_full');
    expect(chooseSplit(6, 'intermediate', 'fat_loss').focuses).toHaveLength(6);
    expect(chooseSplit(7, 'intermediate', 'fat_loss').focuses).toHaveLength(6);
  });

  it('follows the strength / muscle-gain tables for gym lifters', () => {
    const strength = generatePlan(input({ goal: 'strength', experience: 'advanced', daysPerWeek: 4, sessionMinutes: 90 }), catalog);
    const mains = allExercises(strength).filter((x) => x.role === 'main');
    expect(mains.length).toBeGreaterThanOrEqual(8);
    for (const m of mains) {
      expect(m.sets).toBeGreaterThanOrEqual(4);
      expect(m.sets).toBeLessThanOrEqual(5);
      expect(m.repMax).toBeLessThanOrEqual(6);
      expect(m.restSeconds).toBeGreaterThanOrEqual(150);
    }
    const beginner = generatePlan(input({ goal: 'strength', experience: 'beginner', daysPerWeek: 3, sessionMinutes: 60 }), catalog);
    for (const m of allExercises(beginner).filter((x) => x.role === 'main' && x.repMin != null)) {
      expect([m.sets, m.repMin, m.repMax, m.targetRpe]).toEqual([3, 5, 5, 7]);
    }
    const fatLoss = generatePlan(input({ goal: 'fat_loss', daysPerWeek: 3, sessionMinutes: 60 }), catalog);
    for (const x of allExercises(fatLoss).filter((y) => y.role === 'conditioning' && y.targetSeconds != null)) {
      expect(x.sets).toBeGreaterThanOrEqual(3);
      expect(x.sets).toBeLessThanOrEqual(4);
      expect(x.targetSeconds).toBeGreaterThanOrEqual(30);
      expect(x.targetSeconds).toBeLessThanOrEqual(45);
    }
  });

  it('uses bodyweight benchmarks (push-ups ≈ 60–70 % of max, plank, assisted pull-ups at 0)', () => {
    const plan = generatePlan(
      input({ location: 'outdoor', equipment: ['pull_up_bar', 'resistance_bands'], experience: 'intermediate', daysPerWeek: 3, goal: 'general_fitness', ability: { ...NO_ABILITY, pushUpsMax: 20, pullUpsMax: 0, plankSeconds: 100 } }),
      catalog,
    );
    const xs = allExercises(plan);
    expect(xs.some((x) => ['pull_up', 'chin_up', 'muscle_up'].includes(x.exerciseId))).toBe(false);
    expect(xs.some((x) => ['band_assisted_pull_up', 'negative_pull_up', 'band_row'].includes(x.exerciseId))).toBe(true);
    for (const x of xs.filter((y) => y.exerciseId === 'push_up')) expect([x.repMin, x.repMax]).toEqual([12, 14]);
    for (const x of xs.filter((y) => y.exerciseId === 'plank')) expect(x.targetSeconds).toBe(60);

    const weak = generatePlan(input({ location: 'home', equipment: [], experience: 'beginner', daysPerWeek: 2, ability: { ...NO_ABILITY, pushUpsMax: 2 } }), catalog);
    const pushes = allExercises(weak).filter((x) => byId.get(x.exerciseId)!.movementPattern === 'horizontal_push').map((x) => x.exerciseId);
    expect(pushes.length).toBeGreaterThan(0);
    expect(pushes.every((id) => id === 'knee_push_up' || id === 'incline_push_up')).toBe(true);
  });

  it('computes %1RM loads (8 reps @ RPE 8 ≈ 75 %) and rounds to increments', () => {
    expect(percentOfOneRm(8, 8)).toBeCloseTo(0.75, 2);
    expect(percentOfOneRm(5, 10)).toBeCloseTo(1 / (1 + 5 / 30), 5);
    expect(roundToIncrement(61.3, 2.5)).toBe(62.5);
    expect(roundToIncrement(103, 5)).toBe(105);
    expect(roundToIncrement(7.1, null)).toBe(7.5);
    const plan = generatePlan(input({ ability: { ...NO_ABILITY, squat1rmKg: 140 } }), catalog);
    const squat = allExercises(plan).find((x) => x.exerciseId === 'barbell_back_squat');
    expect(squat).toBeDefined();
    expect(squat!.targetWeightKg).toBe(roundToIncrement(140 * percentOfOneRm(squat!.repMax!, squat!.targetRpe!), 5));
    const minor = generatePlan(input({ isMinor: true, ability: { ...NO_ABILITY, squat1rmKg: 140 } }), catalog);
    expect(allExercises(minor).every((x) => x.targetWeightKg == null)).toBe(true);
  });

  it('honours avoid lists, avoided patterns, likes, dislikes and bodyweight preference', () => {
    const base = generatePlan(input({ goal: 'athletic_performance', daysPerWeek: 3 }), catalog);
    expect(allExercises(base).some((x) => x.role === 'power')).toBe(true);
    const noJump = generatePlan(input({ goal: 'athletic_performance', daysPerWeek: 3, avoidPatterns: ['jump'] }), catalog);
    expect(allExercises(noJump).some((x) => byId.get(x.exerciseId)!.movementPattern === 'jump')).toBe(false);
    expect(hasNote(noJump, 'pattern_avoided', { pattern: 'jump' })).toBe(true);

    const avoid = generatePlan(input({ avoidExerciseIds: ['barbell_back_squat', 'barbell_bench_press'] }), catalog);
    expect(allExercises(avoid).some((x) => ['barbell_back_squat', 'barbell_bench_press'].includes(x.exerciseId))).toBe(false);
    expect(hasNote(avoid, 'avoid_list_applied', { count: 2 })).toBe(true);

    const disliked = generatePlan(input({ dislikes: 'lunges, deadlifts' }), catalog);
    expect(allExercises(disliked).some((x) => /lunge|deadlift/i.test(byId.get(x.exerciseId)!.name.en))).toBe(false);
    const liked = generatePlan(input({ likes: 'kettlebell', goal: 'general_fitness', daysPerWeek: 3 }), catalog);
    expect(allExercises(liked).some((x) => x.exerciseId.startsWith('kettlebell'))).toBe(true);
    const likedHe = generatePlan(input({ likes: 'אני אוהב קטלבל', goal: 'general_fitness', daysPerWeek: 3 }), catalog);
    expect(allExercises(likedHe).some((x) => x.exerciseId.startsWith('kettlebell'))).toBe(true);

    const bw = generatePlan(input({ preferBodyweight: true, goal: 'general_fitness', daysPerWeek: 3 }), catalog);
    const bwShare = allExercises(bw).filter((x) => byId.get(x.exerciseId)!.equipment.length === 0).length / allExercises(bw).length;
    const normalShare = allExercises(generatePlan(input({ goal: 'general_fitness', daysPerWeek: 3 }), catalog)).filter((x) => byId.get(x.exerciseId)!.equipment.length === 0).length;
    expect(bwShare).toBeGreaterThan(0.5);
    expect(allExercises(bw).filter((x) => byId.get(x.exerciseId)!.equipment.length === 0).length).toBeGreaterThan(normalShare);
  });

  it('adds focus-group work and intensity modifiers', () => {
    const plain = generatePlan(input({ daysPerWeek: 3, goal: 'general_fitness', sessionMinutes: 60 }), catalog);
    const arms = generatePlan(input({ daysPerWeek: 3, goal: 'general_fitness', sessionMinutes: 60, focusMuscleGroups: ['arms'] }), catalog);
    expect(weeklySetsByGroup(arms.workouts, byId).arms).toBeGreaterThan(weeklySetsByGroup(plain.workouts, byId).arms);
    expect(hasNote(arms, 'focus_group', { group: 'arms' })).toBe(true);

    const total = (p: GeneratedPlan) => allExercises(p).reduce((s, x) => s + x.sets, 0);
    const easier = generatePlan(input({ intensity: 'easier' }), catalog);
    const harder = generatePlan(input({ intensity: 'harder', sessionMinutes: 90 }), catalog);
    expect(total(easier)).toBeLessThan(total(generatePlan(input(), catalog)));
    expect(hasNote(easier, 'intensity_easier')).toBe(true);
    expect(hasNote(harder, 'intensity_harder')).toBe(true);
    expect(Math.max(...allExercises(easier).map((x) => x.targetRpe ?? 0))).toBeLessThan(Math.max(...allExercises(generatePlan(input(), catalog)).map((x) => x.targetRpe ?? 0)));
  });

  it('explains missing pulling equipment and suggests nothing it cannot honour', () => {
    const plan = generatePlan(input({ location: 'home', equipment: ['dumbbells'], experience: 'beginner', goal: 'general_fitness', daysPerWeek: 2 }), catalog);
    // one-arm dumbbell row needs a bench → no pulling option with dumbbells only
    expect(hasNote(plan, 'no_pulling_equipment')).toBe(true);
    const withBands = generatePlan(input({ location: 'home', equipment: ['dumbbells', 'resistance_bands'], experience: 'beginner', goal: 'general_fitness', daysPerWeek: 2 }), catalog);
    expect(hasNote(withBands, 'no_pulling_equipment')).toBe(false);
    expect(allExercises(withBands).some((x) => ['horizontal_pull', 'vertical_pull'].includes(byId.get(x.exerciseId)!.movementPattern))).toBe(true);
  });

  it('regenerates a single day with the same focus, new exercises and plan context', () => {
    const plan = generatePlan(input({ variationSeed: 1 }), catalog);
    const day = plan.workouts[0]!;
    const others = plan.workouts.slice(1).flatMap((w) => w.exercises.map((x) => x.exerciseId));
    const { workout } = generateWorkout(input({ variationSeed: 1001 }), catalog, day.focus, {
      dayIndex: 0,
      usedElsewhere: others,
      currentIds: day.exercises.map((x) => x.exerciseId),
    });
    expect(workout.focus).toBe(day.focus);
    expect(workout.exercises.length).toBeGreaterThanOrEqual(3);
    const before = new Set(day.exercises.map((x) => x.exerciseId));
    expect(workout.exercises.filter((x) => !before.has(x.exerciseId)).length).toBeGreaterThan(0);
  });

  it('has working helpers (seeded hash, stemming, bilingual name matching)', () => {
    const v = seededUnit(1, 'slot', 'push_up');
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThan(1);
    expect(seededUnit(1, 'slot', 'push_up')).toBe(v);
    expect(seededUnit(2, 'slot', 'push_up')).not.toBe(v);
    expect(stem('squats')).toBe('squat');
    expect(stem('presses')).toBe('press');
    expect(stem('סקוואטים')).toBe('סקוואט');
    expect(nameMatches(byId.get('goblet_squat')!, ['squat'])).toBe(true);
    expect(nameMatches(byId.get('goblet_squat')!, ['סקוואט'])).toBe(true);
    expect(nameMatches(byId.get('push_up')!, ['squat'])).toBe(false);
  });
});
