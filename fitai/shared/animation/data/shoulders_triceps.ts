import { STAND_HIP_Y } from '../engine';
import type { ExerciseAnimation } from '../types';

export const animations: ExerciseAnimation[] = [
  {
    id: 'dumbbell_lateral_raise',
    durationSec: 3,
    view: 'front',
    props: [{ kind: 'dumbbell', at: 'hands' }],
    keyframes: [
      { t: 0, pose: { hip: [120, STAND_HIP_Y], torso: 0, armNear: { angles: [10, 12] }, legNear: { angles: [4, 4] } } },
      { t: 0.5, pose: { hip: [120, STAND_HIP_Y], torso: 0, armNear: { angles: [85, 88] }, legNear: { angles: [4, 4] } } },
      { t: 1, pose: { hip: [120, STAND_HIP_Y], torso: 0, armNear: { angles: [10, 12] }, legNear: { angles: [4, 4] } } },
    ],
  },
];
