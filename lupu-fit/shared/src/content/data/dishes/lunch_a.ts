import type { DishRaw } from '../../types.js';

/* Lunch A: chicken, turkey and beef lunches (bowls, wraps, pitas, stir-fries, kebabs, pasta) plus fish, legume, egg and dairy lunches. */

const LD = ['lunch', 'dinner'] as const;
const L = ['lunch'] as const;

export const LUNCH_A_DISHES: DishRaw[] = [
  /* ------------------------------------------------------------ chicken */
  {
    id: 'lua_chicken_rice_roasted_veg', nameHe: 'חזה עוף עם אורז וירקות קלויים', nameEn: 'Chicken and Rice Bowl with Roasted Vegetables',
    slots: LD, prepMinutes: 35,
    ingredients: [
      { foodId: 'chicken_breast_cooked', grams: 150 }, { foodId: 'white_rice_cooked', grams: 180 }, { foodId: 'zucchini_raw', grams: 100 },
      { foodId: 'bell_pepper_red_raw', grams: 100 }, { foodId: 'olive_oil', grams: 10 },
    ],
  },
  {
    id: 'lua_chicken_thigh_quinoa_avocado', nameHe: 'קערת קינואה עם ירך עוף ואבוקדו', nameEn: 'Quinoa Bowl with Chicken Thigh and Avocado',
    slots: LD, prepMinutes: 30,
    ingredients: [
      { foodId: 'chicken_thigh_cooked', grams: 140 }, { foodId: 'quinoa_cooked', grams: 180 }, { foodId: 'cucumber_raw', grams: 100 },
      { foodId: 'tomato_raw', grams: 100 }, { foodId: 'avocado_raw', grams: 40 }, { foodId: 'lemon_juice', grams: 10 },
    ],
  },
  {
    id: 'lua_chicken_hummus_pita', nameHe: 'פיתה מלאה עם חזה עוף וחומוס', nameEn: 'Whole Wheat Pita with Chicken and Hummus',
    slots: L, prepMinutes: 15,
    ingredients: [
      { foodId: 'chicken_breast_cooked', grams: 130 }, { foodId: 'pita_whole_wheat', grams: 100 }, { foodId: 'hummus_spread', grams: 50 },
      { foodId: 'tomato_raw', grams: 80 }, { foodId: 'cucumber_raw', grams: 60 }, { foodId: 'romaine_lettuce_raw', grams: 30 },
    ],
  },
  {
    id: 'lua_baked_schnitzel_potatoes', nameHe: 'נתחי חזה עוף אפויים עם תפוחי אדמה וסלט', nameEn: 'Baked Chicken Cutlets with Potatoes and Salad',
    slots: LD, prepMinutes: 40,
    ingredients: [
      { foodId: 'chicken_schnitzel_plain_cooked', grams: 160 }, { foodId: 'potato_boiled', grams: 250 }, { foodId: 'cucumber_raw', grams: 100 },
      { foodId: 'tomato_raw', grams: 100 }, { foodId: 'olive_oil', grams: 10 },
    ],
  },
  {
    id: 'lua_chicken_teriyaki_brown_rice', nameHe: 'מוקפץ עוף אסייתי עם אורז מלא ושעועית ירוקה', nameEn: 'Asian-Style Chicken Stir-Fry with Brown Rice',
    slots: LD, prepMinutes: 25,
    ingredients: [
      { foodId: 'chicken_breast_cooked', grams: 150 }, { foodId: 'brown_rice_cooked', grams: 200 }, { foodId: 'green_beans_cooked', grams: 100 },
      { foodId: 'mushrooms_raw', grams: 80 }, { foodId: 'soy_sauce', grams: 15 }, { foodId: 'honey', grams: 10 }, { foodId: 'canola_oil', grams: 8 },
    ],
  },
  {
    id: 'lua_chicken_fajita_tortilla', nameHe: 'טורטייה עם עוף ופלפלים מוקפצים', nameEn: 'Chicken and Pepper Fajita Tortilla',
    slots: LD, prepMinutes: 20,
    ingredients: [
      { foodId: 'chicken_breast_cooked', grams: 140 }, { foodId: 'tortilla_flour', grams: 70 }, { foodId: 'bell_pepper_red_raw', grams: 120 },
      { foodId: 'onion_raw', grams: 60 }, { foodId: 'canola_oil', grams: 8 }, { foodId: 'avocado_raw', grams: 30 },
    ],
  },
  {
    id: 'lua_chicken_sweet_potato_broccoli', nameHe: 'ירך עוף עם בטטה אפויה וברוקולי', nameEn: 'Chicken Thigh with Baked Sweet Potato and Broccoli',
    slots: LD, prepMinutes: 40,
    ingredients: [
      { foodId: 'chicken_thigh_cooked', grams: 140 }, { foodId: 'sweet_potato_baked', grams: 250 }, { foodId: 'broccoli_cooked', grams: 150 },
      { foodId: 'olive_oil', grams: 10 }, { foodId: 'garlic_raw', grams: 3 },
    ],
  },
  /* ------------------------------------------------------------- turkey */
  {
    id: 'lua_turkey_bulgur_tabbouleh', nameHe: 'חזה הודו עם בורגול וסלט עגבניות ופטרוזיליה', nameEn: 'Turkey Breast with Bulgur and Tomato Parsley Salad',
    slots: LD, prepMinutes: 30,
    ingredients: [
      { foodId: 'turkey_breast_cooked', grams: 150 }, { foodId: 'bulgur_cooked', grams: 200 }, { foodId: 'tomato_raw', grams: 100 },
      { foodId: 'parsley_raw', grams: 15 }, { foodId: 'cucumber_raw', grams: 80 }, { foodId: 'olive_oil', grams: 10 }, { foodId: 'lemon_juice', grams: 15 },
    ],
  },
  {
    id: 'lua_turkey_meat_sauce_pasta', nameHe: 'פסטה עם רוטב עגבניות והודו טחון', nameEn: 'Pasta with Turkey Meat Sauce',
    slots: LD, prepMinutes: 35,
    ingredients: [
      { foodId: 'turkey_ground_cooked', grams: 130 }, { foodId: 'pasta_white_cooked', grams: 200 }, { foodId: 'tomato_raw', grams: 200 },
      { foodId: 'onion_raw', grams: 40 }, { foodId: 'garlic_raw', grams: 5 }, { foodId: 'olive_oil', grams: 8 },
    ],
  },
  {
    id: 'lua_turkey_hummus_wrap', nameHe: 'טורטייה עם חזה הודו, חומוס וירקות', nameEn: 'Turkey and Hummus Wrap',
    slots: L, prepMinutes: 10,
    ingredients: [
      { foodId: 'turkey_breast_cooked', grams: 120 }, { foodId: 'tortilla_flour', grams: 70 }, { foodId: 'hummus_spread', grams: 40 },
      { foodId: 'romaine_lettuce_raw', grams: 40 }, { foodId: 'tomato_raw', grams: 60 }, { foodId: 'cucumber_raw', grams: 50 },
    ],
  },
  /* --------------------------------------------------------------- beef */
  {
    id: 'lua_beef_stir_fry_rice', nameHe: 'מוקפץ בקר עם אורז וירקות', nameEn: 'Beef and Vegetable Stir-Fry with Rice',
    slots: LD, prepMinutes: 25,
    ingredients: [
      { foodId: 'beef_sirloin_cooked', grams: 140 }, { foodId: 'white_rice_cooked', grams: 200 }, { foodId: 'broccoli_cooked', grams: 100 },
      { foodId: 'bell_pepper_red_raw', grams: 80 }, { foodId: 'carrot_raw', grams: 60 }, { foodId: 'soy_sauce', grams: 15 }, { foodId: 'canola_oil', grams: 8 },
    ],
  },
  {
    id: 'lua_beef_bolognese_whole_wheat', nameHe: 'פסטה מלאה עם בולונז בקר', nameEn: 'Whole Wheat Pasta with Beef Bolognese',
    slots: LD, prepMinutes: 40,
    ingredients: [
      { foodId: 'beef_ground_lean_cooked', grams: 120 }, { foodId: 'pasta_whole_wheat_cooked', grams: 220 }, { foodId: 'tomato_raw', grams: 200 },
      { foodId: 'onion_raw', grams: 50 }, { foodId: 'carrot_raw', grams: 40 }, { foodId: 'olive_oil', grams: 8 },
    ],
  },
  {
    id: 'lua_kebab_pita_salad', nameHe: 'קבב בפיתה עם סלט ירקות', nameEn: 'Kebab in Pita with Chopped Salad',
    slots: L, prepMinutes: 20,
    ingredients: [
      { foodId: 'kebab_ground_meat_grilled', grams: 150 }, { foodId: 'pita_white', grams: 90 }, { foodId: 'tomato_raw', grams: 100 },
      { foodId: 'cucumber_raw', grams: 80 }, { foodId: 'onion_raw', grams: 30 }, { foodId: 'parsley_raw', grams: 10 },
    ],
  },
  {
    id: 'lua_beef_burrito_bowl', nameHe: 'קערת בוריטו עם בקר טחון ושעועית שחורה', nameEn: 'Beef and Black Bean Burrito Bowl',
    slots: LD, prepMinutes: 25,
    ingredients: [
      { foodId: 'beef_ground_lean_cooked', grams: 120 }, { foodId: 'black_beans_cooked', grams: 100 }, { foodId: 'white_rice_cooked', grams: 150 },
      { foodId: 'corn_kernels_cooked', grams: 60 }, { foodId: 'tomato_raw', grams: 80 }, { foodId: 'avocado_raw', grams: 40 }, { foodId: 'lemon_juice', grams: 10 },
    ],
  },
  {
    id: 'lua_beef_skewers_potato_peppers', nameHe: 'שיפודי בקר עם תפוחי אדמה ופלפלים', nameEn: 'Beef Skewers with Potatoes and Peppers',
    slots: LD, prepMinutes: 35,
    ingredients: [
      { foodId: 'beef_flank_cooked', grams: 150 }, { foodId: 'potato_boiled', grams: 250 }, { foodId: 'bell_pepper_red_raw', grams: 100 },
      { foodId: 'onion_raw', grams: 60 }, { foodId: 'olive_oil', grams: 10 },
    ],
  },
  {
    id: 'lua_beef_kofta_couscous_eggplant', nameHe: 'קציצות בקר עם קוסקוס וחצילים קלויים', nameEn: 'Beef Kofta with Couscous and Roasted Eggplant',
    slots: LD, prepMinutes: 35,
    ingredients: [
      { foodId: 'beef_ground_lean_cooked', grams: 140 }, { foodId: 'couscous_cooked', grams: 200 }, { foodId: 'eggplant_roasted', grams: 100 },
      { foodId: 'tomato_raw', grams: 100 }, { foodId: 'parsley_raw', grams: 10 }, { foodId: 'olive_oil', grams: 8 },
    ],
  },
  {
    id: 'lua_lamb_freekeh_salad', nameHe: 'כבש טחון עם פריקה וסלט ירקות', nameEn: 'Ground Lamb with Freekeh and Chopped Salad',
    slots: LD, prepMinutes: 35,
    ingredients: [
      { foodId: 'lamb_ground_cooked', grams: 120 }, { foodId: 'freekeh_cooked', grams: 200 }, { foodId: 'cucumber_raw', grams: 100 },
      { foodId: 'tomato_raw', grams: 100 }, { foodId: 'parsley_raw', grams: 10 }, { foodId: 'lemon_juice', grams: 10 },
    ],
  },
  /* --------------------------------------------------------------- fish */
  {
    id: 'lua_salmon_quinoa_spinach', nameHe: 'סלמון עם קינואה ותרד', nameEn: 'Salmon with Quinoa and Spinach',
    slots: LD, prepMinutes: 25,
    ingredients: [
      { foodId: 'salmon_cooked', grams: 130 }, { foodId: 'quinoa_cooked', grams: 180 }, { foodId: 'spinach_raw', grams: 60 },
      { foodId: 'lemon_juice', grams: 10 }, { foodId: 'olive_oil', grams: 5 },
    ],
  },
  {
    id: 'lua_tilapia_basmati_green_beans', nameHe: 'פילה אמנון עם אורז בסמטי ושעועית ירוקה', nameEn: 'Tilapia with Basmati Rice and Green Beans',
    slots: LD, prepMinutes: 25,
    ingredients: [
      { foodId: 'tilapia_cooked', grams: 160 }, { foodId: 'basmati_rice_cooked', grams: 180 }, { foodId: 'green_beans_cooked', grams: 120 },
      { foodId: 'tomato_raw', grams: 80 }, { foodId: 'olive_oil', grams: 10 },
    ],
  },
  {
    id: 'lua_tuna_whole_wheat_pasta_salad', nameHe: 'סלט פסטה מלאה עם טונה וירקות', nameEn: 'Whole Wheat Pasta Salad with Tuna and Vegetables',
    slots: L, prepMinutes: 20,
    ingredients: [
      { foodId: 'tuna_canned_water', grams: 100 }, { foodId: 'pasta_whole_wheat_cooked', grams: 180 }, { foodId: 'tomato_raw', grams: 100 },
      { foodId: 'cucumber_raw', grams: 60 }, { foodId: 'olive_oil', grams: 10 }, { foodId: 'lemon_juice', grams: 10 },
    ],
  },
  {
    id: 'lua_sea_bream_potatoes_zucchini', nameHe: 'דג דניס אפוי עם תפוחי אדמה וקישואים', nameEn: 'Baked Sea Bream with Potatoes and Zucchini',
    slots: LD, prepMinutes: 40,
    ingredients: [
      { foodId: 'sea_bream_cooked', grams: 170 }, { foodId: 'potato_boiled', grams: 220 }, { foodId: 'zucchini_raw', grams: 100 },
      { foodId: 'olive_oil', grams: 10 }, { foodId: 'lemon_juice', grams: 10 },
    ],
  },
  {
    id: 'lua_cod_couscous_tomato', nameHe: 'דג בקלה עם קוסקוס, עגבניות ופלפל אדום', nameEn: 'Cod with Couscous, Tomato and Red Pepper',
    slots: LD, prepMinutes: 30,
    ingredients: [
      { foodId: 'cod_cooked', grams: 160 }, { foodId: 'couscous_cooked', grams: 180 }, { foodId: 'tomato_raw', grams: 100 },
      { foodId: 'bell_pepper_red_raw', grams: 80 }, { foodId: 'olive_oil', grams: 8 }, { foodId: 'parsley_raw', grams: 5 },
    ],
  },
  /* -------------------------------------------------------------- vegan */
  {
    id: 'lua_chickpea_quinoa_bowl', nameHe: 'קערת קינואה עם קטניות, אבוקדו וירקות', nameEn: 'Chickpea and Quinoa Bowl with Avocado',
    slots: LD, prepMinutes: 20,
    ingredients: [
      { foodId: 'chickpeas_cooked', grams: 150 }, { foodId: 'quinoa_cooked', grams: 150 }, { foodId: 'cucumber_raw', grams: 80 },
      { foodId: 'tomato_raw', grams: 80 }, { foodId: 'avocado_raw', grams: 40 }, { foodId: 'lemon_juice', grams: 10 }, { foodId: 'parsley_raw', grams: 10 },
    ],
  },
  {
    id: 'lua_tofu_broccoli_brown_rice', nameHe: 'מוקפץ טופו וברוקולי עם אורז מלא', nameEn: 'Tofu and Broccoli Stir-Fry with Brown Rice',
    slots: LD, prepMinutes: 25,
    ingredients: [
      { foodId: 'tofu_firm', grams: 180 }, { foodId: 'brown_rice_cooked', grams: 180 }, { foodId: 'broccoli_cooked', grams: 100 },
      { foodId: 'carrot_raw', grams: 60 }, { foodId: 'soy_sauce', grams: 15 }, { foodId: 'canola_oil', grams: 8 },
    ],
  },
  {
    id: 'lua_mujaddara_lentils_rice', nameHe: 'מג׳דרה עדשים ואורז עם בצל מטוגן וסלט', nameEn: 'Mujaddara Lentils and Rice with Fried Onion and Salad',
    slots: LD, prepMinutes: 40,
    ingredients: [
      { foodId: 'lentils_green_cooked', grams: 150 }, { foodId: 'white_rice_cooked', grams: 150 }, { foodId: 'onion_raw', grams: 80 },
      { foodId: 'olive_oil', grams: 10 }, { foodId: 'cucumber_raw', grams: 100 }, { foodId: 'tomato_raw', grams: 80 },
    ],
  },
  {
    id: 'lua_falafel_pita_tahini', nameHe: 'פלאפל בפיתה עם טחינה וירקות', nameEn: 'Falafel Pita with Tahini Sauce and Vegetables',
    slots: L, prepMinutes: 20,
    ingredients: [
      { foodId: 'falafel_baked', grams: 120 }, { foodId: 'pita_whole_wheat', grams: 90 }, { foodId: 'tahini_sauce_ready', grams: 25 },
      { foodId: 'tomato_raw', grams: 80 }, { foodId: 'cucumber_raw', grams: 80 }, { foodId: 'cabbage_white_raw', grams: 40 },
    ],
  },
  {
    id: 'lua_black_bean_brown_rice_avocado', nameHe: 'קערת אורז מלא עם שעועית שחורה ואבוקדו', nameEn: 'Black Bean and Brown Rice Bowl with Avocado',
    slots: LD, prepMinutes: 20,
    ingredients: [
      { foodId: 'black_beans_cooked', grams: 160 }, { foodId: 'brown_rice_cooked', grams: 180 }, { foodId: 'corn_kernels_cooked', grams: 70 },
      { foodId: 'tomato_raw', grams: 100 }, { foodId: 'avocado_raw', grams: 50 }, { foodId: 'bell_pepper_red_raw', grams: 60 },
    ],
  },
  {
    id: 'lua_tempeh_sweet_potato_kale', nameHe: 'טמפה עם בטטה אפויה וקייל', nameEn: 'Tempeh with Baked Sweet Potato and Kale',
    slots: LD, prepMinutes: 35,
    ingredients: [
      { foodId: 'tempeh', grams: 120 }, { foodId: 'sweet_potato_baked', grams: 250 }, { foodId: 'kale_raw', grams: 60 },
      { foodId: 'olive_oil', grams: 8 }, { foodId: 'lemon_juice', grams: 10 },
    ],
  },
  {
    id: 'lua_seitan_bulgur_roasted_veg', nameHe: 'קערת בורגול עם סייטן וירקות קלויים', nameEn: 'Seitan and Roasted Vegetable Bulgur Bowl',
    slots: LD, prepMinutes: 30,
    ingredients: [
      { foodId: 'seitan_prepared', grams: 150 }, { foodId: 'bulgur_cooked', grams: 180 }, { foodId: 'bell_pepper_red_raw', grams: 100 },
      { foodId: 'zucchini_raw', grams: 100 }, { foodId: 'olive_oil', grams: 10 },
    ],
  },
  {
    id: 'lua_white_bean_spinach_pasta', nameHe: 'פסטה מלאה עם שעועית לבנה ותרד', nameEn: 'Whole Wheat Pasta with White Beans and Spinach',
    slots: LD, prepMinutes: 25,
    ingredients: [
      { foodId: 'pasta_whole_wheat_cooked', grams: 200 }, { foodId: 'white_beans_cooked', grams: 120 }, { foodId: 'spinach_raw', grams: 60 },
      { foodId: 'tomato_raw', grams: 150 }, { foodId: 'garlic_raw', grams: 5 }, { foodId: 'olive_oil', grams: 10 },
    ],
  },
  {
    id: 'lua_hummus_veggie_pita', nameHe: 'פיתה מלאה עם חומוס וירקות טריים', nameEn: 'Whole Wheat Pita with Hummus and Fresh Vegetables',
    slots: L, prepMinutes: 10,
    ingredients: [
      { foodId: 'hummus_spread', grams: 80 }, { foodId: 'pita_whole_wheat', grams: 100 }, { foodId: 'chickpeas_cooked', grams: 60 },
      { foodId: 'cucumber_raw', grams: 80 }, { foodId: 'tomato_raw', grams: 80 }, { foodId: 'bell_pepper_red_raw', grams: 60 },
    ],
  },
  /* --------------------------------------------------------- vegetarian */
  {
    id: 'lua_shakshuka_feta_pita', nameHe: 'שקשוקה עם גבינה בולגרית ופיתה', nameEn: 'Shakshuka with Bulgarian Feta and Pita',
    slots: LD, prepMinutes: 30,
    ingredients: [
      { foodId: 'egg_whole_raw', grams: 120 }, { foodId: 'tomato_raw', grams: 250 }, { foodId: 'bell_pepper_red_raw', grams: 80 },
      { foodId: 'onion_raw', grams: 50 }, { foodId: 'feta_bulgarian_cheese', grams: 30 }, { foodId: 'pita_whole_wheat', grams: 70 }, { foodId: 'olive_oil', grams: 8 },
    ],
  },
  {
    id: 'lua_egg_fried_rice_peas', nameHe: 'אורז מוקפץ עם ביצה, אפונה וגזר', nameEn: 'Egg Fried Rice with Peas and Carrot',
    slots: LD, prepMinutes: 20,
    ingredients: [
      { foodId: 'egg_whole_raw', grams: 100 }, { foodId: 'white_rice_cooked', grams: 200 }, { foodId: 'green_peas_cooked', grams: 60 },
      { foodId: 'carrot_raw', grams: 50 }, { foodId: 'soy_sauce', grams: 12 }, { foodId: 'canola_oil', grams: 8 },
    ],
  },
  {
    id: 'lua_cottage_quinoa_bowl', nameHe: 'קערת קינואה עם קוטג׳ וירקות', nameEn: 'Quinoa Bowl with Cottage Cheese and Vegetables',
    slots: L, prepMinutes: 15,
    ingredients: [
      { foodId: 'cottage_cheese_5pct', grams: 150 }, { foodId: 'quinoa_cooked', grams: 150 }, { foodId: 'cucumber_raw', grams: 100 },
      { foodId: 'tomato_raw', grams: 100 }, { foodId: 'olive_oil', grams: 8 }, { foodId: 'parsley_raw', grams: 10 },
    ],
  },
  {
    id: 'lua_chickpea_feta_salad_pita', nameHe: 'סלט קטניות עם גבינה בולגרית ופיתה', nameEn: 'Chickpea Salad with Bulgarian Feta and Whole Wheat Pita',
    slots: L, prepMinutes: 15,
    ingredients: [
      { foodId: 'chickpeas_cooked', grams: 150 }, { foodId: 'feta_bulgarian_cheese', grams: 40 }, { foodId: 'cucumber_raw', grams: 100 },
      { foodId: 'tomato_raw', grams: 100 }, { foodId: 'pita_whole_wheat', grams: 80 }, { foodId: 'olive_oil', grams: 8 },
    ],
  },
  {
    id: 'lua_pasta_pomodoro_mozzarella', nameHe: 'פסטה עגבניות עם מוצרלה ותרד', nameEn: 'Pasta Pomodoro with Mozzarella and Spinach',
    slots: LD, prepMinutes: 25,
    ingredients: [
      { foodId: 'pasta_white_cooked', grams: 200 }, { foodId: 'mozzarella_cheese', grams: 50 }, { foodId: 'tomato_raw', grams: 200 },
      { foodId: 'spinach_raw', grams: 50 }, { foodId: 'garlic_raw', grams: 4 }, { foodId: 'olive_oil', grams: 8 },
    ],
  },
  {
    id: 'lua_red_lentil_stew_egg_rice', nameHe: 'תבשיל עדשים כתומות עם ביצה קשה ואורז', nameEn: 'Red Lentil Stew with Hard-Boiled Egg and Rice',
    slots: LD, prepMinutes: 35,
    ingredients: [
      { foodId: 'lentils_red_cooked', grams: 150 }, { foodId: 'egg_boiled_hard', grams: 100 }, { foodId: 'white_rice_cooked', grams: 120 },
      { foodId: 'onion_raw', grams: 50 }, { foodId: 'tomato_raw', grams: 100 }, { foodId: 'olive_oil', grams: 8 },
    ],
  },
  {
    id: 'lua_labneh_roasted_veg_pita', nameHe: 'פיתה עם לבנה, חצילים קלויים ועגבניות', nameEn: 'Pita with Labneh, Roasted Eggplant and Tomato',
    slots: L, prepMinutes: 15,
    ingredients: [
      { foodId: 'labneh_full_fat', grams: 50 }, { foodId: 'pita_white', grams: 90 }, { foodId: 'eggplant_roasted', grams: 100 },
      { foodId: 'chickpeas_cooked', grams: 80 }, { foodId: 'tomato_raw', grams: 80 }, { foodId: 'cucumber_raw', grams: 60 },
    ],
  },
  {
    id: 'lua_black_bean_greek_yogurt_bowl', nameHe: 'קערת שעועית שחורה עם יוגורט יווני ותירס', nameEn: 'Black Bean Bowl with Greek Yogurt and Corn',
    slots: LD, prepMinutes: 20,
    ingredients: [
      { foodId: 'black_beans_cooked', grams: 150 }, { foodId: 'brown_rice_cooked', grams: 150 }, { foodId: 'yogurt_greek_plain_5pct', grams: 60 },
      { foodId: 'corn_kernels_cooked', grams: 60 }, { foodId: 'tomato_raw', grams: 80 }, { foodId: 'avocado_raw', grams: 30 },
    ],
  },
  {
    id: 'lua_veggie_omelet_potatoes_cottage', nameHe: 'חביתת ירקות עם תפוחי אדמה וקוטג׳', nameEn: 'Vegetable Omelet with Potatoes and Cottage Cheese',
    slots: LD, prepMinutes: 30,
    ingredients: [
      { foodId: 'egg_whole_raw', grams: 150 }, { foodId: 'potato_boiled', grams: 200 }, { foodId: 'spinach_raw', grams: 50 },
      { foodId: 'mushrooms_raw', grams: 80 }, { foodId: 'cottage_cheese_5pct', grams: 80 }, { foodId: 'olive_oil', grams: 8 },
    ],
  },
];
