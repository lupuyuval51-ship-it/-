import type { ExerciseSeed } from '@shared/content';
import { exercises as chest } from './chest';
import { exercises as shouldersTriceps } from './shoulders_triceps';
import { exercises as backBiceps } from './back_biceps';
import { exercises as legs } from './legs';
import { exercises as hingeGlutes } from './hinge_glutes';
import { exercises as core } from './core';
import { exercises as conditioningMobility } from './conditioning_mobility';

/** The complete built-in exercise library. */
export const EXERCISE_LIBRARY: ExerciseSeed[] = [
  ...chest,
  ...shouldersTriceps,
  ...backBiceps,
  ...legs,
  ...hingeGlutes,
  ...core,
  ...conditioningMobility,
];
