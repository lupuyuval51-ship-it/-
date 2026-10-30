import { describe, expect, it } from 'vitest';
import { DIFFICULTIES, LOCATIONS, READY_FOCUSES, SPORTS, SPORT_BLOCK_VARIANTS, TRAINING_MODES } from '@shared/constants';
import { EXERCISE_LIBRARY } from '../src/data/exercises/index';
import { READY_WORKOUTS } from '../src/data/ready-workouts/index';
import { SPORT_BLOCKS } from '../src/data/sport-blocks/index';
import { deriveEquipment, lookupOf, missingSportBlocks, validateReadyCatalog } from '../src/modules/ready/rules';

/** The shipped catalog: what the product owner asked for, kept true as the data changes. */
const lookup = lookupOf(EXERCISE_LIBRARY);
const result = validateReadyCatalog(READY_WORKOUTS, SPORT_BLOCKS, lookup);

describe('shipped ready-workout catalog', () => {
  it('passes every rule', () => {
    expect(result.errors).toEqual([]);
  });

  it('has at least 200 workouts spread over every muscle focus, place, mode and level', () => {
    expect(READY_WORKOUTS.length).toBeGreaterThanOrEqual(200);
    for (const f of READY_FOCUSES) expect(result.stats.byFocus[f], f).toBeGreaterThanOrEqual(6);
    for (const p of LOCATIONS) expect(result.stats.byPlace[p], p).toBeGreaterThanOrEqual(60);
    for (const m of TRAINING_MODES) expect(result.stats.byMode[m], m).toBeGreaterThanOrEqual(80);
    for (const d of DIFFICULTIES) expect(result.stats.byLevel[d], d).toBeGreaterThanOrEqual(25);
    expect(result.stats.noEquipment).toBeGreaterThanOrEqual(40);
  });

  it('offers something for every place and mode with no equipment beyond what that place has by default', () => {
    for (const place of ['home', 'outdoor'] as const) {
      const bodyweightNoGear = READY_WORKOUTS.filter((w) => w.places.includes(place) && w.mode === 'bodyweight' && deriveEquipment(w.items, lookup).length === 0);
      expect(bodyweightNoGear.length, place).toBeGreaterThanOrEqual(30);
    }
    expect(READY_WORKOUTS.filter((w) => w.places.includes('gym') && w.mode === 'weights').length).toBeGreaterThanOrEqual(60);
  });

  it('has the three finisher variants for every sport', () => {
    expect(missingSportBlocks(SPORT_BLOCKS)).toEqual([]);
    expect(SPORT_BLOCKS).toHaveLength(SPORTS.length * SPORT_BLOCK_VARIANTS.length);
  });
});
