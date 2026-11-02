import { FOODS_ALL, EXERCISES_ALL, DISHES_RAW_ALL, FINISHERS_ALL } from './sources.js';
import { buildDish, buildMealTemplate, foodMap } from './build.js';
import { MEAL_TEMPLATES_RAW } from './data/mealTemplates.js';
import { READY_WORKOUTS_GENERATED } from './data/readyWorkouts.generated.js';

export * from './types.js';
export { buildDish, buildMealTemplate, foodMap, sumMacros } from './build.js';

export const EXERCISES = EXERCISES_ALL;
export const FOODS = FOODS_ALL;
export const FINISHERS = FINISHERS_ALL;
export const READY_WORKOUTS = READY_WORKOUTS_GENERATED;
const FOOD_BY_ID = foodMap(FOODS);
export const DISHES = DISHES_RAW_ALL.map((d) => buildDish(d, FOOD_BY_ID));
export const MEAL_TEMPLATES = MEAL_TEMPLATES_RAW.map((m) => buildMealTemplate(m, FOOD_BY_ID));

export { DISH_IMAGE_IDS } from './data/dishImages.generated.js';
