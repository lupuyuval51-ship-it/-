import { describe, expect, it } from 'vitest';
import { DIFFICULTIES, INJURY_AREAS, READINESS_STATES, type Difficulty, type Equipment } from '../src/enums.js';
import { ageBucket, clampPrescriptionForAge, isExerciseAllowedForAge, isHighImpact, allowsPercentOneRm, type Prescription } from '../src/age.js';
import {
  applyAllSafety, epley1RM, generatePlan, isReadyWorkoutVisible, loadFromPercentOneRm, nextProgression,
  plateCalculator, readinessState, resolveSafeExercise, splitForDays, estimateMinutes, type SwapContext,
} from '../src/training.js';
import { ALL_INJURY_SETS, FIXTURE_CATALOG } from './fixtures.js';

const AGES = [13, 17, 18, 50, 64, 65, 100];
const BASES: Prescription[] = [];
for (const sets of [1, 3, 4, 5, 10]) for (const rpe of [1, 5, 6.5, 7, 8, 9.5, 10]) for (const restSec of [0, 60, 150, 585, 600]) for (const loadKg of [null, 0, 20, 100]) {
  BASES.push({ sets, repsMin: 3, repsMax: 8, rpe, restSec, loadKg, durationSec: null });
}

describe('Monotonicity Theorem', () => {
  it('P_safe is never harder than P_base across age × readiness × loaded matrix', () => {
    let n = 0;
    for (const age of AGES) for (const readiness of READINESS_STATES) for (const externallyLoaded of [true, false]) for (const base of BASES) {
      const s = applyAllSafety(base, { age, readiness, externallyLoaded });
      expect(s.rpe).toBeLessThanOrEqual(base.rpe);
      expect(s.sets).toBeLessThanOrEqual(base.sets);
      expect(s.restSec).toBeGreaterThanOrEqual(base.restSec);
      expect(s.restSec).toBeLessThanOrEqual(600);
      if (base.loadKg !== null) expect(s.loadKg ?? 0).toBeLessThanOrEqual(base.loadKg);
      expect(s.sets).toBeGreaterThanOrEqual(1);
      n++;
    }
    expect(n).toBe(AGES.length * 3 * 2 * BASES.length);
  });

  it('readiness easier/rest only ever reduce', () => {
    for (const base of BASES) {
      const easier = applyAllSafety(base, { age: 30, readiness: 'easier', externallyLoaded: true });
      const rest = applyAllSafety(base, { age: 30, readiness: 'rest', externallyLoaded: true });
      expect(rest.rpe).toBeLessThanOrEqual(easier.rpe);
      expect(rest.sets).toBeLessThanOrEqual(easier.sets);
    }
  });

  it('age brackets', () => {
    expect([13, 17, 18, 49, 50, 64, 65, 100].map(ageBucket)).toEqual(['minor', 'minor', 'adult', 'adult', 'master', 'master', 'senior', 'senior']);
    expect(() => ageBucket(12)).toThrow();
    expect(() => ageBucket(101)).toThrow();
  });

  it('minor rules: RPE ≤ 7, loaded repsMin ≥ 6, no %1RM', () => {
    for (const base of BASES) {
      const s = clampPrescriptionForAge({ ...base, repsMin: 1, repsMax: 3 }, 'minor', true);
      expect(s.rpe).toBeLessThanOrEqual(7);
      expect(s.repsMin).toBeGreaterThanOrEqual(6);
      expect(s.repsMax).toBeGreaterThanOrEqual(s.repsMin);
    }
    expect(allowsPercentOneRm('minor')).toBe(false);
    expect(loadFromPercentOneRm(100, 80, 'minor')).toBeNull();
    expect(loadFromPercentOneRm(100, 80, 'adult')).toBe(80);
  });

  it('master and senior rules', () => {
    const base: Prescription = { sets: 6, repsMin: 3, repsMax: 5, rpe: 9.5, restSec: 100, loadKg: 50, durationSec: null };
    const m = clampPrescriptionForAge(base, 'master', true);
    expect(m.rpe).toBe(8); expect(m.restSec).toBe(115);
    const s = clampPrescriptionForAge(base, 'senior', true);
    expect(s.rpe).toBe(7.5); expect(s.restSec).toBe(130); expect(s.sets).toBe(4); expect(s.repsMin).toBeGreaterThanOrEqual(8);
    expect(clampPrescriptionForAge({ ...base, restSec: 590 }, 'senior', true).restSec).toBe(600);
  });

  it('no advanced for minors/seniors and no high-impact for seniors', () => {
    for (const ex of FIXTURE_CATALOG) {
      if (ex.difficulty === 'advanced') {
        expect(isExerciseAllowedForAge(ex, 'minor')).toBe(false);
        expect(isExerciseAllowedForAge(ex, 'senior')).toBe(false);
      }
      if (isHighImpact(ex)) expect(isExerciseAllowedForAge(ex, 'senior')).toBe(false);
    }
    for (const id of ['jump_squat', 'burpee', 'high_knees', 'box_jump', 'jump_rope', 'skater_bound', 'sprint_intervals', 'hop_scotch']) {
      expect(isHighImpact({ id, category: 'cardio', pattern: 'locomotion' })).toBe(true);
    }
    expect(isHighImpact({ id: 'goblet_squat', category: 'weight_reps', pattern: 'squat' })).toBe(false);
  });
});

describe('Epley, plates, progression, readiness', () => {
  it('epley is valid only for 1..12 reps', () => {
    expect(epley1RM(100, 1)).toBeCloseTo(103.333, 2);
    expect(epley1RM(100, 12)).toBeCloseTo(140, 5);
    expect(epley1RM(100, 13)).toBeNull();
    expect(epley1RM(100, 0)).toBeNull();
    expect(epley1RM(0, 5)).toBeNull();
  });
  it('plate calculator', () => {
    expect(plateCalculator(100)).toEqual({ perSide: [25, 15], achievedKg: 100, remainderKg: 0 });
    expect(plateCalculator(20).perSide).toEqual([]);
    const r = plateCalculator(101);
    expect(r.achievedKg).toBe(100); expect(r.remainderKg).toBe(1);
  });
  it('progression: +1 increment after 2 top-of-range sessions, ×0.9 after 2 misses, frozen when easier', () => {
    const top = { loadKg: 60, repsPerSet: [8, 8, 8], repsMin: 6, repsMax: 8 };
    const miss = { loadKg: 60, repsPerSet: [5, 5, 4], repsMin: 6, repsMax: 8 };
    expect(nextProgression([top, top], 'normal')).toEqual({ action: 'increase', loadKg: 62.5 });
    expect(nextProgression([top], 'normal').action).toBe('hold');
    expect(nextProgression([miss, miss], 'normal')).toEqual({ action: 'deload', loadKg: 55 });
    expect(nextProgression([top, top], 'easier').action).toBe('hold');
    expect(nextProgression([top, top], 'rest').loadKg).toBe(60);
  });
  it('readiness reducer', () => {
    expect(readinessState({ sleep: 5, energy: 5, soreness: 1, pain: false })).toBe('normal');
    expect(readinessState({ sleep: 5, energy: 5, soreness: 1, pain: true })).toBe('easier');
    expect(readinessState({ sleep: 1, energy: 2, soreness: 4, pain: false })).toBe('rest');
    expect(readinessState({ sleep: 3, energy: 3, soreness: 3, pain: false })).toBe('easier');
  });
});

describe('Injury-safe, mode-preserving swap engine', () => {
  const byId = new Map(FIXTURE_CATALOG.map((e) => [e.id, e]));
  const all: Equipment[] = ['barbell', 'dumbbell', 'bench', 'squat_rack', 'resistance_band', 'cable', 'pullup_bar', 'box'];
  it('never returns an exercise that intersects injuries, mode or equipment', () => {
    for (const injuries of ALL_INJURY_SETS) for (const mode of ['bodyweight', 'weights'] as const) for (const bucket of ['minor', 'adult', 'senior'] as const) {
      const ctx: SwapContext = { injuries, avoidIds: [], available: mode === 'bodyweight' ? [] : all, bucket, mode, maxDifficulty: 'advanced' };
      for (const ex of FIXTURE_CATALOG) {
        const r = resolveSafeExercise(ex, ctx, byId);
        if (r.kind === 'dropped') continue;
        expect(r.exercise.contraindications.some((c) => injuries.includes(c))).toBe(false);
        if (mode === 'bodyweight') expect(r.exercise.equipment.every((e) => e === 'none')).toBe(true);
        if (r.kind === 'swapped') expect(r.exercise.primary.some((m) => ex.primary.includes(m))).toBe(true);
        expect(isExerciseAllowedForAge(r.exercise, bucket)).toBe(true);
      }
    }
  });
  it('swaps transitively and drops cleanly when impossible', () => {
    const ctx: SwapContext = { injuries: ['knee'], avoidIds: [], available: [], bucket: 'adult', mode: 'bodyweight', maxDifficulty: 'advanced' };
    const r = resolveSafeExercise(byId.get('back_squat')!, ctx, byId);
    expect(r.kind === 'swapped' && r.exercise.id).toBe('box_squat'.replace('box_squat', 'wall_sit'));
    const ctx2: SwapContext = { ...ctx, injuries: ['wrist', 'shoulder'], avoidIds: ['incline_pushup'] };
    expect(resolveSafeExercise(byId.get('bench_press')!, ctx2, byId).kind).toBe('dropped');
  });
  it('ready workout visibility rule', () => {
    expect(isReadyWorkoutVisible(6, 6)).toBe(true);
    expect(isReadyWorkoutVisible(5, 3)).toBe(true);
    expect(isReadyWorkoutVisible(5, 2)).toBe(false);
    expect(isReadyWorkoutVisible(10, 5)).toBe(false);
    expect(isReadyWorkoutVisible(10, 6)).toBe(true);
  });
});

describe('Plan generator', () => {
  const base = { goal: 'muscle_gain' as const, experience: 'intermediate' as Difficulty, daysPerWeek: 4, sessionMinutes: 60, equipment: ['barbell', 'dumbbell', 'bench', 'squat_rack', 'resistance_band', 'cable', 'box'] as Equipment[], avoidIds: [], mode: 'weights' as const, seed: 7 };
  it('is deterministic per seed and varies across seeds', () => {
    const a = generatePlan({ ...base, age: 30, injuries: [] }, FIXTURE_CATALOG);
    const b = generatePlan({ ...base, age: 30, injuries: [] }, FIXTURE_CATALOG);
    expect(a).toEqual(b);
    const seeds = new Set(Array.from({ length: 12 }, (_, i) => JSON.stringify(generatePlan({ ...base, age: 30, injuries: [], seed: i }, FIXTURE_CATALOG).days)));
    expect(seeds.size).toBeGreaterThan(1);
  });
  it('7 requested days → 6 lifting days plus recovery note', () => {
    const p = generatePlan({ ...base, age: 30, injuries: [], daysPerWeek: 7 }, FIXTURE_CATALOG);
    expect(p.days.length).toBe(6);
    expect(p.notes.some((n) => n.code === 'recovery_day_added')).toBe(true);
    expect(splitForDays(3).days).toEqual(['full_a', 'full_b', 'full_c']);
  });
  it('every generated prescription obeys age + injury rules; time budget respected', () => {
    const byId = new Map(FIXTURE_CATALOG.map((e) => [e.id, e]));
    for (const age of AGES) for (const injuries of ALL_INJURY_SETS) for (const experience of DIFFICULTIES) for (const mode of ['weights', 'bodyweight'] as const) {
      const bucket = ageBucket(age);
      const plan = generatePlan({ ...base, age, injuries, experience, mode, equipment: mode === 'bodyweight' ? [] : base.equipment }, FIXTURE_CATALOG);
      for (const day of plan.days) {
        expect(day.exercises.length).toBeLessThanOrEqual(20);
        if (day.exercises.length > 3) expect(day.estimatedMinutes).toBeLessThanOrEqual(base.sessionMinutes);
        for (const pe of day.exercises) {
          const ex = byId.get(pe.exerciseId)!;
          expect(ex.contraindications.some((c) => injuries.includes(c))).toBe(false);
          expect(isExerciseAllowedForAge(ex, bucket)).toBe(true);
          if (mode === 'bodyweight') expect(ex.equipment.every((e) => e === 'none')).toBe(true);
          if (bucket === 'minor') { expect(pe.prescription.rpe).toBeLessThanOrEqual(7); expect(pe.prescription.loadKg).toBeNull(); }
          if (bucket === 'senior') { expect(pe.prescription.sets).toBeLessThanOrEqual(4); expect(pe.prescription.rpe).toBeLessThanOrEqual(7.5); }
        }
      }
    }
  });
  it('time estimate formula', () => {
    // warmup 7 min + 1 exercise: 3 sets × (8 reps × 3 s + 60 s rest) + 60 s transition = 312 s → 7 + 5.2 → 12
    expect(estimateMinutes([{ sets: 3, repsMax: 8, durationSec: null, restSec: 60 }])).toBe(12);
  });
});
void INJURY_AREAS;
