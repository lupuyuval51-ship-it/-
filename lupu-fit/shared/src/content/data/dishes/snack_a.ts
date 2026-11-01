import type { DishRaw } from '../../types.js';

export const SNACK_A_DISHES: DishRaw[] = [
  // ---- Plant-based savoury snacks ----
  {
    id: 'sna_hummus_pita_cucumber', nameHe: 'חומוס ופיתה מחיטה מלאה עם מלפפון ועגבנייה',
    nameEn: 'Hummus and Whole Wheat Pita with Cucumber and Tomato', slots: ['snack'], prepMinutes: 5,
    ingredients: [
      { foodId: 'hummus_spread', grams: 80 }, { foodId: 'pita_whole_wheat', grams: 50 },
      { foodId: 'cucumber_raw', grams: 80 }, { foodId: 'tomato_raw', grams: 60 },
    ],
  },
  {
    id: 'sna_edamame_lemon_carrot', nameHe: 'אדממה עם לימון ומקלות גזר',
    nameEn: 'Edamame with Lemon and Carrot Sticks', slots: ['snack'], prepMinutes: 5,
    ingredients: [
      { foodId: 'edamame_shelled_cooked', grams: 150 }, { foodId: 'lemon_juice', grams: 10 },
      { foodId: 'carrot_raw', grams: 80 },
    ],
  },
  {
    id: 'sna_chickpea_veg_cup', nameHe: 'סלט גרגירי חומוס עם ירקות, פטרוזיליה וטחינה',
    nameEn: 'Chickpea and Vegetable Salad Cup with Parsley and Tahini', slots: ['snack'], prepMinutes: 8,
    ingredients: [
      { foodId: 'chickpeas_cooked', grams: 120 }, { foodId: 'cucumber_raw', grams: 80 },
      { foodId: 'tomato_raw', grams: 80 }, { foodId: 'parsley_raw', grams: 10 },
      { foodId: 'olive_oil', grams: 5 }, { foodId: 'lemon_juice', grams: 10 },
      { foodId: 'tahini_sauce_ready', grams: 15 },
    ],
  },
  {
    id: 'sna_rice_cakes_avocado_tomato', nameHe: 'פריכיות אורז עם אבוקדו ועגבנייה',
    nameEn: 'Rice Cakes with Avocado and Tomato', slots: ['snack'], prepMinutes: 4,
    ingredients: [
      { foodId: 'rice_cakes', grams: 20 }, { foodId: 'avocado_raw', grams: 60 },
      { foodId: 'tomato_raw', grams: 60 }, { foodId: 'lemon_juice', grams: 5 },
    ],
  },
  {
    id: 'sna_veggie_sticks_tahini_dip', nameHe: 'מקלות ירקות עם רוטב טחינה',
    nameEn: 'Veggie Sticks with Tahini Dip', slots: ['snack'], prepMinutes: 6,
    ingredients: [
      { foodId: 'carrot_raw', grams: 100 }, { foodId: 'cucumber_raw', grams: 100 },
      { foodId: 'bell_pepper_red_raw', grams: 80 }, { foodId: 'tahini_sauce_ready', grams: 40 },
    ],
  },
  {
    id: 'sna_lentil_pepper_cup', nameHe: 'סלט עדשים ירוקות עם פלפל ומלפפון',
    nameEn: 'Green Lentil Salad with Pepper and Cucumber', slots: ['snack'], prepMinutes: 8,
    ingredients: [
      { foodId: 'lentils_green_cooked', grams: 120 }, { foodId: 'bell_pepper_red_raw', grams: 60 },
      { foodId: 'cucumber_raw', grams: 60 }, { foodId: 'parsley_raw', grams: 10 },
      { foodId: 'olive_oil', grams: 5 }, { foodId: 'lemon_juice', grams: 10 },
    ],
  },
  {
    id: 'sna_black_bean_corn_salsa', nameHe: 'סלסה שעועית שחורה ותירס עם אבוקדו',
    nameEn: 'Black Bean and Corn Salsa Cup with Avocado', slots: ['snack'], prepMinutes: 10,
    ingredients: [
      { foodId: 'black_beans_cooked', grams: 100 }, { foodId: 'corn_kernels_cooked', grams: 60 },
      { foodId: 'tomato_raw', grams: 60 }, { foodId: 'onion_raw', grams: 20 },
      { foodId: 'avocado_raw', grams: 40 }, { foodId: 'lemon_juice', grams: 10 },
    ],
  },
  {
    id: 'sna_popcorn_pumpkin_seeds', nameHe: 'פופקורן עם גרעיני דלעת',
    nameEn: 'Popcorn with Pumpkin Seeds', slots: ['snack'], prepMinutes: 5,
    ingredients: [
      { foodId: 'popcorn_air_popped', grams: 25 }, { foodId: 'pumpkin_seeds_raw', grams: 15 },
    ],
  },
  {
    id: 'sna_hummus_veggie_sticks', nameHe: 'חומוס עם מקלות ירקות פריכים',
    nameEn: 'Hummus with Crunchy Vegetable Sticks', slots: ['snack'], prepMinutes: 5,
    ingredients: [
      { foodId: 'hummus_spread', grams: 100 }, { foodId: 'carrot_raw', grams: 70 },
      { foodId: 'cucumber_raw', grams: 80 }, { foodId: 'bell_pepper_red_raw', grams: 70 },
    ],
  },
  {
    id: 'sna_baked_tofu_soy_cucumber', nameHe: 'קוביות טופו אפויות ברוטב סויה עם מלפפון',
    nameEn: 'Baked Tofu Cubes in Soy Glaze with Cucumber', slots: ['snack'], prepMinutes: 20,
    ingredients: [
      { foodId: 'tofu_firm', grams: 120 }, { foodId: 'soy_sauce', grams: 8 },
      { foodId: 'canola_oil', grams: 4 }, { foodId: 'cucumber_raw', grams: 100 },
    ],
  },
  {
    id: 'sna_falafel_tahini_salad', nameHe: 'כדורי פלאפל אפויים עם טחינה וסלט',
    nameEn: 'Baked Falafel Bites with Tahini and Salad', slots: ['snack'], prepMinutes: 8,
    ingredients: [
      { foodId: 'falafel_baked', grams: 90 }, { foodId: 'tahini_sauce_ready', grams: 25 },
      { foodId: 'tomato_raw', grams: 60 }, { foodId: 'cucumber_raw', grams: 60 },
    ],
  },
  {
    id: 'sna_eggplant_tahini_pita', nameHe: 'חציל צלוי וטחינה על פיתה מחיטה מלאה',
    nameEn: 'Roasted Eggplant and Tahini on Whole Wheat Pita', slots: ['snack'], prepMinutes: 10,
    ingredients: [
      { foodId: 'eggplant_roasted', grams: 100 }, { foodId: 'tahini_sauce_ready', grams: 25 },
      { foodId: 'pita_whole_wheat', grams: 45 }, { foodId: 'tomato_raw', grams: 50 },
      { foodId: 'parsley_raw', grams: 5 },
    ],
  },
  // ---- Vegetarian: dairy and eggs ----
  {
    id: 'sna_cottage_cucumber_tomato', nameHe: 'קוטג׳ עם מלפפון ועגבנייה',
    nameEn: 'Cottage Cheese with Cucumber and Tomato', slots: ['snack'], prepMinutes: 4,
    ingredients: [
      { foodId: 'cottage_cheese_5pct', grams: 150 }, { foodId: 'cucumber_raw', grams: 100 },
      { foodId: 'tomato_raw', grams: 80 }, { foodId: 'olive_oil', grams: 3 },
      { foodId: 'parsley_raw', grams: 5 },
    ],
  },
  {
    id: 'sna_cottage_rice_cakes_pepper', nameHe: 'קוטג׳ עם פריכיות אורז ופלפל אדום',
    nameEn: 'Cottage Cheese with Rice Cakes and Red Pepper', slots: ['snack'], prepMinutes: 4,
    ingredients: [
      { foodId: 'cottage_cheese_5pct', grams: 125 }, { foodId: 'rice_cakes', grams: 20 },
      { foodId: 'bell_pepper_red_raw', grams: 80 },
    ],
  },
  {
    id: 'sna_boiled_eggs_veg', nameHe: 'ביצים קשות עם מלפפון ועגבנייה',
    nameEn: 'Hard-Boiled Eggs with Cucumber and Tomato', slots: ['snack', 'breakfast'], prepMinutes: 12,
    ingredients: [
      { foodId: 'egg_boiled_hard', grams: 150 }, { foodId: 'cucumber_raw', grams: 100 },
      { foodId: 'tomato_raw', grams: 100 }, { foodId: 'parsley_raw', grams: 5 },
    ],
  },
  {
    id: 'sna_egg_salad_bread', nameHe: 'סלט ביצים עם יוגורט על לחם מחיטה מלאה',
    nameEn: 'Egg Salad with Greek Yogurt on Whole Wheat Bread', slots: ['snack', 'breakfast'], prepMinutes: 15,
    ingredients: [
      { foodId: 'egg_boiled_hard', grams: 100 }, { foodId: 'yogurt_greek_plain_5pct', grams: 30 },
      { foodId: 'mustard_prepared', grams: 5 }, { foodId: 'bread_whole_wheat', grams: 40 },
      { foodId: 'celery_raw', grams: 30 },
    ],
  },
  {
    id: 'sna_labneh_pita_veg', nameHe: 'לאבנה עם פיתה מחיטה מלאה, מלפפון ועגבנייה',
    nameEn: 'Labneh with Whole Wheat Pita, Cucumber and Tomato', slots: ['snack'], prepMinutes: 5,
    ingredients: [
      { foodId: 'labneh_full_fat', grams: 50 }, { foodId: 'pita_whole_wheat', grams: 50 },
      { foodId: 'cucumber_raw', grams: 60 }, { foodId: 'tomato_raw', grams: 60 },
      { foodId: 'olive_oil', grams: 3 },
    ],
  },
  {
    id: 'sna_cheese_plate_crackers', nameHe: 'מגש גבינה צהובה עם קרקרים, מלפפון וענבים',
    nameEn: 'Cheese Plate with Crackers, Cucumber and Grapes', slots: ['snack'], prepMinutes: 5,
    ingredients: [
      { foodId: 'yellow_cheese_gouda_type', grams: 30 }, { foodId: 'crackers_plain', grams: 20 },
      { foodId: 'cucumber_raw', grams: 80 }, { foodId: 'grapes_raw', grams: 60 },
    ],
  },
  {
    id: 'sna_mozzarella_tomato_oil', nameHe: 'מוצרלה ועגבנייה בשמן זית',
    nameEn: 'Mozzarella and Tomato with Olive Oil', slots: ['snack'], prepMinutes: 5,
    ingredients: [
      { foodId: 'mozzarella_cheese', grams: 60 }, { foodId: 'tomato_raw', grams: 120 },
      { foodId: 'olive_oil', grams: 5 }, { foodId: 'parsley_raw', grams: 3 },
    ],
  },
  {
    id: 'sna_feta_watermelon_cucumber', nameHe: 'גבינה בולגרית עם אבטיח ומלפפון',
    nameEn: 'Bulgarian Feta with Watermelon and Cucumber', slots: ['snack'], prepMinutes: 5,
    ingredients: [
      { foodId: 'feta_bulgarian_cheese', grams: 40 }, { foodId: 'watermelon_raw', grams: 150 },
      { foodId: 'cucumber_raw', grams: 50 }, { foodId: 'olive_oil', grams: 3 },
    ],
  },
  {
    id: 'sna_greek_yogurt_dip_pita', nameHe: 'טבילת יוגורט יווני ומלפפון עם פיתה',
    nameEn: 'Greek Yogurt and Cucumber Dip with Pita', slots: ['snack'], prepMinutes: 6,
    ingredients: [
      { foodId: 'yogurt_greek_plain_5pct', grams: 120 }, { foodId: 'cucumber_raw', grams: 80 },
      { foodId: 'olive_oil', grams: 4 }, { foodId: 'pita_whole_wheat', grams: 40 },
    ],
  },
  {
    id: 'sna_skyr_savory_bowl', nameHe: 'קערת סקיר מלוחה עם מלפפון ועגבנייה',
    nameEn: 'Savory Skyr Bowl with Cucumber and Tomato', slots: ['snack'], prepMinutes: 4,
    ingredients: [
      { foodId: 'skyr_plain', grams: 170 }, { foodId: 'cucumber_raw', grams: 100 },
      { foodId: 'tomato_raw', grams: 60 }, { foodId: 'olive_oil', grams: 4 },
    ],
  },
  {
    id: 'sna_cottage_avocado_toast', nameHe: 'טוסט קוטג׳ ואבוקדו עם עגבנייה',
    nameEn: 'Cottage Cheese and Avocado Toast with Tomato', slots: ['snack', 'breakfast'], prepMinutes: 6,
    ingredients: [
      { foodId: 'bread_whole_wheat', grams: 40 }, { foodId: 'cottage_cheese_5pct', grams: 80 },
      { foodId: 'avocado_raw', grams: 50 }, { foodId: 'tomato_raw', grams: 50 },
    ],
  },
  {
    id: 'sna_egg_muffins_spinach_feta', nameHe: 'מאפינס ביצים עם תרד, פטריות ובולגרית',
    nameEn: 'Egg Muffins with Spinach, Mushrooms and Feta', slots: ['snack', 'breakfast'], prepMinutes: 25,
    ingredients: [
      { foodId: 'egg_whole_raw', grams: 100 }, { foodId: 'spinach_raw', grams: 50 },
      { foodId: 'mushrooms_raw', grams: 50 }, { foodId: 'feta_bulgarian_cheese', grams: 15 },
    ],
  },
  // ---- Meat and poultry ----
  {
    id: 'sna_turkey_cucumber_rollups', nameHe: 'גלילי פסטרמת הודו עם מלפפון ופלפל',
    nameEn: 'Turkey Roll-Ups with Cucumber and Pepper', slots: ['snack'], prepMinutes: 5,
    ingredients: [
      { foodId: 'turkey_deli_slices', grams: 70 }, { foodId: 'cucumber_raw', grams: 80 },
      { foodId: 'bell_pepper_red_raw', grams: 50 }, { foodId: 'mustard_prepared', grams: 5 },
    ],
  },
  {
    id: 'sna_turkey_avocado_wrap', nameHe: 'טורטייה עם הודו, אבוקדו וחסה',
    nameEn: 'Turkey and Avocado Tortilla Wrap with Lettuce', slots: ['snack'], prepMinutes: 6,
    ingredients: [
      { foodId: 'tortilla_flour', grams: 45 }, { foodId: 'turkey_deli_slices', grams: 60 },
      { foodId: 'avocado_raw', grams: 40 }, { foodId: 'romaine_lettuce_raw', grams: 30 },
      { foodId: 'tomato_raw', grams: 40 }, { foodId: 'mustard_prepared', grams: 4 },
    ],
  },
  {
    id: 'sna_mini_kebab_pita', nameHe: 'קבב קטן בפיתה עם עגבנייה ובצל',
    nameEn: 'Mini Kebab in Pita with Tomato and Onion', slots: ['snack'], prepMinutes: 10,
    ingredients: [
      { foodId: 'kebab_ground_meat_grilled', grams: 60 }, { foodId: 'pita_white', grams: 40 },
      { foodId: 'tomato_raw', grams: 50 }, { foodId: 'onion_raw', grams: 15 },
      { foodId: 'parsley_raw', grams: 5 },
    ],
  },
  {
    id: 'sna_chicken_avocado_lettuce_cups', nameHe: 'כוסות חסה עם סלט עוף ואבוקדו',
    nameEn: 'Chicken and Avocado Lettuce Cups', slots: ['snack'], prepMinutes: 10,
    ingredients: [
      { foodId: 'chicken_breast_cooked', grams: 70 }, { foodId: 'romaine_lettuce_raw', grams: 40 },
      { foodId: 'avocado_raw', grams: 40 }, { foodId: 'tomato_raw', grams: 40 },
      { foodId: 'lemon_juice', grams: 5 },
    ],
  },
  {
    id: 'sna_sirloin_lettuce_rolls', nameHe: 'גלילי סינטה בחסה עם חרדל ופלפל',
    nameEn: 'Sirloin Lettuce Rolls with Mustard and Pepper', slots: ['snack'], prepMinutes: 8,
    ingredients: [
      { foodId: 'beef_sirloin_cooked', grams: 60 }, { foodId: 'romaine_lettuce_raw', grams: 40 },
      { foodId: 'mustard_prepared', grams: 5 }, { foodId: 'bell_pepper_red_raw', grams: 60 },
    ],
  },
  {
    id: 'sna_cold_chicken_hummus_veg', nameHe: 'חזה עוף קר עם חומוס וירקות',
    nameEn: 'Cold Chicken Breast with Hummus and Veggies', slots: ['snack'], prepMinutes: 5,
    ingredients: [
      { foodId: 'chicken_breast_cooked', grams: 80 }, { foodId: 'hummus_spread', grams: 50 },
      { foodId: 'cucumber_raw', grams: 80 }, { foodId: 'carrot_raw', grams: 60 },
    ],
  },
  {
    id: 'sna_sweet_potato_turkey_spinach', nameHe: 'בטטה אפויה עם פסטרמת הודו ותרד',
    nameEn: 'Baked Sweet Potato with Turkey Slices and Spinach', slots: ['snack'], prepMinutes: 10,
    ingredients: [
      { foodId: 'sweet_potato_baked', grams: 120 }, { foodId: 'turkey_deli_slices', grams: 60 },
      { foodId: 'spinach_raw', grams: 20 },
    ],
  },
  // ---- Fish ----
  {
    id: 'sna_tuna_crackers_cucumber', nameHe: 'טונה על קרקרים עם מלפפון',
    nameEn: 'Tuna on Crackers with Cucumber', slots: ['snack'], prepMinutes: 5,
    ingredients: [
      { foodId: 'tuna_canned_water', grams: 80 }, { foodId: 'crackers_plain', grams: 25 },
      { foodId: 'cucumber_raw', grams: 60 }, { foodId: 'lemon_juice', grams: 5 },
    ],
  },
  {
    id: 'sna_rice_cakes_tuna_avocado', nameHe: 'פריכיות אורז עם טונה ואבוקדו',
    nameEn: 'Rice Cakes with Tuna and Avocado', slots: ['snack'], prepMinutes: 5,
    ingredients: [
      { foodId: 'tuna_canned_water', grams: 70 }, { foodId: 'rice_cakes', grams: 20 },
      { foodId: 'avocado_raw', grams: 40 }, { foodId: 'lemon_juice', grams: 5 },
    ],
  },
  {
    id: 'sna_sardines_sourdough_tomato', nameHe: 'סרדינים על לחם שאור עם עגבנייה',
    nameEn: 'Sardines on Sourdough with Tomato', slots: ['snack'], prepMinutes: 5,
    ingredients: [
      { foodId: 'sardines_canned_oil', grams: 60 }, { foodId: 'sourdough_bread', grams: 40 },
      { foodId: 'tomato_raw', grams: 50 }, { foodId: 'lemon_juice', grams: 5 },
    ],
  },
  {
    id: 'sna_smoked_salmon_cream_cheese_cakes', nameHe: 'סלמון מעושן וגבינת שמנת על פריכיות אורז',
    nameEn: 'Smoked Salmon and Cream Cheese on Rice Cakes', slots: ['snack'], prepMinutes: 5,
    ingredients: [
      { foodId: 'salmon_smoked', grams: 50 }, { foodId: 'cream_cheese_regular', grams: 20 },
      { foodId: 'cucumber_raw', grams: 80 }, { foodId: 'rice_cakes', grams: 15 },
    ],
  },
];
