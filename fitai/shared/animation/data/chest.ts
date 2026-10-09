import type { ExerciseAnimation } from '../types';

export const animations: ExerciseAnimation[] = [
  {
    // Rigid plank rotating around the toes; hands stay planted under the shoulders.
    id: 'push_up',
    durationSec: 2.6,
    keyframes: [
      { t: 0, pose: { hip: [106, 151], torso: 68, armNear: { target: [152, 182] }, legNear: { target: [30, 182] }, footNear: 15 } },
      { t: 0.5, pose: { hip: [111, 173], torso: 84, armNear: { target: [152, 182] }, legNear: { target: [30, 182] }, footNear: 15 } },
      { t: 1, pose: { hip: [106, 151], torso: 68, armNear: { target: [152, 182] }, legNear: { target: [30, 182] }, footNear: 15 } },
    ],
  },
];
