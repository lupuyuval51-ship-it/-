import type { ExerciseSeed } from '@shared/content';
import { exercises as chest } from './chest';
import { exercises as shouldersTriceps } from './shoulders_triceps';
import { exercises as backBiceps } from './back_biceps';
import { exercises as legs } from './legs';
import { exercises as hingeGlutes } from './hinge_glutes';
import { exercises as core } from './core';
import { exercises as conditioningMobility } from './conditioning_mobility';
import { exercises as chestPushExtra } from './chest_push_extra';
import { exercises as backPullExtra } from './back_pull_extra';
import { exercises as shouldersArmsExtra } from './shoulders_arms_extra';
import { exercises as legsExtra } from './legs_extra';
import { exercises as glutesHamstringsExtra } from './glutes_hamstrings_extra';
import { exercises as coreExtra } from './core_extra';
import { exercises as conditioningExtra } from './conditioning_extra';
import { exercises as sportPrepExtra } from './sport_prep_extra';

/** The complete built-in exercise library. */
export const EXERCISE_LIBRARY: ExerciseSeed[] = [
  ...chest,
  ...shouldersTriceps,
  ...backBiceps,
  ...legs,
  ...hingeGlutes,
  ...core,
  ...conditioningMobility,
  ...chestPushExtra,
  ...backPullExtra,
  ...shouldersArmsExtra,
  ...legsExtra,
  ...glutesHamstringsExtra,
  ...coreExtra,
  ...conditioningExtra,
  ...sportPrepExtra,
];
