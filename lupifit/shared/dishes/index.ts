import { DISH_ROWS } from './data';

export const DISH_CATEGORIES = ['breakfast', 'lunch', 'dinner', 'snack', 'pre', 'post', 'drink'] as const;
export type DishCategory = (typeof DISH_CATEGORIES)[number];

export type DishTag = 'hp' | 'v' | 'vg' | 'q' | 'k';

export interface Dish {
  id: string;
  category: DishCategory;
  name: { he: string; en: string };
  /** Per one serving, as listed (approximate). */
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  tags: readonly DishTag[];
  /** Free-text ingredient lists (names, sometimes with a count); not exact quantities. */
  ingredients: { he: string; en: string };
}

const isCategory = (c: string): c is DishCategory => (DISH_CATEGORIES as readonly string[]).includes(c);

export const DISHES: readonly Dish[] = DISH_ROWS.map(([id, category, he, en, kcal, proteinG, carbsG, fatG, tags, ingHe, ingEn]) => {
  if (!isCategory(category)) throw new Error(`Unknown dish category "${category}" on ${id}`);
  return {
    id,
    category,
    name: { he, en },
    kcal,
    proteinG,
    carbsG,
    fatG,
    tags: tags.split(' ').filter(Boolean) as DishTag[],
    ingredients: { he: ingHe, en: ingEn },
  };
});

const BY_ID = new Map(DISHES.map((d) => [d.id, d]));

export const dishById = (id: string): Dish | undefined => BY_ID.get(id);

/** Photo of a dish, served from the app's own origin (client/public/dishes). */
export const dishImageUrl = (id: string): string => `/dishes/${id}.webp`;
