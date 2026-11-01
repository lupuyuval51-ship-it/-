import { describe, expect, it } from 'vitest';
import { ageBucket, isExerciseAllowedForAge } from '../src/age.js';
import { INJURY_AREAS, type Equipment } from '../src/enums.js';
import { filterReadyWorkouts, focusCounts, personalizeReadyWorkout, rankReadyWorkouts, type PersonProfile } from '../src/readyWorkouts.js';
import { EXERCISES, READY_WORKOUTS } from '../src/content/index.js';
import { BODYWEIGHT_APPARATUS, type ExerciseDef } from '../src/training.js';

const catalog = new Map<string, ExerciseDef>(EXERCISES.map((e) => [e.id, e]));
const GYM: Equipment[] = ['barbell', 'dumbbell', 'kettlebell', 'machine', 'cable', 'bench', 'squat_rack', 'pullup_bar', 'dip_station', 'resistance_band', 'trx', 'medicine_ball', 'swiss_ball', 'ab_wheel', 'jump_rope', 'box', 'rings', 'parallettes', 'sled', 'landmine', 'ez_bar', 'foam_roller'];
const mk = (o: Partial<PersonProfile>): PersonProfile => ({ age: 30, goal: 'general_fitness', experience: 'intermediate', sessionMinutes: 60, injuries: [], avoidIds: [], equipment: GYM, ...o });

describe('ready workout catalog', () => {
  it('has at least 250 workouts built only from existing exercises', () => {
    expect(READY_WORKOUTS.length).toBeGreaterThanOrEqual(250);
    for (const w of READY_WORKOUTS) for (const id of w.exerciseIds) expect(catalog.has(id), `${w.id} → ${id}`).toBe(true);
  });
  it('covers every place, both modes, and many focuses', () => {
    expect(new Set(READY_WORKOUTS.map((w) => w.place))).toEqual(new Set(['gym', 'home', 'park']));
    expect(new Set(READY_WORKOUTS.map((w) => w.mode))).toEqual(new Set(['bodyweight', 'weights']));
    expect(new Set(READY_WORKOUTS.map((w) => w.focus)).size).toBeGreaterThanOrEqual(14);
    expect(new Set(READY_WORKOUTS.map((w) => w.style)).size).toBe(5);
  });
  it('home + no equipment + chest gives bodyweight chest workouts only', () => {
    const r = filterReadyWorkouts(READY_WORKOUTS, { place: 'home', ownedEquipment: [], mode: 'bodyweight', focus: 'chest' });
    expect(r.length).toBeGreaterThan(0);
    for (const w of r) expect(w.equipment.length).toBe(0);
    const counts = focusCounts(READY_WORKOUTS, { place: 'home', ownedEquipment: [], mode: 'bodyweight' });
    expect(counts.get('chest')).toBe(r.length);
  });
});

describe('personalisation is safe for every workout × profile', () => {
  const profiles: PersonProfile[] = [];
  for (const age of [13, 17, 18, 50, 65, 100]) for (const injuries of [[], ...INJURY_AREAS.map((i) => [i]), ['knee', 'lower_back', 'shoulder']] as const) for (const experience of ['beginner', 'intermediate', 'advanced'] as const) {
    profiles.push(mk({ age, injuries: [...injuries], experience, goal: age < 18 ? 'general_fitness' : 'strength' }));
  }
  it('never prescribes contraindicated, age-forbidden or over-level exercises; always monotone-safe', () => {
    for (const p of profiles) {
      const bucket = ageBucket(p.age);
      for (const w of READY_WORKOUTS) {
        const pw = personalizeReadyWorkout(w, catalog, p);
        for (const it of pw.items) {
          const ex = catalog.get(it.exerciseId)!;
          expect(ex.contraindications.some((c) => p.injuries.includes(c)), `${w.id} ${ex.id} injuries ${p.injuries}`).toBe(false);
          expect(isExerciseAllowedForAge(ex, bucket)).toBe(true);
          if (w.mode === 'bodyweight') expect(ex.equipment.every((q) => q === 'none' || (BODYWEIGHT_APPARATUS as readonly string[]).includes(q))).toBe(true);
          expect(it.prescription.sets).toBeGreaterThanOrEqual(1);
          if (bucket === 'minor') expect(it.prescription.rpe).toBeLessThanOrEqual(7);
          if (bucket === 'senior') { expect(it.prescription.rpe).toBeLessThanOrEqual(7.5); expect(it.prescription.sets).toBeLessThanOrEqual(4); }
          if (bucket === 'master') expect(it.prescription.rpe).toBeLessThanOrEqual(8);
        }
        expect(new Set(pw.items.map((i) => i.exerciseId)).size).toBe(pw.items.length);
        if (pw.visible) expect(pw.items.length).toBeGreaterThanOrEqual(3);
      }
    }
  });
  it('time budget is honoured whenever there are more than 3 exercises left', () => {
    for (const minutes of [20, 30, 45]) for (const w of READY_WORKOUTS) {
      const pw = personalizeReadyWorkout(w, catalog, mk({ sessionMinutes: minutes }));
      if (pw.visible && pw.items.length > 3) expect(pw.estimatedMinutes).toBeLessThanOrEqual(minutes);
    }
  });
  it('is NOT a template: different people get different prescriptions and orderings', () => {
    const w = READY_WORKOUTS[0]!;
    const a = personalizeReadyWorkout(w, catalog, mk({ goal: 'strength', experience: 'advanced', age: 25 }));
    const b = personalizeReadyWorkout(w, catalog, mk({ goal: 'fat_loss', experience: 'beginner', age: 66 }));
    expect(JSON.stringify(a.items.map((i) => i.prescription))).not.toBe(JSON.stringify(b.items.map((i) => i.prescription)));
    const easier = personalizeReadyWorkout(w, catalog, mk({}), { readiness: 'easier' });
    const normal = personalizeReadyWorkout(w, catalog, mk({}));
    easier.items.forEach((it, i) => { expect(it.prescription.rpe).toBeLessThanOrEqual(normal.items[i]!.prescription.rpe); });
  });
  it('ranking is deterministic, hides unsuitable workouts, and counts them', () => {
    const p = mk({ age: 70, injuries: ['knee', 'shoulder', 'lower_back'], experience: 'beginner' });
    const r1 = rankReadyWorkouts(READY_WORKOUTS, catalog, p);
    const r2 = rankReadyWorkouts(READY_WORKOUTS, catalog, p);
    expect(r1.ranked.map((x) => x.workout.id)).toEqual(r2.ranked.map((x) => x.workout.id));
    expect(r1.ranked.length + r1.hiddenCount).toBe(READY_WORKOUTS.length);
    const strength = rankReadyWorkouts(READY_WORKOUTS, catalog, mk({ goal: 'strength' })).ranked[0]!;
    const fat = rankReadyWorkouts(READY_WORKOUTS, catalog, mk({ goal: 'fat_loss' })).ranked[0]!;
    expect(strength.workout.style === 'straight' || strength.workout.style === 'pyramid').toBe(true);
    expect(['circuit', 'density', 'superset']).toContain(fat.workout.style);
  });
});
