import type { DishRaw } from '../../types.js';

export const SNACK_B_DISHES: DishRaw[] = [
  {
    id: 'snb_banana_peanut_butter', nameHe: 'בננה עם חמאת בוטנים וצ׳יה', nameEn: 'Banana with Peanut Butter and Chia',
    slots: ['snack'], prepMinutes: 3,
    ingredients: [{ foodId: 'banana_raw', grams: 120 }, { foodId: 'peanut_butter', grams: 20 }, { foodId: 'chia_seeds', grams: 5 }],
  },
  {
    id: 'snb_greek_yogurt_berries', nameHe: 'יוגורט יווני עם פירות יער ודבש', nameEn: 'Greek Yogurt with Mixed Berries and Honey',
    slots: ['snack', 'breakfast'], prepMinutes: 4,
    ingredients: [{ foodId: 'yogurt_greek_plain_5pct', grams: 170 }, { foodId: 'blueberries_raw', grams: 80 }, { foodId: 'strawberries_raw', grams: 60 }, { foodId: 'honey', grams: 10 }],
  },
  {
    id: 'snb_yogurt_banana_oats', nameHe: 'יוגורט עם בננה, שיבולת שועל וצ׳יה', nameEn: 'Yogurt Bowl with Banana, Oats and Chia',
    slots: ['snack', 'breakfast'], prepMinutes: 4,
    ingredients: [{ foodId: 'yogurt_plain_3pct', grams: 150 }, { foodId: 'banana_raw', grams: 80 }, { foodId: 'rolled_oats_dry', grams: 20 }, { foodId: 'chia_seeds', grams: 5 }],
  },
  {
    id: 'snb_date_almond_bites', nameHe: 'כדורי תמר ושקדים', nameEn: 'Date and Almond Bites',
    slots: ['snack'], prepMinutes: 10,
    ingredients: [{ foodId: 'date_medjool', grams: 60 }, { foodId: 'almonds_raw', grams: 20 }, { foodId: 'chia_seeds', grams: 5 }],
  },
  {
    id: 'snb_date_oat_pb_balls', nameHe: 'כדורי אנרגיה עם תמר, שיבולת שועל וחמאת בוטנים', nameEn: 'Date, Oat and Peanut Butter Energy Balls',
    slots: ['snack'], prepMinutes: 12,
    ingredients: [{ foodId: 'date_medjool', grams: 50 }, { foodId: 'rolled_oats_dry', grams: 25 }, { foodId: 'peanut_butter', grams: 15 }, { foodId: 'chia_seeds', grams: 5 }],
  },
  {
    id: 'snb_dark_chocolate_almonds_strawberries', nameHe: 'שוקולד מריר עם שקדים ותותים', nameEn: 'Dark Chocolate with Almonds and Strawberries',
    slots: ['snack'], prepMinutes: 3,
    ingredients: [{ foodId: 'dark_chocolate_70', grams: 20 }, { foodId: 'almonds_raw', grams: 20 }, { foodId: 'strawberries_raw', grams: 100 }],
  },
  {
    id: 'snb_popcorn_dark_chocolate', nameHe: 'פופקורן עם שוקולד מריר וגרעיני דלעת', nameEn: 'Popcorn with Dark Chocolate and Pumpkin Seeds',
    slots: ['snack'], prepMinutes: 7,
    ingredients: [{ foodId: 'popcorn_air_popped', grams: 20 }, { foodId: 'dark_chocolate_70', grams: 15 }, { foodId: 'pumpkin_seeds_raw', grams: 10 }],
  },
  {
    id: 'snb_popcorn_seeds_raisins', nameHe: 'פופקורן עם גרעיני דלעת וצימוקים', nameEn: 'Popcorn with Pumpkin Seeds and Raisins',
    slots: ['snack'], prepMinutes: 3,
    ingredients: [{ foodId: 'popcorn_air_popped', grams: 25 }, { foodId: 'pumpkin_seeds_raw', grams: 15 }, { foodId: 'raisins', grams: 15 }],
  },
  {
    id: 'snb_berry_whey_smoothie', nameHe: 'שייק חלבון עם תותים ובננה', nameEn: 'Strawberry Banana Protein Shake',
    slots: ['snack'], prepMinutes: 4,
    ingredients: [{ foodId: 'whey_protein_powder', grams: 30 }, { foodId: 'milk_1pct', grams: 200 }, { foodId: 'banana_raw', grams: 100 }, { foodId: 'strawberries_raw', grams: 80 }],
  },
  {
    id: 'snb_vegan_blueberry_shake', nameHe: 'שייק חלבון צמחי עם אוכמניות ובננה', nameEn: 'Vegan Blueberry Banana Protein Shake',
    slots: ['snack'], prepMinutes: 4,
    ingredients: [{ foodId: 'plant_protein_powder_pea', grams: 30 }, { foodId: 'oat_milk_unsweetened', grams: 250 }, { foodId: 'banana_raw', grams: 100 }, { foodId: 'blueberries_raw', grams: 60 }],
  },
  {
    id: 'snb_mango_yogurt_smoothie', nameHe: 'שייק מנגו ויוגורט', nameEn: 'Mango Yogurt Smoothie',
    slots: ['snack'], prepMinutes: 4,
    ingredients: [{ foodId: 'mango_raw', grams: 150 }, { foodId: 'yogurt_plain_0pct', grams: 150 }, { foodId: 'honey', grams: 8 }, { foodId: 'chia_seeds', grams: 5 }],
  },
  {
    id: 'snb_green_pineapple_shake', nameHe: 'שייק ירוק עם תרד, אננס וחלבון צמחי', nameEn: 'Green Spinach Pineapple Protein Smoothie',
    slots: ['snack'], prepMinutes: 5,
    ingredients: [{ foodId: 'spinach_raw', grams: 40 }, { foodId: 'banana_raw', grams: 100 }, { foodId: 'pineapple_raw', grams: 100 }, { foodId: 'coconut_water', grams: 200 }, { foodId: 'plant_protein_powder_pea', grams: 25 }],
  },
  {
    id: 'snb_apple_almond_butter', nameHe: 'תפוח עם חמאת שקדים וצימוקים', nameEn: 'Apple with Almond Butter and Raisins',
    slots: ['snack'], prepMinutes: 3,
    ingredients: [{ foodId: 'apple_raw', grams: 180 }, { foodId: 'almond_butter', grams: 20 }, { foodId: 'raisins', grams: 10 }],
  },
  {
    id: 'snb_apple_tahini_silan', nameHe: 'פרוסות תפוח עם טחינה וסילאן', nameEn: 'Apple Slices with Tahini and Date Syrup',
    slots: ['snack'], prepMinutes: 4,
    ingredients: [{ foodId: 'apple_raw', grams: 180 }, { foodId: 'tahini_raw', grams: 15 }, { foodId: 'date_syrup_silan', grams: 8 }],
  },
  {
    id: 'snb_cottage_pineapple_seeds', nameHe: 'קוטג׳ עם אננס וגרעיני דלעת', nameEn: 'Cottage Cheese with Pineapple and Pumpkin Seeds',
    slots: ['snack'], prepMinutes: 3,
    ingredients: [{ foodId: 'cottage_cheese_5pct', grams: 150 }, { foodId: 'pineapple_raw', grams: 120 }, { foodId: 'pumpkin_seeds_raw', grams: 10 }],
  },
  {
    id: 'snb_cottage_melon_sunflower', nameHe: 'קוטג׳ עם מלון וגרעיני חמניות', nameEn: 'Cottage Cheese with Melon and Sunflower Seeds',
    slots: ['snack'], prepMinutes: 3,
    ingredients: [{ foodId: 'cottage_cheese_5pct', grams: 125 }, { foodId: 'melon_cantaloupe_raw', grams: 150 }, { foodId: 'sunflower_seeds_raw', grams: 8 }],
  },
  {
    id: 'snb_skyr_blueberry_flax', nameHe: 'סקיר עם אוכמניות, דבש וזרעי פשתן', nameEn: 'Skyr with Blueberries, Honey and Flaxseed',
    slots: ['snack'], prepMinutes: 3,
    ingredients: [{ foodId: 'skyr_plain', grams: 170 }, { foodId: 'blueberries_raw', grams: 80 }, { foodId: 'honey', grams: 8 }, { foodId: 'flaxseed_ground', grams: 8 }],
  },
  {
    id: 'snb_labneh_dates_walnuts', nameHe: 'לאבנה עם תמרים ואגוזי מלך', nameEn: 'Labneh with Dates and Walnuts',
    slots: ['snack'], prepMinutes: 4,
    ingredients: [{ foodId: 'labneh_full_fat', grams: 60 }, { foodId: 'date_medjool', grams: 40 }, { foodId: 'walnuts_raw', grams: 10 }],
  },
  {
    id: 'snb_rice_cake_tahini_banana', nameHe: 'פריכיות אורז עם טחינה, בננה וסילאן', nameEn: 'Rice Cakes with Tahini, Banana and Date Syrup',
    slots: ['snack'], prepMinutes: 4,
    ingredients: [{ foodId: 'rice_cakes', grams: 20 }, { foodId: 'tahini_raw', grams: 15 }, { foodId: 'banana_raw', grams: 50 }, { foodId: 'date_syrup_silan', grams: 10 }],
  },
  {
    id: 'snb_halva_pear_date', nameHe: 'חלווה עם אגס ותמר', nameEn: 'Halva with Pear and Date',
    slots: ['snack'], prepMinutes: 3,
    ingredients: [{ foodId: 'halva_tahini', grams: 25 }, { foodId: 'pear_raw', grams: 120 }, { foodId: 'date_medjool', grams: 20 }],
  },
  {
    id: 'snb_frozen_banana_pistachio', nameHe: 'בננה קפואה מרוסקת עם שוקולד מריר ופיסטוק', nameEn: 'Frozen Mashed Banana Bowl with Dark Chocolate and Pistachios',
    slots: ['snack'], prepMinutes: 8,
    ingredients: [{ foodId: 'banana_raw', grams: 150 }, { foodId: 'dark_chocolate_70', grams: 12 }, { foodId: 'pistachios_shelled_raw', grams: 10 }],
  },
  {
    id: 'snb_watermelon_feta', nameHe: 'אבטיח עם גבינה בולגרית ופטרוזיליה', nameEn: 'Watermelon with Feta and Parsley',
    slots: ['snack'], prepMinutes: 4,
    ingredients: [{ foodId: 'watermelon_raw', grams: 250 }, { foodId: 'feta_bulgarian_cheese', grams: 40 }, { foodId: 'parsley_raw', grams: 5 }],
  },
  {
    id: 'snb_grapes_cheese_rice_cake', nameHe: 'ענבים עם גבינה צהובה ופריכיות אורז', nameEn: 'Grapes with Yellow Cheese and Rice Cakes',
    slots: ['snack'], prepMinutes: 3,
    ingredients: [{ foodId: 'grapes_raw', grams: 150 }, { foodId: 'yellow_cheese_gouda_type', grams: 30 }, { foodId: 'rice_cakes', grams: 10 }],
  },
  {
    id: 'snb_fruit_salad_pomegranate', nameHe: 'סלט פירות עם רימון וצ׳יה', nameEn: 'Fruit Salad with Pomegranate and Chia',
    slots: ['snack'], prepMinutes: 8,
    ingredients: [{ foodId: 'orange_raw', grams: 120 }, { foodId: 'kiwi_raw', grams: 80 }, { foodId: 'strawberries_raw', grams: 80 }, { foodId: 'pomegranate_seeds', grams: 30 }, { foodId: 'chia_seeds', grams: 5 }],
  },
  {
    id: 'snb_dried_fruit_seed_mix', nameHe: 'תערובת משמש, צימוקים וגרעינים', nameEn: 'Dried Apricot, Raisin and Seed Mix',
    slots: ['snack'], prepMinutes: 2,
    ingredients: [{ foodId: 'apricots_dried', grams: 40 }, { foodId: 'raisins', grams: 15 }, { foodId: 'pumpkin_seeds_raw', grams: 15 }, { foodId: 'sunflower_seeds_raw', grams: 10 }],
  },
  {
    id: 'snb_banana_oat_pancakes', nameHe: 'פנקייק בננה ושיבולת שועל עם אוכמניות', nameEn: 'Banana Oat Pancakes with Blueberries',
    slots: ['snack', 'breakfast'], prepMinutes: 15,
    ingredients: [{ foodId: 'egg_whole_raw', grams: 50 }, { foodId: 'banana_raw', grams: 100 }, { foodId: 'rolled_oats_dry', grams: 30 }, { foodId: 'blueberries_raw', grams: 50 }, { foodId: 'canola_oil', grams: 3 }],
  },
  {
    id: 'snb_chia_pudding_oat_mango', nameHe: 'פודינג צ׳יה טבעוני עם מנגו', nameEn: 'Vegan Chia Pudding with Mango',
    slots: ['snack', 'breakfast'], prepMinutes: 5,
    ingredients: [{ foodId: 'chia_seeds', grams: 25 }, { foodId: 'oat_milk_unsweetened', grams: 150 }, { foodId: 'mango_raw', grams: 80 }, { foodId: 'date_syrup_silan', grams: 8 }],
  },
  {
    id: 'snb_chia_pudding_milk_strawberry', nameHe: 'פודינג צ׳יה בחלב עם תותים ודבש', nameEn: 'Milk Chia Pudding with Strawberries and Honey',
    slots: ['snack', 'breakfast'], prepMinutes: 5,
    ingredients: [{ foodId: 'chia_seeds', grams: 20 }, { foodId: 'milk_3pct', grams: 150 }, { foodId: 'strawberries_raw', grams: 80 }, { foodId: 'honey', grams: 8 }],
  },
  {
    id: 'snb_overnight_oats_apple', nameHe: 'שיבולת שועל בלילה עם יוגורט ותפוח', nameEn: 'Overnight Oats with Yogurt and Apple',
    slots: ['snack', 'breakfast'], prepMinutes: 5,
    ingredients: [{ foodId: 'rolled_oats_dry', grams: 30 }, { foodId: 'yogurt_plain_3pct', grams: 120 }, { foodId: 'apple_raw', grams: 100 }, { foodId: 'flaxseed_ground', grams: 5 }],
  },
  {
    id: 'snb_coffee_banana_whey_shake', nameHe: 'שייק קפה, בננה וחלבון', nameEn: 'Coffee Banana Protein Shake',
    slots: ['snack'], prepMinutes: 4,
    ingredients: [{ foodId: 'coffee_black', grams: 150 }, { foodId: 'whey_protein_powder', grams: 25 }, { foodId: 'banana_raw', grams: 80 }, { foodId: 'milk_1pct', grams: 150 }],
  },
  {
    id: 'snb_kefir_peach_flax', nameHe: 'קפיר עם אפרסק וזרעי פשתן', nameEn: 'Kefir with Peach and Flaxseed',
    slots: ['snack'], prepMinutes: 4,
    ingredients: [{ foodId: 'kefir_plain', grams: 200 }, { foodId: 'peach_raw', grams: 120 }, { foodId: 'flaxseed_ground', grams: 8 }, { foodId: 'honey', grams: 6 }],
  },
  {
    id: 'snb_beet_orange_vegan_shake', nameHe: 'שייק סלק, תפוז ובננה עם חלבון צמחי', nameEn: 'Beet Orange Banana Shake with Plant Protein',
    slots: ['snack'], prepMinutes: 5,
    ingredients: [{ foodId: 'orange_raw', grams: 150 }, { foodId: 'beet_cooked', grams: 80 }, { foodId: 'banana_raw', grams: 80 }, { foodId: 'plant_protein_powder_pea', grams: 20 }],
  },
  {
    id: 'snb_soy_yogurt_peach_oats', nameHe: 'קערת סויה עם אפרסק ושיבולת שועל', nameEn: 'Soy Peach Oat Bowl',
    slots: ['snack'], prepMinutes: 4,
    ingredients: [{ foodId: 'soy_yogurt_plain', grams: 150 }, { foodId: 'peach_raw', grams: 120 }, { foodId: 'rolled_oats_dry', grams: 20 }, { foodId: 'pumpkin_seeds_raw', grams: 8 }],
  },
  {
    id: 'snb_rice_cake_honey_banana', nameHe: 'פריכיות אורז עם דבש ובננה', nameEn: 'Rice Cakes with Honey and Banana',
    slots: ['snack'], prepMinutes: 3,
    ingredients: [{ foodId: 'rice_cakes', grams: 25 }, { foodId: 'honey', grams: 15 }, { foodId: 'banana_raw', grams: 120 }],
  },
  {
    id: 'snb_protein_bar_apple', nameHe: 'חטיף חלבון עם תפוח', nameEn: 'Protein Bar with Apple',
    slots: ['snack'], prepMinutes: 2,
    ingredients: [{ foodId: 'protein_bar_whey', grams: 45 }, { foodId: 'apple_raw', grams: 150 }],
  },
];
