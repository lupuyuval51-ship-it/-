import { STAND_HIP_Y } from '../engine';
import type { ExerciseAnimation } from '../types';

const FLOOR_ANKLE = 184;

export const animations: ExerciseAnimation[] = [
  {
    id: 'bodyweight_squat',
    durationSec: 3,
    keyframes: [
      { t: 0, pose: { hip: [112, STAND_HIP_Y], torso: 2, armNear: { angles: [80, 85] }, legNear: { target: [116, FLOOR_ANKLE] } } },
      { t: 0.5, pose: { hip: [86, 146], torso: 42, armNear: { angles: [88, 92] }, legNear: { target: [116, FLOOR_ANKLE] } } },
      { t: 1, pose: { hip: [112, STAND_HIP_Y], torso: 2, armNear: { angles: [80, 85] }, legNear: { target: [116, FLOOR_ANKLE] } } },
    ],
  },
];
