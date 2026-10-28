import type { FoodSeed } from '@shared/content';
import { foods as meatFish } from './meat_fish';
import { foods as eggsDairy } from './eggs_dairy';
import { foods as plantNutsFats } from './plant_nuts_fats';
import { foods as grainsStarches } from './grains_starches';
import { foods as produce } from './produce';
import { foods as preparedSnacksDrinks } from './prepared_snacks_drinks';

/**
 * The complete built-in food database. Values are per 100 g as eaten and are
 * typical reference values (USDA FoodData Central / common Israeli product labels);
 * users can correct any logged entry and create their own foods.
 */
export const FOOD_DATABASE: FoodSeed[] = [
  ...meatFish,
  ...eggsDairy,
  ...plantNutsFats,
  ...grainsStarches,
  ...produce,
  ...preparedSnacksDrinks,
];
