import type { DishRaw } from '../../types.js';

/* Dinner A: meat and poultry dinners first, plus fish, vegetarian and vegan dinners for variety. One adult serving each. */
export const DINNER_A_DISHES: DishRaw[] = [
  /* ------------------------------------------------------------ meat and poultry */
  {
    id: 'dia_baked_chicken_thighs_veg', nameHe: 'ירכי עוף אפויות עם ירקות קלויים', nameEn: 'Baked Chicken Thighs with Roasted Vegetables',
    slots: ['lunch', 'dinner'], prepMinutes: 50,
    ingredients: [
      { foodId: 'chicken_thigh_cooked', grams: 170 }, { foodId: 'potato_boiled', grams: 150 }, { foodId: 'carrot_raw', grams: 80 },
      { foodId: 'zucchini_raw', grams: 100 }, { foodId: 'onion_raw', grams: 50 }, { foodId: 'olive_oil', grams: 10 },
    ],
  },
  {
    id: 'dia_chicken_thighs_basmati_green_beans', nameHe: 'שוקי עוף צלויות עם אורז בסמטי ושעועית ירוקה', nameEn: 'Roasted Chicken Thighs with Basmati Rice and Green Beans',
    slots: ['dinner', 'lunch'], prepMinutes: 35,
    ingredients: [
      { foodId: 'chicken_thigh_cooked', grams: 150 }, { foodId: 'basmati_rice_cooked', grams: 180 }, { foodId: 'green_beans_cooked', grams: 120 }, { foodId: 'olive_oil', grams: 8 }, { foodId: 'garlic_raw', grams: 4 },
    ],
  },
  {
    id: 'dia_beef_meatballs_tomato_bulgur', nameHe: 'קציצות בקר ברוטב עגבניות עם בורגול', nameEn: 'Beef Meatballs in Tomato Sauce with Bulgur',
    slots: ['dinner'], prepMinutes: 40,
    ingredients: [
      { foodId: 'beef_ground_lean_cooked', grams: 150 }, { foodId: 'tomato_raw', grams: 200 }, { foodId: 'onion_raw', grams: 50 },
      { foodId: 'bulgur_cooked', grams: 180 }, { foodId: 'garlic_raw', grams: 5 }, { foodId: 'olive_oil', grams: 8 }, { foodId: 'parsley_raw', grams: 10 },
    ],
  },
  {
    id: 'dia_sirloin_steak_potatoes_broccoli', nameHe: 'סטייק סינטה עם תפוחי אדמה וברוקולי', nameEn: 'Sirloin Steak with Potatoes and Broccoli',
    slots: ['dinner'], prepMinutes: 30,
    ingredients: [
      { foodId: 'beef_sirloin_cooked', grams: 160 }, { foodId: 'potato_boiled', grams: 250 }, { foodId: 'broccoli_cooked', grams: 150 },
      { foodId: 'olive_oil', grams: 10 }, { foodId: 'garlic_raw', grams: 4 },
    ],
  },
  {
    id: 'dia_turkey_stirfry_rice', nameHe: 'מוקפץ הודו וירקות עם אורז', nameEn: 'Turkey and Vegetable Stir-Fry with Rice',
    slots: ['dinner'], prepMinutes: 25,
    ingredients: [
      { foodId: 'turkey_breast_cooked', grams: 150 }, { foodId: 'white_rice_cooked', grams: 200 }, { foodId: 'broccoli_cooked', grams: 100 },
      { foodId: 'bell_pepper_red_raw', grams: 80 }, { foodId: 'carrot_raw', grams: 60 }, { foodId: 'soy_sauce', grams: 15 }, { foodId: 'canola_oil', grams: 8 },
    ],
  },
  {
    id: 'dia_chicken_shawarma_pita_plate', nameHe: 'צלחת שווארמה עוף בפיתה עם סלט וטחינה', nameEn: 'Chicken Shawarma Plate with Pita, Salad and Tahini',
    slots: ['lunch', 'dinner'], prepMinutes: 30,
    ingredients: [
      { foodId: 'chicken_thigh_cooked', grams: 160 }, { foodId: 'pita_white', grams: 90 }, { foodId: 'tomato_raw', grams: 80 },
      { foodId: 'cucumber_raw', grams: 80 }, { foodId: 'onion_raw', grams: 30 }, { foodId: 'tahini_sauce_ready', grams: 25 },
    ],
  },
  {
    id: 'dia_chicken_green_lentil_stew', nameHe: 'תבשיל עוף ועדשים ירוקות', nameEn: 'Chicken and Green Lentil Stew',
    slots: ['lunch', 'dinner'], prepMinutes: 45,
    ingredients: [
      { foodId: 'chicken_thigh_cooked', grams: 140 }, { foodId: 'lentils_green_cooked', grams: 180 }, { foodId: 'carrot_raw', grams: 80 },
      { foodId: 'onion_raw', grams: 60 }, { foodId: 'tomato_raw', grams: 100 }, { foodId: 'olive_oil', grams: 8 },
    ],
  },
  {
    id: 'dia_beef_white_bean_potato_stew', nameHe: 'תבשיל בקר עם שעועית לבנה ותפוחי אדמה', nameEn: 'Beef Stew with White Beans and Potatoes',
    slots: ['dinner'], prepMinutes: 60,
    ingredients: [
      { foodId: 'beef_sirloin_cooked', grams: 150 }, { foodId: 'potato_boiled', grams: 200 }, { foodId: 'carrot_raw', grams: 100 },
      { foodId: 'onion_raw', grams: 60 }, { foodId: 'white_beans_cooked', grams: 100 }, { foodId: 'olive_oil', grams: 8 },
    ],
  },
  {
    id: 'dia_chicken_fajita_tortillas', nameHe: 'טורטיות פחיטה עוף עם פלפלים ואבוקדו', nameEn: 'Chicken Fajita Tortillas with Peppers and Avocado',
    slots: ['dinner'], prepMinutes: 25,
    ingredients: [
      { foodId: 'chicken_breast_cooked', grams: 140 }, { foodId: 'tortilla_flour', grams: 100 }, { foodId: 'bell_pepper_red_raw', grams: 100 },
      { foodId: 'onion_raw', grams: 60 }, { foodId: 'avocado_raw', grams: 50 }, { foodId: 'olive_oil', grams: 6 },
    ],
  },
  {
    id: 'dia_turkey_burger_sweet_potato', nameHe: 'המבורגר הודו עם בטטה אפויה וסלט', nameEn: 'Turkey Burger Patties with Baked Sweet Potato and Salad',
    slots: ['dinner'], prepMinutes: 35,
    ingredients: [
      { foodId: 'turkey_ground_cooked', grams: 150 }, { foodId: 'sweet_potato_baked', grams: 220 }, { foodId: 'romaine_lettuce_raw', grams: 60 },
      { foodId: 'tomato_raw', grams: 80 }, { foodId: 'olive_oil', grams: 8 },
    ],
  },
  {
    id: 'dia_kebab_hummus_plate', nameHe: 'צלחת קבב עם חומוס וסלט ירקות', nameEn: 'Kebab Plate with Hummus and Chopped Salad',
    slots: ['dinner'], prepMinutes: 25,
    ingredients: [
      { foodId: 'kebab_ground_meat_grilled', grams: 150 }, { foodId: 'hummus_spread', grams: 60 }, { foodId: 'tomato_raw', grams: 80 },
      { foodId: 'cucumber_raw', grams: 80 }, { foodId: 'pita_white', grams: 70 },
    ],
  },
  {
    id: 'dia_chicken_quinoa_mushrooms_spinach', nameHe: 'עוף עם קינואה, פטריות ותרד', nameEn: 'Chicken with Quinoa, Mushrooms and Spinach',
    slots: ['lunch', 'dinner'], prepMinutes: 30,
    ingredients: [
      { foodId: 'chicken_breast_cooked', grams: 150 }, { foodId: 'quinoa_cooked', grams: 180 }, { foodId: 'mushrooms_raw', grams: 100 },
      { foodId: 'spinach_raw', grams: 60 }, { foodId: 'olive_oil', grams: 8 }, { foodId: 'garlic_raw', grams: 4 },
    ],
  },
  {
    id: 'dia_chicken_pasta_tomato_spinach', nameHe: 'פסטה עם עוף, עגבניות ותרד', nameEn: 'Pasta with Chicken, Tomatoes and Spinach',
    slots: ['dinner'], prepMinutes: 30,
    ingredients: [
      { foodId: 'pasta_white_cooked', grams: 200 }, { foodId: 'chicken_breast_cooked', grams: 140 }, { foodId: 'tomato_raw', grams: 180 },
      { foodId: 'spinach_raw', grams: 40 }, { foodId: 'garlic_raw', grams: 5 }, { foodId: 'olive_oil', grams: 10 },
    ],
  },
  {
    id: 'dia_chicken_liver_onions_rice', nameHe: 'כבד עוף מוקפץ עם בצל ואורז', nameEn: 'Sauteed Chicken Liver with Onions and Rice',
    slots: ['dinner'], prepMinutes: 25,
    ingredients: [
      { foodId: 'chicken_liver_cooked', grams: 130 }, { foodId: 'onion_raw', grams: 100 }, { foodId: 'white_rice_cooked', grams: 180 },
      { foodId: 'olive_oil', grams: 8 }, { foodId: 'parsley_raw', grams: 10 },
    ],
  },
  {
    id: 'dia_roast_lamb_freekeh_eggplant', nameHe: 'כבש צלוי עם פריקה וחציל קלוי', nameEn: 'Roast Lamb with Freekeh and Roasted Eggplant',
    slots: ['dinner'], prepMinutes: 55,
    ingredients: [
      { foodId: 'lamb_leg_cooked', grams: 140 }, { foodId: 'freekeh_cooked', grams: 180 }, { foodId: 'eggplant_roasted', grams: 120 },
      { foodId: 'tomato_raw', grams: 80 }, { foodId: 'olive_oil', grams: 8 },
    ],
  },
  {
    id: 'dia_stuffed_peppers_beef_rice', nameHe: 'פלפלים ממולאים בבשר ואורז ברוטב עגבניות', nameEn: 'Peppers Stuffed with Beef and Rice in Tomato Sauce',
    slots: ['dinner'], prepMinutes: 60,
    ingredients: [
      { foodId: 'beef_ground_lean_cooked', grams: 130 }, { foodId: 'white_rice_cooked', grams: 120 }, { foodId: 'bell_pepper_red_raw', grams: 200 },
      { foodId: 'tomato_raw', grams: 100 }, { foodId: 'onion_raw', grams: 40 }, { foodId: 'olive_oil', grams: 6 },
    ],
  },
  {
    id: 'dia_veal_couscous_vegetables', nameHe: 'קוסקוס עם בשר עגל וירקות', nameEn: 'Couscous with Veal and Vegetables',
    slots: ['dinner'], prepMinutes: 40,
    ingredients: [
      { foodId: 'veal_cutlet_cooked', grams: 150 }, { foodId: 'couscous_cooked', grams: 180 }, { foodId: 'zucchini_raw', grams: 100 },
      { foodId: 'chickpeas_cooked', grams: 60 }, { foodId: 'olive_oil', grams: 8 },
    ],
  },
  /* ------------------------------------------------------------ fish */
  {
    id: 'dia_baked_salmon_brown_rice_broccoli', nameHe: 'סלמון אפוי עם אורז מלא וברוקולי', nameEn: 'Baked Salmon with Brown Rice and Broccoli',
    slots: ['dinner'], prepMinutes: 30,
    ingredients: [
      { foodId: 'salmon_cooked', grams: 140 }, { foodId: 'brown_rice_cooked', grams: 200 }, { foodId: 'broccoli_cooked', grams: 150 },
      { foodId: 'olive_oil', grams: 5 }, { foodId: 'lemon_juice', grams: 15 },
    ],
  },
  {
    id: 'dia_sea_bream_potatoes_vegetables', nameHe: 'דג דניס בתנור עם תפוחי אדמה וירקות', nameEn: 'Oven-Baked Sea Bream with Potatoes and Vegetables',
    slots: ['dinner'], prepMinutes: 45,
    ingredients: [
      { foodId: 'sea_bream_cooked', grams: 180 }, { foodId: 'potato_boiled', grams: 200 }, { foodId: 'tomato_raw', grams: 100 },
      { foodId: 'zucchini_raw', grams: 80 }, { foodId: 'olive_oil', grams: 10 }, { foodId: 'lemon_juice', grams: 10 },
    ],
  },
  {
    id: 'dia_tuna_pasta_tomato', nameHe: 'פסטה עם טונה ועגבניות', nameEn: 'Pasta with Tuna and Fresh Tomatoes',
    slots: ['lunch', 'dinner'], prepMinutes: 20,
    ingredients: [
      { foodId: 'pasta_white_cooked', grams: 200 }, { foodId: 'tuna_canned_water', grams: 100 }, { foodId: 'tomato_raw', grams: 150 },
      { foodId: 'olive_oil', grams: 10 }, { foodId: 'garlic_raw', grams: 4 },
    ],
  },
  {
    id: 'dia_tilapia_quinoa_green_beans', nameHe: 'פילה טילפיה עם קינואה ושעועית ירוקה', nameEn: 'Tilapia Fillet with Quinoa and Green Beans',
    slots: ['dinner'], prepMinutes: 25,
    ingredients: [
      { foodId: 'tilapia_cooked', grams: 180 }, { foodId: 'quinoa_cooked', grams: 180 }, { foodId: 'green_beans_cooked', grams: 120 },
      { foodId: 'olive_oil', grams: 8 }, { foodId: 'lemon_juice', grams: 10 },
    ],
  },
  {
    id: 'dia_cod_chickpea_tomato_pot', nameHe: 'סיר דג בקלה עם קטניות ועגבניות', nameEn: 'Cod and Chickpea Tomato Pot',
    slots: ['dinner'], prepMinutes: 35,
    ingredients: [
      { foodId: 'cod_cooked', grams: 180 }, { foodId: 'chickpeas_cooked', grams: 120 }, { foodId: 'tomato_raw', grams: 200 },
      { foodId: 'onion_raw', grams: 50 }, { foodId: 'olive_oil', grams: 10 }, { foodId: 'spinach_raw', grams: 40 },
    ],
  },
  /* ------------------------------------------------------------ vegetarian */
  {
    id: 'dia_green_shakshuka_spinach_pita', nameHe: 'שקשוקה ירוקה עם תרד וקישואים ופיתה מלאה', nameEn: 'Green Shakshuka with Spinach and Whole Wheat Pita',
    slots: ['lunch', 'dinner'], prepMinutes: 25,
    ingredients: [
      { foodId: 'egg_whole_raw', grams: 110 }, { foodId: 'spinach_raw', grams: 100 }, { foodId: 'zucchini_raw', grams: 100 }, { foodId: 'onion_raw', grams: 50 }, { foodId: 'pita_whole_wheat', grams: 70 }, { foodId: 'olive_oil', grams: 8 },
    ],
  },
  {
    id: 'dia_vegetable_omelet_potatoes', nameHe: 'חביתת ירקות עם תפוחי אדמה וסלט', nameEn: 'Vegetable Omelet with Potatoes and Salad',
    slots: ['dinner'], prepMinutes: 25,
    ingredients: [
      { foodId: 'egg_whole_raw', grams: 150 }, { foodId: 'potato_boiled', grams: 200 }, { foodId: 'zucchini_raw', grams: 100 },
      { foodId: 'onion_raw', grams: 50 }, { foodId: 'tomato_raw', grams: 100 }, { foodId: 'olive_oil', grams: 8 },
    ],
  },
  {
    id: 'dia_whole_wheat_pasta_mozzarella', nameHe: 'פסטה מלאה עם עגבניות ומוצרלה', nameEn: 'Whole Wheat Pasta with Tomatoes and Mozzarella',
    slots: ['dinner'], prepMinutes: 25,
    ingredients: [
      { foodId: 'pasta_whole_wheat_cooked', grams: 200 }, { foodId: 'tomato_raw', grams: 200 }, { foodId: 'mozzarella_cheese', grams: 50 },
      { foodId: 'spinach_raw', grams: 50 }, { foodId: 'olive_oil', grams: 8 }, { foodId: 'garlic_raw', grams: 4 },
    ],
  },
  {
    id: 'dia_sweet_potato_cottage_green_beans', nameHe: 'בטטה אפויה עם קוטג׳ ושעועית ירוקה', nameEn: 'Baked Sweet Potato with Cottage Cheese and Green Beans',
    slots: ['dinner'], prepMinutes: 40,
    ingredients: [
      { foodId: 'sweet_potato_baked', grams: 300 }, { foodId: 'cottage_cheese_5pct', grams: 150 }, { foodId: 'green_beans_cooked', grams: 120 }, { foodId: 'olive_oil', grams: 5 },
    ],
  },
  {
    id: 'dia_roasted_eggplant_chickpeas_yogurt_bulgur', nameHe: 'חציל קלוי עם קטניות ויוגורט על בורגול', nameEn: 'Roasted Eggplant with Chickpeas and Yogurt over Bulgur',
    slots: ['dinner'], prepMinutes: 45,
    ingredients: [
      { foodId: 'eggplant_roasted', grams: 200 }, { foodId: 'chickpeas_cooked', grams: 120 }, { foodId: 'yogurt_plain_3pct', grams: 100 },
      { foodId: 'bulgur_cooked', grams: 150 }, { foodId: 'olive_oil', grams: 8 }, { foodId: 'tomato_raw', grams: 100 },
    ],
  },
  {
    id: 'dia_turkey_fried_rice_peas', nameHe: 'אורז מוקפץ עם הודו, אפונה וגזר', nameEn: 'Turkey Fried Rice with Peas and Carrot',
    slots: ['lunch', 'dinner'], prepMinutes: 20,
    ingredients: [
      { foodId: 'turkey_ground_cooked', grams: 120 }, { foodId: 'white_rice_cooked', grams: 200 }, { foodId: 'green_peas_cooked', grams: 60 }, { foodId: 'carrot_raw', grams: 60 }, { foodId: 'soy_sauce', grams: 12 }, { foodId: 'canola_oil', grams: 8 },
    ],
  },
  {
    id: 'dia_quinoa_feta_cucumber_bowl', nameHe: 'קערת קינואה עם פטה, קטניות וירקות', nameEn: 'Quinoa Bowl with Feta, Chickpeas and Fresh Vegetables',
    slots: ['lunch', 'dinner'], prepMinutes: 20,
    ingredients: [
      { foodId: 'quinoa_cooked', grams: 180 }, { foodId: 'feta_bulgarian_cheese', grams: 50 }, { foodId: 'cucumber_raw', grams: 100 },
      { foodId: 'tomato_raw', grams: 120 }, { foodId: 'chickpeas_cooked', grams: 80 }, { foodId: 'olive_oil', grams: 10 }, { foodId: 'parsley_raw', grams: 10 },
    ],
  },
  {
    id: 'dia_lentil_rice_boiled_egg', nameHe: 'מג׳דרה עדשים ואורז עם ביצה קשה', nameEn: 'Lentil and Rice Mujaddara with a Hard-Boiled Egg',
    slots: ['dinner'], prepMinutes: 40,
    ingredients: [
      { foodId: 'lentils_green_cooked', grams: 180 }, { foodId: 'white_rice_cooked', grams: 150 }, { foodId: 'onion_raw', grams: 80 },
      { foodId: 'egg_boiled_hard', grams: 100 }, { foodId: 'olive_oil', grams: 10 },
    ],
  },
  {
    id: 'dia_black_bean_cheese_quesadilla', nameHe: 'קסדילה שעועית שחורה וגבינה צהובה עם סלסה טרייה', nameEn: 'Black Bean and Cheese Quesadilla with Fresh Salsa',
    slots: ['dinner'], prepMinutes: 20,
    ingredients: [
      { foodId: 'tortilla_flour', grams: 100 }, { foodId: 'black_beans_cooked', grams: 150 }, { foodId: 'yellow_cheese_gouda_type', grams: 40 },
      { foodId: 'bell_pepper_red_raw', grams: 80 }, { foodId: 'tomato_raw', grams: 80 }, { foodId: 'olive_oil', grams: 5 },
    ],
  },
  {
    id: 'dia_quinoa_mushrooms_parmesan', nameHe: 'קינואה מוקפצת עם פטריות, תרד ופרמזן', nameEn: 'Sauteed Quinoa with Mushrooms, Spinach and Parmesan',
    slots: ['dinner'], prepMinutes: 25,
    ingredients: [
      { foodId: 'quinoa_cooked', grams: 200 }, { foodId: 'mushrooms_raw', grams: 150 }, { foodId: 'parmesan_cheese', grams: 20 },
      { foodId: 'spinach_raw', grams: 60 }, { foodId: 'olive_oil', grams: 10 }, { foodId: 'onion_raw', grams: 50 },
    ],
  },
  /* ------------------------------------------------------------ vegan */
  {
    id: 'dia_tofu_vegetable_stirfry_rice', nameHe: 'מוקפץ טופו וירקות עם אורז', nameEn: 'Tofu and Vegetable Stir-Fry with Rice',
    slots: ['dinner'], prepMinutes: 25,
    ingredients: [
      { foodId: 'tofu_firm', grams: 150 }, { foodId: 'white_rice_cooked', grams: 200 }, { foodId: 'broccoli_cooked', grams: 100 },
      { foodId: 'bell_pepper_red_raw', grams: 80 }, { foodId: 'carrot_raw', grams: 50 }, { foodId: 'soy_sauce', grams: 12 }, { foodId: 'canola_oil', grams: 8 },
    ],
  },
  {
    id: 'dia_red_lentil_sweet_potato_soup', nameHe: 'מרק עדשים כתומות עם בטטה ופיתה מלאה', nameEn: 'Red Lentil and Sweet Potato Soup with Whole Wheat Pita',
    slots: ['dinner'], prepMinutes: 35,
    ingredients: [
      { foodId: 'lentils_red_cooked', grams: 200 }, { foodId: 'sweet_potato_baked', grams: 150 }, { foodId: 'carrot_raw', grams: 80 },
      { foodId: 'onion_raw', grams: 50 }, { foodId: 'olive_oil', grams: 8 }, { foodId: 'pita_whole_wheat', grams: 70 },
    ],
  },
  {
    id: 'dia_chickpea_spinach_curry_basmati', nameHe: 'קארי קטניות ותרד עם אורז בסמטי', nameEn: 'Chickpea and Spinach Curry with Basmati Rice',
    slots: ['dinner'], prepMinutes: 35,
    ingredients: [
      { foodId: 'chickpeas_cooked', grams: 180 }, { foodId: 'basmati_rice_cooked', grams: 180 }, { foodId: 'tomato_raw', grams: 150 },
      { foodId: 'spinach_raw', grams: 60 }, { foodId: 'onion_raw', grams: 60 }, { foodId: 'coconut_oil', grams: 8 },
    ],
  },
  {
    id: 'dia_baked_falafel_pita_tahini', nameHe: 'פלאפל אפוי בפיתה עם סלט ירקות וטחינה', nameEn: 'Baked Falafel in Pita with Vegetable Salad and Tahini',
    slots: ['dinner'], prepMinutes: 30,
    ingredients: [
      { foodId: 'falafel_baked', grams: 150 }, { foodId: 'tahini_sauce_ready', grams: 25 }, { foodId: 'pita_white', grams: 70 },
      { foodId: 'cucumber_raw', grams: 80 }, { foodId: 'tomato_raw', grams: 100 }, { foodId: 'cabbage_white_raw', grams: 40 },
    ],
  },
  {
    id: 'dia_black_bean_burrito_bowl', nameHe: 'קערת בוריטו עם שעועית שחורה, אורז מלא ואבוקדו', nameEn: 'Black Bean Burrito Bowl with Brown Rice and Avocado',
    slots: ['lunch', 'dinner'], prepMinutes: 25,
    ingredients: [
      { foodId: 'black_beans_cooked', grams: 180 }, { foodId: 'brown_rice_cooked', grams: 180 }, { foodId: 'corn_kernels_cooked', grams: 60 },
      { foodId: 'tomato_raw', grams: 100 }, { foodId: 'avocado_raw', grams: 50 }, { foodId: 'lemon_juice', grams: 10 },
    ],
  },
  {
    id: 'dia_roasted_chickpeas_sweet_potato_spinach', nameHe: 'גרגרי חומוס צלויים עם בטטה ותרד', nameEn: 'Roasted Chickpeas with Sweet Potato and Spinach',
    slots: ['dinner'], prepMinutes: 35,
    ingredients: [
      { foodId: 'chickpeas_cooked', grams: 150 }, { foodId: 'sweet_potato_baked', grams: 250 }, { foodId: 'spinach_raw', grams: 80 }, { foodId: 'olive_oil', grams: 10 }, { foodId: 'lemon_juice', grams: 10 },
    ],
  },
  {
    id: 'dia_seitan_whole_wheat_pasta_tomato', nameHe: 'פסטה מלאה עם סייטן, פטריות ועגבניות', nameEn: 'Whole Wheat Pasta with Seitan, Mushrooms and Tomatoes',
    slots: ['dinner'], prepMinutes: 30,
    ingredients: [
      { foodId: 'seitan_prepared', grams: 150 }, { foodId: 'pasta_whole_wheat_cooked', grams: 180 }, { foodId: 'tomato_raw', grams: 180 },
      { foodId: 'mushrooms_raw', grams: 80 }, { foodId: 'olive_oil', grams: 8 },
    ],
  },
  {
    id: 'dia_white_bean_tomato_stew_millet', nameHe: 'תבשיל שעועית לבנה ברוטב עגבניות עם דוחן', nameEn: 'White Bean and Tomato Stew with Millet',
    slots: ['lunch', 'dinner'], prepMinutes: 40,
    ingredients: [
      { foodId: 'white_beans_cooked', grams: 200 }, { foodId: 'tomato_raw', grams: 200 }, { foodId: 'spinach_raw', grams: 60 },
      { foodId: 'onion_raw', grams: 50 }, { foodId: 'millet_cooked', grams: 150 }, { foodId: 'olive_oil', grams: 10 },
    ],
  },
];
