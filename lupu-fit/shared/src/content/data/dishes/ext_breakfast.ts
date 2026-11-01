import type { DishRaw } from '../../types.js';

/* Extra breakfasts: vegan, vegetarian, meat and fish options. One adult serving each. */
export const EXT_BREAKFAST_DISHES: DishRaw[] = [
  {
    id: 'xbf_pear_walnut_oat_porridge', nameHe: 'דייסת שיבולת שועל עם אגס, אגוזי מלך וסילאן', nameEn: 'Oat Porridge with Pear, Walnuts and Date Syrup', slots: ['breakfast'],
    ingredients: [
      { foodId: 'rolled_oats_dry', grams: 60 }, { foodId: 'oat_milk_unsweetened', grams: 250 }, { foodId: 'pear_raw', grams: 150 }, { foodId: 'walnuts_raw', grams: 20 }, { foodId: 'date_syrup_silan', grams: 15 },
    ],
    prepMinutes: 10,
  },
  {
    id: 'xbf_tempeh_sweet_potato_bowl', nameHe: 'קערת טמפה עם בטטה אפויה ותרד', nameEn: 'Tempeh Bowl with Baked Sweet Potato and Spinach', slots: ['breakfast'],
    ingredients: [
      { foodId: 'tempeh', grams: 100 }, { foodId: 'sweet_potato_baked', grams: 200 }, { foodId: 'spinach_raw', grams: 60 }, { foodId: 'olive_oil', grams: 10 }, { foodId: 'tomato_raw', grams: 100 },
    ],
    prepMinutes: 20,
  },
  {
    id: 'xbf_peanut_butter_strawberry_toast', nameHe: 'טוסט חמאת בוטנים עם תותים, צ׳יה ומשקה סויה', nameEn: 'Peanut Butter Toast with Strawberries, Chia and Soy Milk', slots: ['breakfast'],
    ingredients: [
      { foodId: 'bread_whole_wheat', grams: 80 }, { foodId: 'peanut_butter', grams: 25 }, { foodId: 'strawberries_raw', grams: 120 }, { foodId: 'chia_seeds', grams: 10 }, { foodId: 'soy_milk_unsweetened', grams: 250 },
    ],
    prepMinutes: 7,
  },
  {
    id: 'xbf_brown_rice_raisin_pudding', nameHe: 'פודינג אורז מלא עם צימוקים וגרעיני דלעת', nameEn: 'Brown Rice Pudding with Raisins and Pumpkin Seeds', slots: ['breakfast'],
    ingredients: [
      { foodId: 'brown_rice_cooked', grams: 180 }, { foodId: 'oat_milk_unsweetened', grams: 200 }, { foodId: 'raisins', grams: 25 }, { foodId: 'pumpkin_seeds_raw', grams: 20 }, { foodId: 'date_syrup_silan', grams: 15 },
    ],
    prepMinutes: 12,
  },
  {
    id: 'xbf_hummus_beet_sourdough_toast', nameHe: 'טוסט שאור עם חומוס, סלק ומלפפון', nameEn: 'Sourdough Toast with Hummus, Beet and Cucumber', slots: ['breakfast'],
    ingredients: [
      { foodId: 'sourdough_bread', grams: 90 }, { foodId: 'hummus_spread', grams: 80 }, { foodId: 'beet_cooked', grams: 100 }, { foodId: 'cucumber_raw', grams: 80 }, { foodId: 'pumpkin_seeds_raw', grams: 15 },
    ],
    prepMinutes: 8,
  },
  {
    id: 'xbf_red_lentil_cabbage_wrap', nameHe: 'טורטייה עם עדשים כתומות, כרוב וגזר ורוטב טחינה', nameEn: 'Red Lentil Wrap with Cabbage, Carrot and Tahini Sauce', slots: ['breakfast'],
    ingredients: [
      { foodId: 'tortilla_flour', grams: 70 }, { foodId: 'lentils_red_cooked', grams: 150 }, { foodId: 'carrot_raw', grams: 60 }, { foodId: 'cabbage_white_raw', grams: 60 }, { foodId: 'tahini_sauce_ready', grams: 30 },
    ],
    prepMinutes: 12,
  },
  {
    id: 'xbf_quinoa_blueberry_soy_bowl', nameHe: 'קערת קינואה חמה עם אוכמניות, משקה סויה וזרעי פשתן', nameEn: 'Warm Quinoa Bowl with Blueberries, Soy Milk and Flaxseed', slots: ['breakfast'],
    ingredients: [
      { foodId: 'quinoa_cooked', grams: 150 }, { foodId: 'soy_milk_unsweetened', grams: 200 }, { foodId: 'blueberries_raw', grams: 100 }, { foodId: 'flaxseed_ground', grams: 15 }, { foodId: 'sunflower_seeds_raw', grams: 15 },
    ],
    prepMinutes: 10,
  },
  {
    id: 'xbf_polenta_mushroom_white_beans', nameHe: 'פולנטה עם פטריות, שעועית לבנה ותרד', nameEn: 'Polenta with Mushrooms, White Beans and Spinach', slots: ['breakfast'],
    ingredients: [
      { foodId: 'polenta_cooked', grams: 250 }, { foodId: 'mushrooms_raw', grams: 120 }, { foodId: 'white_beans_cooked', grams: 120 }, { foodId: 'spinach_raw', grams: 50 }, { foodId: 'olive_oil', grams: 10 },
    ],
    prepMinutes: 20,
  },
  {
    id: 'xbf_sweet_potato_almond_butter_banana', nameHe: 'בטטה אפויה עם חמאת שקדים, בננה וצ׳יה', nameEn: 'Baked Sweet Potato with Almond Butter, Banana and Chia', slots: ['breakfast'],
    ingredients: [
      { foodId: 'sweet_potato_baked', grams: 200 }, { foodId: 'almond_butter', grams: 25 }, { foodId: 'banana_raw', grams: 100 }, { foodId: 'chia_seeds', grams: 10 },
    ],
    prepMinutes: 8,
  },
  {
    id: 'xbf_pea_avocado_whole_wheat_pita', nameHe: 'פיתה מחיטה מלאה עם מחית אפונה ואבוקדו', nameEn: 'Whole Wheat Pita with Smashed Pea and Avocado', slots: ['breakfast'],
    ingredients: [
      { foodId: 'pita_whole_wheat', grams: 80 }, { foodId: 'green_peas_cooked', grams: 100 }, { foodId: 'avocado_raw', grams: 80 }, { foodId: 'lemon_juice', grams: 10 }, { foodId: 'tomato_raw', grams: 100 },
    ],
    prepMinutes: 10,
  },
  {
    id: 'xbf_soy_yogurt_berry_oat_bowl', nameHe: 'קערת שיבולת שועל על בסיס סויה עם אוכמניות, בננה ופשתן', nameEn: 'Plant-Based Oat Bowl with Blueberries, Banana and Flaxseed', slots: ['breakfast'],
    ingredients: [
      { foodId: 'soy_yogurt_plain', grams: 200 }, { foodId: 'blueberries_raw', grams: 100 }, { foodId: 'banana_raw', grams: 100 }, { foodId: 'rolled_oats_dry', grams: 40 }, { foodId: 'flaxseed_ground', grams: 15 },
    ],
    prepMinutes: 5,
  },
  {
    id: 'xbf_bulgur_apricot_pistachio_porridge', nameHe: 'דייסת בורגול עם משמש מיובש ופיסטוקים', nameEn: 'Bulgur Porridge with Dried Apricots and Pistachios', slots: ['breakfast'],
    ingredients: [
      { foodId: 'bulgur_cooked', grams: 180 }, { foodId: 'oat_milk_unsweetened', grams: 150 }, { foodId: 'apricots_dried', grams: 40 }, { foodId: 'pistachios_shelled_raw', grams: 20 }, { foodId: 'date_syrup_silan', grams: 10 },
    ],
    prepMinutes: 15,
  },
  {
    id: 'xbf_edamame_brown_rice_bowl', nameHe: 'קערת אורז מלא עם אדממה, מלפפון, גזר ושומשום', nameEn: 'Brown Rice Bowl with Edamame, Cucumber, Carrot and Sesame', slots: ['breakfast'],
    ingredients: [
      { foodId: 'brown_rice_cooked', grams: 180 }, { foodId: 'edamame_shelled_cooked', grams: 100 }, { foodId: 'cucumber_raw', grams: 80 }, { foodId: 'carrot_raw', grams: 60 }, { foodId: 'sesame_seeds', grams: 10 }, { foodId: 'olive_oil', grams: 5 },
    ],
    prepMinutes: 12,
  },
  {
    id: 'xbf_poached_eggs_beet_labneh', nameHe: 'ביצים עלומות עם סלק ולאבנה על לחם שאור', nameEn: 'Poached Eggs with Beet and Labneh on Sourdough', slots: ['breakfast'],
    ingredients: [
      { foodId: 'egg_whole_raw', grams: 120 }, { foodId: 'labneh_full_fat', grams: 60 }, { foodId: 'beet_cooked', grams: 120 }, { foodId: 'sourdough_bread', grams: 60 }, { foodId: 'parsley_raw', grams: 5 },
    ],
    prepMinutes: 15,
  },
  {
    id: 'xbf_spanish_potato_onion_omelet', nameHe: 'חביתת תפוחי אדמה ובצל בסגנון ספרדי', nameEn: 'Spanish-Style Potato and Onion Omelet', slots: ['breakfast'],
    ingredients: [
      { foodId: 'egg_whole_raw', grams: 150 }, { foodId: 'potato_boiled', grams: 250 }, { foodId: 'onion_raw', grams: 60 }, { foodId: 'olive_oil', grams: 12 }, { foodId: 'parsley_raw', grams: 10 },
    ],
    prepMinutes: 25,
  },
  {
    id: 'xbf_mushroom_parmesan_scramble_toast', nameHe: 'ביצים מקושקשות עם פטריות ופרמזן על לחם לבן', nameEn: 'Mushroom and Parmesan Scramble on White Toast', slots: ['breakfast'],
    ingredients: [
      { foodId: 'egg_whole_raw', grams: 150 }, { foodId: 'mushrooms_raw', grams: 150 }, { foodId: 'bread_white', grams: 70 }, { foodId: 'parmesan_cheese', grams: 15 }, { foodId: 'butter_regular', grams: 8 },
    ],
    prepMinutes: 12,
  },
  {
    id: 'xbf_kale_sweet_potato_egg_bake', nameHe: 'אפיית ביצים עם קייל, בטטה וגבינה בולגרית', nameEn: 'Kale and Sweet Potato Egg Bake with Feta', slots: ['breakfast'],
    ingredients: [
      { foodId: 'egg_whole_raw', grams: 150 }, { foodId: 'kale_raw', grams: 80 }, { foodId: 'sweet_potato_baked', grams: 200 }, { foodId: 'feta_bulgarian_cheese', grams: 30 }, { foodId: 'olive_oil', grams: 8 },
    ],
    prepMinutes: 30,
  },
  {
    id: 'xbf_mexican_fried_eggs_black_beans', nameHe: 'ביצי עין על טורטייה עם שעועית שחורה ואבוקדו', nameEn: 'Mexican-Style Fried Eggs on Tortilla with Black Beans and Avocado', slots: ['breakfast'],
    ingredients: [
      { foodId: 'egg_whole_raw', grams: 100 }, { foodId: 'black_beans_cooked', grams: 120 }, { foodId: 'tortilla_flour', grams: 60 }, { foodId: 'tomato_raw', grams: 120 }, { foodId: 'avocado_raw', grams: 50 },
    ],
    prepMinutes: 15,
  },
  {
    id: 'xbf_cauliflower_egg_tahini_pita', nameHe: 'ביצים מקושקשות עם כרובית וטחינה בפיתה', nameEn: 'Scrambled Eggs with Cauliflower and Tahini in Pita', slots: ['breakfast'],
    ingredients: [
      { foodId: 'egg_whole_raw', grams: 150 }, { foodId: 'cauliflower_cooked', grams: 200 }, { foodId: 'tahini_raw', grams: 20 }, { foodId: 'pita_white', grams: 60 }, { foodId: 'tomato_raw', grams: 100 },
    ],
    prepMinutes: 15,
  },
  {
    id: 'xbf_cottage_peach_whole_wheat_toast', nameHe: 'טוסט מחיטה מלאה עם קוטג׳, אפרסק, דבש וגרעיני חמניות', nameEn: 'Whole Wheat Toast with Cottage Cheese, Peach, Honey and Sunflower Seeds', slots: ['breakfast'],
    ingredients: [
      { foodId: 'bread_whole_wheat', grams: 80 }, { foodId: 'cottage_cheese_5pct', grams: 120 }, { foodId: 'peach_raw', grams: 150 }, { foodId: 'honey', grams: 10 }, { foodId: 'sunflower_seeds_raw', grams: 15 },
    ],
    prepMinutes: 7,
  },
  {
    id: 'xbf_kefir_apple_hazelnut_bircher', nameHe: 'ברכר עם קפיר, תפוח עץ ואגוזי לוז', nameEn: 'Kefir Bircher Muesli with Apple and Hazelnuts', slots: ['breakfast'],
    ingredients: [
      { foodId: 'rolled_oats_dry', grams: 50 }, { foodId: 'kefir_plain', grams: 200 }, { foodId: 'apple_raw', grams: 150 }, { foodId: 'hazelnuts_raw', grams: 15 }, { foodId: 'raisins', grams: 20 },
    ],
    prepMinutes: 8,
  },
  {
    id: 'xbf_cream_cheese_strawberry_bagel', nameHe: 'בייגל עם גבינת שמנת, תותים ודבש', nameEn: 'Bagel with Cream Cheese, Strawberries and Honey', slots: ['breakfast'],
    ingredients: [
      { foodId: 'bagel_plain', grams: 100 }, { foodId: 'cream_cheese_regular', grams: 40 }, { foodId: 'strawberries_raw', grams: 100 }, { foodId: 'honey', grams: 10 },
    ],
    prepMinutes: 6,
  },
  {
    id: 'xbf_labneh_pomegranate_pita', nameHe: 'פיתה עם לאבנה, רימון, גרעיני דלעת ומלפפון', nameEn: 'Pita with Labneh, Pomegranate, Pumpkin Seeds and Cucumber', slots: ['breakfast'],
    ingredients: [
      { foodId: 'labneh_full_fat', grams: 80 }, { foodId: 'pomegranate_seeds', grams: 60 }, { foodId: 'pumpkin_seeds_raw', grams: 15 }, { foodId: 'pita_white', grams: 80 }, { foodId: 'olive_oil', grams: 8 }, { foodId: 'cucumber_raw', grams: 80 },
    ],
    prepMinutes: 8,
  },
  {
    id: 'xbf_skyr_mango_oat_parfait', nameHe: 'פרפה סקיר עם מנגו, שיבולת שועל וצ׳יה', nameEn: 'Skyr Parfait with Mango, Oats and Chia', slots: ['breakfast'],
    ingredients: [
      { foodId: 'skyr_plain', grams: 200 }, { foodId: 'mango_raw', grams: 120 }, { foodId: 'rolled_oats_dry', grams: 40 }, { foodId: 'chia_seeds', grams: 10 },
    ],
    prepMinutes: 6,
  },
  {
    id: 'xbf_greek_yogurt_pear_hazelnut', nameHe: 'יוגורט יווני עם אגס, אגוזי לוז ודבש', nameEn: 'Greek Yogurt with Pear, Hazelnuts and Honey', slots: ['breakfast'],
    ingredients: [
      { foodId: 'yogurt_greek_plain_5pct', grams: 200 }, { foodId: 'pear_raw', grams: 150 }, { foodId: 'hazelnuts_raw', grams: 20 }, { foodId: 'honey', grams: 15 },
    ],
    prepMinutes: 5,
  },
  {
    id: 'xbf_mozzarella_pita_pizza', nameHe: 'פיצה בפיתה מחיטה מלאה עם מוצרלה, עגבנייה ותרד', nameEn: 'Whole Wheat Pita Pizza with Mozzarella, Tomato and Spinach', slots: ['breakfast'],
    ingredients: [
      { foodId: 'pita_whole_wheat', grams: 90 }, { foodId: 'mozzarella_cheese', grams: 50 }, { foodId: 'tomato_raw', grams: 150 }, { foodId: 'spinach_raw', grams: 40 }, { foodId: 'olive_oil', grams: 8 },
    ],
    prepMinutes: 15,
  },
  {
    id: 'xbf_feta_spinach_egg_wrap', nameHe: 'טורטייה עם ביצה, גבינה בולגרית ותרד', nameEn: 'Egg, Feta and Spinach Tortilla Wrap', slots: ['breakfast'],
    ingredients: [
      { foodId: 'tortilla_flour', grams: 70 }, { foodId: 'egg_whole_raw', grams: 100 }, { foodId: 'feta_bulgarian_cheese', grams: 30 }, { foodId: 'spinach_raw', grams: 50 }, { foodId: 'tomato_raw', grams: 80 },
    ],
    prepMinutes: 12,
  },
  {
    id: 'xbf_milk_rice_peach_raisins', nameHe: 'אורז בחלב עם אפרסק, דבש וצימוקים', nameEn: 'Milk Rice with Peach, Honey and Raisins', slots: ['breakfast'],
    ingredients: [
      { foodId: 'white_rice_cooked', grams: 180 }, { foodId: 'milk_3pct', grams: 250 }, { foodId: 'peach_raw', grams: 150 }, { foodId: 'honey', grams: 10 }, { foodId: 'raisins', grams: 20 },
    ],
    prepMinutes: 15,
  },
  {
    id: 'xbf_apple_whey_oat_bake', nameHe: 'אפיית שיבולת שועל עם תפוח עץ, ביצה ואבקת חלבון', nameEn: 'Protein Oat Bake with Apple and Egg', slots: ['breakfast'],
    ingredients: [
      { foodId: 'rolled_oats_dry', grams: 50 }, { foodId: 'egg_whole_raw', grams: 50 }, { foodId: 'apple_raw', grams: 150 }, { foodId: 'whey_protein_powder', grams: 25 }, { foodId: 'milk_1pct', grams: 150 },
    ],
    prepMinutes: 25,
  },
  {
    id: 'xbf_casein_banana_chia_pudding', nameHe: 'פודינג קזאין עם בננה, זרעי דלעת וצ׳יה', nameEn: 'Casein Pudding with Banana, Pumpkin Seeds and Chia', slots: ['breakfast'],
    ingredients: [
      { foodId: 'casein_protein_powder', grams: 30 }, { foodId: 'milk_3pct', grams: 250 }, { foodId: 'banana_raw', grams: 120 }, { foodId: 'pumpkin_seeds_raw', grams: 15 }, { foodId: 'chia_seeds', grams: 10 },
    ],
    prepMinutes: 5,
  },
  {
    id: 'xbf_turkey_patties_sweet_potato', nameHe: 'קציצות הודו עם בטטה, פלפל ותרד', nameEn: 'Turkey Patties with Sweet Potato, Pepper and Spinach', slots: ['breakfast'],
    ingredients: [
      { foodId: 'turkey_ground_cooked', grams: 120 }, { foodId: 'sweet_potato_baked', grams: 200 }, { foodId: 'bell_pepper_red_raw', grams: 100 }, { foodId: 'spinach_raw', grams: 50 }, { foodId: 'olive_oil', grams: 10 },
    ],
    prepMinutes: 25,
  },
  {
    id: 'xbf_chicken_rice_porridge', nameHe: 'דייסת אורז מלוחה עם עוף, תרד וביצה קשה', nameEn: 'Savory Rice Porridge with Chicken, Spinach and Hard-Boiled Egg', slots: ['breakfast'],
    ingredients: [
      { foodId: 'white_rice_cooked', grams: 200 }, { foodId: 'chicken_breast_cooked', grams: 80 }, { foodId: 'spinach_raw', grams: 60 }, { foodId: 'egg_boiled_hard', grams: 50 }, { foodId: 'carrot_raw', grams: 50 },
    ],
    prepMinutes: 20,
  },
  {
    id: 'xbf_beef_black_bean_tacos', nameHe: 'טאקו בשר טחון עם שעועית שחורה ואבוקדו', nameEn: 'Beef and Black Bean Breakfast Tacos with Avocado', slots: ['breakfast'],
    ingredients: [
      { foodId: 'tortilla_flour', grams: 70 }, { foodId: 'beef_ground_lean_cooked', grams: 70 }, { foodId: 'black_beans_cooked', grams: 80 }, { foodId: 'tomato_raw', grams: 100 }, { foodId: 'avocado_raw', grams: 50 },
    ],
    prepMinutes: 15,
  },
  {
    id: 'xbf_turkey_egg_tomato_bagel', nameHe: 'בייגל עם פסטרמת הודו, ביצה ועגבנייה', nameEn: 'Bagel with Turkey Deli, Egg and Tomato', slots: ['breakfast'],
    ingredients: [
      { foodId: 'bagel_plain', grams: 100 }, { foodId: 'turkey_deli_slices', grams: 50 }, { foodId: 'egg_whole_raw', grams: 100 }, { foodId: 'tomato_raw', grams: 80 }, { foodId: 'romaine_lettuce_raw', grams: 30 },
    ],
    prepMinutes: 10,
  },
  {
    id: 'xbf_lamb_egg_parsley_pita', nameHe: 'פיתה עם כבש טחון, ביצה ופטרוזיליה', nameEn: 'Pita with Ground Lamb, Egg and Parsley', slots: ['breakfast'],
    ingredients: [
      { foodId: 'lamb_ground_cooked', grams: 70 }, { foodId: 'pita_white', grams: 80 }, { foodId: 'egg_whole_raw', grams: 100 }, { foodId: 'tomato_raw', grams: 100 }, { foodId: 'parsley_raw', grams: 10 },
    ],
    prepMinutes: 15,
  },
  {
    id: 'xbf_turkey_quinoa_kale_egg_bowl', nameHe: 'קערת קינואה עם הודו, קייל וביצה', nameEn: 'Quinoa Bowl with Turkey, Kale and Egg', slots: ['breakfast'],
    ingredients: [
      { foodId: 'quinoa_cooked', grams: 150 }, { foodId: 'turkey_breast_cooked', grams: 80 }, { foodId: 'kale_raw', grams: 60 }, { foodId: 'egg_whole_raw', grams: 50 }, { foodId: 'olive_oil', grams: 8 },
    ],
    prepMinutes: 15,
  },
  {
    id: 'xbf_smoked_salmon_omelet_roll', nameHe: 'רול חביתה עם סלמון מעושן, גבינת שמנת ומלפפון', nameEn: 'Omelet Roll with Smoked Salmon, Cream Cheese and Cucumber', slots: ['breakfast'],
    ingredients: [
      { foodId: 'egg_whole_raw', grams: 150 }, { foodId: 'salmon_smoked', grams: 50 }, { foodId: 'cream_cheese_regular', grams: 25 }, { foodId: 'cucumber_raw', grams: 100 }, { foodId: 'potato_boiled', grams: 150 },
    ],
    prepMinutes: 15,
  },
  {
    id: 'xbf_tuna_white_bean_toast', nameHe: 'טוסט מחיטה מלאה עם סלט טונה ושעועית לבנה', nameEn: 'Whole Wheat Toast with Tuna and White Bean Salad', slots: ['breakfast'],
    ingredients: [
      { foodId: 'tuna_canned_water', grams: 80 }, { foodId: 'white_beans_cooked', grams: 120 }, { foodId: 'bread_whole_wheat', grams: 80 }, { foodId: 'tomato_raw', grams: 100 }, { foodId: 'parsley_raw', grams: 10 }, { foodId: 'olive_oil', grams: 8 },
    ],
    prepMinutes: 10,
  },
  {
    id: 'xbf_mackerel_sourdough_cucumber', nameHe: 'לחם שאור עם מקרל אפוי, מלפפון ובצל', nameEn: 'Sourdough with Baked Mackerel, Cucumber and Onion', slots: ['breakfast'],
    ingredients: [
      { foodId: 'mackerel_cooked', grams: 80 }, { foodId: 'sourdough_bread', grams: 90 }, { foodId: 'cucumber_raw', grams: 100 }, { foodId: 'onion_raw', grams: 30 }, { foodId: 'mustard_prepared', grams: 10 },
    ],
    prepMinutes: 8,
  },
  {
    id: 'xbf_salmon_sweet_potato_hash', nameHe: 'האש בטטה עם סלמון אפוי, ביצה ותרד', nameEn: 'Sweet Potato Hash with Baked Salmon, Egg and Spinach', slots: ['breakfast'],
    ingredients: [
      { foodId: 'salmon_cooked', grams: 100 }, { foodId: 'sweet_potato_baked', grams: 200 }, { foodId: 'egg_whole_raw', grams: 50 }, { foodId: 'spinach_raw', grams: 60 }, { foodId: 'olive_oil', grams: 8 },
    ],
    prepMinutes: 25,
  },
];
