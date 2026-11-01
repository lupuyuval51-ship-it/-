/** Static built-in content (exercises, foods, dishes, workouts, finishers). Versioned with the app, never fetched. */
import type { Language, Muscle } from '@lupu-fit/shared';
import { DISHES, EXERCISES, FINISHERS, FOODS, MEAL_TEMPLATES, READY_WORKOUTS, type ExerciseContent, type FinisherContent, type FoodContent, type ReadyWorkoutContent } from '@lupu-fit/shared/content';
import type { Dish } from '@lupu-fit/shared';

export { DISHES, EXERCISES, FINISHERS, FOODS, MEAL_TEMPLATES, READY_WORKOUTS };
export type { ExerciseContent, FinisherContent, FoodContent, ReadyWorkoutContent, Dish };

export const EXERCISE_BY_ID: ReadonlyMap<string, ExerciseContent> = new Map(EXERCISES.map((e) => [e.id, e]));
export const FOOD_BY_ID: ReadonlyMap<string, FoodContent> = new Map(FOODS.map((f) => [f.id, f]));
export const DISH_BY_ID: ReadonlyMap<string, Dish> = new Map(DISHES.map((d) => [d.id, d]));
export const READY_BY_ID: ReadonlyMap<string, ReadyWorkoutContent> = new Map(READY_WORKOUTS.map((w) => [w.id, w]));
export const FINISHER_BY_SPORT = (sport: string): FinisherContent[] => FINISHERS.filter((f) => f.sport === sport);

export const exName = (e: { nameHe: string; nameEn: string }, lang: Language): string => (lang === 'he' ? e.nameHe : e.nameEn);
export const exById = (id: string): ExerciseContent | undefined => EXERCISE_BY_ID.get(id);
export const nameOfExercise = (id: string, lang: Language): string => { const e = EXERCISE_BY_ID.get(id); return e ? exName(e, lang) : id; };
export const primaryMuscles = (e: ExerciseContent): readonly Muscle[] => e.primary;

/** The 18 muscles in display order. */
export const ALL_EQUIPMENT_FOR_PICKER = ['dumbbell', 'barbell', 'kettlebell', 'bench', 'resistance_band', 'pullup_bar', 'dip_station', 'trx', 'medicine_ball', 'swiss_ball', 'ab_wheel', 'jump_rope', 'box', 'rings', 'parallettes', 'ez_bar', 'foam_roller'] as const;
