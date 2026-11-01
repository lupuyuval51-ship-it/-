import type { DishRaw } from '../../types.js';

export const EXT_DINNER_DISHES: DishRaw[] = [
  {
    id: 'xdi_chicken_lemon_herb_potatoes', nameHe: 'ירך עוף בלימון ועשבי תיבול עם תפוחי אדמה', nameEn: 'Lemon-Herb Chicken Thigh with Roasted Potatoes',
    slots: ['dinner'], prepMinutes: 45,
    ingredients: [
      { foodId: 'chicken_thigh_cooked', grams: 170 }, { foodId: 'potato_boiled', grams: 250 }, { foodId: 'lemon_juice', grams: 15 }, { foodId: 'garlic_raw', grams: 5 }, { foodId: 'parsley_raw', grams: 10 }, { foodId: 'olive_oil', grams: 10 },
    ],
  },
  {
    id: 'xdi_chicken_sweet_potato_kale_skillet', nameHe: 'מחבת חזה עוף עם בטטה וקייל', nameEn: 'Chicken Breast Skillet with Sweet Potato and Kale',
    slots: ['dinner', 'lunch'], prepMinutes: 30,
    ingredients: [
      { foodId: 'chicken_breast_cooked', grams: 170 }, { foodId: 'sweet_potato_baked', grams: 250 }, { foodId: 'kale_raw', grams: 70 }, { foodId: 'onion_raw', grams: 50 }, { foodId: 'olive_oil', grams: 10 },
    ],
  },
  {
    id: 'xdi_moroccan_chicken_chickpea_couscous', nameHe: 'תבשיל עוף וגרגרי חומוס בסגנון מרוקאי עם קוסקוס', nameEn: 'Moroccan-Style Chicken and Chickpea Stew with Couscous',
    slots: ['dinner'], prepMinutes: 45,
    ingredients: [
      { foodId: 'chicken_thigh_cooked', grams: 150 }, { foodId: 'chickpeas_cooked', grams: 120 }, { foodId: 'carrot_raw', grams: 80 }, { foodId: 'onion_raw', grams: 60 }, { foodId: 'tomato_raw', grams: 150 }, { foodId: 'couscous_cooked', grams: 150 },
    ],
  },
  {
    id: 'xdi_chicken_mushroom_freekeh_pilaf', nameHe: 'פילאף פריקה עם עוף ופטריות', nameEn: 'Chicken and Mushroom Freekeh Pilaf',
    slots: ['dinner', 'lunch'], prepMinutes: 35,
    ingredients: [
      { foodId: 'chicken_breast_cooked', grams: 150 }, { foodId: 'freekeh_cooked', grams: 200 }, { foodId: 'mushrooms_raw', grams: 100 }, { foodId: 'spinach_raw', grams: 50 }, { foodId: 'olive_oil', grams: 10 },
    ],
  },
  {
    id: 'xdi_chicken_noodle_veg_soup', nameHe: 'מרק עוף עם אטריות וירקות', nameEn: 'Chicken Noodle Soup with Vegetables',
    slots: ['dinner'], prepMinutes: 40,
    ingredients: [
      { foodId: 'chicken_breast_cooked', grams: 140 }, { foodId: 'pasta_white_cooked', grams: 200 }, { foodId: 'carrot_raw', grams: 80 }, { foodId: 'celery_raw', grams: 50 }, { foodId: 'onion_raw', grams: 50 }, { foodId: 'parsley_raw', grams: 8 },
    ],
  },
  {
    id: 'xdi_ground_chicken_ragu_polenta', nameHe: 'ראגו עוף טחון על פולנטה', nameEn: 'Ground Chicken Ragu over Polenta',
    slots: ['dinner'], prepMinutes: 35,
    ingredients: [
      { foodId: 'chicken_ground_cooked', grams: 170 }, { foodId: 'polenta_cooked', grams: 280 }, { foodId: 'tomato_raw', grams: 150 }, { foodId: 'bell_pepper_red_raw', grams: 80 }, { foodId: 'onion_raw', grams: 40 }, { foodId: 'olive_oil', grams: 10 },
    ],
  },
  {
    id: 'xdi_chicken_rice_roasted_cauliflower', nameHe: 'קערת אורז עם ירך עוף וכרובית קלויה', nameEn: 'Chicken Thigh Rice Bowl with Roasted Cauliflower and Peppers',
    slots: ['dinner'], prepMinutes: 40,
    ingredients: [
      { foodId: 'chicken_thigh_cooked', grams: 160 }, { foodId: 'brown_rice_cooked', grams: 200 }, { foodId: 'cauliflower_cooked', grams: 130 }, { foodId: 'bell_pepper_red_raw', grams: 80 }, { foodId: 'olive_oil', grams: 10 },
    ],
  },
  {
    id: 'xdi_chicken_beet_quinoa_walnut_salad', nameHe: 'סלט חזה עוף עם סלק קינואה ואגוזי מלך', nameEn: 'Chicken Breast Salad with Beet, Quinoa and Walnuts',
    slots: ['dinner', 'lunch'], prepMinutes: 25,
    ingredients: [
      { foodId: 'chicken_breast_cooked', grams: 150 }, { foodId: 'beet_cooked', grams: 120 }, { foodId: 'quinoa_cooked', grams: 160 }, { foodId: 'romaine_lettuce_raw', grams: 60 }, { foodId: 'walnuts_raw', grams: 20 }, { foodId: 'olive_oil', grams: 8 },
    ],
  },
  {
    id: 'xdi_chicken_cutlet_potatoes_slaw', nameHe: 'פילה עוף אפוי עם תפוחי אדמה וסלט כרוב וגזר', nameEn: 'Baked Chicken Fillet with Potatoes and Cabbage-Carrot Slaw',
    slots: ['dinner'], prepMinutes: 35,
    ingredients: [
      { foodId: 'chicken_schnitzel_plain_cooked', grams: 170 }, { foodId: 'potato_boiled', grams: 250 }, { foodId: 'cabbage_white_raw', grams: 100 }, { foodId: 'carrot_raw', grams: 50 }, { foodId: 'canola_oil', grams: 10 }, { foodId: 'lemon_juice', grams: 10 },
    ],
  },
  {
    id: 'xdi_turkey_meatballs_white_beans', nameHe: 'קציצות הודו עם שעועית לבנה ברוטב עגבניות', nameEn: 'Turkey Meatballs with White Beans in Tomato Sauce',
    slots: ['dinner'], prepMinutes: 40,
    ingredients: [
      { foodId: 'turkey_ground_cooked', grams: 150 }, { foodId: 'white_beans_cooked', grams: 160 }, { foodId: 'tomato_raw', grams: 200 }, { foodId: 'spinach_raw', grams: 50 }, { foodId: 'garlic_raw', grams: 5 }, { foodId: 'olive_oil', grams: 10 },
    ],
  },
  {
    id: 'xdi_turkey_mustard_sweet_potato_broccoli', nameHe: 'חזה הודו בחרדל עם בטטה וברוקולי', nameEn: 'Mustard Turkey Breast with Sweet Potato and Broccoli',
    slots: ['dinner', 'lunch'], prepMinutes: 35,
    ingredients: [
      { foodId: 'turkey_breast_cooked', grams: 170 }, { foodId: 'sweet_potato_baked', grams: 250 }, { foodId: 'broccoli_cooked', grams: 120 }, { foodId: 'mustard_prepared', grams: 10 }, { foodId: 'olive_oil', grams: 10 },
    ],
  },
  {
    id: 'xdi_turkey_stuffed_zucchini_rice', nameHe: 'קישואים ממולאים בהודו ואורז', nameEn: 'Zucchini Stuffed with Turkey and Rice',
    slots: ['dinner'], prepMinutes: 50,
    ingredients: [
      { foodId: 'turkey_ground_cooked', grams: 150 }, { foodId: 'zucchini_raw', grams: 250 }, { foodId: 'white_rice_cooked', grams: 150 }, { foodId: 'tomato_raw', grams: 100 }, { foodId: 'onion_raw', grams: 40 }, { foodId: 'olive_oil', grams: 8 },
    ],
  },
  {
    id: 'xdi_turkey_taco_bowl', nameHe: 'קערת טאקו הודו עם תירס ואבוקדו', nameEn: 'Turkey Taco Bowl with Corn and Avocado',
    slots: ['dinner', 'lunch'], prepMinutes: 30,
    ingredients: [
      { foodId: 'turkey_ground_cooked', grams: 150 }, { foodId: 'brown_rice_cooked', grams: 170 }, { foodId: 'black_beans_cooked', grams: 100 }, { foodId: 'corn_kernels_cooked', grams: 60 }, { foodId: 'tomato_raw', grams: 80 }, { foodId: 'avocado_raw', grams: 60 },
    ],
  },
  {
    id: 'xdi_beef_flank_beet_potato_salad', nameHe: 'סלט סטייק פלנק עם סלק ותפוחי אדמה', nameEn: 'Beef Flank Salad with Beets and Potatoes',
    slots: ['dinner'], prepMinutes: 35,
    ingredients: [
      { foodId: 'beef_flank_cooked', grams: 150 }, { foodId: 'potato_boiled', grams: 220 }, { foodId: 'beet_cooked', grams: 100 }, { foodId: 'romaine_lettuce_raw', grams: 60 }, { foodId: 'olive_oil', grams: 12 }, { foodId: 'mustard_prepared', grams: 8 },
    ],
  },
  {
    id: 'xdi_beef_lentil_veg_soup', nameHe: 'מרק בקר ועדשים ירוקות עם ירקות', nameEn: 'Beef and Green Lentil Soup with Vegetables',
    slots: ['dinner'], prepMinutes: 55,
    ingredients: [
      { foodId: 'beef_ground_lean_cooked', grams: 120 }, { foodId: 'lentils_green_cooked', grams: 200 }, { foodId: 'carrot_raw', grams: 80 }, { foodId: 'onion_raw', grams: 50 }, { foodId: 'tomato_raw', grams: 100 }, { foodId: 'celery_raw', grams: 40 },
    ],
  },
  {
    id: 'xdi_beef_fajita_tortillas', nameHe: 'טורטיות פחיטה עם בקר ופלפלים', nameEn: 'Beef Fajita Tortillas with Peppers and Avocado',
    slots: ['dinner'], prepMinutes: 30,
    ingredients: [
      { foodId: 'beef_sirloin_cooked', grams: 150 }, { foodId: 'bell_pepper_red_raw', grams: 120 }, { foodId: 'onion_raw', grams: 60 }, { foodId: 'tortilla_flour', grams: 100 }, { foodId: 'avocado_raw', grams: 60 }, { foodId: 'tomato_raw', grams: 60 },
    ],
  },
  {
    id: 'xdi_beef_cabbage_roll_skillet', nameHe: 'מחבת קציצות כרוב עם בקר ואורז', nameEn: 'Deconstructed Cabbage Roll Skillet with Beef and Rice',
    slots: ['dinner'], prepMinutes: 45,
    ingredients: [
      { foodId: 'beef_ground_lean_cooked', grams: 140 }, { foodId: 'cabbage_white_raw', grams: 150 }, { foodId: 'white_rice_cooked', grams: 150 }, { foodId: 'tomato_raw', grams: 150 }, { foodId: 'onion_raw', grams: 50 }, { foodId: 'olive_oil', grams: 8 },
    ],
  },
  {
    id: 'xdi_ribeye_garlic_potatoes_spinach', nameHe: 'סטייק אנטריקוט עם תפוחי אדמה בשום ותרד', nameEn: 'Ribeye Steak with Garlic Potatoes and Spinach',
    slots: ['dinner'], prepMinutes: 35,
    ingredients: [
      { foodId: 'beef_ribeye_cooked', grams: 140 }, { foodId: 'potato_boiled', grams: 260 }, { foodId: 'spinach_raw', grams: 80 }, { foodId: 'garlic_raw', grams: 6 }, { foodId: 'olive_oil', grams: 10 },
    ],
  },
  {
    id: 'xdi_lamb_chickpea_bulgur_stew', nameHe: 'תבשיל כבש וגרגרי חומוס עם בורגול', nameEn: 'Lamb and Chickpea Stew with Bulgur',
    slots: ['dinner'], prepMinutes: 60,
    ingredients: [
      { foodId: 'lamb_leg_cooked', grams: 130 }, { foodId: 'chickpeas_cooked', grams: 120 }, { foodId: 'tomato_raw', grams: 150 }, { foodId: 'onion_raw', grams: 60 }, { foodId: 'bulgur_cooked', grams: 160 }, { foodId: 'parsley_raw', grams: 8 },
    ],
  },
  {
    id: 'xdi_lamb_stuffed_eggplant_rice', nameHe: 'חצילים ממולאים בכבש טחון ואורז', nameEn: 'Eggplant Stuffed with Ground Lamb and Rice',
    slots: ['dinner'], prepMinutes: 55,
    ingredients: [
      { foodId: 'lamb_ground_cooked', grams: 140 }, { foodId: 'eggplant_roasted', grams: 250 }, { foodId: 'tomato_raw', grams: 100 }, { foodId: 'white_rice_cooked', grams: 150 }, { foodId: 'parsley_raw', grams: 10 }, { foodId: 'onion_raw', grams: 40 },
    ],
  },
  {
    id: 'xdi_lamb_green_bean_stew_basmati', nameHe: 'תבשיל כבש ושעועית ירוקה עם אורז בסמטי', nameEn: 'Lamb and Green Bean Stew with Basmati Rice',
    slots: ['dinner'], prepMinutes: 60,
    ingredients: [
      { foodId: 'lamb_leg_cooked', grams: 130 }, { foodId: 'green_beans_cooked', grams: 200 }, { foodId: 'tomato_raw', grams: 150 }, { foodId: 'basmati_rice_cooked', grams: 170 }, { foodId: 'onion_raw', grams: 50 }, { foodId: 'olive_oil', grams: 8 },
    ],
  },
  {
    id: 'xdi_kebab_sweet_potato_tahini', nameHe: 'מגש קבב עם בטטה וטחינה', nameEn: 'Kebab Tray with Sweet Potato and Tahini Sauce',
    slots: ['dinner'], prepMinutes: 35,
    ingredients: [
      { foodId: 'kebab_ground_meat_grilled', grams: 150 }, { foodId: 'sweet_potato_baked', grams: 250 }, { foodId: 'tahini_sauce_ready', grams: 25 }, { foodId: 'cucumber_raw', grams: 100 }, { foodId: 'tomato_raw', grams: 100 },
    ],
  },
  {
    id: 'xdi_veal_quinoa_roasted_peppers', nameHe: 'עגל צלוי עם קינואה ופלפלים קלויים', nameEn: 'Pan-Seared Veal with Quinoa and Roasted Peppers',
    slots: ['dinner'], prepMinutes: 35,
    ingredients: [
      { foodId: 'veal_cutlet_cooked', grams: 160 }, { foodId: 'quinoa_cooked', grams: 180 }, { foodId: 'bell_pepper_red_raw', grams: 130 }, { foodId: 'zucchini_raw', grams: 80 }, { foodId: 'olive_oil', grams: 10 }, { foodId: 'lemon_juice', grams: 10 },
    ],
  },
  {
    id: 'xdi_chicken_lettuce_wraps_rice', nameHe: 'עלי חסה ממולאים בעוף עם אורז ואבוקדו', nameEn: 'Chicken Lettuce Wraps with Rice and Avocado',
    slots: ['dinner', 'lunch'], prepMinutes: 25,
    ingredients: [
      { foodId: 'chicken_breast_cooked', grams: 150 }, { foodId: 'romaine_lettuce_raw', grams: 80 }, { foodId: 'white_rice_cooked', grams: 170 }, { foodId: 'avocado_raw', grams: 70 }, { foodId: 'cucumber_raw', grams: 80 }, { foodId: 'soy_sauce', grams: 8 },
    ],
  },
  {
    id: 'xdi_chicken_corn_potato_soup', nameHe: 'מרק עוף עם תירס ותפוחי אדמה', nameEn: 'Chicken, Corn and Potato Soup',
    slots: ['dinner'], prepMinutes: 40,
    ingredients: [
      { foodId: 'chicken_breast_cooked', grams: 140 }, { foodId: 'corn_kernels_cooked', grams: 100 }, { foodId: 'potato_boiled', grams: 200 }, { foodId: 'onion_raw', grams: 40 }, { foodId: 'celery_raw', grams: 40 }, { foodId: 'parsley_raw', grams: 8 },
    ],
  },
  {
    id: 'xdi_baked_salmon_sweet_potato_beans', nameHe: 'סלמון אפוי עם בטטה ושעועית ירוקה', nameEn: 'Baked Salmon with Sweet Potato and Green Beans',
    slots: ['dinner'], prepMinutes: 30,
    ingredients: [
      { foodId: 'salmon_cooked', grams: 150 }, { foodId: 'sweet_potato_baked', grams: 220 }, { foodId: 'green_beans_cooked', grams: 130 }, { foodId: 'lemon_juice', grams: 10 }, { foodId: 'olive_oil', grams: 8 },
    ],
  },
  {
    id: 'xdi_grilled_tuna_white_bean_salad', nameHe: 'טונה צלויה עם סלט שעועית לבנה ועגבניות', nameEn: 'Grilled Tuna with White Bean and Tomato Salad',
    slots: ['dinner'], prepMinutes: 25,
    ingredients: [
      { foodId: 'tuna_fresh_cooked', grams: 150 }, { foodId: 'white_beans_cooked', grams: 150 }, { foodId: 'tomato_raw', grams: 130 }, { foodId: 'romaine_lettuce_raw', grams: 50 }, { foodId: 'olive_oil', grams: 10 }, { foodId: 'lemon_juice', grams: 10 },
    ],
  },
  {
    id: 'xdi_baked_mackerel_potato_beet', nameHe: 'מקרל אפוי עם תפוחי אדמה וסלט סלק', nameEn: 'Baked Mackerel with Potatoes and Beet Salad',
    slots: ['dinner'], prepMinutes: 40,
    ingredients: [
      { foodId: 'mackerel_cooked', grams: 130 }, { foodId: 'potato_boiled', grams: 230 }, { foodId: 'beet_cooked', grams: 100 }, { foodId: 'parsley_raw', grams: 8 }, { foodId: 'olive_oil', grams: 8 },
    ],
  },
  {
    id: 'xdi_cod_green_lentils_spinach', nameHe: 'בקלה על מצע עדשים ירוקות ותרד', nameEn: 'Cod over Green Lentils with Spinach and Tomato',
    slots: ['dinner'], prepMinutes: 35,
    ingredients: [
      { foodId: 'cod_cooked', grams: 170 }, { foodId: 'lentils_green_cooked', grams: 180 }, { foodId: 'spinach_raw', grams: 60 }, { foodId: 'tomato_raw', grams: 100 }, { foodId: 'olive_oil', grams: 10 },
    ],
  },
  {
    id: 'xdi_sea_bream_millet_zucchini', nameHe: 'דג דניס צלוי עם דוחן וקישואים', nameEn: 'Grilled Sea Bream with Millet and Zucchini',
    slots: ['dinner'], prepMinutes: 30,
    ingredients: [
      { foodId: 'sea_bream_cooked', grams: 170 }, { foodId: 'millet_cooked', grams: 200 }, { foodId: 'zucchini_raw', grams: 120 }, { foodId: 'lemon_juice', grams: 10 }, { foodId: 'olive_oil', grams: 10 },
    ],
  },
  {
    id: 'xdi_sardine_tomato_pasta', nameHe: 'פסטה מלאה עם סרדינים ועגבניות', nameEn: 'Whole Wheat Pasta with Sardines and Tomatoes',
    slots: ['dinner', 'lunch'], prepMinutes: 20,
    ingredients: [
      { foodId: 'sardines_canned_oil', grams: 100 }, { foodId: 'pasta_whole_wheat_cooked', grams: 200 }, { foodId: 'tomato_raw', grams: 150 }, { foodId: 'garlic_raw', grams: 5 }, { foodId: 'parsley_raw', grams: 8 },
    ],
  },
  {
    id: 'xdi_tilapia_polenta_broccoli', nameHe: 'אמנון אפוי עם פולנטה רכה וברוקולי', nameEn: 'Baked Tilapia with Soft Polenta and Broccoli',
    slots: ['dinner'], prepMinutes: 35,
    ingredients: [
      { foodId: 'tilapia_cooked', grams: 170 }, { foodId: 'polenta_cooked', grams: 250 }, { foodId: 'broccoli_cooked', grams: 130 }, { foodId: 'garlic_raw', grams: 4 }, { foodId: 'olive_oil', grams: 10 },
    ],
  },
  {
    id: 'xdi_tofu_mushroom_stroganoff_pasta', nameHe: 'פסטה עם טופו ברוטב פטריות', nameEn: 'Pasta with Tofu and Mushrooms in Mushroom Sauce',
    slots: ['dinner'], prepMinutes: 30,
    ingredients: [
      { foodId: 'tofu_firm', grams: 160 }, { foodId: 'mushrooms_raw', grams: 120 }, { foodId: 'pasta_white_cooked', grams: 200 }, { foodId: 'onion_raw', grams: 50 }, { foodId: 'olive_oil', grams: 10 }, { foodId: 'parsley_raw', grams: 8 },
    ],
  },
  {
    id: 'xdi_tempeh_potato_kale_hash', nameHe: 'מחבת טמפה עם תפוחי אדמה וקייל', nameEn: 'Tempeh Hash with Potatoes and Kale',
    slots: ['dinner'], prepMinutes: 30,
    ingredients: [
      { foodId: 'tempeh', grams: 130 }, { foodId: 'potato_boiled', grams: 250 }, { foodId: 'kale_raw', grams: 70 }, { foodId: 'mustard_prepared', grams: 8 }, { foodId: 'olive_oil', grams: 10 },
    ],
  },
  {
    id: 'xdi_seitan_shawarma_plate', nameHe: 'מנת שווארמה סייטן בפיתה עם סלט וטחינה', nameEn: 'Seitan Shawarma Pita with Salad and Tahini Sauce',
    slots: ['dinner'], prepMinutes: 30,
    ingredients: [
      { foodId: 'seitan_prepared', grams: 150 }, { foodId: 'pita_whole_wheat', grams: 90 }, { foodId: 'tomato_raw', grams: 100 }, { foodId: 'cucumber_raw', grams: 100 }, { foodId: 'tahini_sauce_ready', grams: 20 }, { foodId: 'onion_raw', grams: 30 },
    ],
  },
  {
    id: 'xdi_red_lentil_dal_basmati', nameHe: 'דאל עדשים אדומות עם אורז בסמטי', nameEn: 'Red Lentil Dal with Basmati Rice',
    slots: ['dinner', 'lunch'], prepMinutes: 35,
    ingredients: [
      { foodId: 'lentils_red_cooked', grams: 220 }, { foodId: 'basmati_rice_cooked', grams: 180 }, { foodId: 'tomato_raw', grams: 120 }, { foodId: 'onion_raw', grams: 60 }, { foodId: 'spinach_raw', grams: 50 }, { foodId: 'olive_oil', grams: 10 },
    ],
  },
  {
    id: 'xdi_black_bean_chili_rice', nameHe: 'צ׳ילי שעועית שחורה עם תירס ואורז מלא', nameEn: 'Black Bean Chili with Corn and Brown Rice',
    slots: ['dinner'], prepMinutes: 40,
    ingredients: [
      { foodId: 'black_beans_cooked', grams: 200 }, { foodId: 'tomato_raw', grams: 200 }, { foodId: 'corn_kernels_cooked', grams: 80 }, { foodId: 'onion_raw', grams: 50 }, { foodId: 'brown_rice_cooked', grams: 160 }, { foodId: 'olive_oil', grams: 8 },
    ],
  },
  {
    id: 'xdi_chickpea_cauliflower_potato_curry', nameHe: 'קארי גרגרי חומוס כרובית ותפוחי אדמה', nameEn: 'Chickpea, Cauliflower and Potato Curry',
    slots: ['dinner'], prepMinutes: 40,
    ingredients: [
      { foodId: 'chickpeas_cooked', grams: 180 }, { foodId: 'cauliflower_cooked', grams: 150 }, { foodId: 'potato_boiled', grams: 170 }, { foodId: 'tomato_raw', grams: 150 }, { foodId: 'onion_raw', grams: 50 }, { foodId: 'olive_oil', grams: 10 },
    ],
  },
  {
    id: 'xdi_tuscan_white_bean_kale_soup', nameHe: 'מרק שעועית לבנה וקייל בסגנון טוסקני עם תפוחי אדמה', nameEn: 'Tuscan-Style White Bean and Kale Soup with Potatoes',
    slots: ['dinner'], prepMinutes: 45,
    ingredients: [
      { foodId: 'white_beans_cooked', grams: 220 }, { foodId: 'kale_raw', grams: 80 }, { foodId: 'potato_boiled', grams: 160 }, { foodId: 'carrot_raw', grams: 60 }, { foodId: 'onion_raw', grams: 40 }, { foodId: 'olive_oil', grams: 12 },
    ],
  },
  {
    id: 'xdi_edamame_rice_avocado_bowl', nameHe: 'קערת אדממה עם אורז מלא אבוקדו ומלפפון', nameEn: 'Edamame Brown Rice Bowl with Avocado and Cucumber',
    slots: ['dinner', 'lunch'], prepMinutes: 25,
    ingredients: [
      { foodId: 'edamame_shelled_cooked', grams: 160 }, { foodId: 'brown_rice_cooked', grams: 200 }, { foodId: 'avocado_raw', grams: 80 }, { foodId: 'cucumber_raw', grams: 100 }, { foodId: 'soy_sauce', grams: 8 }, { foodId: 'carrot_raw', grams: 50 },
    ],
  },
  {
    id: 'xdi_lentil_beet_walnut_bowl', nameHe: 'קערת עדשים וסלק עם תרד ואגוזי מלך', nameEn: 'Lentil and Beet Bowl with Spinach and Walnuts',
    slots: ['dinner', 'lunch'], prepMinutes: 30,
    ingredients: [
      { foodId: 'lentils_green_cooked', grams: 200 }, { foodId: 'beet_cooked', grams: 130 }, { foodId: 'spinach_raw', grams: 60 }, { foodId: 'walnuts_raw', grams: 20 }, { foodId: 'olive_oil', grams: 8 }, { foodId: 'sourdough_bread', grams: 70 },
    ],
  },
  {
    id: 'xdi_fava_tomato_stew_pita', nameHe: 'תבשיל פול בעגבניות עם פיתה מלאה', nameEn: 'Fava Bean and Tomato Stew with Whole Wheat Pita',
    slots: ['dinner'], prepMinutes: 35,
    ingredients: [
      { foodId: 'fava_beans_cooked', grams: 220 }, { foodId: 'tomato_raw', grams: 150 }, { foodId: 'onion_raw', grams: 50 }, { foodId: 'pita_whole_wheat', grams: 100 }, { foodId: 'olive_oil', grams: 12 }, { foodId: 'lemon_juice', grams: 10 },
    ],
  },
  {
    id: 'xdi_tempeh_cabbage_tacos', nameHe: 'טאקו טמפה עם כרוב ואבוקדו', nameEn: 'Tempeh Tacos with Cabbage and Avocado',
    slots: ['dinner'], prepMinutes: 30,
    ingredients: [
      { foodId: 'tempeh', grams: 140 }, { foodId: 'tortilla_flour', grams: 110 }, { foodId: 'cabbage_white_raw', grams: 80 }, { foodId: 'avocado_raw', grams: 70 }, { foodId: 'tomato_raw', grams: 80 },
    ],
  },
  {
    id: 'xdi_pumpkin_chickpea_soup_sourdough', nameHe: 'מרק דלעת וגרגרי חומוס קלויים עם לחם מחמצת', nameEn: 'Roasted Pumpkin and Chickpea Soup with Sourdough',
    slots: ['dinner'], prepMinutes: 45,
    ingredients: [
      { foodId: 'pumpkin_cooked', grams: 280 }, { foodId: 'chickpeas_cooked', grams: 150 }, { foodId: 'onion_raw', grams: 50 }, { foodId: 'sourdough_bread', grams: 90 }, { foodId: 'olive_oil', grams: 10 }, { foodId: 'garlic_raw', grams: 4 },
    ],
  },
  {
    id: 'xdi_soy_protein_chili_kidney_rice', nameHe: 'צ׳ילי סויה מרוקעת עם שעועית אדומה ואורז', nameEn: 'Textured Soy Chili with Kidney Beans and Rice',
    slots: ['dinner'], prepMinutes: 35,
    ingredients: [
      { foodId: 'textured_soy_protein_dry', grams: 45 }, { foodId: 'kidney_beans_cooked', grams: 150 }, { foodId: 'tomato_raw', grams: 200 }, { foodId: 'brown_rice_cooked', grams: 150 }, { foodId: 'onion_raw', grams: 50 }, { foodId: 'bell_pepper_red_raw', grams: 60 },
    ],
  },
  {
    id: 'xdi_millet_pilaf_peas_almonds', nameHe: 'פילאף דוחן עם אפונה קישואים ושקדים', nameEn: 'Millet Pilaf with Peas, Zucchini and Almonds',
    slots: ['dinner', 'lunch'], prepMinutes: 30,
    ingredients: [
      { foodId: 'millet_cooked', grams: 250 }, { foodId: 'green_peas_cooked', grams: 120 }, { foodId: 'zucchini_raw', grams: 100 }, { foodId: 'almonds_raw', grams: 25 }, { foodId: 'olive_oil', grams: 10 },
    ],
  },
  {
    id: 'xdi_potato_spinach_feta_frittata', nameHe: 'פריטטה של תפוחי אדמה, תרד ובולגרית', nameEn: 'Potato, Spinach and Feta Frittata',
    slots: ['dinner', 'lunch'], prepMinutes: 35,
    ingredients: [
      { foodId: 'egg_whole_raw', grams: 150 }, { foodId: 'potato_boiled', grams: 220 }, { foodId: 'spinach_raw', grams: 80 }, { foodId: 'feta_bulgarian_cheese', grams: 40 }, { foodId: 'onion_raw', grams: 40 }, { foodId: 'olive_oil', grams: 10 },
    ],
  },
  {
    id: 'xdi_egg_curry_basmati', nameHe: 'קארי ביצים קשות עם אורז בסמטי ואפונה', nameEn: 'Boiled Egg Curry with Basmati Rice and Peas',
    slots: ['dinner'], prepMinutes: 35,
    ingredients: [
      { foodId: 'egg_boiled_hard', grams: 110 }, { foodId: 'tomato_raw', grams: 150 }, { foodId: 'onion_raw', grams: 60 }, { foodId: 'basmati_rice_cooked', grams: 180 }, { foodId: 'green_peas_cooked', grams: 60 }, { foodId: 'olive_oil', grams: 8 },
    ],
  },
  {
    id: 'xdi_egg_white_mushroom_scramble_sourdough', nameHe: 'ערבולית חלבונים עם פטריות על לחם מחמצת', nameEn: 'Mushroom Egg White Scramble on Sourdough',
    slots: ['dinner', 'lunch'], prepMinutes: 20,
    ingredients: [
      { foodId: 'egg_white_raw', grams: 200 }, { foodId: 'mushrooms_raw', grams: 120 }, { foodId: 'spinach_raw', grams: 60 }, { foodId: 'sourdough_bread', grams: 100 }, { foodId: 'olive_oil', grams: 8 }, { foodId: 'tomato_raw', grams: 80 },
    ],
  },
  {
    id: 'xdi_eggplant_parmigiana_quinoa', nameHe: 'חציל אפוי עם מוצרלה ורוטב עגבניות וקינואה', nameEn: 'Baked Eggplant with Mozzarella and Tomato Sauce over Quinoa',
    slots: ['dinner'], prepMinutes: 45,
    ingredients: [
      { foodId: 'eggplant_roasted', grams: 250 }, { foodId: 'mozzarella_cheese', grams: 80 }, { foodId: 'tomato_raw', grams: 150 }, { foodId: 'quinoa_cooked', grams: 150 }, { foodId: 'olive_oil', grams: 6 },
    ],
  },
  {
    id: 'xdi_watermelon_feta_chickpea_salad', nameHe: 'סלט אבטיח גבינה בולגרית וגרגרי חומוס', nameEn: 'Watermelon, Feta and Chickpea Salad',
    slots: ['dinner', 'lunch'], prepMinutes: 15,
    ingredients: [
      { foodId: 'watermelon_raw', grams: 250 }, { foodId: 'feta_bulgarian_cheese', grams: 60 }, { foodId: 'chickpeas_cooked', grams: 180 }, { foodId: 'cucumber_raw', grams: 100 }, { foodId: 'parsley_raw', grams: 8 }, { foodId: 'olive_oil', grams: 10 },
    ],
  },
  {
    id: 'xdi_lentil_soup_labneh_pita', nameHe: 'מרק עדשים ירוקות עם לבנה ופיתה מלאה', nameEn: 'Green Lentil Soup with Labneh and Whole Wheat Pita',
    slots: ['dinner'], prepMinutes: 45,
    ingredients: [
      { foodId: 'lentils_green_cooked', grams: 230 }, { foodId: 'carrot_raw', grams: 80 }, { foodId: 'onion_raw', grams: 50 }, { foodId: 'labneh_full_fat', grams: 40 }, { foodId: 'pita_whole_wheat', grams: 80 }, { foodId: 'olive_oil', grams: 6 },
    ],
  },
  {
    id: 'xdi_cottage_pasta_peas_broccoli', nameHe: 'פסטה מלאה עם קוטג׳ אפונה וברוקולי', nameEn: 'Whole Wheat Pasta with Cottage Cheese, Peas and Broccoli',
    slots: ['dinner'], prepMinutes: 25,
    ingredients: [
      { foodId: 'pasta_whole_wheat_cooked', grams: 200 }, { foodId: 'cottage_cheese_5pct', grams: 150 }, { foodId: 'green_peas_cooked', grams: 80 }, { foodId: 'broccoli_cooked', grams: 100 }, { foodId: 'garlic_raw', grams: 4 }, { foodId: 'olive_oil', grams: 6 },
    ],
  },
  {
    id: 'xdi_skyr_millet_roasted_veg_bowl', nameHe: 'קערת דוחן עם סקיר ירקות קלויים', nameEn: 'Millet Bowl with Skyr Dressing and Roasted Vegetables',
    slots: ['dinner'], prepMinutes: 30,
    ingredients: [
      { foodId: 'skyr_plain', grams: 150 }, { foodId: 'millet_cooked', grams: 220 }, { foodId: 'zucchini_raw', grams: 100 }, { foodId: 'cucumber_raw', grams: 80 }, { foodId: 'bell_pepper_red_raw', grams: 100 }, { foodId: 'olive_oil', grams: 8 },
    ],
  },
  {
    id: 'xdi_quinoa_feta_stuffed_peppers', nameHe: 'פלפלים ממולאים בקינואה וגבינה בולגרית', nameEn: 'Peppers Stuffed with Quinoa, White Beans and Feta',
    slots: ['dinner'], prepMinutes: 50,
    ingredients: [
      { foodId: 'bell_pepper_red_raw', grams: 250 }, { foodId: 'quinoa_cooked', grams: 160 }, { foodId: 'feta_bulgarian_cheese', grams: 50 }, { foodId: 'white_beans_cooked', grams: 110 }, { foodId: 'tomato_raw', grams: 80 }, { foodId: 'olive_oil', grams: 6 },
    ],
  },
  {
    id: 'xdi_sweet_potato_egg_hash', nameHe: 'מחבת בטטה עם ביצים ותרד', nameEn: 'Sweet Potato Hash with Fried Eggs and Spinach',
    slots: ['dinner', 'lunch'], prepMinutes: 30,
    ingredients: [
      { foodId: 'sweet_potato_baked', grams: 260 }, { foodId: 'egg_whole_raw', grams: 130 }, { foodId: 'spinach_raw', grams: 60 }, { foodId: 'onion_raw', grams: 50 }, { foodId: 'bell_pepper_red_raw', grams: 80 }, { foodId: 'olive_oil', grams: 10 },
    ],
  },
  {
    id: 'xdi_tortilla_veggie_mozzarella_pizza', nameHe: 'פיצה טורטייה עם מוצרלה ירקות ופטריות', nameEn: 'Tortilla Pizza with Mozzarella, Mushrooms and Peppers',
    slots: ['dinner'], prepMinutes: 20,
    ingredients: [
      { foodId: 'tortilla_flour', grams: 120 }, { foodId: 'mozzarella_cheese', grams: 80 }, { foodId: 'tomato_raw', grams: 120 }, { foodId: 'mushrooms_raw', grams: 80 }, { foodId: 'bell_pepper_red_raw', grams: 60 }, { foodId: 'olive_oil', grams: 5 },
    ],
  },
  {
    id: 'xdi_cauliflower_egg_rice_yogurt', nameHe: 'קערת אורז מלא עם כרובית קלויה ביצה קשה ויוגורט', nameEn: 'Brown Rice Bowl with Roasted Cauliflower, Boiled Egg and Yogurt',
    slots: ['dinner'], prepMinutes: 35,
    ingredients: [
      { foodId: 'cauliflower_cooked', grams: 200 }, { foodId: 'egg_boiled_hard', grams: 110 }, { foodId: 'brown_rice_cooked', grams: 180 }, { foodId: 'yogurt_plain_3pct', grams: 80 }, { foodId: 'olive_oil', grams: 8 }, { foodId: 'parsley_raw', grams: 8 },
    ],
  },
  {
    id: 'xdi_zucchini_white_cheese_rice_bake', nameHe: 'תבשיל קישואים וגבינה לבנה עם אורז', nameEn: 'Zucchini and White Cheese Bake with Rice',
    slots: ['dinner'], prepMinutes: 40,
    ingredients: [
      { foodId: 'zucchini_raw', grams: 250 }, { foodId: 'white_cheese_5pct', grams: 100 }, { foodId: 'white_rice_cooked', grams: 180 }, { foodId: 'tomato_raw', grams: 100 }, { foodId: 'olive_oil', grams: 8 }, { foodId: 'parsley_raw', grams: 8 },
    ],
  },
  {
    id: 'xdi_hummus_quinoa_roasted_veg_bowl', nameHe: 'קערת קינואה עם חומוס וירקות קלויים', nameEn: 'Hummus Quinoa Bowl with Roasted Vegetables',
    slots: ['dinner', 'lunch'], prepMinutes: 30,
    ingredients: [
      { foodId: 'hummus_spread', grams: 90 }, { foodId: 'quinoa_cooked', grams: 170 }, { foodId: 'eggplant_roasted', grams: 120 }, { foodId: 'bell_pepper_red_raw', grams: 100 }, { foodId: 'cucumber_raw', grams: 80 }, { foodId: 'olive_oil', grams: 6 },
    ],
  },
];
