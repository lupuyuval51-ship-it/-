import type { ExerciseAnimation } from '../types';

export const animations: ExerciseAnimation[] = [
  {
    // Dead hang → chin over the bar; knees bent so the feet clear the floor.
    id: 'pull_up',
    durationSec: 3.2,
    props: [{ kind: 'pullUpBar', x: 120, y: 16 }],
    keyframes: [
      { t: 0, pose: { hip: [118, 126], torso: -3, armNear: { target: [122, 16], bend: -1 }, legNear: { angles: [8, -80] } } },
      { t: 0.45, pose: { hip: [112, 82], torso: -10, armNear: { target: [122, 16], bend: -1 }, legNear: { angles: [12, -75] } } },
      { t: 0.6, pose: { hip: [112, 82], torso: -10, armNear: { target: [122, 16], bend: -1 }, legNear: { angles: [12, -75] } } },
      { t: 1, pose: { hip: [118, 126], torso: -3, armNear: { target: [122, 16], bend: -1 }, legNear: { angles: [8, -80] } } },
    ],
  },
];
