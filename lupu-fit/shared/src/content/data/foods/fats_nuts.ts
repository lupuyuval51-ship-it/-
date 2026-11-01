import type { FoodContent } from '../../types.js';

type Diets = FoodContent['diets'];
type Tags = FoodContent['restrictionTags'];

const VEGAN: Diets = ['vegan', 'vegetarian', 'pescatarian', 'kosher'];
const VEGETARIAN: Diets = ['vegetarian', 'pescatarian', 'kosher'];
const PLANT_TAGS: Tags = ['no_pork', 'halal', 'kosher', 'lactose_free'];
const PLANT_LOW_NA_TAGS: Tags = ['no_pork', 'halal', 'kosher', 'low_sodium', 'lactose_free'];

export const FATS_NUTS_FOODS: FoodContent[] = [
  // ---- Tree nuts ----
  {
    id: 'almonds_raw', nameHe: 'שקדים טבעיים', nameEn: 'Almonds, Raw', category: 'nuts_seeds',
    kcal: 579, proteinG: 21.2, carbsG: 21.6, fatG: 49.9, fiberG: 12.5,
    servingG: 28, servingNameHe: 'חופן קטן', servingNameEn: '1 small handful',
    allergens: ['tree_nut'], diets: VEGAN, restrictionTags: PLANT_LOW_NA_TAGS, kosherClass: 'pareve',
  },
  {
    id: 'walnuts_raw', nameHe: 'אגוזי מלך', nameEn: 'Walnuts, Raw', category: 'nuts_seeds',
    kcal: 654, proteinG: 15.2, carbsG: 13.7, fatG: 65.2, fiberG: 6.7,
    servingG: 28, servingNameHe: 'חופן קטן', servingNameEn: '1 small handful',
    allergens: ['tree_nut'], diets: VEGAN, restrictionTags: PLANT_LOW_NA_TAGS, kosherClass: 'pareve',
  },
  {
    id: 'cashews_raw', nameHe: 'קשיו טבעי', nameEn: 'Cashews, Raw', category: 'nuts_seeds',
    kcal: 553, proteinG: 18.2, carbsG: 30.2, fatG: 43.9, fiberG: 3.3,
    servingG: 28, servingNameHe: 'חופן קטן', servingNameEn: '1 small handful',
    allergens: ['tree_nut'], diets: VEGAN, restrictionTags: PLANT_LOW_NA_TAGS, kosherClass: 'pareve',
  },
  {
    id: 'pistachios_shelled_raw', nameHe: 'פיסטוקים מקולפים', nameEn: 'Pistachios, Shelled, Raw', category: 'nuts_seeds',
    kcal: 560, proteinG: 20.2, carbsG: 27.2, fatG: 45.3, fiberG: 10.6,
    servingG: 28, servingNameHe: 'חופן קטן', servingNameEn: '1 small handful',
    allergens: ['tree_nut'], diets: VEGAN, restrictionTags: PLANT_LOW_NA_TAGS, kosherClass: 'pareve',
  },
  {
    id: 'hazelnuts_raw', nameHe: 'אגוזי לוז', nameEn: 'Hazelnuts, Raw', category: 'nuts_seeds',
    kcal: 628, proteinG: 15, carbsG: 16.7, fatG: 60.8, fiberG: 9.7,
    servingG: 28, servingNameHe: 'חופן קטן', servingNameEn: '1 small handful',
    allergens: ['tree_nut'], diets: VEGAN, restrictionTags: PLANT_LOW_NA_TAGS, kosherClass: 'pareve',
  },
  {
    id: 'pecans_raw', nameHe: 'פקאן', nameEn: 'Pecans, Raw', category: 'nuts_seeds',
    kcal: 691, proteinG: 9.2, carbsG: 13.9, fatG: 72, fiberG: 9.6,
    servingG: 28, servingNameHe: 'חופן קטן', servingNameEn: '1 small handful',
    allergens: ['tree_nut'], diets: VEGAN, restrictionTags: PLANT_LOW_NA_TAGS, kosherClass: 'pareve',
  },
  // ---- Peanuts and nut butters ----
  {
    id: 'peanuts_raw', nameHe: 'בוטנים טבעיים', nameEn: 'Peanuts, Raw', category: 'nuts_seeds',
    kcal: 567, proteinG: 25.8, carbsG: 16.1, fatG: 49.2, fiberG: 8.5,
    servingG: 28, servingNameHe: 'חופן קטן', servingNameEn: '1 small handful',
    allergens: ['peanut'], diets: VEGAN, restrictionTags: PLANT_LOW_NA_TAGS, kosherClass: 'pareve',
  },
  {
    id: 'peanut_butter', nameHe: 'חמאת בוטנים', nameEn: 'Peanut Butter', category: 'spreads_sauces',
    kcal: 588, proteinG: 25, carbsG: 20, fatG: 50, fiberG: 6,
    servingG: 16, servingNameHe: 'כף', servingNameEn: '1 tbsp',
    allergens: ['peanut'], diets: VEGAN, restrictionTags: PLANT_TAGS, kosherClass: 'pareve',
  },
  {
    id: 'almond_butter', nameHe: 'חמאת שקדים', nameEn: 'Almond Butter', category: 'spreads_sauces',
    kcal: 614, proteinG: 21, carbsG: 19, fatG: 56, fiberG: 10,
    servingG: 16, servingNameHe: 'כף', servingNameEn: '1 tbsp',
    allergens: ['tree_nut'], diets: VEGAN, restrictionTags: PLANT_TAGS, kosherClass: 'pareve',
  },
  // ---- Sesame and seeds ----
  {
    id: 'tahini_raw', nameHe: 'טחינה גולמית', nameEn: 'Tahini, Raw', category: 'spreads_sauces',
    kcal: 595, proteinG: 17, carbsG: 21.2, fatG: 53.8, fiberG: 9.3,
    servingG: 15, servingNameHe: 'כף', servingNameEn: '1 tbsp',
    allergens: ['sesame'], diets: VEGAN, restrictionTags: PLANT_LOW_NA_TAGS, kosherClass: 'pareve',
  },
  {
    id: 'sesame_seeds', nameHe: 'שומשום', nameEn: 'Sesame Seeds', category: 'nuts_seeds',
    kcal: 573, proteinG: 17.7, carbsG: 23.5, fatG: 49.7, fiberG: 11.8,
    servingG: 9, servingNameHe: 'כף', servingNameEn: '1 tbsp',
    allergens: ['sesame'], diets: VEGAN, restrictionTags: PLANT_LOW_NA_TAGS, kosherClass: 'pareve',
  },
  {
    id: 'chia_seeds', nameHe: 'זרעי צ׳יה', nameEn: 'Chia Seeds', category: 'nuts_seeds',
    kcal: 486, proteinG: 16.5, carbsG: 42.1, fatG: 30.7, fiberG: 34.4,
    servingG: 12, servingNameHe: 'כף', servingNameEn: '1 tbsp',
    allergens: [], diets: VEGAN, restrictionTags: PLANT_LOW_NA_TAGS, kosherClass: 'pareve',
  },
  {
    id: 'flaxseed_ground', nameHe: 'זרעי פשתן טחונים', nameEn: 'Flaxseed, Ground', category: 'nuts_seeds',
    kcal: 534, proteinG: 18.3, carbsG: 28.9, fatG: 42.2, fiberG: 27.3,
    servingG: 10, servingNameHe: 'כף', servingNameEn: '1 tbsp',
    allergens: [], diets: VEGAN, restrictionTags: PLANT_LOW_NA_TAGS, kosherClass: 'pareve',
  },
  {
    id: 'pumpkin_seeds_raw', nameHe: 'גרעיני דלעת', nameEn: 'Pumpkin Seeds, Raw', category: 'nuts_seeds',
    kcal: 559, proteinG: 30.2, carbsG: 10.7, fatG: 49, fiberG: 6,
    servingG: 28, servingNameHe: 'חופן קטן', servingNameEn: '1 small handful',
    allergens: [], diets: VEGAN, restrictionTags: PLANT_LOW_NA_TAGS, kosherClass: 'pareve',
  },
  {
    id: 'sunflower_seeds_raw', nameHe: 'גרעיני חמניות', nameEn: 'Sunflower Seeds, Raw', category: 'nuts_seeds',
    kcal: 584, proteinG: 20.8, carbsG: 20, fatG: 51.5, fiberG: 8.6,
    servingG: 28, servingNameHe: 'חופן קטן', servingNameEn: '1 small handful',
    allergens: [], diets: VEGAN, restrictionTags: PLANT_LOW_NA_TAGS, kosherClass: 'pareve',
  },
  // ---- Oils and fats ----
  {
    id: 'olive_oil', nameHe: 'שמן זית', nameEn: 'Olive Oil', category: 'fats_oils',
    kcal: 884, proteinG: 0, carbsG: 0, fatG: 100, fiberG: 0,
    servingG: 14, servingNameHe: 'כף', servingNameEn: '1 tbsp',
    allergens: [], diets: VEGAN, restrictionTags: PLANT_LOW_NA_TAGS, kosherClass: 'pareve',
  },
  {
    id: 'canola_oil', nameHe: 'שמן קנולה', nameEn: 'Canola Oil', category: 'fats_oils',
    kcal: 884, proteinG: 0, carbsG: 0, fatG: 100, fiberG: 0,
    servingG: 14, servingNameHe: 'כף', servingNameEn: '1 tbsp',
    allergens: [], diets: VEGAN, restrictionTags: PLANT_LOW_NA_TAGS, kosherClass: 'pareve',
  },
  {
    id: 'coconut_oil', nameHe: 'שמן קוקוס', nameEn: 'Coconut Oil', category: 'fats_oils',
    kcal: 892, proteinG: 0, carbsG: 0, fatG: 99.1, fiberG: 0,
    servingG: 14, servingNameHe: 'כף', servingNameEn: '1 tbsp',
    allergens: [], diets: VEGAN, restrictionTags: PLANT_LOW_NA_TAGS, kosherClass: 'pareve',
  },
  {
    id: 'ghee', nameHe: 'גהי (חמאה מזוקקת)', nameEn: 'Ghee (Clarified Butter)', category: 'fats_oils',
    kcal: 876, proteinG: 0.3, carbsG: 0, fatG: 99.5, fiberG: 0,
    servingG: 14, servingNameHe: 'כף', servingNameEn: '1 tbsp',
    allergens: ['dairy'], diets: VEGETARIAN, restrictionTags: ['no_pork', 'halal', 'kosher', 'low_sodium', 'lactose_free'], kosherClass: 'dairy',
  },
  // ---- Spreads, sweeteners and sauces ----
  {
    id: 'mayonnaise', nameHe: 'מיונז', nameEn: 'Mayonnaise', category: 'spreads_sauces',
    kcal: 680, proteinG: 1, carbsG: 0.6, fatG: 75, fiberG: 0,
    servingG: 15, servingNameHe: 'כף', servingNameEn: '1 tbsp',
    allergens: ['egg'], diets: VEGETARIAN, restrictionTags: PLANT_TAGS, kosherClass: 'pareve',
  },
  {
    id: 'chocolate_hazelnut_spread', nameHe: 'ממרח שוקולד אגוזי לוז', nameEn: 'Chocolate-Hazelnut Spread', category: 'spreads_sauces',
    kcal: 539, proteinG: 6.3, carbsG: 57.5, fatG: 30.9, fiberG: 3.4,
    servingG: 20, servingNameHe: 'כף', servingNameEn: '1 tbsp',
    allergens: ['tree_nut', 'dairy', 'soy'], diets: VEGETARIAN, restrictionTags: ['no_pork', 'halal', 'kosher', 'low_sodium'], kosherClass: 'dairy',
  },
  {
    id: 'honey', nameHe: 'דבש', nameEn: 'Honey', category: 'spreads_sauces',
    kcal: 304, proteinG: 0.3, carbsG: 82.4, fatG: 0, fiberG: 0.2,
    servingG: 21, servingNameHe: 'כף', servingNameEn: '1 tbsp',
    allergens: [], diets: VEGETARIAN, restrictionTags: PLANT_LOW_NA_TAGS, kosherClass: 'pareve',
  },
  {
    id: 'date_syrup_silan', nameHe: 'סילאן (דבש תמרים)', nameEn: 'Date Syrup (Silan)', category: 'spreads_sauces',
    kcal: 292, proteinG: 1, carbsG: 71.5, fatG: 0.1, fiberG: 0.9,
    servingG: 21, servingNameHe: 'כף', servingNameEn: '1 tbsp',
    allergens: [], diets: VEGAN, restrictionTags: PLANT_LOW_NA_TAGS, kosherClass: 'pareve',
  },
  {
    id: 'ketchup', nameHe: 'קטשופ', nameEn: 'Ketchup', category: 'spreads_sauces',
    kcal: 101, proteinG: 1, carbsG: 25.8, fatG: 0.1, fiberG: 0.3,
    servingG: 17, servingNameHe: 'כף', servingNameEn: '1 tbsp',
    allergens: [], diets: VEGAN, restrictionTags: PLANT_TAGS, kosherClass: 'pareve',
  },
  {
    id: 'soy_sauce', nameHe: 'רוטב סויה', nameEn: 'Soy Sauce', category: 'spreads_sauces',
    kcal: 53, proteinG: 8.1, carbsG: 4.9, fatG: 0.6, fiberG: 0.8,
    servingG: 16, servingNameHe: 'כף', servingNameEn: '1 tbsp',
    allergens: ['soy', 'gluten'], diets: VEGAN, restrictionTags: ['no_pork', 'kosher', 'lactose_free'], kosherClass: 'pareve',
  },
  {
    id: 'mustard_prepared', nameHe: 'חרדל', nameEn: 'Mustard, Prepared', category: 'spreads_sauces',
    kcal: 66, proteinG: 4.4, carbsG: 5.8, fatG: 4, fiberG: 3.3,
    servingG: 5, servingNameHe: 'כפית', servingNameEn: '1 tsp',
    allergens: [], diets: VEGAN, restrictionTags: ['no_pork', 'kosher', 'lactose_free'], kosherClass: 'pareve',
  },
  {
    id: 'pesto_basil', nameHe: 'פסטו בזיליקום', nameEn: 'Basil Pesto', category: 'spreads_sauces',
    kcal: 418, proteinG: 5, carbsG: 6, fatG: 41, fiberG: 2,
    servingG: 15, servingNameHe: 'כף', servingNameEn: '1 tbsp',
    allergens: ['tree_nut', 'dairy'], diets: VEGETARIAN, restrictionTags: ['no_pork', 'kosher'], kosherClass: 'dairy',
  },
  {
    id: 'tahini_sauce_ready', nameHe: 'רוטב טחינה מוכן', nameEn: 'Tahini Sauce, Ready-Made', category: 'spreads_sauces',
    kcal: 255, proteinG: 7, carbsG: 9, fatG: 22, fiberG: 3.5,
    servingG: 30, servingNameHe: 'שתי כפות', servingNameEn: '2 tbsp',
    allergens: ['sesame'], diets: VEGAN, restrictionTags: PLANT_TAGS, kosherClass: 'pareve',
  },
];
