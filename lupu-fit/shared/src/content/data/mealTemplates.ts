import type { MealTemplateRaw } from '../types.js';

/* 36 one-tap meal templates, 9 per slot. Grams are edible portions of the foods as named in the foods dataset. */

export const MEAL_TEMPLATES_RAW: MealTemplateRaw[] = [
  /* ------------------------------------------------------------ breakfast */
  {
    id: 'mt_bf_high_protein_eggs', nameHe: 'ביצים קשות, לחם מלא ואבוקדו', nameEn: 'Hard-Boiled Eggs, Whole Wheat Bread and Avocado', slot: 'breakfast',
    items: [
      { foodId: 'egg_boiled_hard', grams: 150 }, { foodId: 'bread_whole_wheat', grams: 70 }, { foodId: 'avocado_raw', grams: 50 },
      { foodId: 'tomato_raw', grams: 100 }, { foodId: 'cucumber_raw', grams: 100 },
    ],
  },
  {
    id: 'mt_bf_pre_workout_oats', nameHe: 'דייסת שיבולת שועל עם בננה ודבש', nameEn: 'Oatmeal with Banana and Honey', slot: 'breakfast',
    items: [
      { foodId: 'rolled_oats_dry', grams: 60 }, { foodId: 'milk_3pct', grams: 200 }, { foodId: 'banana_raw', grams: 120 }, { foodId: 'honey', grams: 10 },
    ],
  },
  {
    id: 'mt_bf_post_workout_cottage', nameHe: 'קוטג׳ עם לחם מלא וירקות', nameEn: 'Cottage Cheese with Whole Wheat Bread and Vegetables', slot: 'breakfast',
    items: [
      { foodId: 'cottage_cheese_5pct', grams: 200 }, { foodId: 'bread_whole_wheat', grams: 80 }, { foodId: 'tomato_raw', grams: 100 },
      { foodId: 'cucumber_raw', grams: 100 }, { foodId: 'olive_oil', grams: 5 },
    ],
  },
  {
    id: 'mt_bf_light_yogurt_berries', nameHe: 'יוגורט 0% עם פירות יער וצ׳יה', nameEn: 'Fat-Free Yogurt with Berries and Chia', slot: 'breakfast',
    items: [
      { foodId: 'yogurt_plain_0pct', grams: 250 }, { foodId: 'strawberries_raw', grams: 150 }, { foodId: 'blueberries_raw', grams: 80 }, { foodId: 'chia_seeds', grams: 12 },
    ],
  },
  {
    id: 'mt_bf_israeli_classic', nameHe: 'ארוחת בוקר ישראלית: ביצה, גבינה, פיתה וסלט', nameEn: 'Israeli Breakfast: Egg, White Cheese, Pita and Salad', slot: 'breakfast',
    items: [
      { foodId: 'egg_boiled_hard', grams: 110 }, { foodId: 'white_cheese_5pct', grams: 100 }, { foodId: 'pita_whole_wheat', grams: 70 },
      { foodId: 'tomato_raw', grams: 100 }, { foodId: 'cucumber_raw', grams: 100 }, { foodId: 'olive_oil', grams: 8 },
    ],
  },
  {
    id: 'mt_bf_vegan_tofu_toast', nameHe: 'טוסט טופו עם אבוקדו ועגבנייה', nameEn: 'Tofu and Avocado Toast with Tomato', slot: 'breakfast',
    items: [
      { foodId: 'tofu_firm', grams: 150 }, { foodId: 'sourdough_bread', grams: 80 }, { foodId: 'avocado_raw', grams: 60 },
      { foodId: 'tomato_raw', grams: 100 }, { foodId: 'spinach_raw', grams: 30 },
    ],
  },
  {
    id: 'mt_bf_vegan_oats_pb', nameHe: 'דייסת שיבולת שועל טבעונית עם חמאת בוטנים', nameEn: 'Vegan Oatmeal with Peanut Butter and Chia', slot: 'breakfast',
    items: [
      { foodId: 'rolled_oats_dry', grams: 60 }, { foodId: 'soy_milk_unsweetened', grams: 250 }, { foodId: 'banana_raw', grams: 100 },
      { foodId: 'peanut_butter', grams: 20 }, { foodId: 'chia_seeds', grams: 10 },
    ],
  },
  {
    id: 'mt_bf_budget_egg_hummus', nameHe: 'ביצים קשות, חומוס ולחם מלא', nameEn: 'Hard-Boiled Eggs, Hummus and Whole Wheat Bread', slot: 'breakfast',
    items: [
      { foodId: 'egg_boiled_hard', grams: 110 }, { foodId: 'hummus_spread', grams: 80 }, { foodId: 'bread_whole_wheat', grams: 70 },
      { foodId: 'cucumber_raw', grams: 100 }, { foodId: 'tomato_raw', grams: 100 },
    ],
  },
  {
    id: 'mt_bf_on_the_go_shake', nameHe: 'שייק חלבון עם בננה ושיבולת שועל', nameEn: 'Protein Shake with Banana and Oats', slot: 'breakfast',
    items: [
      { foodId: 'whey_protein_powder', grams: 30 }, { foodId: 'milk_3pct', grams: 250 }, { foodId: 'banana_raw', grams: 120 },
      { foodId: 'rolled_oats_dry', grams: 40 }, { foodId: 'peanut_butter', grams: 15 },
    ],
  },

  /* ---------------------------------------------------------------- lunch */
  {
    id: 'mt_ln_high_protein_chicken_rice', nameHe: 'חזה עוף, אורז מלא וברוקולי', nameEn: 'Chicken Breast, Brown Rice and Broccoli', slot: 'lunch',
    items: [
      { foodId: 'chicken_breast_cooked', grams: 180 }, { foodId: 'brown_rice_cooked', grams: 200 }, { foodId: 'broccoli_cooked', grams: 150 }, { foodId: 'olive_oil', grams: 10 },
    ],
  },
  {
    id: 'mt_ln_pre_workout_pasta', nameHe: 'פסטה עם חזה עוף וירקות', nameEn: 'Pasta with Chicken Breast and Vegetables', slot: 'lunch',
    items: [
      { foodId: 'pasta_white_cooked', grams: 250 }, { foodId: 'chicken_breast_cooked', grams: 120 }, { foodId: 'zucchini_raw', grams: 100 },
      { foodId: 'tomato_raw', grams: 100 }, { foodId: 'olive_oil', grams: 8 },
    ],
  },
  {
    id: 'mt_ln_post_workout_salmon', nameHe: 'סלמון אפוי, בטטה ושעועית ירוקה', nameEn: 'Baked Salmon, Sweet Potato and Green Beans', slot: 'lunch',
    items: [
      { foodId: 'salmon_cooked', grams: 150 }, { foodId: 'sweet_potato_baked', grams: 250 }, { foodId: 'green_beans_cooked', grams: 150 }, { foodId: 'olive_oil', grams: 5 },
    ],
  },
  {
    id: 'mt_ln_light_tuna_salad', nameHe: 'סלט טונה גדול עם פיתה מחיטה מלאה', nameEn: 'Large Tuna Salad with Whole Wheat Pita', slot: 'lunch',
    items: [
      { foodId: 'tuna_canned_water', grams: 120 }, { foodId: 'romaine_lettuce_raw', grams: 150 }, { foodId: 'tomato_raw', grams: 150 },
      { foodId: 'cucumber_raw', grams: 150 }, { foodId: 'olive_oil', grams: 10 }, { foodId: 'pita_whole_wheat', grams: 50 },
    ],
  },
  {
    id: 'mt_ln_vegetarian_pasta_feta', nameHe: 'פסטה מחיטה מלאה עם בולגרית ותרד', nameEn: 'Whole Wheat Pasta with Feta and Spinach', slot: 'lunch',
    items: [
      { foodId: 'pasta_whole_wheat_cooked', grams: 250 }, { foodId: 'feta_bulgarian_cheese', grams: 40 }, { foodId: 'spinach_raw', grams: 50 },
      { foodId: 'tomato_raw', grams: 150 }, { foodId: 'olive_oil', grams: 10 },
    ],
  },
  {
    id: 'mt_ln_vegan_lentils_rice', nameHe: 'עדשים ירוקות עם אורז מלא וסלט', nameEn: 'Green Lentils with Brown Rice and Salad', slot: 'lunch',
    items: [
      { foodId: 'lentils_green_cooked', grams: 200 }, { foodId: 'brown_rice_cooked', grams: 150 }, { foodId: 'onion_raw', grams: 50 },
      { foodId: 'tomato_raw', grams: 100 }, { foodId: 'cucumber_raw', grams: 100 }, { foodId: 'olive_oil', grams: 10 },
    ],
  },
  {
    id: 'mt_ln_budget_rice_beans_egg', nameHe: 'אורז לבן, שעועית אדומה וביצה קשה', nameEn: 'White Rice, Kidney Beans and Hard-Boiled Egg', slot: 'lunch',
    items: [
      { foodId: 'white_rice_cooked', grams: 200 }, { foodId: 'kidney_beans_cooked', grams: 150 }, { foodId: 'egg_boiled_hard', grams: 110 },
      { foodId: 'tomato_raw', grams: 100 }, { foodId: 'olive_oil', grams: 8 },
    ],
  },
  {
    id: 'mt_ln_israeli_schnitzel_pita', nameHe: 'שניצל עוף טבעי בפיתה עם טחינה וסלט', nameEn: 'Plain Chicken Cutlet in Pita with Tahini and Salad', slot: 'lunch',
    items: [
      { foodId: 'chicken_schnitzel_plain_cooked', grams: 150 }, { foodId: 'pita_white', grams: 110 }, { foodId: 'tahini_sauce_ready', grams: 30 },
      { foodId: 'tomato_raw', grams: 100 }, { foodId: 'cucumber_raw', grams: 100 }, { foodId: 'cabbage_white_raw', grams: 50 },
    ],
  },
  {
    id: 'mt_ln_on_the_go_turkey_sandwich', nameHe: 'כריך הודו בלחם מלא עם אבוקדו', nameEn: 'Turkey Sandwich on Whole Wheat with Avocado', slot: 'lunch',
    items: [
      { foodId: 'bread_whole_wheat', grams: 100 }, { foodId: 'turkey_deli_slices', grams: 80 }, { foodId: 'avocado_raw', grams: 50 },
      { foodId: 'tomato_raw', grams: 80 }, { foodId: 'romaine_lettuce_raw', grams: 30 },
    ],
  },

  /* --------------------------------------------------------------- dinner */
  {
    id: 'mt_dn_high_protein_sirloin', nameHe: 'סינטה צלויה, תפוח אדמה וברוקולי', nameEn: 'Roast Sirloin, Boiled Potato and Broccoli', slot: 'dinner',
    items: [
      { foodId: 'beef_sirloin_cooked', grams: 180 }, { foodId: 'potato_boiled', grams: 250 }, { foodId: 'broccoli_cooked', grams: 150 }, { foodId: 'olive_oil', grams: 8 },
    ],
  },
  {
    id: 'mt_dn_pre_workout_basmati_chicken', nameHe: 'אורז בסמטי עם ירך עוף וגזר', nameEn: 'Basmati Rice with Chicken Thigh and Carrots', slot: 'dinner',
    items: [
      { foodId: 'basmati_rice_cooked', grams: 250 }, { foodId: 'chicken_thigh_cooked', grams: 150 }, { foodId: 'carrot_raw', grams: 80 }, { foodId: 'cucumber_raw', grams: 100 },
    ],
  },
  {
    id: 'mt_dn_post_workout_tilapia_quinoa', nameHe: 'אמנון אפוי, קינואה וברוקולי', nameEn: 'Baked Tilapia, Quinoa and Broccoli', slot: 'dinner',
    items: [
      { foodId: 'tilapia_cooked', grams: 200 }, { foodId: 'quinoa_cooked', grams: 200 }, { foodId: 'broccoli_cooked', grams: 150 }, { foodId: 'olive_oil', grams: 10 },
    ],
  },
  {
    id: 'mt_dn_light_cod_cauliflower', nameHe: 'פילה בקלה אפוי עם כרובית וסלט', nameEn: 'Baked Cod Fillet with Cauliflower and Salad', slot: 'dinner',
    items: [
      { foodId: 'cod_cooked', grams: 200 }, { foodId: 'cauliflower_cooked', grams: 200 }, { foodId: 'tomato_raw', grams: 150 },
      { foodId: 'cucumber_raw', grams: 100 }, { foodId: 'olive_oil', grams: 8 },
    ],
  },
  {
    id: 'mt_dn_vegetarian_omelet', nameHe: 'חביתת ירקות עם בולגרית ולחם מלא', nameEn: 'Vegetable Omelet with Feta and Whole Wheat Bread', slot: 'dinner',
    items: [
      { foodId: 'egg_whole_raw', grams: 180 }, { foodId: 'mushrooms_raw', grams: 100 }, { foodId: 'spinach_raw', grams: 50 },
      { foodId: 'feta_bulgarian_cheese', grams: 40 }, { foodId: 'bread_whole_wheat', grams: 80 },
    ],
  },
  {
    id: 'mt_dn_vegan_tofu_stir_fry', nameHe: 'טופו מוקפץ עם אורז מלא וירקות', nameEn: 'Tofu Stir-Fry with Brown Rice and Vegetables', slot: 'dinner',
    items: [
      { foodId: 'tofu_firm', grams: 200 }, { foodId: 'brown_rice_cooked', grams: 200 }, { foodId: 'broccoli_cooked', grams: 150 },
      { foodId: 'bell_pepper_red_raw', grams: 100 }, { foodId: 'soy_sauce', grams: 15 }, { foodId: 'canola_oil', grams: 8 },
    ],
  },
  {
    id: 'mt_dn_budget_chickpeas_bulgur', nameHe: 'גרגירי חומוס עם בורגול וסלט טחינה', nameEn: 'Chickpeas with Bulgur and Tahini Salad', slot: 'dinner',
    items: [
      { foodId: 'chickpeas_cooked', grams: 200 }, { foodId: 'bulgur_cooked', grams: 200 }, { foodId: 'tomato_raw', grams: 120 },
      { foodId: 'cucumber_raw', grams: 120 }, { foodId: 'tahini_raw', grams: 20 },
    ],
  },
  {
    id: 'mt_dn_israeli_kebab_rice', nameHe: 'קבב על הגריל עם אורז וסלט ישראלי', nameEn: 'Grilled Kebab with Rice and Israeli Salad', slot: 'dinner',
    items: [
      { foodId: 'kebab_ground_meat_grilled', grams: 150 }, { foodId: 'white_rice_cooked', grams: 200 }, { foodId: 'tomato_raw', grams: 120 },
      { foodId: 'cucumber_raw', grams: 100 }, { foodId: 'tahini_sauce_ready', grams: 30 },
    ],
  },
  {
    id: 'mt_dn_on_the_go_chicken_wrap', nameHe: 'טורטייה ממולאת בחזה עוף ואבוקדו', nameEn: 'Chicken Breast and Avocado Wrap', slot: 'dinner',
    items: [
      { foodId: 'tortilla_flour', grams: 100 }, { foodId: 'chicken_breast_cooked', grams: 130 }, { foodId: 'avocado_raw', grams: 50 },
      { foodId: 'romaine_lettuce_raw', grams: 40 }, { foodId: 'tomato_raw', grams: 80 },
    ],
  },

  /* ---------------------------------------------------------------- snack */
  {
    id: 'mt_sn_high_protein_skyr', nameHe: 'סקיר עם שקדים ואוכמניות', nameEn: 'Skyr with Almonds and Blueberries', slot: 'snack',
    items: [{ foodId: 'skyr_plain', grams: 200 }, { foodId: 'almonds_raw', grams: 15 }, { foodId: 'blueberries_raw', grams: 50 }],
  },
  {
    id: 'mt_sn_pre_workout_banana_dates', nameHe: 'בננה, תמרים ופריכיות אורז', nameEn: 'Banana, Dates and Rice Cakes', slot: 'snack',
    items: [{ foodId: 'banana_raw', grams: 120 }, { foodId: 'date_medjool', grams: 40 }, { foodId: 'rice_cakes', grams: 20 }],
  },
  {
    id: 'mt_sn_post_workout_whey_banana', nameHe: 'שייק חלבון עם חלב ובננה', nameEn: 'Whey Protein Shake with Milk and Banana', slot: 'snack',
    items: [{ foodId: 'whey_protein_powder', grams: 30 }, { foodId: 'milk_1pct', grams: 250 }, { foodId: 'banana_raw', grams: 120 }],
  },
  {
    id: 'mt_sn_light_veggies_hummus', nameHe: 'תפוח וירקות חתוכים עם חומוס', nameEn: 'Apple and Cut Vegetables with Hummus', slot: 'snack',
    items: [
      { foodId: 'apple_raw', grams: 150 }, { foodId: 'carrot_raw', grams: 100 }, { foodId: 'cucumber_raw', grams: 100 }, { foodId: 'hummus_spread', grams: 40 },
    ],
  },
  {
    id: 'mt_sn_vegetarian_cottage_crackers', nameHe: 'קוטג׳ עם קרקרים ועגבנייה', nameEn: 'Cottage Cheese with Crackers and Tomato', slot: 'snack',
    items: [{ foodId: 'cottage_cheese_5pct', grams: 150 }, { foodId: 'crackers_plain', grams: 25 }, { foodId: 'tomato_raw', grams: 100 }],
  },
  {
    id: 'mt_sn_vegan_pb_rice_cakes', nameHe: 'פריכיות אורז עם חמאת בוטנים ובננה', nameEn: 'Rice Cakes with Peanut Butter and Banana', slot: 'snack',
    items: [{ foodId: 'rice_cakes', grams: 25 }, { foodId: 'peanut_butter', grams: 20 }, { foodId: 'banana_raw', grams: 100 }],
  },
  {
    id: 'mt_sn_budget_egg_pita', nameHe: 'ביצים קשות ופיתה עם מלפפון', nameEn: 'Hard-Boiled Eggs and Pita with Cucumber', slot: 'snack',
    items: [{ foodId: 'egg_boiled_hard', grams: 110 }, { foodId: 'pita_whole_wheat', grams: 50 }, { foodId: 'cucumber_raw', grams: 100 }],
  },
  {
    id: 'mt_sn_israeli_pita_tahini_silan', nameHe: 'פיתה עם טחינה וסילאן', nameEn: 'Pita with Tahini and Date Syrup', slot: 'snack',
    items: [{ foodId: 'pita_white', grams: 60 }, { foodId: 'tahini_raw', grams: 15 }, { foodId: 'date_syrup_silan', grams: 10 }],
  },
  {
    id: 'mt_sn_on_the_go_bar_apple', nameHe: 'חטיף חלבון, תפוח ושקדים', nameEn: 'Protein Bar, Apple and Almonds', slot: 'snack',
    items: [{ foodId: 'protein_bar_whey', grams: 60 }, { foodId: 'apple_raw', grams: 150 }, { foodId: 'almonds_raw', grams: 10 }],
  },
];
