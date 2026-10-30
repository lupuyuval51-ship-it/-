import { describe, expect, it } from 'vitest';
import type { ReadyItemSeed, ReadyWorkoutSeed, SportBlockSeed } from '@shared/content';
import { EXERCISE_LIBRARY } from '../src/data/exercises/index';
import { exerciseSeconds } from '../src/modules/workouts/generator';
import {
  blockSeconds,
  deriveEquipment,
  deriveMuscles,
  effectiveEquipment,
  itemSeconds,
  lookupOf,
  missingSportBlocks,
  setShare,
  validateReadyCatalog,
  validateReadyWorkout,
  validateSportBlock,
  workoutMinutes,
} from '../src/modules/ready/rules';

const lookup = lookupOf(EXERCISE_LIBRARY);
const reps = (exerciseId: string, sets = 3, r: [number, number] = [8, 12], restSeconds = 60): ReadyItemSeed => ({ exerciseId, sets, reps: r, restSeconds });
const hold = (exerciseId: string, seconds = 30, sets = 3, restSeconds = 45): ReadyItemSeed => ({ exerciseId, sets, seconds, restSeconds });

const chestBeginner: ReadyWorkoutSeed = {
  id: 'chest_home_bodyweight_push_basics',
  name: { en: 'Push-up basics', he: 'יסודות שכיבות סמיכה' },
  description: { en: 'Builds the chest with easy push-up variations, then a plank for the core.', he: 'בונה את החזה בעזרת וריאציות קלות של שכיבות סמיכה, ומסיים בפלאנק.' },
  focus: 'chest',
  mode: 'bodyweight',
  level: 'beginner',
  places: ['home', 'outdoor', 'gym'],
  items: [reps('incline_push_up'), reps('knee_push_up'), reps('push_up', 3, [6, 10]), hold('plank')],
};

const bodyweightBlock: SportBlockSeed = {
  id: 'general_bodyweight',
  sport: 'general',
  variant: 'bodyweight',
  name: { en: 'General fitness finisher', he: 'סיום כושר כללי' },
  description: { en: 'Five short stations that raise the heart rate and wake up the legs and core.', he: 'חמש תחנות קצרות שמעלות דופק ומעירות רגליים וליבה.' },
  items: ['mountain_climber', 'jumping_jack', 'wall_sit', 'high_knees', 'plank'].map((id) => hold(id, 40, 2, 20)),
};

const errorsOf = (w: ReadyWorkoutSeed) => validateReadyWorkout(w, lookup).errors;
const withItems = (items: ReadyItemSeed[], patch: Partial<ReadyWorkoutSeed> = {}): ReadyWorkoutSeed => ({ ...chestBeginner, items, ...patch });

describe('time model', () => {
  it('matches the plan generator for every combination', () => {
    for (const unilateral of [false, true]) {
      for (const trackingType of ['reps', 'time', 'weight_reps'] as const) {
        const e = { unilateral, trackingType };
        const item: ReadyItemSeed = trackingType === 'time' ? hold('plank', 35, 3, 45) : reps('push_up', 3, [8, 12], 45);
        const rx = { sets: 3, targetSeconds: trackingType === 'time' ? 35 : null, restSeconds: 45 };
        expect(itemSeconds(item, e)).toBe(exerciseSeconds(rx, e));
      }
    }
  });

  it('adds the warm-up to a workout and none to a block', () => {
    const minutes = workoutMinutes(chestBeginner.items, lookup);
    const body = chestBeginner.items.reduce((n, it) => n + itemSeconds(it, lookup.get(it.exerciseId)!), 0);
    expect(minutes).toBe(6 + Math.ceil(body / 60));
    expect(blockSeconds(bodyweightBlock.items, lookup)).toBe(5 * 2 * (40 + 20));
  });
});

describe('derived facts', () => {
  it('derives equipment, muscles and set share from the exercises', () => {
    expect(deriveEquipment(chestBeginner.items, lookup)).toEqual([]);
    expect(deriveMuscles(chestBeginner.items, lookup)[0]).toBe('chest');
    expect(setShare(chestBeginner.items, lookup, ['chest'])).toBeCloseTo(9 / 12);
    expect(deriveEquipment([reps('dumbbell_bench_press'), reps('pull_up')], lookup)).toEqual(['dumbbells', 'bench', 'pull_up_bar']);
  });

  it('assumes everything at the gym and only the ticked gear elsewhere', () => {
    expect(effectiveEquipment('gym', [])).toContain('barbell');
    expect(effectiveEquipment('home', undefined)).toEqual([]);
    expect(effectiveEquipment('outdoor', undefined)).toEqual(['pull_up_bar', 'dip_bars']);
    expect(effectiveEquipment('home', ['bench', 'dumbbells', 'bench'])).toEqual(['dumbbells', 'bench']);
  });
});

describe('ready workout validation', () => {
  it('accepts a well-formed workout', () => {
    expect(validateReadyWorkout(chestBeginner, lookup).errors).toEqual([]);
  });

  it('rejects unknown exercises, repeats and the wrong prescription kind', () => {
    expect(errorsOf(withItems([...chestBeginner.items, reps('no_such_exercise')])).join('\n')).toMatch(/unknown exercise "no_such_exercise"/);
    expect(errorsOf(withItems([...chestBeginner.items, reps('push_up', 2)])).join('\n')).toMatch(/push_up appears twice/);
    expect(errorsOf(withItems([reps('incline_push_up'), reps('knee_push_up'), reps('push_up'), reps('plank')])).join('\n')).toMatch(/plank is timed/);
    expect(errorsOf(withItems([reps('incline_push_up'), reps('knee_push_up'), reps('push_up'), hold('crunch')])).join('\n')).toMatch(/crunch is rep-tracked/);
  });

  it('keeps bodyweight workouts free of external load and weight workouts loaded', () => {
    const loaded = withItems([reps('dumbbell_bench_press'), reps('knee_push_up'), reps('push_up'), hold('plank')]);
    expect(errorsOf(loaded).join('\n')).toMatch(/mode bodyweight/);
    const notLoaded = withItems(chestBeginner.items, { mode: 'weights' });
    expect(errorsOf(notLoaded).join('\n')).toMatch(/mode weights/);
  });

  it('only lists places that have the gear', () => {
    const barbell = withItems([reps('barbell_bench_press', 3, [6, 10]), reps('incline_barbell_bench_press', 3, [6, 10]), reps('dumbbell_fly'), reps('close_grip_bench_press', 3, [6, 10])], { mode: 'weights', level: 'intermediate', places: ['home', 'gym'] });
    expect(errorsOf(barbell).join('\n')).toMatch(/place home does not have barbell/);
    expect(errorsOf({ ...barbell, places: ['gym'] }).join('\n')).not.toMatch(/place/);
  });

  it('keeps the level honest', () => {
    const hard = withItems([reps('incline_push_up'), reps('knee_push_up'), reps('push_up'), reps('archer_push_up', 3, [4, 6])]);
    expect(errorsOf(hard).join('\n')).toMatch(/level beginner but contains a advanced exercise \(archer_push_up\)/);
    expect(errorsOf(withItems(chestBeginner.items.map((it) => ({ ...it, sets: 4 })))).join('\n')).toMatch(/at most 3 sets/);
  });

  it('requires the focus muscle to be trained', () => {
    const wrongFocus = withItems([reps('glute_bridge'), reps('bodyweight_squat'), reps('reverse_lunge'), hold('plank')]);
    expect(errorsOf(wrongFocus).join('\n')).toMatch(/focus chest needs 55%/);
    const legs = withItems([reps('bodyweight_squat'), reps('reverse_lunge'), reps('glute_bridge'), reps('single_leg_romanian_deadlift'), reps('standing_calf_raise')], { focus: 'legs', level: 'intermediate' });
    expect(errorsOf(legs).join('\n')).not.toMatch(/focus/);
    const upper = withItems([reps('push_up'), reps('incline_push_up'), reps('knee_push_up'), reps('decline_push_up')], { focus: 'upper_body', level: 'intermediate' });
    expect(errorsOf(upper).join('\n')).toMatch(/needs a push .* and a pull/);
  });

  it('keeps the length sensible', () => {
    const tiny = withItems(chestBeginner.items.map((it) => ({ ...it, sets: 1, restSeconds: 15 })));
    expect(errorsOf(tiny).join('\n')).toMatch(/estimated \d+ min, must be 20-75/);
  });

  it('keeps heavy singles out of loaded work', () => {
    const heavy = withItems([reps('barbell_bench_press', 3, [1, 3]), reps('incline_barbell_bench_press', 3, [6, 10]), reps('dumbbell_fly'), reps('close_grip_bench_press', 3, [6, 10])], { mode: 'weights', level: 'intermediate', places: ['gym'] });
    expect(errorsOf(heavy).join('\n')).toMatch(/minimum reps must be at least 5/);
  });
});

describe('sport block validation', () => {
  it('accepts a ten-minute block', () => {
    expect(validateSportBlock(bodyweightBlock, lookup).errors).toEqual([]);
  });

  it('wants about ten minutes and matching variant and id', () => {
    const short = { ...bodyweightBlock, items: bodyweightBlock.items.map((it) => ({ ...it, sets: 1 })) };
    expect(validateSportBlock(short, lookup).errors.join('\n')).toMatch(/takes 5\.0 min/);
    expect(validateSportBlock({ ...bodyweightBlock, id: 'general_gear' }, lookup).errors.join('\n')).toMatch(/id must be "general_bodyweight"/);
  });

  it('checks the gear of each variant and keeps the gentle one low impact', () => {
    const gearless = { ...bodyweightBlock, id: 'general_gear', variant: 'gear' as const };
    expect(validateSportBlock(gearless, lookup).errors.join('\n')).toMatch(/must use some equipment/);
    const gentle = { ...bodyweightBlock, id: 'general_gentle', variant: 'gentle' as const };
    const errors = validateSportBlock(gentle, lookup).errors.join('\n');
    expect(errors).toMatch(/high-impact exercise (high_knees|jumping_jack)/);
  });
});

describe('catalog validation', () => {
  it('flags duplicate ids, names and identical or near-identical exercise lists', () => {
    const copy: ReadyWorkoutSeed = { ...chestBeginner };
    const r = validateReadyCatalog([chestBeginner, copy], [], lookup);
    const text = r.errors.join('\n');
    expect(text).toMatch(/duplicate id/);
    expect(text).toMatch(/duplicate English name/);
    expect(text).toMatch(/same exercises as/);
    const near: ReadyWorkoutSeed = { ...chestBeginner, id: 'chest_home_bodyweight_push_basics_2', name: { en: 'Push-up basics 2', he: 'יסודות שכיבות סמיכה 2' }, items: [...chestBeginner.items, reps('decline_push_up')], level: 'intermediate' };
    expect(validateReadyCatalog([chestBeginner, near], [], lookup).errors.join('\n')).toMatch(/they share 80% of their exercises/);
    const different: ReadyWorkoutSeed = { ...near, items: [reps('decline_push_up'), reps('diamond_push_up'), reps('pike_push_up'), reps('push_up'), hold('side_plank')] };
    expect(validateReadyCatalog([chestBeginner, different], [], lookup).errors.join('\n')).not.toMatch(/they share/);
  });

  it('reports the missing sport blocks', () => {
    expect(missingSportBlocks([bodyweightBlock])).toHaveLength(13 * 3 - 1);
    expect(missingSportBlocks([bodyweightBlock])).not.toContain('general_bodyweight');
  });
});
