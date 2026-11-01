import type { DishRaw } from '../../types.js';

/* Eggs and savoury breakfasts. One adult serving each. */
export const BREAKFAST_A_DISHES: DishRaw[] = [
  {
    id: 'bfa_shakshuka_feta', nameHe: 'שקשוקה עם גבינה בולגרית ופיתה', nameEn: 'Shakshuka with Feta and Pita', slots: ['breakfast'],
    ingredients: [
      { foodId: 'tomato_raw', grams: 250 }, { foodId: 'egg_whole_raw', grams: 100 }, { foodId: 'onion_raw', grams: 50 },
      { foodId: 'bell_pepper_red_raw', grams: 60 }, { foodId: 'olive_oil', grams: 10 }, { foodId: 'feta_bulgarian_cheese', grams: 30 },
      { foodId: 'pita_white', grams: 70 },
    ],
    prepMinutes: 25,
  },
  {
    id: 'bfa_shakshuka_classic', nameHe: 'שקשוקה קלאסית עם לחם מחמצת', nameEn: 'Classic Shakshuka with Sourdough', slots: ['breakfast'],
    ingredients: [
      { foodId: 'tomato_raw', grams: 300 }, { foodId: 'egg_whole_raw', grams: 150 }, { foodId: 'onion_raw', grams: 60 },
      { foodId: 'garlic_raw', grams: 5 }, { foodId: 'olive_oil', grams: 10 }, { foodId: 'sourdough_bread', grams: 60 },
    ],
    prepMinutes: 25,
  },
  {
    id: 'bfa_shakshuka_green_potato', nameHe: 'שקשוקה ירוקה עם תרד, קישואים ותפוחי אדמה', nameEn: 'Green Shakshuka with Spinach, Zucchini and Potato', slots: ['breakfast'],
    ingredients: [
      { foodId: 'spinach_raw', grams: 100 }, { foodId: 'zucchini_raw', grams: 120 }, { foodId: 'egg_whole_raw', grams: 100 },
      { foodId: 'onion_raw', grams: 50 }, { foodId: 'olive_oil', grams: 10 }, { foodId: 'white_cheese_5pct', grams: 40 },
      { foodId: 'potato_boiled', grams: 150 },
    ],
    prepMinutes: 25,
  },
  {
    id: 'bfa_chickpea_tomato_skillet', nameHe: 'מחבת עגבניות וגרבנזו עם פיתה מלאה', nameEn: 'Vegan Tomato and Chickpea Skillet with Whole Wheat Pita', slots: ['breakfast'],
    ingredients: [
      { foodId: 'tomato_raw', grams: 250 }, { foodId: 'chickpeas_cooked', grams: 150 }, { foodId: 'onion_raw', grams: 60 },
      { foodId: 'bell_pepper_red_raw', grams: 80 }, { foodId: 'olive_oil', grams: 10 }, { foodId: 'garlic_raw', grams: 5 },
      { foodId: 'pita_whole_wheat', grams: 60 },
    ],
    prepMinutes: 25,
  },
  {
    id: 'bfa_omelette_veggie_toast', nameHe: 'חביתת ירקות עם פטריות ותרד וטוסט מלא', nameEn: 'Vegetable Omelette with Mushrooms, Spinach and Whole Wheat Toast', slots: ['breakfast'],
    ingredients: [
      { foodId: 'egg_whole_raw', grams: 150 }, { foodId: 'mushrooms_raw', grams: 60 }, { foodId: 'spinach_raw', grams: 40 },
      { foodId: 'onion_raw', grams: 30 }, { foodId: 'olive_oil', grams: 8 }, { foodId: 'bread_whole_wheat', grams: 60 },
    ],
    prepMinutes: 12,
  },
  {
    id: 'bfa_omelette_feta_spinach_potato', nameHe: 'חביתת תרד ובולגרית עם תפוחי אדמה', nameEn: 'Spinach and Feta Omelette with Boiled Potatoes', slots: ['breakfast'],
    ingredients: [
      { foodId: 'egg_whole_raw', grams: 150 }, { foodId: 'spinach_raw', grams: 80 }, { foodId: 'feta_bulgarian_cheese', grams: 35 },
      { foodId: 'olive_oil', grams: 8 }, { foodId: 'tomato_raw', grams: 100 }, { foodId: 'potato_boiled', grams: 150 },
    ],
    prepMinutes: 15,
  },
  {
    id: 'bfa_egg_white_turkey_omelette', nameHe: 'חביתת חלבונים עם הודו ופלפל וטוסט מלא', nameEn: 'Egg White Omelette with Turkey, Pepper and Whole Wheat Toast', slots: ['breakfast'],
    ingredients: [
      { foodId: 'egg_white_raw', grams: 200 }, { foodId: 'turkey_deli_slices', grams: 50 }, { foodId: 'bell_pepper_red_raw', grams: 80 },
      { foodId: 'onion_raw', grams: 30 }, { foodId: 'olive_oil', grams: 8 }, { foodId: 'bread_whole_wheat', grams: 60 },
    ],
    prepMinutes: 12,
  },
  {
    id: 'bfa_egg_cheese_bagel', nameHe: 'כריך ביצה מקושקשת וגבינה צהובה בבייגל', nameEn: 'Scrambled Egg and Cheese Bagel Sandwich', slots: ['breakfast'],
    ingredients: [
      { foodId: 'bagel_plain', grams: 100 }, { foodId: 'egg_whole_raw', grams: 100 }, { foodId: 'olive_oil', grams: 5 },
      { foodId: 'yellow_cheese_gouda_type', grams: 25 }, { foodId: 'tomato_raw', grams: 60 },
    ],
    prepMinutes: 10,
  },
  {
    id: 'bfa_avocado_toast_poached_egg', nameHe: 'טוסט אבוקדו וביצה עלומה על לחם מחמצת', nameEn: 'Avocado Toast with Poached Egg on Sourdough', slots: ['breakfast'],
    ingredients: [
      { foodId: 'sourdough_bread', grams: 70 }, { foodId: 'avocado_raw', grams: 80 }, { foodId: 'egg_whole_raw', grams: 100 },
      { foodId: 'tomato_raw', grams: 80 }, { foodId: 'lemon_juice', grams: 5 },
    ],
    prepMinutes: 12,
  },
  {
    id: 'bfa_israeli_breakfast_classic', nameHe: 'ארוחת בוקר ישראלית עם ביצה קשה, גבינה לבנה ואבוקדו', nameEn: 'Israeli Breakfast Plate with Hard-Boiled Egg, White Cheese and Avocado', slots: ['breakfast'],
    ingredients: [
      { foodId: 'egg_boiled_hard', grams: 110 }, { foodId: 'cucumber_raw', grams: 100 }, { foodId: 'tomato_raw', grams: 120 },
      { foodId: 'white_cheese_5pct', grams: 80 }, { foodId: 'bread_whole_wheat', grams: 70 }, { foodId: 'olive_oil', grams: 8 },
      { foodId: 'avocado_raw', grams: 50 },
    ],
    prepMinutes: 10,
  },
  {
    id: 'bfa_sabich_plate', nameHe: 'סביח בפיתה עם חציל, ביצה קשה וטחינה', nameEn: 'Sabich Pita with Roasted Eggplant, Egg and Tahini', slots: ['breakfast', 'lunch'],
    ingredients: [
      { foodId: 'pita_white', grams: 90 }, { foodId: 'eggplant_roasted', grams: 120 }, { foodId: 'egg_boiled_hard', grams: 100 },
      { foodId: 'tahini_sauce_ready', grams: 30 }, { foodId: 'cucumber_raw', grams: 60 }, { foodId: 'tomato_raw', grams: 60 },
    ],
    prepMinutes: 15,
  },
  {
    id: 'bfa_burrito_egg_black_beans', nameHe: 'בוריטו בוקר עם ביצים, שעועית שחורה וגבינה צהובה', nameEn: 'Breakfast Burrito with Eggs, Black Beans and Cheese', slots: ['breakfast'],
    ingredients: [
      { foodId: 'tortilla_flour', grams: 70 }, { foodId: 'egg_whole_raw', grams: 100 }, { foodId: 'black_beans_cooked', grams: 80 },
      { foodId: 'bell_pepper_red_raw', grams: 60 }, { foodId: 'avocado_raw', grams: 40 }, { foodId: 'yellow_cheese_gouda_type', grams: 20 },
    ],
    prepMinutes: 15,
  },
  {
    id: 'bfa_savory_oats_egg_parmesan', nameHe: 'שיבולת שועל מלוחה עם ביצה, תרד ופרמזן', nameEn: 'Savory Oats with Egg, Spinach and Parmesan', slots: ['breakfast'],
    ingredients: [
      { foodId: 'rolled_oats_dry', grams: 55 }, { foodId: 'egg_whole_raw', grams: 100 }, { foodId: 'spinach_raw', grams: 50 },
      { foodId: 'parmesan_cheese', grams: 8 }, { foodId: 'olive_oil', grams: 5 },
    ],
    prepMinutes: 12,
  },
  {
    id: 'bfa_frittata_zucchini_mozzarella', nameHe: 'פריטטה קישואים ומוצרלה עם תפוחי אדמה', nameEn: 'Zucchini and Mozzarella Frittata with Potatoes', slots: ['breakfast', 'lunch'],
    ingredients: [
      { foodId: 'egg_whole_raw', grams: 150 }, { foodId: 'zucchini_raw', grams: 150 }, { foodId: 'mozzarella_cheese', grams: 40 },
      { foodId: 'onion_raw', grams: 30 }, { foodId: 'olive_oil', grams: 8 }, { foodId: 'potato_boiled', grams: 100 },
    ],
    prepMinutes: 25,
  },
  {
    id: 'bfa_rice_egg_edamame_bowl', nameHe: 'קערת אורז מלא עם ביצה, אדממה וירקות בסגנון אסייתי', nameEn: 'Asian-Style Brown Rice Bowl with Egg, Edamame and Vegetables', slots: ['breakfast', 'lunch'],
    ingredients: [
      { foodId: 'brown_rice_cooked', grams: 150 }, { foodId: 'egg_whole_raw', grams: 100 }, { foodId: 'edamame_shelled_cooked', grams: 60 },
      { foodId: 'cucumber_raw', grams: 60 }, { foodId: 'soy_sauce', grams: 8 }, { foodId: 'carrot_raw', grams: 50 },
      { foodId: 'sesame_seeds', grams: 5 },
    ],
    prepMinutes: 15,
  },
  {
    id: 'bfa_avocado_toast_chickpeas', nameHe: 'טוסט אבוקדו עם גרבנזו מעוך', nameEn: 'Avocado Toast with Smashed Chickpeas', slots: ['breakfast'],
    ingredients: [
      { foodId: 'sourdough_bread', grams: 70 }, { foodId: 'avocado_raw', grams: 90 }, { foodId: 'chickpeas_cooked', grams: 60 },
      { foodId: 'tomato_raw', grams: 80 }, { foodId: 'lemon_juice', grams: 5 }, { foodId: 'olive_oil', grams: 5 },
    ],
    prepMinutes: 8,
  },
  {
    id: 'bfa_labneh_veggie_pita_plate', nameHe: 'צלחת לאבנה עם שמן זית, ירקות ופיתה', nameEn: 'Labneh Plate with Olive Oil, Fresh Vegetables and Pita', slots: ['breakfast'],
    ingredients: [
      { foodId: 'labneh_full_fat', grams: 80 }, { foodId: 'olive_oil', grams: 8 }, { foodId: 'cucumber_raw', grams: 100 },
      { foodId: 'tomato_raw', grams: 100 }, { foodId: 'pita_white', grams: 80 },
    ],
    prepMinutes: 5,
  },
  {
    id: 'bfa_cottage_israeli_salad_plate', nameHe: 'צלחת קוטג׳ עם סלט ירקות ולחם מלא', nameEn: 'Cottage Cheese Plate with Israeli Salad and Whole Wheat Bread', slots: ['breakfast'],
    ingredients: [
      { foodId: 'cottage_cheese_5pct', grams: 200 }, { foodId: 'cucumber_raw', grams: 100 }, { foodId: 'tomato_raw', grams: 100 },
      { foodId: 'bell_pepper_red_raw', grams: 60 }, { foodId: 'bread_whole_wheat', grams: 60 }, { foodId: 'olive_oil', grams: 5 },
    ],
    prepMinutes: 8,
  },
  {
    id: 'bfa_hummus_pita_veggie_plate', nameHe: 'צלחת חומוס עם פיתה מלאה וירקות טריים', nameEn: 'Hummus Plate with Whole Wheat Pita and Fresh Vegetables', slots: ['breakfast', 'lunch'],
    ingredients: [
      { foodId: 'hummus_spread', grams: 150 }, { foodId: 'pita_whole_wheat', grams: 80 }, { foodId: 'cucumber_raw', grams: 80 },
      { foodId: 'tomato_raw', grams: 80 }, { foodId: 'parsley_raw', grams: 10 }, { foodId: 'olive_oil', grams: 5 },
    ],
    prepMinutes: 8,
  },
  {
    id: 'bfa_ful_medames_pita', nameHe: 'פול מדמס עם עגבנייה, לימון ופיתה', nameEn: 'Ful Medames with Tomato, Lemon and Pita', slots: ['breakfast'],
    ingredients: [
      { foodId: 'fava_beans_cooked', grams: 200 }, { foodId: 'tomato_raw', grams: 100 }, { foodId: 'parsley_raw', grams: 10 },
      { foodId: 'lemon_juice', grams: 10 }, { foodId: 'olive_oil', grams: 10 }, { foodId: 'pita_white', grams: 70 },
      { foodId: 'garlic_raw', grams: 3 },
    ],
    prepMinutes: 15,
  },
  {
    id: 'bfa_tofu_scramble_potatoes', nameHe: 'מקושקשת טופו עם פלפל, תרד ותפוחי אדמה', nameEn: 'Tofu Scramble with Peppers, Spinach and Potatoes', slots: ['breakfast'],
    ingredients: [
      { foodId: 'tofu_firm', grams: 180 }, { foodId: 'bell_pepper_red_raw', grams: 80 }, { foodId: 'spinach_raw', grams: 60 },
      { foodId: 'onion_raw', grams: 40 }, { foodId: 'olive_oil', grams: 8 }, { foodId: 'potato_boiled', grams: 150 },
    ],
    prepMinutes: 15,
  },
  {
    id: 'bfa_burrito_tofu_black_beans', nameHe: 'בוריטו בוקר טבעוני עם טופו ושעועית שחורה', nameEn: 'Vegan Breakfast Burrito with Tofu and Black Beans', slots: ['breakfast'],
    ingredients: [
      { foodId: 'tortilla_flour', grams: 70 }, { foodId: 'tofu_firm', grams: 150 }, { foodId: 'black_beans_cooked', grams: 60 },
      { foodId: 'tomato_raw', grams: 80 }, { foodId: 'avocado_raw', grams: 40 },
    ],
    prepMinutes: 15,
  },
  {
    id: 'bfa_savory_oats_chickpeas_mushrooms', nameHe: 'שיבולת שועל מלוחה עם גרבנזו, פטריות ותרד', nameEn: 'Savory Oats with Chickpeas, Mushrooms and Spinach', slots: ['breakfast'],
    ingredients: [
      { foodId: 'rolled_oats_dry', grams: 60 }, { foodId: 'chickpeas_cooked', grams: 80 }, { foodId: 'mushrooms_raw', grams: 60 },
      { foodId: 'spinach_raw', grams: 60 }, { foodId: 'tomato_raw', grams: 100 }, { foodId: 'olive_oil', grams: 8 },
    ],
    prepMinutes: 15,
  },
  {
    id: 'bfa_savory_oats_feta_tomato', nameHe: 'שיבולת שועל מלוחה עם גבינה בולגרית, עגבנייה וגרעיני דלעת', nameEn: 'Savory Oats with Feta, Tomato and Pumpkin Seeds', slots: ['breakfast'],
    ingredients: [
      { foodId: 'rolled_oats_dry', grams: 60 }, { foodId: 'feta_bulgarian_cheese', grams: 30 }, { foodId: 'tomato_raw', grams: 100 },
      { foodId: 'spinach_raw', grams: 50 }, { foodId: 'olive_oil', grams: 5 }, { foodId: 'pumpkin_seeds_raw', grams: 10 },
    ],
    prepMinutes: 12,
  },
  {
    id: 'bfa_skyr_cucumber_seeds_bowl', nameHe: 'קערת סקיר עם מלפפון, גרעיני דלעת ופריכיות אורז', nameEn: 'Skyr Bowl with Cucumber, Pumpkin Seeds and Rice Cakes', slots: ['breakfast', 'snack'],
    ingredients: [
      { foodId: 'skyr_plain', grams: 200 }, { foodId: 'cucumber_raw', grams: 120 }, { foodId: 'pumpkin_seeds_raw', grams: 15 },
      { foodId: 'rice_cakes', grams: 30 }, { foodId: 'olive_oil', grams: 5 }, { foodId: 'parsley_raw', grams: 10 },
    ],
    prepMinutes: 5,
  },
  {
    id: 'bfa_sweet_potato_labneh_seeds', nameHe: 'בטטה אפויה עם לאבנה, תרד וגרעיני דלעת', nameEn: 'Baked Sweet Potato with Labneh, Spinach and Pumpkin Seeds', slots: ['breakfast', 'lunch'],
    ingredients: [
      { foodId: 'sweet_potato_baked', grams: 250 }, { foodId: 'labneh_full_fat', grams: 60 }, { foodId: 'pumpkin_seeds_raw', grams: 10 },
      { foodId: 'spinach_raw', grams: 40 }, { foodId: 'olive_oil', grams: 5 },
    ],
    prepMinutes: 10,
  },
  {
    id: 'bfa_turkey_avocado_pita', nameHe: 'פיתה מלאה עם חזה הודו, אבוקדו וירקות', nameEn: 'Whole Wheat Pita with Turkey Breast, Avocado and Vegetables', slots: ['breakfast', 'lunch'],
    ingredients: [
      { foodId: 'pita_whole_wheat', grams: 90 }, { foodId: 'turkey_breast_cooked', grams: 100 }, { foodId: 'avocado_raw', grams: 50 },
      { foodId: 'tomato_raw', grams: 80 }, { foodId: 'romaine_lettuce_raw', grams: 30 },
    ],
    prepMinutes: 8,
  },
  {
    id: 'bfa_beef_potato_hash', nameHe: 'מחבת בקר טחון, תפוחי אדמה ופלפלים', nameEn: 'Beef and Potato Skillet Hash with Peppers', slots: ['breakfast', 'lunch'],
    ingredients: [
      { foodId: 'potato_boiled', grams: 250 }, { foodId: 'beef_ground_lean_cooked', grams: 100 }, { foodId: 'onion_raw', grams: 60 },
      { foodId: 'bell_pepper_red_raw', grams: 80 }, { foodId: 'olive_oil', grams: 8 },
    ],
    prepMinutes: 20,
  },
  {
    id: 'bfa_smoked_salmon_bagel', nameHe: 'בייגל עם סלמון מעושן, גבינת שמנת ומלפפון', nameEn: 'Bagel with Smoked Salmon, Cream Cheese and Cucumber', slots: ['breakfast'],
    ingredients: [
      { foodId: 'bagel_plain', grams: 90 }, { foodId: 'salmon_smoked', grams: 60 }, { foodId: 'cream_cheese_regular', grams: 30 },
      { foodId: 'cucumber_raw', grams: 80 }, { foodId: 'onion_raw', grams: 20 },
    ],
    prepMinutes: 8,
  },
  {
    id: 'bfa_tuna_avocado_toast', nameHe: 'טוסט טונה ואבוקדו על לחם מחמצת', nameEn: 'Tuna and Avocado Toast on Sourdough', slots: ['breakfast', 'lunch'],
    ingredients: [
      { foodId: 'sourdough_bread', grams: 70 }, { foodId: 'tuna_canned_water', grams: 80 }, { foodId: 'avocado_raw', grams: 60 },
      { foodId: 'tomato_raw', grams: 80 }, { foodId: 'lemon_juice', grams: 5 },
    ],
    prepMinutes: 8,
  },
  {
    id: 'bfa_sardines_tomato_toast', nameHe: 'טוסט סרדינים עם עגבנייה ופטרוזיליה', nameEn: 'Sardines on Whole Wheat Toast with Tomato and Parsley', slots: ['breakfast'],
    ingredients: [
      { foodId: 'bread_whole_wheat', grams: 70 }, { foodId: 'sardines_canned_oil', grams: 90 }, { foodId: 'tomato_raw', grams: 100 },
      { foodId: 'lemon_juice', grams: 5 }, { foodId: 'parsley_raw', grams: 5 },
    ],
    prepMinutes: 6,
  },
  {
    id: 'bfa_lentil_roasted_veg_bowl', nameHe: 'קערת עדשים חמה עם ירקות צלויים ואבוקדו', nameEn: 'Warm Lentil Bowl with Roasted Vegetables and Avocado', slots: ['breakfast', 'lunch'],
    ingredients: [
      { foodId: 'lentils_green_cooked', grams: 150 }, { foodId: 'eggplant_roasted', grams: 100 }, { foodId: 'tomato_raw', grams: 100 },
      { foodId: 'bell_pepper_red_raw', grams: 60 }, { foodId: 'olive_oil', grams: 10 }, { foodId: 'parsley_raw', grams: 10 },
      { foodId: 'avocado_raw', grams: 50 },
    ],
    prepMinutes: 20,
  },
  {
    id: 'bfa_sweet_potato_black_bean_bowl', nameHe: 'קערת בטטה ושעועית שחורה עם אבוקדו בסגנון מקסיקני', nameEn: 'Mexican-Style Sweet Potato and Black Bean Bowl with Avocado', slots: ['breakfast', 'lunch'],
    ingredients: [
      { foodId: 'sweet_potato_baked', grams: 200 }, { foodId: 'black_beans_cooked', grams: 120 }, { foodId: 'avocado_raw', grams: 60 },
      { foodId: 'tomato_raw', grams: 80 }, { foodId: 'lemon_juice', grams: 5 }, { foodId: 'onion_raw', grams: 20 },
    ],
    prepMinutes: 15,
  },
  {
    id: 'bfa_polenta_tomato_feta', nameHe: 'פולנטה עם עגבניות, תרד, גבינה בולגרית וביצת עין', nameEn: 'Polenta with Tomatoes, Spinach, Feta and Fried Egg', slots: ['breakfast'],
    ingredients: [
      { foodId: 'polenta_cooked', grams: 250 }, { foodId: 'tomato_raw', grams: 120 }, { foodId: 'feta_bulgarian_cheese', grams: 40 },
      { foodId: 'olive_oil', grams: 8 }, { foodId: 'spinach_raw', grams: 50 }, { foodId: 'egg_whole_raw', grams: 55 },
    ],
    prepMinutes: 15,
  },
  {
    id: 'bfa_quesadilla_beans_cheese', nameHe: 'קסדיה שעועית שחורה וגבינה צהובה', nameEn: 'Black Bean and Cheese Quesadilla', slots: ['breakfast', 'lunch'],
    ingredients: [
      { foodId: 'tortilla_flour', grams: 70 }, { foodId: 'yellow_cheese_gouda_type', grams: 40 }, { foodId: 'black_beans_cooked', grams: 80 },
      { foodId: 'bell_pepper_red_raw', grams: 60 }, { foodId: 'olive_oil', grams: 5 },
    ],
    prepMinutes: 12,
  },
];
