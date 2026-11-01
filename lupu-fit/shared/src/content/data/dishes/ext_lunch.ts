import type { DishRaw } from '../../types.js';

const LD = ['lunch', 'dinner'] as const;
const L = ['lunch'] as const;

export const EXT_LUNCH_DISHES: DishRaw[] = [
  {
    id: 'xlu_chicken_freekeh_pomegranate', nameHe: 'ירך עוף עם פריקה, רימון ופטרוזיליה', nameEn: 'Chicken Thigh with Freekeh, Pomegranate and Parsley',
    slots: LD, prepMinutes: 35,
    ingredients: [
      { foodId: 'chicken_thigh_cooked', grams: 150 }, { foodId: 'freekeh_cooked', grams: 200 }, { foodId: 'pomegranate_seeds', grams: 40 }, { foodId: 'parsley_raw', grams: 15 }, { foodId: 'cucumber_raw', grams: 80 }, { foodId: 'olive_oil', grams: 8 },
    ],
  },
  {
    id: 'xlu_chicken_millet_beet_bowl', nameHe: 'קערת חזה עוף עם דוחן וסלק', nameEn: 'Chicken Breast Bowl with Millet and Beet',
    slots: LD, prepMinutes: 30,
    ingredients: [
      { foodId: 'chicken_breast_cooked', grams: 150 }, { foodId: 'millet_cooked', grams: 200 }, { foodId: 'beet_cooked', grams: 100 }, { foodId: 'kale_raw', grams: 40 }, { foodId: 'olive_oil', grams: 10 },
    ],
  },
  {
    id: 'xlu_chicken_corn_potato_soup', nameHe: 'מרק עוף עם תירס, תפוחי אדמה וגזר', nameEn: 'Chicken Soup with Corn, Potato and Carrot',
    slots: LD, prepMinutes: 40,
    ingredients: [
      { foodId: 'chicken_breast_cooked', grams: 130 }, { foodId: 'corn_kernels_cooked', grams: 100 }, { foodId: 'potato_boiled', grams: 200 }, { foodId: 'carrot_raw', grams: 80 }, { foodId: 'celery_raw', grams: 40 }, { foodId: 'onion_raw', grams: 50 },
    ],
  },
  {
    id: 'xlu_chicken_polenta_mushroom_ragout', nameHe: 'פולנטה עם ירך עוף ורוטב פטריות', nameEn: 'Polenta with Chicken Thigh and Mushroom Ragout',
    slots: LD, prepMinutes: 35,
    ingredients: [
      { foodId: 'chicken_thigh_cooked', grams: 140 }, { foodId: 'polenta_cooked', grams: 250 }, { foodId: 'mushrooms_raw', grams: 100 }, { foodId: 'tomato_raw', grams: 80 }, { foodId: 'olive_oil', grams: 8 },
    ],
  },
  {
    id: 'xlu_chicken_soy_glazed_rice_beans', nameHe: 'עוף מוקפץ בסויה ודבש עם אורז ושעועית ירוקה', nameEn: 'Soy-Honey Chicken with Rice and Green Beans',
    slots: LD, prepMinutes: 25,
    ingredients: [
      { foodId: 'chicken_breast_cooked', grams: 150 }, { foodId: 'white_rice_cooked', grams: 200 }, { foodId: 'green_beans_cooked', grams: 120 }, { foodId: 'soy_sauce', grams: 15 }, { foodId: 'honey', grams: 10 }, { foodId: 'garlic_raw', grams: 5 },
    ],
  },
  {
    id: 'xlu_chicken_meatballs_couscous_tomato', nameHe: 'קציצות עוף עם קוסקוס ורוטב עגבניות', nameEn: 'Chicken Meatballs with Couscous and Tomato Sauce',
    slots: LD, prepMinutes: 35,
    ingredients: [
      { foodId: 'chicken_ground_cooked', grams: 140 }, { foodId: 'couscous_cooked', grams: 200 }, { foodId: 'tomato_raw', grams: 150 }, { foodId: 'onion_raw', grams: 40 }, { foodId: 'parsley_raw', grams: 10 }, { foodId: 'olive_oil', grams: 8 },
    ],
  },
  {
    id: 'xlu_chicken_black_bean_burrito', nameHe: 'בוריטו עוף עם שעועית שחורה, תירס ואבוקדו', nameEn: 'Chicken Burrito with Black Beans, Corn and Avocado',
    slots: L, prepMinutes: 20,
    ingredients: [
      { foodId: 'tortilla_flour', grams: 100 }, { foodId: 'chicken_breast_cooked', grams: 130 }, { foodId: 'black_beans_cooked', grams: 100 }, { foodId: 'corn_kernels_cooked', grams: 60 }, { foodId: 'tomato_raw', grams: 80 }, { foodId: 'avocado_raw', grams: 40 },
    ],
  },
  {
    id: 'xlu_turkey_lettuce_wraps_rice', nameHe: 'עלי חסה ממולאים בהודו טחון, עם אורז בסמטי וגזר', nameEn: 'Turkey Lettuce Wraps with Basmati Rice and Carrot',
    slots: L, prepMinutes: 25,
    ingredients: [
      { foodId: 'turkey_ground_cooked', grams: 130 }, { foodId: 'romaine_lettuce_raw', grams: 100 }, { foodId: 'basmati_rice_cooked', grams: 150 }, { foodId: 'carrot_raw', grams: 60 }, { foodId: 'soy_sauce', grams: 10 }, { foodId: 'garlic_raw', grams: 4 },
    ],
  },
  {
    id: 'xlu_turkey_stuffed_sweet_potato_peas', nameHe: 'בטטה ממולאת בחזה הודו, אפונה ותרד', nameEn: 'Sweet Potato Stuffed with Turkey Breast, Peas and Spinach',
    slots: LD, prepMinutes: 40,
    ingredients: [
      { foodId: 'turkey_breast_cooked', grams: 140 }, { foodId: 'sweet_potato_baked', grams: 300 }, { foodId: 'green_peas_cooked', grams: 80 }, { foodId: 'spinach_raw', grams: 40 }, { foodId: 'olive_oil', grams: 8 },
    ],
  },
  {
    id: 'xlu_turkey_quinoa_stuffed_zucchini', nameHe: 'קישואים ממולאים בהודו וקינואה', nameEn: 'Zucchini Stuffed with Turkey and Quinoa',
    slots: LD, prepMinutes: 45,
    ingredients: [
      { foodId: 'turkey_ground_cooked', grams: 130 }, { foodId: 'quinoa_cooked', grams: 150 }, { foodId: 'zucchini_raw', grams: 250 }, { foodId: 'tomato_raw', grams: 100 }, { foodId: 'onion_raw', grams: 40 }, { foodId: 'olive_oil', grams: 8 },
    ],
  },
  {
    id: 'xlu_turkey_deli_avocado_sourdough', nameHe: 'כריך סורדו עם פסטרמת הודו, אבוקדו ומלפפון', nameEn: 'Sourdough Sandwich with Turkey Deli, Avocado and Cucumber',
    slots: L, prepMinutes: 10,
    ingredients: [
      { foodId: 'sourdough_bread', grams: 120 }, { foodId: 'turkey_deli_slices', grams: 80 }, { foodId: 'avocado_raw', grams: 60 }, { foodId: 'cucumber_raw', grams: 80 }, { foodId: 'tomato_raw', grams: 60 }, { foodId: 'mustard_prepared', grams: 10 }, { foodId: 'romaine_lettuce_raw', grams: 30 },
    ],
  },
  {
    id: 'xlu_beef_cabbage_bulgur_skillet', nameHe: 'מחבת בקר וכרוב עם בורגול', nameEn: 'Beef and Cabbage Skillet with Bulgur',
    slots: LD, prepMinutes: 30,
    ingredients: [
      { foodId: 'beef_ground_lean_cooked', grams: 120 }, { foodId: 'cabbage_white_raw', grams: 200 }, { foodId: 'bulgur_cooked', grams: 200 }, { foodId: 'onion_raw', grams: 50 }, { foodId: 'tomato_raw', grams: 80 }, { foodId: 'olive_oil', grams: 6 },
    ],
  },
  {
    id: 'xlu_beef_pepper_steak_basmati', nameHe: 'סטייק בקר ופלפלים עם אורז בסמטי וברוקולי', nameEn: 'Pepper Steak with Basmati Rice and Broccoli',
    slots: LD, prepMinutes: 30,
    ingredients: [
      { foodId: 'beef_flank_cooked', grams: 140 }, { foodId: 'basmati_rice_cooked', grams: 200 }, { foodId: 'bell_pepper_red_raw', grams: 120 }, { foodId: 'broccoli_cooked', grams: 100 }, { foodId: 'soy_sauce', grams: 10 }, { foodId: 'olive_oil', grams: 5 },
    ],
  },
  {
    id: 'xlu_beef_sweet_potato_spinach_hash', nameHe: 'האש בטטה ובשר בקר טחון עם תרד', nameEn: 'Beef and Sweet Potato Hash with Spinach',
    slots: LD, prepMinutes: 30,
    ingredients: [
      { foodId: 'beef_ground_lean_cooked', grams: 130 }, { foodId: 'sweet_potato_baked', grams: 250 }, { foodId: 'spinach_raw', grams: 60 }, { foodId: 'onion_raw', grams: 50 }, { foodId: 'bell_pepper_red_raw', grams: 80 }, { foodId: 'olive_oil', grams: 8 },
    ],
  },
  {
    id: 'xlu_beef_green_lentil_soup', nameHe: 'מרק עדשים ירוקות עם נתחי בקר וגזר', nameEn: 'Green Lentil Soup with Beef and Carrot',
    slots: LD, prepMinutes: 50,
    ingredients: [
      { foodId: 'beef_sirloin_cooked', grams: 100 }, { foodId: 'lentils_green_cooked', grams: 200 }, { foodId: 'carrot_raw', grams: 100 }, { foodId: 'celery_raw', grams: 50 }, { foodId: 'onion_raw', grams: 50 }, { foodId: 'tomato_raw', grams: 100 }, { foodId: 'olive_oil', grams: 6 },
    ],
  },
  {
    id: 'xlu_lamb_chickpea_apricot_couscous', nameHe: 'בשר כבש בסגנון טאג׳ין עם גרגרי חומוס, משמש וקוסקוס', nameEn: 'Lamb Tagine-Style with Chickpeas, Apricots and Couscous',
    slots: LD, prepMinutes: 50,
    ingredients: [
      { foodId: 'lamb_leg_cooked', grams: 120 }, { foodId: 'chickpeas_cooked', grams: 100 }, { foodId: 'couscous_cooked', grams: 180 }, { foodId: 'carrot_raw', grams: 80 }, { foodId: 'onion_raw', grams: 50 }, { foodId: 'apricots_dried', grams: 20 },
    ],
  },
  {
    id: 'xlu_lamb_meatballs_basmati_cucumber', nameHe: 'קציצות כבש עם אורז בסמטי וסלט מלפפונים', nameEn: 'Lamb Meatballs with Basmati Rice and Cucumber Salad',
    slots: LD, prepMinutes: 35,
    ingredients: [
      { foodId: 'lamb_ground_cooked', grams: 110 }, { foodId: 'basmati_rice_cooked', grams: 200 }, { foodId: 'cucumber_raw', grams: 120 }, { foodId: 'tomato_raw', grams: 100 }, { foodId: 'parsley_raw', grams: 10 }, { foodId: 'olive_oil', grams: 6 },
    ],
  },
  {
    id: 'xlu_veal_roasted_potato_green_beans', nameHe: 'נתח עגל צלוי עם תפוחי אדמה ושעועית ירוקה', nameEn: 'Veal Cutlet with Roasted Potatoes and Green Beans',
    slots: LD, prepMinutes: 35,
    ingredients: [
      { foodId: 'veal_cutlet_cooked', grams: 150 }, { foodId: 'potato_boiled', grams: 250 }, { foodId: 'green_beans_cooked', grams: 120 }, { foodId: 'lemon_juice', grams: 10 }, { foodId: 'olive_oil', grams: 10 },
    ],
  },
  {
    id: 'xlu_salmon_potato_spinach_salad', nameHe: 'סלמון אפוי עם תפוחי אדמה וסלט תרד', nameEn: 'Baked Salmon with Potatoes and Spinach Salad',
    slots: LD, prepMinutes: 35,
    ingredients: [
      { foodId: 'salmon_cooked', grams: 140 }, { foodId: 'potato_boiled', grams: 250 }, { foodId: 'spinach_raw', grams: 60 }, { foodId: 'lemon_juice', grams: 10 }, { foodId: 'olive_oil', grams: 8 },
    ],
  },
  {
    id: 'xlu_tuna_white_bean_salad_sourdough', nameHe: 'סלט טונה ושעועית לבנה עם לחם סורדו', nameEn: 'Tuna and White Bean Salad with Sourdough',
    slots: L, prepMinutes: 15,
    ingredients: [
      { foodId: 'tuna_canned_water', grams: 120 }, { foodId: 'white_beans_cooked', grams: 200 }, { foodId: 'onion_raw', grams: 30 }, { foodId: 'tomato_raw', grams: 100 }, { foodId: 'parsley_raw', grams: 10 }, { foodId: 'olive_oil', grams: 10 }, { foodId: 'sourdough_bread', grams: 60 },
    ],
  },
  {
    id: 'xlu_cod_polenta_roasted_tomato', nameHe: 'דג בקלה אפוי עם פולנטה ועגבניות קלויות', nameEn: 'Baked Cod with Polenta and Roasted Tomatoes',
    slots: LD, prepMinutes: 35,
    ingredients: [
      { foodId: 'cod_cooked', grams: 170 }, { foodId: 'polenta_cooked', grams: 250 }, { foodId: 'tomato_raw', grams: 150 }, { foodId: 'olive_oil', grams: 10 }, { foodId: 'garlic_raw', grams: 4 },
    ],
  },
  {
    id: 'xlu_mackerel_brown_rice_bowl', nameHe: 'קערת מקרל עם אורז מלא, מלפפון וגזר', nameEn: 'Mackerel Bowl with Brown Rice, Cucumber and Carrot',
    slots: L, prepMinutes: 20,
    ingredients: [
      { foodId: 'mackerel_cooked', grams: 100 }, { foodId: 'brown_rice_cooked', grams: 200 }, { foodId: 'cucumber_raw', grams: 100 }, { foodId: 'carrot_raw', grams: 60 }, { foodId: 'soy_sauce', grams: 8 },
    ],
  },
  {
    id: 'xlu_green_lentil_bulgur_pilaf', nameHe: 'פילאף עדשים ירוקות ובורגול עם גזר קלוי', nameEn: 'Green Lentil and Bulgur Pilaf with Roasted Carrots',
    slots: LD, prepMinutes: 35,
    ingredients: [
      { foodId: 'lentils_green_cooked', grams: 200 }, { foodId: 'bulgur_cooked', grams: 150 }, { foodId: 'carrot_raw', grams: 100 }, { foodId: 'onion_raw', grams: 50 }, { foodId: 'olive_oil', grams: 10 }, { foodId: 'parsley_raw', grams: 10 },
    ],
  },
  {
    id: 'xlu_peanut_tofu_rice_cabbage', nameHe: 'קערת טופו ברוטב בוטנים עם אורז מלא וכרוב', nameEn: 'Peanut Tofu Bowl with Brown Rice and Cabbage',
    slots: LD, prepMinutes: 25,
    ingredients: [
      { foodId: 'tofu_firm', grams: 150 }, { foodId: 'brown_rice_cooked', grams: 200 }, { foodId: 'cabbage_white_raw', grams: 100 }, { foodId: 'carrot_raw', grams: 60 }, { foodId: 'peanut_butter', grams: 20 }, { foodId: 'soy_sauce', grams: 10 },
    ],
  },
  {
    id: 'xlu_chickpea_sweet_potato_millet_stew', nameHe: 'תבשיל גרגרי חומוס ובטטה עם דוחן', nameEn: 'Chickpea and Sweet Potato Stew with Millet',
    slots: LD, prepMinutes: 40,
    ingredients: [
      { foodId: 'chickpeas_cooked', grams: 150 }, { foodId: 'sweet_potato_baked', grams: 200 }, { foodId: 'millet_cooked', grams: 150 }, { foodId: 'tomato_raw', grams: 100 }, { foodId: 'spinach_raw', grams: 40 }, { foodId: 'olive_oil', grams: 8 },
    ],
  },
  {
    id: 'xlu_tempeh_quinoa_roasted_beet', nameHe: 'טמפה עם קינואה, סלק קלוי וקייל', nameEn: 'Tempeh with Quinoa, Roasted Beet and Kale',
    slots: LD, prepMinutes: 30,
    ingredients: [
      { foodId: 'tempeh', grams: 120 }, { foodId: 'quinoa_cooked', grams: 180 }, { foodId: 'beet_cooked', grams: 100 }, { foodId: 'kale_raw', grams: 40 }, { foodId: 'olive_oil', grams: 8 },
    ],
  },
  {
    id: 'xlu_edamame_avocado_rice_bowl', nameHe: 'קערת אדממה ואבוקדו עם אורז בסמטי', nameEn: 'Edamame and Avocado Bowl with Basmati Rice',
    slots: L, prepMinutes: 20,
    ingredients: [
      { foodId: 'edamame_shelled_cooked', grams: 120 }, { foodId: 'basmati_rice_cooked', grams: 180 }, { foodId: 'avocado_raw', grams: 70 }, { foodId: 'cucumber_raw', grams: 80 }, { foodId: 'carrot_raw', grams: 50 }, { foodId: 'soy_sauce', grams: 8 },
    ],
  },
  {
    id: 'xlu_white_bean_kale_polenta', nameHe: 'פולנטה עם ראגו שעועית לבנה וקייל', nameEn: 'Polenta with White Bean and Kale Ragout',
    slots: LD, prepMinutes: 35,
    ingredients: [
      { foodId: 'white_beans_cooked', grams: 200 }, { foodId: 'polenta_cooked', grams: 250 }, { foodId: 'kale_raw', grams: 50 }, { foodId: 'tomato_raw', grams: 120 }, { foodId: 'olive_oil', grams: 10 },
    ],
  },
  {
    id: 'xlu_seitan_shawarma_pita_cabbage', nameHe: 'פיתה עם סייטן בתיבול שווארמה, סלט כרוב וטחינה', nameEn: 'Seitan Shawarma-Style Pita with Cabbage Salad and Tahini',
    slots: L, prepMinutes: 25,
    ingredients: [
      { foodId: 'seitan_prepared', grams: 150 }, { foodId: 'pita_whole_wheat', grams: 100 }, { foodId: 'cabbage_white_raw', grams: 80 }, { foodId: 'tomato_raw', grams: 80 }, { foodId: 'tahini_sauce_ready', grams: 25 },
    ],
  },
  {
    id: 'xlu_black_bean_quinoa_stuffed_peppers', nameHe: 'פלפלים ממולאים בשעועית שחורה וקינואה', nameEn: 'Peppers Stuffed with Black Beans and Quinoa',
    slots: LD, prepMinutes: 45,
    ingredients: [
      { foodId: 'bell_pepper_red_raw', grams: 250 }, { foodId: 'black_beans_cooked', grams: 130 }, { foodId: 'quinoa_cooked', grams: 130 }, { foodId: 'corn_kernels_cooked', grams: 50 }, { foodId: 'tomato_raw', grams: 80 }, { foodId: 'olive_oil', grams: 6 },
    ],
  },
  {
    id: 'xlu_kidney_bean_rice_stew', nameHe: 'תבשיל שעועית אדומה עם אורז ופלפלים', nameEn: 'Kidney Bean Stew with Rice and Peppers',
    slots: LD, prepMinutes: 40,
    ingredients: [
      { foodId: 'kidney_beans_cooked', grams: 180 }, { foodId: 'white_rice_cooked', grams: 180 }, { foodId: 'bell_pepper_red_raw', grams: 100 }, { foodId: 'onion_raw', grams: 50 }, { foodId: 'tomato_raw', grams: 100 }, { foodId: 'olive_oil', grams: 8 },
    ],
  },
  {
    id: 'xlu_red_lentil_ragu_pasta', nameHe: 'פסטה מלאה עם ראגו עדשים כתומות', nameEn: 'Whole Wheat Pasta with Red Lentil Ragu',
    slots: LD, prepMinutes: 35,
    ingredients: [
      { foodId: 'lentils_red_cooked', grams: 200 }, { foodId: 'pasta_whole_wheat_cooked', grams: 220 }, { foodId: 'carrot_raw', grams: 60 }, { foodId: 'tomato_raw', grams: 120 }, { foodId: 'onion_raw', grams: 40 }, { foodId: 'olive_oil', grams: 8 },
    ],
  },
  {
    id: 'xlu_fava_tomato_salad_pita', nameHe: 'סלט פול, עגבניות ופטרוזיליה עם פיתה', nameEn: 'Fava Bean and Tomato Salad with Pita',
    slots: L, prepMinutes: 15,
    ingredients: [
      { foodId: 'fava_beans_cooked', grams: 200 }, { foodId: 'pita_white', grams: 100 }, { foodId: 'tomato_raw', grams: 120 }, { foodId: 'cucumber_raw', grams: 100 }, { foodId: 'parsley_raw', grams: 15 }, { foodId: 'olive_oil', grams: 10 }, { foodId: 'lemon_juice', grams: 10 },
    ],
  },
  {
    id: 'xlu_pumpkin_chickpea_quinoa_seeds', nameHe: 'קערת דלעת, גרגרי חומוס וקינואה עם גרעיני דלעת', nameEn: 'Pumpkin, Chickpea and Quinoa Bowl with Pumpkin Seeds',
    slots: LD, prepMinutes: 35,
    ingredients: [
      { foodId: 'pumpkin_cooked', grams: 200 }, { foodId: 'chickpeas_cooked', grams: 120 }, { foodId: 'quinoa_cooked', grams: 150 }, { foodId: 'pumpkin_seeds_raw', grams: 20 }, { foodId: 'spinach_raw', grams: 40 }, { foodId: 'olive_oil', grams: 6 },
    ],
  },
  {
    id: 'xlu_eggs_tomato_pepper_potatoes', nameHe: 'ביצים ברוטב עגבניות ופלפלים עם תפוחי אדמה', nameEn: 'Eggs Poached in Tomato Pepper Sauce with Potatoes',
    slots: LD, prepMinutes: 30,
    ingredients: [
      { foodId: 'egg_whole_raw', grams: 150 }, { foodId: 'tomato_raw', grams: 200 }, { foodId: 'bell_pepper_red_raw', grams: 100 }, { foodId: 'potato_boiled', grams: 200 }, { foodId: 'onion_raw', grams: 40 }, { foodId: 'olive_oil', grams: 8 },
    ],
  },
  {
    id: 'xlu_spinach_mushroom_egg_bake_quinoa', nameHe: 'אפיית ביצים עם תרד ופטריות וקינואה', nameEn: 'Spinach and Mushroom Egg Bake with Quinoa',
    slots: LD, prepMinutes: 30,
    ingredients: [
      { foodId: 'egg_whole_raw', grams: 120 }, { foodId: 'spinach_raw', grams: 80 }, { foodId: 'mushrooms_raw', grams: 80 }, { foodId: 'quinoa_cooked', grams: 150 }, { foodId: 'olive_oil', grams: 8 },
    ],
  },
  {
    id: 'xlu_egg_salad_sandwich_whole_wheat', nameHe: 'כריך סלט ביצים עם מלפפון וחסה בלחם מלא', nameEn: 'Egg Salad Sandwich with Cucumber and Lettuce on Whole Wheat',
    slots: L, prepMinutes: 15,
    ingredients: [
      { foodId: 'egg_boiled_hard', grams: 120 }, { foodId: 'mayonnaise', grams: 15 }, { foodId: 'bread_whole_wheat', grams: 120 }, { foodId: 'cucumber_raw', grams: 80 }, { foodId: 'romaine_lettuce_raw', grams: 40 }, { foodId: 'mustard_prepared', grams: 5 },
    ],
  },
  {
    id: 'xlu_cottage_kidney_bean_wrap', nameHe: 'טורטייה עם קוטג׳, שעועית אדומה ופלפל', nameEn: 'Cottage Cheese and Kidney Bean Wrap with Pepper',
    slots: L, prepMinutes: 15,
    ingredients: [
      { foodId: 'tortilla_flour', grams: 100 }, { foodId: 'cottage_cheese_5pct', grams: 120 }, { foodId: 'kidney_beans_cooked', grams: 100 }, { foodId: 'tomato_raw', grams: 80 }, { foodId: 'bell_pepper_red_raw', grams: 60 }, { foodId: 'corn_kernels_cooked', grams: 40 },
    ],
  },
  {
    id: 'xlu_skyr_chickpea_tabbouleh', nameHe: 'טבולה בורגול עם גרגרי חומוס ויוגורט סקיר', nameEn: 'Bulgur Tabbouleh with Chickpeas and Skyr',
    slots: L, prepMinutes: 20,
    ingredients: [
      { foodId: 'bulgur_cooked', grams: 200 }, { foodId: 'chickpeas_cooked', grams: 100 }, { foodId: 'skyr_plain', grams: 100 }, { foodId: 'tomato_raw', grams: 100 }, { foodId: 'parsley_raw', grams: 30 }, { foodId: 'cucumber_raw', grams: 80 }, { foodId: 'lemon_juice', grams: 15 },
    ],
  },
  {
    id: 'xlu_couscous_feta_melon_chickpea', nameHe: 'סלט קוסקוס עם גבינה בולגרית, מלון וגרגרי חומוס', nameEn: 'Couscous Salad with Feta, Melon and Chickpeas',
    slots: L, prepMinutes: 20,
    ingredients: [
      { foodId: 'couscous_cooked', grams: 200 }, { foodId: 'feta_bulgarian_cheese', grams: 60 }, { foodId: 'melon_cantaloupe_raw', grams: 150 }, { foodId: 'cucumber_raw', grams: 100 }, { foodId: 'chickpeas_cooked', grams: 100 }, { foodId: 'parsley_raw', grams: 10 },
    ],
  },
  {
    id: 'xlu_eggplant_mozzarella_pasta', nameHe: 'פסטה עם חציל אפוי, עגבניות ומוצרלה', nameEn: 'Pasta with Baked Eggplant, Tomato and Mozzarella',
    slots: LD, prepMinutes: 35,
    ingredients: [
      { foodId: 'pasta_white_cooked', grams: 200 }, { foodId: 'eggplant_roasted', grams: 200 }, { foodId: 'tomato_raw', grams: 150 }, { foodId: 'mozzarella_cheese', grams: 50 }, { foodId: 'olive_oil', grams: 8 },
    ],
  },
  {
    id: 'xlu_sweet_potato_labneh_lentils', nameHe: 'בטטה קלויה עם לבנה ועדשים ירוקות', nameEn: 'Roasted Sweet Potato with Labneh and Green Lentils',
    slots: LD, prepMinutes: 40,
    ingredients: [
      { foodId: 'sweet_potato_baked', grams: 250 }, { foodId: 'lentils_green_cooked', grams: 150 }, { foodId: 'labneh_full_fat', grams: 50 }, { foodId: 'spinach_raw', grams: 40 }, { foodId: 'pumpkin_seeds_raw', grams: 10 }, { foodId: 'olive_oil', grams: 6 },
    ],
  },
  {
    id: 'xlu_frittata_wrap_peppers_gouda', nameHe: 'טורטייה עם פריטטה, פלפלים וגבינה צהובה', nameEn: 'Frittata Wrap with Peppers and Gouda',
    slots: L, prepMinutes: 20,
    ingredients: [
      { foodId: 'egg_whole_raw', grams: 120 }, { foodId: 'tortilla_flour', grams: 90 }, { foodId: 'bell_pepper_red_raw', grams: 80 }, { foodId: 'spinach_raw', grams: 40 }, { foodId: 'yellow_cheese_gouda_type', grams: 30 },
    ],
  },
  {
    id: 'xlu_oat_pancakes_cottage_tomato', nameHe: 'פנקייק שיבולת שועל מלוח עם קוטג׳ ועגבניות', nameEn: 'Savory Oat Pancakes with Cottage Cheese and Tomato',
    slots: L, prepMinutes: 25,
    ingredients: [
      { foodId: 'rolled_oats_dry', grams: 70 }, { foodId: 'egg_whole_raw', grams: 100 }, { foodId: 'cottage_cheese_5pct', grams: 100 }, { foodId: 'tomato_raw', grams: 100 }, { foodId: 'spinach_raw', grams: 40 },
    ],
  },
  {
    id: 'xlu_lentil_soup_yogurt_pita', nameHe: 'מרק עדשים כתומות עם יוגורט ופיתה מלאה', nameEn: 'Red Lentil Soup with Yogurt and Whole Wheat Pita',
    slots: LD, prepMinutes: 35,
    ingredients: [
      { foodId: 'lentils_red_cooked', grams: 250 }, { foodId: 'yogurt_plain_3pct', grams: 80 }, { foodId: 'pita_whole_wheat', grams: 80 }, { foodId: 'carrot_raw', grams: 80 }, { foodId: 'onion_raw', grams: 40 }, { foodId: 'olive_oil', grams: 6 },
    ],
  },
  {
    id: 'xlu_quinoa_feta_stuffed_eggplant', nameHe: 'חציל ממולא בקינואה, גבינה בולגרית וגרגרי חומוס', nameEn: 'Eggplant Stuffed with Quinoa, Feta and Chickpeas',
    slots: LD, prepMinutes: 45,
    ingredients: [
      { foodId: 'eggplant_roasted', grams: 250 }, { foodId: 'quinoa_cooked', grams: 150 }, { foodId: 'feta_bulgarian_cheese', grams: 50 }, { foodId: 'tomato_raw', grams: 100 }, { foodId: 'chickpeas_cooked', grams: 80 }, { foodId: 'parsley_raw', grams: 10 },
    ],
  },
  {
    id: 'xlu_spanish_potato_omelet_salad', nameHe: 'טורטייה ספרדית עם סלט עגבניות ומלפפון', nameEn: 'Spanish-Style Potato Omelet with Tomato Cucumber Salad',
    slots: LD, prepMinutes: 35,
    ingredients: [
      { foodId: 'potato_boiled', grams: 250 }, { foodId: 'egg_whole_raw', grams: 150 }, { foodId: 'onion_raw', grams: 60 }, { foodId: 'tomato_raw', grams: 100 }, { foodId: 'cucumber_raw', grams: 80 }, { foodId: 'olive_oil', grams: 12 },
    ],
  },
  {
    id: 'xlu_bagel_cream_cheese_egg', nameHe: 'בייגל עם גבינת שמנת, ביצה קשה וירקות', nameEn: 'Bagel with Cream Cheese, Hard-Boiled Egg and Vegetables',
    slots: L, prepMinutes: 10,
    ingredients: [
      { foodId: 'bagel_plain', grams: 100 }, { foodId: 'cream_cheese_regular', grams: 40 }, { foodId: 'egg_boiled_hard', grams: 60 }, { foodId: 'cucumber_raw', grams: 80 }, { foodId: 'tomato_raw', grams: 60 }, { foodId: 'romaine_lettuce_raw', grams: 20 },
    ],
  },
  {
    id: 'xlu_baked_polenta_parmesan_white_beans', nameHe: 'פולנטה אפויה עם פרמזן, שעועית לבנה ועגבניות', nameEn: 'Baked Polenta with Parmesan, White Beans and Tomato',
    slots: LD, prepMinutes: 40,
    ingredients: [
      { foodId: 'polenta_cooked', grams: 250 }, { foodId: 'parmesan_cheese', grams: 25 }, { foodId: 'white_beans_cooked', grams: 150 }, { foodId: 'tomato_raw', grams: 120 }, { foodId: 'spinach_raw', grams: 40 }, { foodId: 'olive_oil', grams: 6 },
    ],
  },
  {
    id: 'xlu_pasta_cottage_peas_lemon', nameHe: 'פסטה עם קוטג׳, אפונה ולימון', nameEn: 'Pasta with Cottage Cheese, Peas and Lemon',
    slots: L, prepMinutes: 20,
    ingredients: [
      { foodId: 'pasta_white_cooked', grams: 220 }, { foodId: 'cottage_cheese_5pct', grams: 100 }, { foodId: 'green_peas_cooked', grams: 100 }, { foodId: 'lemon_juice', grams: 10 }, { foodId: 'parsley_raw', grams: 10 }, { foodId: 'olive_oil', grams: 8 },
    ],
  },
];
