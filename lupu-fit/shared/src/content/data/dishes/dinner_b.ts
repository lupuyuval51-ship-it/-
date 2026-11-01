import type { DishRaw } from '../../types.js';

/* Dinner B: fish, vegetarian, vegan and light dinners. One adult serving each. */

export const DINNER_B_DISHES: DishRaw[] = [
  /* ------------------------------------------------------------ fish */
  {
    id: 'dib_baked_salmon_quinoa_broccoli', nameHe: 'סלמון אפוי עם קינואה וברוקולי', nameEn: 'Baked Salmon with Quinoa and Broccoli',
    slots: ['dinner'], prepMinutes: 25,
    ingredients: [{ foodId: 'salmon_cooked', grams: 150 }, { foodId: 'quinoa_cooked', grams: 180 }, { foodId: 'broccoli_cooked', grams: 150 }, { foodId: 'olive_oil', grams: 5 }, { foodId: 'lemon_juice', grams: 15 }],
  },
  {
    id: 'dib_tilapia_rice_green_beans', nameHe: 'פילה אמנון אפוי עם אורז ושעועית ירוקה', nameEn: 'Baked Tilapia with Rice and Garlic Green Beans',
    slots: ['dinner', 'lunch'], prepMinutes: 25,
    ingredients: [{ foodId: 'tilapia_cooked', grams: 180 }, { foodId: 'white_rice_cooked', grams: 180 }, { foodId: 'green_beans_cooked', grams: 130 }, { foodId: 'olive_oil', grams: 10 }, { foodId: 'lemon_juice', grams: 15 }, { foodId: 'garlic_raw', grams: 3 }],
  },
  {
    id: 'dib_cod_potatoes_zucchini', nameHe: 'בקלה אפויה עם תפוחי אדמה וקישואים', nameEn: 'Oven-Baked Cod with Potatoes and Zucchini',
    slots: ['dinner'], prepMinutes: 35,
    ingredients: [{ foodId: 'cod_cooked', grams: 200 }, { foodId: 'potato_boiled', grams: 250 }, { foodId: 'zucchini_raw', grams: 150 }, { foodId: 'tomato_raw', grams: 100 }, { foodId: 'olive_oil', grams: 12 }],
  },
  {
    id: 'dib_sea_bream_couscous_salad', nameHe: 'דניס צלוי עם קוסקוס וסלט ירקות', nameEn: 'Grilled Sea Bream with Couscous and Chopped Salad',
    slots: ['dinner', 'lunch'], prepMinutes: 30,
    ingredients: [{ foodId: 'sea_bream_cooked', grams: 200 }, { foodId: 'couscous_cooked', grams: 200 }, { foodId: 'tomato_raw', grams: 120 }, { foodId: 'cucumber_raw', grams: 100 }, { foodId: 'olive_oil', grams: 10 }, { foodId: 'parsley_raw', grams: 10 }, { foodId: 'lemon_juice', grams: 15 }],
  },
  {
    id: 'dib_tuna_corn_pasta_salad', nameHe: 'סלט פסטה עם טונה ותירס', nameEn: 'Tuna and Corn Pasta Salad',
    slots: ['dinner', 'lunch'], prepMinutes: 15,
    ingredients: [
      { foodId: 'tuna_canned_water', grams: 120 }, { foodId: 'pasta_white_cooked', grams: 200 }, { foodId: 'tomato_raw', grams: 150 }, { foodId: 'corn_kernels_cooked', grams: 60 }, { foodId: 'parsley_raw', grams: 5 }, { foodId: 'olive_oil', grams: 10 }, { foodId: 'lemon_juice', grams: 10 },
    ],
  },
  {
    id: 'dib_sardines_avocado_sourdough', nameHe: 'טוסט שאור עם סרדינים ואבוקדו', nameEn: 'Sardine and Avocado Sourdough Toast with Tomato',
    slots: ['dinner'], prepMinutes: 10,
    ingredients: [{ foodId: 'sardines_canned_oil', grams: 90 }, { foodId: 'sourdough_bread', grams: 90 }, { foodId: 'avocado_raw', grams: 70 }, { foodId: 'tomato_raw', grams: 100 }, { foodId: 'lemon_juice', grams: 10 }],
  },
  /* ------------------------------------------------------------ vegan */
  {
    id: 'dib_chickpea_spinach_shakshuka', nameHe: 'מחבת עגבניות, תרד וקטניות עם פיתה מחיטה מלאה', nameEn: 'Vegan Tomato, Spinach and Chickpea Skillet with Whole Wheat Pita',
    slots: ['dinner'], prepMinutes: 25,
    ingredients: [{ foodId: 'chickpeas_cooked', grams: 150 }, { foodId: 'tomato_raw', grams: 250 }, { foodId: 'spinach_raw', grams: 60 }, { foodId: 'onion_raw', grams: 80 }, { foodId: 'olive_oil', grams: 10 }, { foodId: 'garlic_raw', grams: 5 }, { foodId: 'pita_whole_wheat', grams: 80 }],
  },
  {
    id: 'dib_red_lentil_soup_pita', nameHe: 'מרק עדשים כתומות עם גזר ופיתה מחיטה מלאה', nameEn: 'Red Lentil and Carrot Soup with Whole Wheat Pita',
    slots: ['dinner', 'lunch'], prepMinutes: 30,
    ingredients: [{ foodId: 'lentils_red_cooked', grams: 300 }, { foodId: 'carrot_raw', grams: 80 }, { foodId: 'onion_raw', grams: 80 }, { foodId: 'olive_oil', grams: 10 }, { foodId: 'lemon_juice', grams: 15 }, { foodId: 'pita_whole_wheat', grams: 80 }],
  },
  {
    id: 'dib_brown_rice_lentil_bowl', nameHe: 'קערת אורז מלא ועדשים עם בצל מקורמל וסלט טרי', nameEn: 'Brown Rice and Lentil Bowl with Caramelized Onions and Fresh Salad',
    slots: ['dinner', 'lunch'], prepMinutes: 35,
    ingredients: [
      { foodId: 'lentils_green_cooked', grams: 180 }, { foodId: 'brown_rice_cooked', grams: 150 }, { foodId: 'onion_raw', grams: 100 }, { foodId: 'olive_oil', grams: 10 }, { foodId: 'cucumber_raw', grams: 100 }, { foodId: 'tomato_raw', grams: 100 },
    ],
  },
  {
    id: 'dib_tofu_vegetable_curry_basmati', nameHe: 'קארי טופו וירקות עם אורז בסמטי', nameEn: 'Tofu and Vegetable Curry with Basmati Rice',
    slots: ['dinner'], prepMinutes: 35,
    ingredients: [{ foodId: 'tofu_firm', grams: 200 }, { foodId: 'sweet_potato_baked', grams: 150 }, { foodId: 'cauliflower_cooked', grams: 100 }, { foodId: 'tomato_raw', grams: 150 }, { foodId: 'onion_raw', grams: 80 }, { foodId: 'coconut_oil', grams: 10 }, { foodId: 'basmati_rice_cooked', grams: 150 }],
  },
  {
    id: 'dib_tempeh_stir_fry_brown_rice', nameHe: 'טמפה מוקפצת עם ירקות ואורז מלא', nameEn: 'Tempeh and Vegetable Stir-Fry with Brown Rice',
    slots: ['dinner'], prepMinutes: 25,
    ingredients: [{ foodId: 'tempeh', grams: 150 }, { foodId: 'brown_rice_cooked', grams: 180 }, { foodId: 'broccoli_cooked', grams: 120 }, { foodId: 'carrot_raw', grams: 60 }, { foodId: 'bell_pepper_red_raw', grams: 100 }, { foodId: 'soy_sauce', grams: 15 }, { foodId: 'canola_oil', grams: 10 }],
  },
  {
    id: 'dib_stuffed_peppers_lentils_rice', nameHe: 'פלפלים ממולאים בעדשים ובאורז מלא', nameEn: 'Bell Peppers Stuffed with Lentils and Brown Rice',
    slots: ['dinner'], prepMinutes: 50,
    ingredients: [{ foodId: 'bell_pepper_red_raw', grams: 250 }, { foodId: 'lentils_green_cooked', grams: 150 }, { foodId: 'brown_rice_cooked', grams: 120 }, { foodId: 'onion_raw', grams: 60 }, { foodId: 'tomato_raw', grams: 100 }, { foodId: 'olive_oil', grams: 10 }, { foodId: 'parsley_raw', grams: 5 }],
  },
  {
    id: 'dib_black_bean_rice_bowl', nameHe: 'קערת שעועית שחורה ואורז מלא עם אבוקדו ותירס', nameEn: 'Mexican-Style Black Bean and Rice Bowl with Avocado',
    slots: ['dinner', 'lunch'], prepMinutes: 20,
    ingredients: [{ foodId: 'black_beans_cooked', grams: 150 }, { foodId: 'brown_rice_cooked', grams: 150 }, { foodId: 'corn_kernels_cooked', grams: 80 }, { foodId: 'avocado_raw', grams: 60 }, { foodId: 'tomato_raw', grams: 100 }, { foodId: 'romaine_lettuce_raw', grams: 40 }, { foodId: 'lemon_juice', grams: 10 }],
  },
  {
    id: 'dib_eggplant_tahini_quinoa_bowl', nameHe: 'קערת חציל צלוי עם טחינה, קינואה וגרגירי חומוס', nameEn: 'Roasted Eggplant Bowl with Tahini, Quinoa and Chickpeas',
    slots: ['dinner', 'lunch'], prepMinutes: 35,
    ingredients: [{ foodId: 'eggplant_roasted', grams: 200 }, { foodId: 'quinoa_cooked', grams: 180 }, { foodId: 'chickpeas_cooked', grams: 100 }, { foodId: 'tahini_raw', grams: 25 }, { foodId: 'tomato_raw', grams: 100 }, { foodId: 'parsley_raw', grams: 5 }, { foodId: 'olive_oil', grams: 5 }],
  },
  {
    id: 'dib_white_bean_spinach_pasta', nameHe: 'פסטה עם שעועית לבנה, תרד ועגבניות', nameEn: 'Pasta with White Beans, Spinach and Tomatoes',
    slots: ['dinner'], prepMinutes: 25,
    ingredients: [{ foodId: 'pasta_white_cooked', grams: 250 }, { foodId: 'white_beans_cooked', grams: 120 }, { foodId: 'spinach_raw', grams: 80 }, { foodId: 'tomato_raw', grams: 150 }, { foodId: 'garlic_raw', grams: 5 }, { foodId: 'olive_oil', grams: 12 }],
  },
  {
    id: 'dib_tofu_scramble_mushrooms_pita', nameHe: 'טופו מקושקש עם פטריות, תרד ופיתה', nameEn: 'Tofu Scramble with Mushrooms, Spinach and Pita',
    slots: ['dinner'], prepMinutes: 20,
    ingredients: [{ foodId: 'tofu_firm', grams: 200 }, { foodId: 'mushrooms_raw', grams: 80 }, { foodId: 'spinach_raw', grams: 60 }, { foodId: 'tomato_raw', grams: 100 }, { foodId: 'onion_raw', grams: 60 }, { foodId: 'olive_oil', grams: 8 }, { foodId: 'pita_white', grams: 80 }],
  },
  {
    id: 'dib_pumpkin_lentil_soup_bread', nameHe: 'מרק דלעת ועדשים כתומות עם לחם מלא', nameEn: 'Pumpkin and Red Lentil Soup with Whole Wheat Bread',
    slots: ['dinner', 'lunch'], prepMinutes: 35,
    ingredients: [{ foodId: 'pumpkin_cooked', grams: 250 }, { foodId: 'lentils_red_cooked', grams: 250 }, { foodId: 'onion_raw', grams: 80 }, { foodId: 'carrot_raw', grams: 60 }, { foodId: 'olive_oil', grams: 10 }, { foodId: 'bread_whole_wheat', grams: 60 }],
  },
  {
    id: 'dib_quinoa_stuffed_zucchini', nameHe: 'קישואים ממולאים בקינואה ובקטניות', nameEn: 'Zucchini Boats Stuffed with Quinoa and Chickpeas',
    slots: ['dinner'], prepMinutes: 45,
    ingredients: [{ foodId: 'zucchini_raw', grams: 300 }, { foodId: 'quinoa_cooked', grams: 150 }, { foodId: 'chickpeas_cooked', grams: 100 }, { foodId: 'tomato_raw', grams: 100 }, { foodId: 'onion_raw', grams: 60 }, { foodId: 'olive_oil', grams: 10 }],
  },
  {
    id: 'dib_falafel_quinoa_bowl', nameHe: 'קערת פלאפל עם קינואה וטחינה', nameEn: 'Falafel Quinoa Bowl with Tahini',
    slots: ['dinner', 'lunch'], prepMinutes: 15,
    ingredients: [
      { foodId: 'falafel_baked', grams: 150 }, { foodId: 'quinoa_cooked', grams: 120 }, { foodId: 'tomato_raw', grams: 100 }, { foodId: 'cucumber_raw', grams: 100 }, { foodId: 'tahini_sauce_ready', grams: 30 }, { foodId: 'romaine_lettuce_raw', grams: 50 },
    ],
  },
  /* ------------------------------------------------------- vegetarian */
  {
    id: 'dib_chickpea_shakshuka_feta', nameHe: 'שקשוקה עם גרגרי חומוס ובולגרית', nameEn: 'Shakshuka with Chickpeas and Feta',
    slots: ['dinner', 'breakfast'], prepMinutes: 25,
    ingredients: [
      { foodId: 'egg_whole_raw', grams: 150 }, { foodId: 'tomato_raw', grams: 250 }, { foodId: 'chickpeas_cooked', grams: 100 }, { foodId: 'onion_raw', grams: 80 }, { foodId: 'feta_bulgarian_cheese', grams: 40 }, { foodId: 'olive_oil', grams: 10 },
    ],
  },
  {
    id: 'dib_veggie_omelette_toast', nameHe: 'חביתת פטריות, תרד ופלפל עם לחם מלא', nameEn: 'Mushroom, Spinach and Pepper Omelette with Whole Wheat Toast',
    slots: ['dinner', 'breakfast'], prepMinutes: 15,
    ingredients: [{ foodId: 'egg_whole_raw', grams: 150 }, { foodId: 'mushrooms_raw', grams: 80 }, { foodId: 'spinach_raw', grams: 40 }, { foodId: 'bell_pepper_red_raw', grams: 80 }, { foodId: 'onion_raw', grams: 40 }, { foodId: 'olive_oil', grams: 8 }, { foodId: 'bread_whole_wheat', grams: 90 }],
  },
  {
    id: 'dib_cottage_cheese_veggie_plate', nameHe: 'צלחת קוטג׳ עם ירקות טריים ופיתה מחיטה מלאה', nameEn: 'Cottage Cheese Plate with Fresh Vegetables and Whole Wheat Pita',
    slots: ['dinner', 'lunch'], prepMinutes: 10,
    ingredients: [{ foodId: 'cottage_cheese_5pct', grams: 250 }, { foodId: 'tomato_raw', grams: 150 }, { foodId: 'cucumber_raw', grams: 100 }, { foodId: 'bell_pepper_red_raw', grams: 80 }, { foodId: 'olive_oil', grams: 8 }, { foodId: 'pita_whole_wheat', grams: 80 }],
  },
  {
    id: 'dib_pesto_pasta_mozzarella', nameHe: 'פסטה עם פסטו, עגבניות ומוצרלה', nameEn: 'Pesto Pasta with Tomatoes and Mozzarella',
    slots: ['dinner', 'lunch'], prepMinutes: 20,
    ingredients: [{ foodId: 'pasta_white_cooked', grams: 250 }, { foodId: 'pesto_basil', grams: 30 }, { foodId: 'tomato_raw', grams: 150 }, { foodId: 'mozzarella_cheese', grams: 50 }, { foodId: 'green_peas_cooked', grams: 80 }],
  },
  {
    id: 'dib_tomato_garlic_pasta_parmesan', nameHe: 'פסטה מחיטה מלאה ברוטב עגבניות טריות עם פרמזן', nameEn: 'Whole Wheat Pasta in Fresh Tomato Sauce with Parmesan',
    slots: ['dinner'], prepMinutes: 25,
    ingredients: [{ foodId: 'pasta_whole_wheat_cooked', grams: 250 }, { foodId: 'tomato_raw', grams: 300 }, { foodId: 'garlic_raw', grams: 5 }, { foodId: 'olive_oil', grams: 12 }, { foodId: 'parmesan_cheese', grams: 15 }, { foodId: 'spinach_raw', grams: 50 }],
  },
  {
    id: 'dib_eggplant_feta_bulgur', nameHe: 'חציל צלוי עם גבינה בולגרית ובורגול', nameEn: 'Roasted Eggplant with Feta, Bulgur and Chickpeas',
    slots: ['dinner', 'lunch'], prepMinutes: 35,
    ingredients: [{ foodId: 'eggplant_roasted', grams: 250 }, { foodId: 'bulgur_cooked', grams: 180 }, { foodId: 'feta_bulgarian_cheese', grams: 50 }, { foodId: 'chickpeas_cooked', grams: 80 }, { foodId: 'tomato_raw', grams: 100 }, { foodId: 'olive_oil', grams: 10 }, { foodId: 'parsley_raw', grams: 5 }],
  },
  {
    id: 'dib_bean_cheese_quesadilla', nameHe: 'קסדיות עם שעועית שחורה, גבינה צהובה ואבוקדו', nameEn: 'Black Bean and Cheese Quesadillas with Avocado',
    slots: ['dinner'], prepMinutes: 20,
    ingredients: [{ foodId: 'tortilla_flour', grams: 90 }, { foodId: 'black_beans_cooked', grams: 100 }, { foodId: 'yellow_cheese_gouda_type', grams: 40 }, { foodId: 'bell_pepper_red_raw', grams: 80 }, { foodId: 'corn_kernels_cooked', grams: 60 }, { foodId: 'tomato_raw', grams: 100 }, { foodId: 'avocado_raw', grams: 50 }],
  },
  {
    id: 'dib_lentil_quinoa_yogurt_bowl', nameHe: 'קערת עדשים וקינואה עם יוגורט יווני, ירקות ואגוזי מלך', nameEn: 'Lentil and Quinoa Bowl with Greek Yogurt, Vegetables and Walnuts',
    slots: ['dinner', 'lunch'], prepMinutes: 20,
    ingredients: [{ foodId: 'lentils_green_cooked', grams: 180 }, { foodId: 'quinoa_cooked', grams: 120 }, { foodId: 'yogurt_greek_plain_5pct', grams: 100 }, { foodId: 'cucumber_raw', grams: 100 }, { foodId: 'tomato_raw', grams: 100 }, { foodId: 'olive_oil', grams: 10 }, { foodId: 'walnuts_raw', grams: 15 }],
  },
  {
    id: 'dib_sweet_potato_cottage_beans', nameHe: 'בטטה אפויה במילוי שעועית שחורה וקוטג׳', nameEn: 'Baked Sweet Potato Stuffed with Black Beans and Cottage Cheese',
    slots: ['dinner', 'lunch'], prepMinutes: 45,
    ingredients: [{ foodId: 'sweet_potato_baked', grams: 250 }, { foodId: 'black_beans_cooked', grams: 100 }, { foodId: 'cottage_cheese_5pct', grams: 100 }, { foodId: 'avocado_raw', grams: 50 }, { foodId: 'tomato_raw', grams: 100 }, { foodId: 'olive_oil', grams: 5 }],
  },
  {
    id: 'dib_polenta_mushrooms_mozzarella', nameHe: 'פולנטה עם פטריות מוקפצות, תרד ומוצרלה', nameEn: 'Creamy Polenta with Sauteed Mushrooms, Spinach and Mozzarella',
    slots: ['dinner'], prepMinutes: 30,
    ingredients: [{ foodId: 'polenta_cooked', grams: 300 }, { foodId: 'mushrooms_raw', grams: 150 }, { foodId: 'mozzarella_cheese', grams: 60 }, { foodId: 'spinach_raw', grams: 60 }, { foodId: 'olive_oil', grams: 10 }, { foodId: 'garlic_raw', grams: 3 }],
  },
  {
    id: 'dib_greek_chickpea_feta_salad', nameHe: 'סלט יווני גדול עם קטניות, גבינה בולגרית ולחם מלא', nameEn: 'Greek-Style Chickpea and Feta Salad with Whole Wheat Bread',
    slots: ['dinner', 'lunch'], prepMinutes: 15,
    ingredients: [{ foodId: 'chickpeas_cooked', grams: 150 }, { foodId: 'feta_bulgarian_cheese', grams: 50 }, { foodId: 'cucumber_raw', grams: 150 }, { foodId: 'tomato_raw', grams: 150 }, { foodId: 'romaine_lettuce_raw', grams: 60 }, { foodId: 'olive_oil', grams: 12 }, { foodId: 'bread_whole_wheat', grams: 60 }],
  },
  /* ------------------------------------------------------------- meat */
  {
    id: 'dib_chicken_sweet_potato_green_beans', nameHe: 'חזה עוף עם בטטה אפויה ושעועית ירוקה', nameEn: 'Roasted Chicken Breast with Sweet Potato and Green Beans',
    slots: ['dinner', 'lunch'], prepMinutes: 35,
    ingredients: [{ foodId: 'chicken_breast_cooked', grams: 150 }, { foodId: 'sweet_potato_baked', grams: 200 }, { foodId: 'green_beans_cooked', grams: 130 }, { foodId: 'olive_oil', grams: 10 }],
  },
  {
    id: 'dib_turkey_bolognese_whole_wheat_pasta', nameHe: 'פסטה מחיטה מלאה ברוטב בולונז הודו', nameEn: 'Turkey Bolognese with Whole Wheat Pasta',
    slots: ['dinner'], prepMinutes: 35,
    ingredients: [{ foodId: 'turkey_ground_cooked', grams: 150 }, { foodId: 'pasta_whole_wheat_cooked', grams: 200 }, { foodId: 'tomato_raw', grams: 250 }, { foodId: 'onion_raw', grams: 50 }, { foodId: 'olive_oil', grams: 8 }],
  },
  {
    id: 'dib_chicken_veggie_stir_fry_basmati', nameHe: 'עוף מוקפץ עם ירקות ואורז בסמטי', nameEn: 'Chicken and Vegetable Stir-Fry with Basmati Rice',
    slots: ['dinner', 'lunch'], prepMinutes: 25,
    ingredients: [{ foodId: 'chicken_breast_cooked', grams: 150 }, { foodId: 'basmati_rice_cooked', grams: 180 }, { foodId: 'broccoli_cooked', grams: 100 }, { foodId: 'bell_pepper_red_raw', grams: 100 }, { foodId: 'carrot_raw', grams: 60 }, { foodId: 'soy_sauce', grams: 15 }, { foodId: 'canola_oil', grams: 8 }],
  },
  {
    id: 'dib_beef_potato_mushroom_skillet', nameHe: 'מחבת בקר עם תפוחי אדמה, פטריות וקישואים', nameEn: 'Beef Flank Skillet with Potatoes, Mushrooms and Zucchini',
    slots: ['dinner'], prepMinutes: 30,
    ingredients: [{ foodId: 'beef_flank_cooked', grams: 140 }, { foodId: 'potato_boiled', grams: 200 }, { foodId: 'zucchini_raw', grams: 150 }, { foodId: 'mushrooms_raw', grams: 100 }, { foodId: 'onion_raw', grams: 60 }, { foodId: 'olive_oil', grams: 10 }],
  },
  {
    id: 'dib_chicken_shawarma_style_pita_salad', nameHe: 'פיתה עם ירך עוף בסגנון שווארמה, סלט וטחינה', nameEn: 'Shawarma-Style Chicken Thigh Pita with Salad and Tahini',
    slots: ['dinner', 'lunch'], prepMinutes: 25,
    ingredients: [{ foodId: 'chicken_thigh_cooked', grams: 150 }, { foodId: 'pita_white', grams: 80 }, { foodId: 'romaine_lettuce_raw', grams: 60 }, { foodId: 'tomato_raw', grams: 100 }, { foodId: 'cucumber_raw', grams: 100 }, { foodId: 'tahini_sauce_ready', grams: 25 }],
  },
  {
    id: 'dib_turkey_bean_chili', nameHe: 'צ׳ילי הודו ושעועית אדומה עם תירס', nameEn: 'Turkey and Kidney Bean Chili with Corn',
    slots: ['dinner'], prepMinutes: 40,
    ingredients: [{ foodId: 'turkey_ground_cooked', grams: 130 }, { foodId: 'kidney_beans_cooked', grams: 150 }, { foodId: 'tomato_raw', grams: 250 }, { foodId: 'onion_raw', grams: 80 }, { foodId: 'bell_pepper_red_raw', grams: 80 }, { foodId: 'corn_kernels_cooked', grams: 60 }, { foodId: 'olive_oil', grams: 5 }],
  },
  {
    id: 'dib_chicken_quinoa_roasted_vegetables', nameHe: 'חזה עוף עם קינואה וירקות צלויים', nameEn: 'Chicken Breast with Quinoa and Roasted Vegetables',
    slots: ['dinner', 'lunch'], prepMinutes: 35,
    ingredients: [{ foodId: 'chicken_breast_cooked', grams: 150 }, { foodId: 'quinoa_cooked', grams: 180 }, { foodId: 'zucchini_raw', grams: 100 }, { foodId: 'bell_pepper_red_raw', grams: 100 }, { foodId: 'olive_oil', grams: 10 }],
  },
  {
    id: 'dib_kebab_bulgur_tomato_cucumber', nameHe: 'קבב על הגריל עם בורגול וסלט עגבניות ומלפפון', nameEn: 'Grilled Kebab with Bulgur and Tomato-Cucumber Salad',
    slots: ['dinner'], prepMinutes: 30,
    ingredients: [{ foodId: 'kebab_ground_meat_grilled', grams: 160 }, { foodId: 'bulgur_cooked', grams: 200 }, { foodId: 'tomato_raw', grams: 120 }, { foodId: 'cucumber_raw', grams: 100 }, { foodId: 'parsley_raw', grams: 10 }, { foodId: 'olive_oil', grams: 5 }],
  },
  {
    id: 'dib_chicken_soup_rice_vegetables', nameHe: 'מרק עוף ביתי עם אורז וירקות שורש', nameEn: 'Homemade Chicken Soup with Rice and Root Vegetables',
    slots: ['dinner', 'lunch'], prepMinutes: 45,
    ingredients: [{ foodId: 'chicken_breast_cooked', grams: 130 }, { foodId: 'white_rice_cooked', grams: 120 }, { foodId: 'carrot_raw', grams: 100 }, { foodId: 'potato_boiled', grams: 100 }, { foodId: 'celery_raw', grams: 40 }, { foodId: 'onion_raw', grams: 60 }],
  },
  {
    id: 'dib_beef_burger_whole_wheat_pita', nameHe: 'המבורגר בקר רזה בפיתה מחיטה מלאה עם אבוקדו', nameEn: 'Lean Beef Burger in Whole Wheat Pita with Avocado',
    slots: ['dinner'], prepMinutes: 20,
    ingredients: [{ foodId: 'beef_ground_lean_cooked', grams: 150 }, { foodId: 'pita_whole_wheat', grams: 80 }, { foodId: 'tomato_raw', grams: 100 }, { foodId: 'romaine_lettuce_raw', grams: 40 }, { foodId: 'avocado_raw', grams: 50 }],
  },
];
