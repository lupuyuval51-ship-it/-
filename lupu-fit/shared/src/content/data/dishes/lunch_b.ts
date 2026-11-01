import type { DishRaw } from '../../types.js';

/* Lunch B: fish, vegetarian and vegan lunches. Amounts are for one adult serving. */

export const LUNCH_B_DISHES: DishRaw[] = [
  /* ------------------------------------------------------------ vegan */
  {
    id: 'lub_red_lentil_soup_sourdough', nameHe: 'מרק עדשים כתומות עם לחם שאור', nameEn: 'Red Lentil Soup with Sourdough',
    slots: ['lunch', 'dinner'], prepMinutes: 30,
    ingredients: [
      { foodId: 'lentils_red_cooked', grams: 250 }, { foodId: 'carrot_raw', grams: 80 }, { foodId: 'onion_raw', grams: 60 },
      { foodId: 'olive_oil', grams: 8 }, { foodId: 'sourdough_bread', grams: 80 }, { foodId: 'lemon_juice', grams: 10 },
    ],
  },
  {
    id: 'lub_chickpea_quinoa_bowl', nameHe: 'קערת חימצה וקינואה עם ירקות טריים', nameEn: 'Chickpea and Quinoa Bowl with Fresh Vegetables',
    slots: ['lunch'], prepMinutes: 20,
    ingredients: [
      { foodId: 'chickpeas_cooked', grams: 150 }, { foodId: 'quinoa_cooked', grams: 150 }, { foodId: 'cucumber_raw', grams: 100 },
      { foodId: 'tomato_raw', grams: 100 }, { foodId: 'parsley_raw', grams: 10 }, { foodId: 'olive_oil', grams: 10 },
      { foodId: 'lemon_juice', grams: 15 },
    ],
  },
  {
    id: 'lub_sesame_tofu_broccoli_quinoa', nameHe: 'טופו שומשום וברוקולי עם קינואה', nameEn: 'Sesame Tofu and Broccoli with Quinoa',
    slots: ['lunch', 'dinner'], prepMinutes: 20,
    ingredients: [
      { foodId: 'tofu_firm', grams: 180 }, { foodId: 'broccoli_cooked', grams: 150 }, { foodId: 'quinoa_cooked', grams: 180 }, { foodId: 'soy_sauce', grams: 15 }, { foodId: 'sesame_seeds', grams: 8 }, { foodId: 'canola_oil', grams: 8 },
    ],
  },
  {
    id: 'lub_black_bean_rice_avocado_bowl', nameHe: 'קערת אורז ושעועית שחורה עם אבוקדו', nameEn: 'Black Bean and Rice Bowl with Avocado',
    slots: ['lunch', 'dinner'], prepMinutes: 20,
    ingredients: [
      { foodId: 'black_beans_cooked', grams: 180 }, { foodId: 'white_rice_cooked', grams: 200 }, { foodId: 'corn_kernels_cooked', grams: 80 },
      { foodId: 'avocado_raw', grams: 70 }, { foodId: 'tomato_raw', grams: 100 }, { foodId: 'lemon_juice', grams: 10 },
    ],
  },
  {
    id: 'lub_falafel_hummus_plate', nameHe: 'צלחת פלאפל עם חומוס וסלט טרי', nameEn: 'Falafel Plate with Hummus and Fresh Salad',
    slots: ['lunch'], prepMinutes: 15,
    ingredients: [
      { foodId: 'falafel_baked', grams: 150 }, { foodId: 'hummus_spread', grams: 80 }, { foodId: 'tomato_raw', grams: 100 }, { foodId: 'cucumber_raw', grams: 100 }, { foodId: 'romaine_lettuce_raw', grams: 40 }, { foodId: 'olive_oil', grams: 8 }, { foodId: 'lemon_juice', grams: 10 },
    ],
  },
  {
    id: 'lub_hummus_plate_pita', nameHe: 'צלחת חומוס עם פיתה, חימצה וירקות', nameEn: 'Hummus Plate with Pita and Chickpeas',
    slots: ['lunch'], prepMinutes: 10,
    ingredients: [
      { foodId: 'hummus_spread', grams: 150 }, { foodId: 'pita_white', grams: 100 }, { foodId: 'cucumber_raw', grams: 100 },
      { foodId: 'tomato_raw', grams: 100 }, { foodId: 'chickpeas_cooked', grams: 80 }, { foodId: 'olive_oil', grams: 8 },
    ],
  },
  {
    id: 'lub_mujaddara_lentils_rice', nameHe: 'מג׳דרה עדשים ואורז עם בצל וסלט עגבניות', nameEn: 'Mujaddara with Lentils, Rice, and Tomato Salad',
    slots: ['lunch', 'dinner'], prepMinutes: 40,
    ingredients: [
      { foodId: 'lentils_green_cooked', grams: 180 }, { foodId: 'white_rice_cooked', grams: 150 }, { foodId: 'onion_raw', grams: 120 },
      { foodId: 'olive_oil', grams: 12 }, { foodId: 'tomato_raw', grams: 100 },
    ],
  },
  {
    id: 'lub_eggplant_chickpea_stew_bulgur', nameHe: 'תבשיל חציל וחימצה עם בורגול', nameEn: 'Eggplant and Chickpea Stew with Bulgur',
    slots: ['lunch', 'dinner'], prepMinutes: 35,
    ingredients: [
      { foodId: 'eggplant_roasted', grams: 200 }, { foodId: 'chickpeas_cooked', grams: 180 }, { foodId: 'tomato_raw', grams: 150 },
      { foodId: 'onion_raw', grams: 80 }, { foodId: 'olive_oil', grams: 10 }, { foodId: 'bulgur_cooked', grams: 150 },
    ],
  },
  {
    id: 'lub_tempeh_brown_rice_kale_bowl', nameHe: 'קערת טמפה, אורז מלא וקייל', nameEn: 'Tempeh and Brown Rice Bowl with Kale',
    slots: ['lunch', 'dinner'], prepMinutes: 25,
    ingredients: [
      { foodId: 'tempeh', grams: 140 }, { foodId: 'brown_rice_cooked', grams: 180 }, { foodId: 'kale_raw', grams: 60 },
      { foodId: 'carrot_raw', grams: 80 }, { foodId: 'soy_sauce', grams: 10 }, { foodId: 'canola_oil', grams: 8 },
    ],
  },
  {
    id: 'lub_white_bean_kale_soup_bread', nameHe: 'מרק שעועית לבנה וקייל עם לחם שאור', nameEn: 'White Bean and Kale Soup with Sourdough',
    slots: ['lunch', 'dinner'], prepMinutes: 35,
    ingredients: [
      { foodId: 'white_beans_cooked', grams: 250 }, { foodId: 'kale_raw', grams: 80 }, { foodId: 'carrot_raw', grams: 80 },
      { foodId: 'onion_raw', grams: 60 }, { foodId: 'olive_oil', grams: 10 }, { foodId: 'sourdough_bread', grams: 80 },
    ],
  },
  {
    id: 'lub_quinoa_edamame_salad', nameHe: 'סלט קינואה ואדממה עם ירקות', nameEn: 'Quinoa and Edamame Salad with Vegetables',
    slots: ['lunch'], prepMinutes: 20,
    ingredients: [
      { foodId: 'edamame_shelled_cooked', grams: 150 }, { foodId: 'quinoa_cooked', grams: 150 }, { foodId: 'cucumber_raw', grams: 100 },
      { foodId: 'bell_pepper_red_raw', grams: 100 }, { foodId: 'carrot_raw', grams: 60 }, { foodId: 'lemon_juice', grams: 15 },
      { foodId: 'olive_oil', grams: 10 },
    ],
  },
  {
    id: 'lub_sweet_potato_black_bean_tortilla', nameHe: 'טורטייה עם שעועית שחורה ובטטה', nameEn: 'Sweet Potato and Black Bean Tortilla',
    slots: ['lunch', 'dinner'], prepMinutes: 25,
    ingredients: [
      { foodId: 'tortilla_flour', grams: 110 }, { foodId: 'black_beans_cooked', grams: 150 }, { foodId: 'sweet_potato_baked', grams: 150 },
      { foodId: 'avocado_raw', grams: 50 }, { foodId: 'tomato_raw', grams: 80 },
    ],
  },
  {
    id: 'lub_chickpea_spinach_stew_basmati', nameHe: 'תבשיל חימצה ותרד עם אורז בסמטי', nameEn: 'Chickpea and Spinach Stew with Basmati Rice',
    slots: ['lunch', 'dinner'], prepMinutes: 30,
    ingredients: [
      { foodId: 'chickpeas_cooked', grams: 180 }, { foodId: 'spinach_raw', grams: 100 }, { foodId: 'tomato_raw', grams: 150 },
      { foodId: 'onion_raw', grams: 80 }, { foodId: 'basmati_rice_cooked', grams: 180 }, { foodId: 'olive_oil', grams: 10 },
    ],
  },
  {
    id: 'lub_pasta_primavera_zucchini_mushroom', nameHe: 'פסטה עם קישואים ופטריות בשמן זית ושום', nameEn: 'Pasta Primavera with Zucchini and Mushrooms',
    slots: ['lunch', 'dinner'], prepMinutes: 25,
    ingredients: [
      { foodId: 'pasta_white_cooked', grams: 250 }, { foodId: 'zucchini_raw', grams: 120 }, { foodId: 'tomato_raw', grams: 150 },
      { foodId: 'mushrooms_raw', grams: 100 }, { foodId: 'garlic_raw', grams: 5 }, { foodId: 'olive_oil', grams: 12 },
    ],
  },
  {
    id: 'lub_seitan_veg_stir_fry_rice', nameHe: 'סייטן מוקפץ עם ירקות ואורז', nameEn: 'Seitan and Vegetable Stir-Fry with Rice',
    slots: ['lunch', 'dinner'], prepMinutes: 25,
    ingredients: [
      { foodId: 'seitan_prepared', grams: 150 }, { foodId: 'broccoli_cooked', grams: 120 }, { foodId: 'carrot_raw', grams: 80 },
      { foodId: 'bell_pepper_red_raw', grams: 80 }, { foodId: 'white_rice_cooked', grams: 180 }, { foodId: 'soy_sauce', grams: 12 },
      { foodId: 'canola_oil', grams: 8 },
    ],
  },
  {
    id: 'lub_whole_wheat_pasta_soy_bolognese', nameHe: 'פסטה מחיטה מלאה ברוטב בולונז עם חלבון סויה', nameEn: 'Whole Wheat Pasta with Soy Protein Bolognese',
    slots: ['lunch', 'dinner'], prepMinutes: 30,
    ingredients: [
      { foodId: 'textured_soy_protein_dry', grams: 50 }, { foodId: 'pasta_whole_wheat_cooked', grams: 220 }, { foodId: 'tomato_raw', grams: 200 },
      { foodId: 'onion_raw', grams: 60 }, { foodId: 'mushrooms_raw', grams: 80 }, { foodId: 'olive_oil', grams: 8 },
    ],
  },
  {
    id: 'lub_tofu_scramble_potatoes', nameHe: 'טופו מקושקש עם ירקות ותפוחי אדמה', nameEn: 'Tofu Scramble with Vegetables and Potatoes',
    slots: ['lunch', 'dinner'], prepMinutes: 25,
    ingredients: [
      { foodId: 'tofu_firm', grams: 200 }, { foodId: 'spinach_raw', grams: 80 }, { foodId: 'mushrooms_raw', grams: 100 },
      { foodId: 'bell_pepper_red_raw', grams: 80 }, { foodId: 'potato_boiled', grams: 200 }, { foodId: 'olive_oil', grams: 8 },
    ],
  },
  {
    id: 'lub_roasted_cauliflower_chickpea_tahini', nameHe: 'כרובית צלויה וחומוס על אורז מלא עם טחינה', nameEn: 'Roasted Cauliflower and Chickpea Bowl with Tahini',
    slots: ['lunch'], prepMinutes: 35,
    ingredients: [
      { foodId: 'chickpeas_cooked', grams: 160 }, { foodId: 'brown_rice_cooked', grams: 180 }, { foodId: 'cauliflower_cooked', grams: 150 },
      { foodId: 'tahini_raw', grams: 20 }, { foodId: 'lemon_juice', grams: 15 },
    ],
  },
  /* ------------------------------------------------------- vegetarian */
  {
    id: 'lub_egg_feta_pita_sandwich', nameHe: 'כריך פיתה עם ביצה קשה ובולגרית', nameEn: 'Egg and Feta Pita Sandwich with Tomato and Cucumber',
    slots: ['lunch', 'dinner'], prepMinutes: 10,
    ingredients: [
      { foodId: 'egg_boiled_hard', grams: 100 }, { foodId: 'feta_bulgarian_cheese', grams: 40 }, { foodId: 'pita_white', grams: 80 }, { foodId: 'tomato_raw', grams: 80 }, { foodId: 'cucumber_raw', grams: 60 }, { foodId: 'olive_oil', grams: 6 },
    ],
  },
  {
    id: 'lub_greek_salad_chickpeas_feta', nameHe: 'סלט יווני עם חימצה וגבינה בולגרית', nameEn: 'Greek Salad with Chickpeas and Feta',
    slots: ['lunch'], prepMinutes: 15,
    ingredients: [
      { foodId: 'tomato_raw', grams: 150 }, { foodId: 'cucumber_raw', grams: 120 }, { foodId: 'feta_bulgarian_cheese', grams: 70 },
      { foodId: 'chickpeas_cooked', grams: 150 }, { foodId: 'onion_raw', grams: 30 }, { foodId: 'olive_oil', grams: 12 },
      { foodId: 'pita_whole_wheat', grams: 60 },
    ],
  },
  {
    id: 'lub_pasta_broccoli_parmesan', nameHe: 'פסטה עם ברוקולי ופרמזן', nameEn: 'Pasta with Broccoli and Parmesan',
    slots: ['lunch', 'dinner'], prepMinutes: 20,
    ingredients: [
      { foodId: 'pasta_white_cooked', grams: 230 }, { foodId: 'broccoli_cooked', grams: 120 }, { foodId: 'parmesan_cheese', grams: 25 },
      { foodId: 'tomato_raw', grams: 100 }, { foodId: 'olive_oil', grams: 10 },
    ],
  },
  {
    id: 'lub_cottage_plate_egg_bread', nameHe: 'צלחת קוטג׳ עם ביצה קשה, ירקות ולחם מלא', nameEn: 'Cottage Cheese Plate with Egg, Vegetables, and Whole Wheat Bread',
    slots: ['lunch'], prepMinutes: 10,
    ingredients: [
      { foodId: 'cottage_cheese_5pct', grams: 200 }, { foodId: 'bread_whole_wheat', grams: 100 }, { foodId: 'cucumber_raw', grams: 100 },
      { foodId: 'tomato_raw', grams: 100 }, { foodId: 'egg_boiled_hard', grams: 100 }, { foodId: 'olive_oil', grams: 8 },
    ],
  },
  {
    id: 'lub_zucchini_mushroom_feta_frittata', nameHe: 'פריטטה עם קישואים, פטריות וגבינה בולגרית ותפוחי אדמה', nameEn: 'Zucchini, Mushroom, and Feta Frittata with Potatoes',
    slots: ['lunch', 'dinner'], prepMinutes: 30,
    ingredients: [
      { foodId: 'egg_whole_raw', grams: 180 }, { foodId: 'zucchini_raw', grams: 120 }, { foodId: 'mushrooms_raw', grams: 100 },
      { foodId: 'potato_boiled', grams: 200 }, { foodId: 'feta_bulgarian_cheese', grams: 40 }, { foodId: 'olive_oil', grams: 10 },
    ],
  },
  {
    id: 'lub_caprese_pasta_mozzarella', nameHe: 'פסטה קפרזה עם מוצרלה ועגבניות', nameEn: 'Caprese-Style Pasta with Mozzarella, Tomatoes, and Spinach',
    slots: ['lunch', 'dinner'], prepMinutes: 20,
    ingredients: [
      { foodId: 'pasta_white_cooked', grams: 200 }, { foodId: 'mozzarella_cheese', grams: 70 }, { foodId: 'tomato_raw', grams: 200 },
      { foodId: 'olive_oil', grams: 10 }, { foodId: 'spinach_raw', grams: 40 },
    ],
  },
  {
    id: 'lub_spinach_omelet_pita_white_cheese', nameHe: 'חביתת תרד עם גבינה לבנה בפיתה מחיטה מלאה', nameEn: 'Spinach Omelet with White Cheese in Whole Wheat Pita',
    slots: ['lunch'], prepMinutes: 15,
    ingredients: [
      { foodId: 'egg_whole_raw', grams: 150 }, { foodId: 'spinach_raw', grams: 60 }, { foodId: 'pita_whole_wheat', grams: 100 },
      { foodId: 'tomato_raw', grams: 100 }, { foodId: 'white_cheese_5pct', grams: 50 }, { foodId: 'olive_oil', grams: 8 },
    ],
  },
  {
    id: 'lub_lentil_salad_feta', nameHe: 'סלט עדשים עם גבינה בולגרית וירקות', nameEn: 'Lentil Salad with Feta and Vegetables',
    slots: ['lunch'], prepMinutes: 15,
    ingredients: [
      { foodId: 'lentils_green_cooked', grams: 200 }, { foodId: 'feta_bulgarian_cheese', grams: 50 }, { foodId: 'cucumber_raw', grams: 100 },
      { foodId: 'tomato_raw', grams: 100 }, { foodId: 'onion_raw', grams: 30 }, { foodId: 'parsley_raw', grams: 15 },
      { foodId: 'olive_oil', grams: 10 }, { foodId: 'lemon_juice', grams: 15 },
    ],
  },
  {
    id: 'lub_potato_cottage_broccoli', nameHe: 'תפוח אדמה עם קוטג׳ וברוקולי', nameEn: 'Potato with Cottage Cheese and Broccoli',
    slots: ['lunch', 'dinner'], prepMinutes: 25,
    ingredients: [
      { foodId: 'potato_boiled', grams: 350 }, { foodId: 'cottage_cheese_5pct', grams: 150 }, { foodId: 'broccoli_cooked', grams: 120 },
      { foodId: 'olive_oil', grams: 5 },
    ],
  },
  {
    id: 'lub_labneh_roasted_veg_pita', nameHe: 'צלחת לאבנה עם ירקות צלויים, חימצה ופיתה', nameEn: 'Labneh Plate with Roasted Vegetables, Chickpeas, and Pita',
    slots: ['lunch'], prepMinutes: 25,
    ingredients: [
      { foodId: 'labneh_full_fat', grams: 80 }, { foodId: 'pita_white', grams: 110 }, { foodId: 'eggplant_roasted', grams: 150 },
      { foodId: 'bell_pepper_red_raw', grams: 100 }, { foodId: 'tomato_raw', grams: 100 }, { foodId: 'olive_oil', grams: 10 },
      { foodId: 'chickpeas_cooked', grams: 80 },
    ],
  },
  {
    id: 'lub_tomato_white_bean_soup_cheese_toast', nameHe: 'מרק עגבניות ושעועית לבנה עם טוסט גבינה', nameEn: 'Tomato and White Bean Soup with Cheese Toast',
    slots: ['lunch', 'dinner'], prepMinutes: 30,
    ingredients: [
      { foodId: 'white_beans_cooked', grams: 200 }, { foodId: 'tomato_raw', grams: 300 }, { foodId: 'onion_raw', grams: 70 },
      { foodId: 'carrot_raw', grams: 60 }, { foodId: 'sourdough_bread', grams: 80 }, { foodId: 'yellow_cheese_gouda_type', grams: 30 },
      { foodId: 'olive_oil', grams: 8 },
    ],
  },
  {
    id: 'lub_quinoa_egg_avocado_bowl', nameHe: 'קערת קינואה עם ביצה קשה ואבוקדו', nameEn: 'Quinoa Bowl with Hard-Boiled Egg and Avocado',
    slots: ['lunch'], prepMinutes: 20,
    ingredients: [
      { foodId: 'quinoa_cooked', grams: 180 }, { foodId: 'egg_boiled_hard', grams: 100 }, { foodId: 'avocado_raw', grams: 60 },
      { foodId: 'spinach_raw', grams: 60 }, { foodId: 'tomato_raw', grams: 100 }, { foodId: 'lemon_juice', grams: 10 },
      { foodId: 'olive_oil', grams: 8 },
    ],
  },
  {
    id: 'lub_bulgur_chickpea_yogurt_bowl', nameHe: 'קערת בורגול וחימצה עם רוטב יוגורט', nameEn: 'Bulgur and Chickpea Bowl with Yogurt Sauce',
    slots: ['lunch', 'dinner'], prepMinutes: 20,
    ingredients: [
      { foodId: 'bulgur_cooked', grams: 200 }, { foodId: 'chickpeas_cooked', grams: 150 }, { foodId: 'yogurt_plain_3pct', grams: 80 },
      { foodId: 'cucumber_raw', grams: 100 }, { foodId: 'tomato_raw', grams: 100 }, { foodId: 'parsley_raw', grams: 10 },
      { foodId: 'olive_oil', grams: 8 },
    ],
  },
  {
    id: 'lub_eggplant_hummus_egg_plate', nameHe: 'צלחת חציל וחומוס עם ביצה קשה', nameEn: 'Eggplant and Hummus Plate with Boiled Egg',
    slots: ['lunch'], prepMinutes: 15,
    ingredients: [
      { foodId: 'eggplant_roasted', grams: 150 }, { foodId: 'hummus_spread', grams: 80 }, { foodId: 'egg_boiled_hard', grams: 100 }, { foodId: 'pita_whole_wheat', grams: 70 }, { foodId: 'tomato_raw', grams: 80 }, { foodId: 'parsley_raw', grams: 5 },
    ],
  },
  {
    id: 'lub_pesto_pasta_mozzarella_tomato', nameHe: 'פסטה בפסטו עם מוצרלה ועגבניות', nameEn: 'Pesto Pasta with Mozzarella and Tomatoes',
    slots: ['lunch', 'dinner'], prepMinutes: 20,
    ingredients: [
      { foodId: 'pasta_white_cooked', grams: 220 }, { foodId: 'pesto_basil', grams: 25 }, { foodId: 'mozzarella_cheese', grams: 50 },
      { foodId: 'tomato_raw', grams: 150 },
    ],
  },
  {
    id: 'lub_quinoa_roasted_veg_almond_feta', nameHe: 'סלט קינואה, ירקות צלויים, שקדים וגבינה בולגרית', nameEn: 'Quinoa Salad with Roasted Vegetables, Almonds, and Feta',
    slots: ['lunch'], prepMinutes: 30,
    ingredients: [
      { foodId: 'quinoa_cooked', grams: 170 }, { foodId: 'almonds_raw', grams: 20 }, { foodId: 'zucchini_raw', grams: 100 },
      { foodId: 'bell_pepper_red_raw', grams: 100 }, { foodId: 'feta_bulgarian_cheese', grams: 40 }, { foodId: 'olive_oil', grams: 8 },
    ],
  },
  /* ------------------------------------------------------------- fish */
  {
    id: 'lub_tuna_rice_avocado_bowl', nameHe: 'קערת טונה ואורז עם אבוקדו ותירס', nameEn: 'Tuna Rice Bowl with Avocado and Corn',
    slots: ['lunch'], prepMinutes: 15,
    ingredients: [
      { foodId: 'tuna_canned_water', grams: 130 }, { foodId: 'white_rice_cooked', grams: 180 }, { foodId: 'cucumber_raw', grams: 100 },
      { foodId: 'corn_kernels_cooked', grams: 60 }, { foodId: 'avocado_raw', grams: 50 }, { foodId: 'olive_oil', grams: 5 },
    ],
  },
  {
    id: 'lub_salmon_quinoa_broccoli_bowl', nameHe: 'קערת סלמון אפוי, קינואה וברוקולי', nameEn: 'Baked Salmon Bowl with Quinoa and Broccoli',
    slots: ['lunch', 'dinner'], prepMinutes: 25,
    ingredients: [
      { foodId: 'salmon_cooked', grams: 150 }, { foodId: 'quinoa_cooked', grams: 150 }, { foodId: 'broccoli_cooked', grams: 120 },
      { foodId: 'avocado_raw', grams: 40 }, { foodId: 'lemon_juice', grams: 15 }, { foodId: 'olive_oil', grams: 5 },
    ],
  },
  {
    id: 'lub_tuna_pasta_salad', nameHe: 'סלט פסטה עם טונה ועגבניות', nameEn: 'Tuna Pasta Salad with Tomatoes and Corn',
    slots: ['lunch'], prepMinutes: 20,
    ingredients: [
      { foodId: 'pasta_white_cooked', grams: 200 }, { foodId: 'tuna_canned_water', grams: 100 }, { foodId: 'tomato_raw', grams: 150 },
      { foodId: 'cucumber_raw', grams: 80 }, { foodId: 'olive_oil', grams: 10 }, { foodId: 'corn_kernels_cooked', grams: 50 },
    ],
  },
  {
    id: 'lub_tuna_salad_sandwich', nameHe: 'כריך טונה עם ירקות על לחם מלא', nameEn: 'Tuna Salad Sandwich with Vegetables on Whole Wheat',
    slots: ['lunch'], prepMinutes: 10,
    ingredients: [
      { foodId: 'bread_whole_wheat', grams: 120 }, { foodId: 'tuna_canned_water', grams: 100 }, { foodId: 'mayonnaise', grams: 15 },
      { foodId: 'tomato_raw', grams: 80 }, { foodId: 'cucumber_raw', grams: 60 }, { foodId: 'romaine_lettuce_raw', grams: 30 },
    ],
  },
  {
    id: 'lub_tilapia_potatoes_green_beans', nameHe: 'אמנון אפוי עם תפוחי אדמה ושעועית ירוקה', nameEn: 'Baked Tilapia with Potatoes and Green Beans',
    slots: ['lunch', 'dinner'], prepMinutes: 35,
    ingredients: [
      { foodId: 'tilapia_cooked', grams: 170 }, { foodId: 'potato_boiled', grams: 250 }, { foodId: 'green_beans_cooked', grams: 120 },
      { foodId: 'olive_oil', grams: 10 }, { foodId: 'lemon_juice', grams: 15 },
    ],
  },
  {
    id: 'lub_sardine_sourdough_toast_salad', nameHe: 'טוסט סרדינים על לחם שאור עם סלט', nameEn: 'Sardine Toast on Sourdough with Fresh Salad',
    slots: ['lunch'], prepMinutes: 10,
    ingredients: [
      { foodId: 'sardines_canned_oil', grams: 90 }, { foodId: 'sourdough_bread', grams: 100 }, { foodId: 'tomato_raw', grams: 100 },
      { foodId: 'cucumber_raw', grams: 80 }, { foodId: 'avocado_raw', grams: 50 },
    ],
  },
];
