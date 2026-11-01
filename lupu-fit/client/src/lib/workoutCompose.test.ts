import { describe, expect, it } from 'vitest';
import { READY_WORKOUTS, FINISHERS, EXERCISES, EXERCISE_BY_ID } from '../data/content.ts';
import { filterReadyWorkouts, focusCounts, type ExerciseDef, type GeneratedPlan } from '@lupu-fit/shared';
import {
  addExercise, alternativesFor, applyProgression, buildSessionPayload, defaultVariant, EMPTY_FILTER, filterStep, finisherPlanned, lastWorkingLoad, localDateStr, mergeAvoidIds, missingFinisherGear,
  moveExercise, parsePreferences, pickFinisher, prescriptionForSwap, recentFocusFromSessions, removeExercise, sanitizeFilter, swapExercise, toReadyFilter, type ExerciseHistory,
} from './workoutCompose.ts';

const presc = { sets: 3, repsMin: 8, repsMax: 10, rpe: 7, restSec: 90, loadKg: null, durationSec: null };

describe('parsePreferences', () => {
  it('maps Hebrew and English "no jumping" to plyometric / high-impact ids', () => {
    for (const text of ['בלי קפיצות', 'ללא קפיצות בבקשה', 'no jumping', 'No Jumps please', 'without jumping']) {
      const r = parsePreferences(text, EXERCISES);
      expect(r.rules, text).toEqual(['no_jumping']);
      expect(r.avoidIds).toEqual(expect.arrayContaining(['jump_squat', 'box_jump', 'broad_jump']));
    }
  });
  it('maps "no shoulder work" to exercises whose PRIMARY muscles are shoulders only', () => {
    for (const text of ['בלי כתפיים', 'no shoulder work', 'No shoulders']) {
      const r = parsePreferences(text, EXERCISES);
      expect(r.rules).toEqual(['no_shoulders']);
      expect(r.avoidIds.length).toBeGreaterThan(5);
      for (const id of r.avoidIds) expect(EXERCISE_BY_ID.get(id)!.primary.some((m) => ['front_delts', 'side_delts', 'rear_delts'].includes(m))).toBe(true);
    }
    const chestPress = EXERCISE_BY_ID.get('barbell_bench_press')!;
    expect(chestPress.primary).not.toContain('front_delts');
    expect(parsePreferences('no shoulder work', EXERCISES).avoidIds).not.toContain('barbell_bench_press');
  });
  it('maps "no running" to locomotion ids', () => {
    for (const text of ['בלי ריצה', 'no running']) {
      const r = parsePreferences(text, EXERCISES);
      expect(r.rules).toEqual(['no_running']);
      expect(r.avoidIds).toEqual(expect.arrayContaining(['mountain_climbers', 'high_knees']));
      for (const id of r.avoidIds) expect(EXERCISE_BY_ID.get(id)!.pattern).toBe('locomotion');
    }
  });
  it('records focus as a note only and never adds avoid ids for it', () => {
    for (const text of ['דגש על רגליים', 'focus on legs', 'Focus legs']) {
      const r = parsePreferences(text, EXERCISES);
      expect(r.focus).toEqual(['legs']); expect(r.avoidIds).toEqual([]); expect(r.rules).toEqual([]);
    }
  });
  it('combines rules, ignores unknown text and is deterministic', () => {
    const text = 'בלי קפיצות, no running, focus on legs. אני אוהב אימון קצר';
    const a = parsePreferences(text, EXERCISES); const b = parsePreferences(text, EXERCISES);
    expect(a).toEqual(b);
    expect(a.rules.sort()).toEqual(['no_jumping', 'no_running']);
    expect(parsePreferences('שבוע טוב', EXERCISES)).toEqual({ avoidIds: [], rules: [], focus: [] });
  });
  it('merges manual and parsed ids, de-duplicated and capped for the server', () => {
    expect(mergeAvoidIds(['a', 'b'], ['b', 'c'])).toEqual({ ids: ['a', 'b', 'c'], truncated: false });
    const many = Array.from({ length: 70 }, (_, i) => `x${i}`);
    const r = mergeAvoidIds(['m'], many); expect(r.ids).toHaveLength(60); expect(r.truncated).toBe(true); expect(r.ids[0]).toBe('m');
  });
});

describe('buildSessionPayload', () => {
  const items = [{ exerciseId: 'push_up', prescription: presc }, { exerciseId: 'squat', prescription: { ...presc, loadKg: 40 } }];
  it('without a finisher: sport null, only main rows', () => {
    const b = buildSessionPayload({ name: 'Chest', source: 'ready', sourceId: 'rw1', localDate: '2026-11-02', items });
    expect(b.sport).toBeNull(); expect(b.exercises).toHaveLength(2); expect(b.exercises.every((e) => !e.isFinisher)).toBe(true);
    expect(b.exercises[1]!.planned.loadKg).toBe(40); expect('readiness' in b).toBe(false);
  });
  it('with a finisher: appended rows carry isFinisher + sport and the exact planned shape', () => {
    const f = pickFinisher(FINISHERS, 'soccer', 'bodyweight')!;
    const b = buildSessionPayload({ name: 'Chest', source: 'ready', sourceId: 'rw1', localDate: '2026-11-02', readiness: 'easier', items, finisher: f });
    expect(b.sport).toBe('soccer'); expect(b.readiness).toBe('easier');
    expect(b.exercises).toHaveLength(2 + f.items.length);
    const rows = b.exercises.slice(2);
    expect(rows.every((e) => e.isFinisher && e.sport === 'soccer')).toBe(true);
    expect(rows[0]!.planned).toEqual({ sets: f.rounds, repsMin: 1, repsMax: 1, rpe: 6, restSec: f.items[0]!.restSec, loadKg: null, durationSec: f.items[0]!.workSec });
    expect(b.exercises.slice(0, 2).every((e) => !e.isFinisher)).toBe(true);
    expect(finisherPlanned(2, { workSec: 40, restSec: 20 }).durationSec).toBe(40);
  });
  it('local date is the local calendar day, not UTC', () => {
    expect(localDateStr(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(localDateStr(new Date(2026, 11, 31, 0, 1))).toBe('2026-12-31');
  });
});

describe('finisher helpers', () => {
  it('every sport has all three variants', () => {
    const sports = new Set(FINISHERS.map((f) => f.sport));
    expect(sports.size).toBe(13);
    for (const s of sports) for (const v of ['bodyweight', 'gear', 'gentle'] as const) expect(pickFinisher(FINISHERS, s, v), `${s}/${v}`).not.toBeNull();
  });
  it('seniors and lower-body injuries default to gentle', () => {
    expect(defaultVariant(70, [])).toBe('gentle'); expect(defaultVariant(30, [])).toBe('bodyweight'); expect(defaultVariant(30, ['knee'])).toBe('gentle'); expect(defaultVariant(30, ['wrist'])).toBe('bodyweight');
  });
  it('gear is missing unless owned', () => {
    const gear = pickFinisher(FINISHERS, 'soccer', 'gear')!;
    expect(missingFinisherGear(gear, EXERCISE_BY_ID, []).length).toBeGreaterThan(0);
    const needs = missingFinisherGear(gear, EXERCISE_BY_ID, []);
    expect(missingFinisherGear(gear, EXERCISE_BY_ID, needs)).toEqual([]);
    expect(missingFinisherGear(pickFinisher(FINISHERS, 'soccer', 'gentle')!, EXERCISE_BY_ID, [])).toEqual([]);
  });
});

describe('ready filter flow', () => {
  it('walks the 4 steps', () => {
    expect(filterStep(EMPTY_FILTER)).toBe(1);
    expect(filterStep({ ...EMPTY_FILTER, place: 'home' })).toBe(2);
    expect(filterStep({ ...EMPTY_FILTER, place: 'home', equipmentDone: true })).toBe(3);
    expect(filterStep({ ...EMPTY_FILTER, place: 'gym', equipmentDone: true })).toBe(3); // gym skips step 2
    expect(filterStep({ ...EMPTY_FILTER, place: 'gym', mode: 'weights' })).toBe(4);
  });
  it('home + no equipment + bodyweight: chest results are bodyweight chest workouts without gear', () => {
    const s = { ...EMPTY_FILTER, place: 'home' as const, equipmentDone: true, mode: 'bodyweight' as const, focus: 'chest' as const };
    const list = filterReadyWorkouts(READY_WORKOUTS, toReadyFilter(s, true));
    expect(list.length).toBeGreaterThan(0);
    for (const w of list) { expect(w.place).toBe('home'); expect(w.mode).toBe('bodyweight'); expect(w.focus).toBe('chest'); expect(w.equipment).toEqual([]); }
  });
  it('empty equipment with weights mode has no home workouts; counts follow the filter', () => {
    expect(filterReadyWorkouts(READY_WORKOUTS, toReadyFilter({ ...EMPTY_FILTER, place: 'home', equipmentDone: true, mode: 'weights' }, true))).toEqual([]);
    const counts = focusCounts(READY_WORKOUTS, toReadyFilter({ ...EMPTY_FILTER, place: 'gym', mode: 'weights' }, false));
    expect(counts.size).toBeGreaterThan(3);
  });
  it('a gym ignores owned equipment', () => {
    const f = toReadyFilter({ ...EMPTY_FILTER, place: 'gym', mode: 'weights', equipment: ['dumbbell'] }, true);
    expect(f.ownedEquipment).toBeUndefined();
  });
  it('sanitizes stored preferences', () => {
    expect(sanitizeFilter('x', ['dumbbell'])).toBeNull();
    const r = sanitizeFilter({ place: 'mars', equipment: ['dumbbell', 'laser'], mode: 'weights', maxMinutes: -3 }, ['dumbbell'])!;
    expect(r.place).toBeNull(); expect(r.equipment).toEqual(['dumbbell']); expect(r.mode).toBe('weights'); expect(r.maxMinutes).toBeNull();
  });
  it('recent focus is recovered from session names in either language', () => {
    const w = READY_WORKOUTS[0]!;
    expect(recentFocusFromSessions([{ name: w.nameEn }, { name: 'unknown' }, { name: w.nameHe }], READY_WORKOUTS)).toEqual([w.focus, w.focus]);
  });
});

describe('plan editing and progression', () => {
  const plan = (): GeneratedPlan => ({ days: [{ day: 'full_a', estimatedMinutes: 0, exercises: [{ exerciseId: 'push_up', prescription: presc }, { exerciseId: 'barbell_bench_press', prescription: { ...presc, loadKg: 60 } }] }], notes: [] });
  it('reorders, adds, removes (never the last) and recomputes minutes', () => {
    let p = moveExercise(plan(), 0, 0, 1);
    expect(p.days[0]!.exercises.map((e) => e.exerciseId)).toEqual(['barbell_bench_press', 'push_up']);
    expect(p.days[0]!.estimatedMinutes).toBeGreaterThan(0);
    p = addExercise(p, 0, 'squat', presc); expect(p.days[0]!.exercises).toHaveLength(3);
    p = removeExercise(removeExercise(p, 0, 0), 0, 0); expect(p.days[0]!.exercises).toHaveLength(1);
    expect(removeExercise(p, 0, 0).days[0]!.exercises).toHaveLength(1);
  });
  it('swap drops the old load and keeps sets', () => {
    const to = EXERCISE_BY_ID.get('push_up') as ExerciseDef;
    const p = swapExercise(plan(), 0, 1, 'push_up', prescriptionForSwap({ ...presc, loadKg: 60 }, to));
    expect(p.days[0]!.exercises[1]!.prescription.loadKg).toBeNull(); expect(p.days[0]!.exercises[1]!.prescription.sets).toBe(3);
  });
  it('alternatives are flagged unsafe with a reason', () => {
    const ex = EXERCISES.find((e) => e.easierAlternatives.length > 0 && e.easierAlternatives.some((id) => EXERCISE_BY_ID.get(id)!.equipment.some((q) => q !== 'none')))!;
    const alts = alternativesFor(ex, 'easier', EXERCISE_BY_ID as ReadonlyMap<string, ExerciseDef>, { injuries: [], avoidIds: [], available: [], bucket: 'adult', mode: 'weights', maxDifficulty: 'advanced' });
    const unsafe = alts.filter((a) => !a.safe);
    expect(unsafe.length).toBeGreaterThan(0); expect(unsafe[0]!.reason).toBe('equipment');
  });
  const h = (reps: number, kg: number, date: string): ExerciseHistory => ({ sessionId: date, date, sets: [1, 2, 3].map((n) => ({ setNo: n, reps, weightKg: kg, durationSec: null, rpe: 8 })) });
  it('progression: increases after two top-of-range sessions, and changes nothing without history', () => {
    const none = applyProgression(plan(), new Map(), EXERCISE_BY_ID);
    expect(none.changes).toEqual([]); expect(none.withoutHistory).toBe(1); expect(none.plan).toEqual(plan());
    const histories = new Map([['barbell_bench_press', [h(10, 60, '2026-11-02'), h(10, 60, '2026-10-30')]]]);
    const out = applyProgression(plan(), histories, EXERCISE_BY_ID);
    expect(out.changes).toHaveLength(1); expect(out.changes[0]!).toMatchObject({ exerciseId: 'barbell_bench_press', from: 60, to: 62.5, action: 'increase' });
    expect(out.plan.days[0]!.exercises[1]!.prescription.loadKg).toBe(62.5);
    expect(plan().days[0]!.exercises[1]!.prescription.loadKg).toBe(60); // input is not mutated
  });
  it('last working load = heaviest weight of the newest weighted session', () => {
    expect(lastWorkingLoad([])).toBeNull();
    expect(lastWorkingLoad([h(8, 0, 'a'), h(8, 45, 'b')])).toBe(45);
  });
});
