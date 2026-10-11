import { describe, expect, it } from 'vitest';
import { EXERCISE_LIBRARY } from '../../server/src/data/exercises/index';
import { ANIMATIONS } from './data/index';
import { computeFrame, loopTravel, validateAnimation } from './engine';

describe('exercise animations', () => {
  it('every library exercise has a demonstration animation', () => {
    const missing = EXERCISE_LIBRARY.filter((e) => !ANIMATIONS.has(e.id)).map((e) => e.id);
    expect(missing).toEqual([]);
    const unknown = [...ANIMATIONS.keys()].filter((id) => !EXERCISE_LIBRARY.some((e) => e.id === id));
    expect(unknown).toEqual([]);
  });

  it('every animation loops, stays above the floor and produces finite geometry', () => {
    for (const anim of ANIMATIONS.values()) expect(validateAnimation(anim), anim.id).toEqual([]);
  });

  it('loops seamlessly (first and last frames match)', () => {
    for (const anim of ANIMATIONS.values()) {
      const a = computeFrame(anim, 0).joints;
      const b = computeFrame(anim, 0.99999).joints;
      // Travelling movements (follow camera) may advance horizontally by exactly the loop travel.
      const travel = anim.camera?.followX ? loopTravel(anim) : 0;
      expect(Math.abs(a.hip[0] + travel - b.hip[0]) + Math.abs(a.hip[1] - b.hip[1]), anim.id).toBeLessThan(1);
      if (!anim.camera?.followX) expect(Math.abs(loopTravel(anim)), anim.id).toBeLessThan(1);
    }
  });
});
