import type { ExerciseAnimation } from '../types';
import { animations as backBiceps } from './back_biceps';
import { animations as chest } from './chest';
import { animations as conditioningMobility } from './conditioning_mobility';
import { animations as core } from './core';
import { animations as hingeGlutes } from './hinge_glutes';
import { animations as legs } from './legs';
import { animations as shouldersTriceps } from './shoulders_triceps';

const ALL: ExerciseAnimation[] = [...chest, ...shouldersTriceps, ...backBiceps, ...legs, ...hingeGlutes, ...core, ...conditioningMobility];

/** Exercise id → demonstration animation. */
export const ANIMATIONS: ReadonlyMap<string, ExerciseAnimation> = new Map(ALL.map((a) => [a.id, a]));

export const hasAnimation = (exerciseId: string) => ANIMATIONS.has(exerciseId);
export const getAnimation = (exerciseId: string) => ANIMATIONS.get(exerciseId) ?? null;
