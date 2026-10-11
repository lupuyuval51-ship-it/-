/**
 * Weekly split choice (pure). Shared so the generator preview in the client and the
 * server-side training engine always agree on the split for a given profile.
 */
import type { ExperienceLevel, Goal, SplitType } from './constants';
import type { WorkoutFocus } from './schemas/workouts';

export interface SplitChoice {
  splitType: SplitType;
  focuses: WorkoutFocus[];
  noteCode: string;
}

export function chooseSplit(daysPerWeek: number, experience: ExperienceLevel, goal: Goal): SplitChoice {
  const days = Math.min(7, Math.max(1, Math.round(daysPerWeek)));
  const hypertrophyOrStrength = experience !== 'beginner' && (goal === 'muscle_gain' || goal === 'strength');
  switch (days) {
    case 1:
      return { splitType: 'full_body', focuses: ['full_body'], noteCode: 'split_full_body' };
    case 2:
      return { splitType: 'full_body', focuses: ['full_body_a', 'full_body_b'], noteCode: 'split_full_body' };
    case 3:
      return hypertrophyOrStrength
        ? { splitType: 'push_pull_legs', focuses: ['push', 'pull', 'legs'], noteCode: 'split_push_pull_legs' }
        : { splitType: 'full_body', focuses: ['full_body_a', 'full_body_b', 'full_body_c'], noteCode: 'split_full_body' };
    case 4:
      return { splitType: 'upper_lower', focuses: ['upper_a', 'lower_a', 'upper_b', 'lower_b'], noteCode: 'split_upper_lower' };
    case 5:
      return hypertrophyOrStrength
        ? { splitType: 'upper_lower_full', focuses: ['upper', 'lower', 'push', 'pull', 'legs'], noteCode: 'split_upper_lower_ppl' }
        : { splitType: 'upper_lower_full', focuses: ['upper_a', 'lower_a', 'full_body', 'upper_b', 'lower_b'], noteCode: 'split_upper_lower_full' };
    default:
      return {
        splitType: 'push_pull_legs',
        focuses: ['push_a', 'pull_a', 'legs_a', 'push_b', 'pull_b', 'legs_b'],
        noteCode: 'split_push_pull_legs_x2',
      };
  }
}

