import type { MealTemplateSeed } from '@shared/content';

/**
 * Practical, balanced meal ideas used by the nutrition suggestion engine.
 * Every item references a FoodSeed slug; grams are as eaten. Nutrition, diet
 * suitability and allergens are derived from the referenced foods at runtime.
 */
export const MEAL_TEMPLATES: MealTemplateSeed[] = [
  // ───────────────────────────── Breakfast ─────────────────────────────
  {
    slug: 'israeli_breakfast',
    name: { he: 'ארוחת בוקר ישראלית', en: 'Israeli breakfast' },
    description: {
      he: 'חביתה, סלט ישראלי קצוץ, גבינה לבנה ולחם מלא – הקלאסיקה של הבוקר הישראלי.',
      en: 'Omelette, chopped Israeli salad, white cheese and whole-wheat bread – the classic Israeli morning plate.',
    },
    mealTypes: ['breakfast'],
    items: [
      { foodSlug: 'omelette_plain', grams: 120 },
      { foodSlug: 'israeli_salad_olive_oil', grams: 200 },
      { foodSlug: 'white_cheese_5pct', grams: 60 },
      { foodSlug: 'bread_whole_wheat', grams: 80 },
      { foodSlug: 'olives_green_in_brine', grams: 20 },
    ],
    prepMinutes: 15,
  },
  {
    slug: 'shakshuka_with_bread',
    name: { he: 'שקשוקה עם פיתה וגבינה בולגרית', en: 'Shakshuka with pita and feta' },
    description: {
      he: 'ביצים ברוטב עגבניות ופלפלים, לצד פיתה מלאה וקצת גבינה בולגרית.',
      en: 'Eggs poached in tomato-pepper sauce with whole-wheat pita and a little feta-style cheese.',
    },
    mealTypes: ['breakfast', 'dinner'],
    items: [
      { foodSlug: 'shakshuka', grams: 350 },
      { foodSlug: 'pita_whole_wheat', grams: 70 },
      { foodSlug: 'bulgarian_cheese_5pct', grams: 40 },
    ],
    prepMinutes: 25,
  },
  {
    slug: 'cottage_veg_toast',
    name: { he: 'קוטג׳ וירקות עם לחם מלא', en: 'Cottage cheese, veggies and toast' },
    description: {
      he: 'קוטג׳ עשיר בחלבון עם עגבנייה ומלפפון חתוכים ופרוסות לחם מלא.',
      en: 'Protein-rich cottage cheese with sliced tomato and cucumber and whole-wheat toast.',
    },
    mealTypes: ['breakfast', 'dinner'],
    items: [
      { foodSlug: 'cottage_cheese_5pct', grams: 250 },
      { foodSlug: 'bread_whole_wheat', grams: 80 },
      { foodSlug: 'tomato', grams: 100 },
      { foodSlug: 'cucumber', grams: 100 },
    ],
    prepMinutes: 5,
  },
  {
    slug: 'oatmeal_berries_peanut_butter',
    name: { he: 'דייסת שיבולת שועל עם פירות יער וחמאת בוטנים', en: 'Oatmeal with berries and peanut butter' },
    description: {
      he: 'דייסה חמה על משקה סויה עם בננה, אוכמניות וכף חמאת בוטנים.',
      en: 'Warm oats cooked in soy drink, topped with banana, blueberries and a spoon of peanut butter.',
    },
    mealTypes: ['breakfast'],
    items: [
      { foodSlug: 'oats_rolled_dry', grams: 70 },
      { foodSlug: 'soy_milk_unsweetened', grams: 250 },
      { foodSlug: 'blueberries', grams: 100 },
      { foodSlug: 'banana', grams: 60 },
      { foodSlug: 'peanut_butter_natural', grams: 20 },
    ],
    prepMinutes: 10,
  },
  {
    slug: 'greek_yogurt_granola_bowl',
    name: { he: 'קערת יוגורט יווני וגרנולה', en: 'Greek yogurt granola bowl' },
    description: {
      he: 'יוגורט יווני עם גרנולה פריכה, תותים וטיפת דבש.',
      en: 'Greek yogurt with crunchy granola, strawberries and a drizzle of honey.',
    },
    mealTypes: ['breakfast'],
    items: [
      { foodSlug: 'greek_yogurt_plain_2pct', grams: 250 },
      { foodSlug: 'granola_with_nuts', grams: 50 },
      { foodSlug: 'strawberries', grams: 100 },
      { foodSlug: 'honey', grams: 10 },
    ],
    prepMinutes: 3,
  },
  {
    slug: 'tofu_scramble_tortillas',
    name: { he: 'טופו מקושקש עם טורטיות תירס', en: 'Tofu scramble with corn tortillas' },
    description: {
      he: 'טופו מוקפץ עם תרד ועגבניות שרי, מוגש בטורטיות תירס – טבעוני ועשיר בחלבון.',
      en: 'Tofu sautéed with spinach and cherry tomatoes, served in corn tortillas – vegan and protein-packed.',
    },
    mealTypes: ['breakfast', 'dinner'],
    items: [
      { foodSlug: 'tofu_firm', grams: 200 },
      { foodSlug: 'spinach_raw', grams: 60 },
      { foodSlug: 'cherry_tomatoes', grams: 100 },
      { foodSlug: 'olive_oil', grams: 10 },
      { foodSlug: 'tortilla_corn', grams: 60 },
    ],
    prepMinutes: 15,
  },
  {
    slug: 'avocado_egg_toast',
    name: { he: 'טוסט אבוקדו וביצה', en: 'Avocado and egg toast' },
    description: {
      he: 'לחם מלא עם אבוקדו מעוך, ביצים קשות ועגבניות שרי.',
      en: 'Whole-wheat toast with mashed avocado, hard-boiled eggs and cherry tomatoes.',
    },
    mealTypes: ['breakfast'],
    items: [
      { foodSlug: 'bread_whole_wheat', grams: 80 },
      { foodSlug: 'avocado', grams: 70 },
      { foodSlug: 'egg_hard_boiled', grams: 100 },
      { foodSlug: 'cherry_tomatoes', grams: 80 },
    ],
    prepMinutes: 12,
  },
  {
    slug: 'smoked_salmon_bagel',
    name: { he: 'בייגל סלמון מעושן', en: 'Smoked salmon bagel' },
    description: {
      he: 'בייגל עם גבינת שמנת, סלמון מעושן ופרוסות מלפפון.',
      en: 'Bagel with cream cheese, smoked salmon and cucumber slices.',
    },
    mealTypes: ['breakfast', 'lunch'],
    items: [
      { foodSlug: 'bagel_plain', grams: 100 },
      { foodSlug: 'cream_cheese_full_fat', grams: 30 },
      { foodSlug: 'smoked_salmon', grams: 70 },
      { foodSlug: 'cucumber', grams: 50 },
    ],
    prepMinutes: 5,
  },
  {
    slug: 'chia_pudding_mango',
    name: { he: 'פודינג צ׳יה עם מנגו ושקדים', en: 'Chia pudding with mango and almonds' },
    description: {
      he: 'זרעי צ׳יה שהושרו במשקה סויה, עם קוביות מנגו ושקדים – אפשר להכין מהערב.',
      en: 'Chia seeds soaked in soy drink, topped with mango and almonds – easy to prep the night before.',
    },
    mealTypes: ['breakfast'],
    items: [
      { foodSlug: 'chia_seeds', grams: 30 },
      { foodSlug: 'soy_milk_unsweetened', grams: 250 },
      { foodSlug: 'mango', grams: 150 },
      { foodSlug: 'almonds_raw', grams: 20 },
    ],
    prepMinutes: 5,
  },

  // ─────────────────────────────── Lunch ───────────────────────────────
  {
    slug: 'hummus_plate',
    name: { he: 'צלחת חומוס', en: 'Hummus plate' },
    description: {
      he: 'חומוס עם גרגרים חמים, פיתה מלאה וסלט ישראלי בצד.',
      en: 'Hummus topped with warm chickpeas, served with whole-wheat pita and Israeli salad.',
    },
    mealTypes: ['lunch'],
    items: [
      { foodSlug: 'hummus', grams: 150 },
      { foodSlug: 'chickpeas_cooked', grams: 80 },
      { foodSlug: 'pita_whole_wheat', grams: 70 },
      { foodSlug: 'israeli_salad_olive_oil', grams: 150 },
    ],
    prepMinutes: 10,
  },
  {
    slug: 'chicken_rice_broccoli_bowl',
    name: { he: 'קערת עוף, אורז וברוקולי', en: 'Chicken, rice and broccoli bowl' },
    description: {
      he: 'חזה עוף בגריל עם אורז בסמטי וברוקולי מאודה – ארוחת חלבון קלאסית.',
      en: 'Grilled chicken breast with basmati rice and steamed broccoli – a classic high-protein meal.',
    },
    mealTypes: ['lunch', 'dinner'],
    items: [
      { foodSlug: 'chicken_breast_cooked', grams: 150 },
      { foodSlug: 'rice_basmati_cooked', grams: 200 },
      { foodSlug: 'broccoli_cooked', grams: 150 },
      { foodSlug: 'olive_oil', grams: 10 },
    ],
    prepMinutes: 25,
  },
  {
    slug: 'tuna_quinoa_salad',
    name: { he: 'סלט קינואה וטונה', en: 'Tuna quinoa salad' },
    description: {
      he: 'קינואה עם טונה, עגבניות שרי ומלפפון בתיבול שמן זית ולימון.',
      en: 'Quinoa with tuna, cherry tomatoes and cucumber dressed in olive oil and lemon.',
    },
    mealTypes: ['lunch'],
    items: [
      { foodSlug: 'tuna_canned_water_drained', grams: 120 },
      { foodSlug: 'quinoa_cooked', grams: 180 },
      { foodSlug: 'cherry_tomatoes', grams: 100 },
      { foodSlug: 'cucumber', grams: 100 },
      { foodSlug: 'olive_oil', grams: 10 },
      { foodSlug: 'lemon_juice_fresh', grams: 15 },
    ],
    prepMinutes: 15,
  },
  {
    slug: 'falafel_pita',
    name: { he: 'פלאפל בפיתה', en: 'Falafel in pita' },
    description: {
      he: 'כדורי פלאפל בפיתה עם סלט קצוץ וטחינה – אוכל רחוב ישראלי טבעוני.',
      en: 'Falafel balls in pita with chopped salad and tahini – vegan Israeli street food.',
    },
    mealTypes: ['lunch'],
    items: [
      { foodSlug: 'falafel_balls_fried', grams: 100 },
      { foodSlug: 'pita_white', grams: 90 },
      { foodSlug: 'tahini_sauce_prepared', grams: 30 },
      { foodSlug: 'israeli_salad_olive_oil', grams: 120 },
    ],
    prepMinutes: 10,
  },
  {
    slug: 'majadra_yogurt_salad',
    name: { he: 'מג׳דרה עם יוגורט וסלט', en: 'Majadra with yogurt and salad' },
    description: {
      he: 'אורז ועדשים עם בצל מטוגן, לצד יוגורט וסלט ירקות טרי.',
      en: 'Rice and lentils with fried onions, served with yogurt and fresh salad.',
    },
    mealTypes: ['lunch', 'dinner'],
    items: [
      { foodSlug: 'majadra', grams: 300 },
      { foodSlug: 'yogurt_plain_3pct', grams: 150 },
      { foodSlug: 'israeli_salad_olive_oil', grams: 150 },
    ],
    prepMinutes: 40,
  },
  {
    slug: 'lentil_soup_bread_hummus',
    name: { he: 'מרק עדשים עם לחם וחומוס', en: 'Lentil soup with bread and hummus' },
    description: {
      he: 'קערה גדולה של מרק עדשים ביתי עם לחם מלא מרוח בחומוס.',
      en: 'A big bowl of homemade lentil soup with whole-wheat bread spread with hummus.',
    },
    mealTypes: ['lunch', 'dinner'],
    items: [
      { foodSlug: 'lentil_soup', grams: 450 },
      { foodSlug: 'bread_whole_wheat', grams: 80 },
      { foodSlug: 'hummus', grams: 40 },
    ],
    prepMinutes: 45,
  },
  {
    slug: 'turkey_avocado_sandwich',
    name: { he: 'כריך הודו ואבוקדו', en: 'Turkey and avocado sandwich' },
    description: {
      he: 'לחם מלא עם פסטרמה הודו, אבוקדו, עגבנייה, חסה וחרדל.',
      en: 'Whole-wheat bread with turkey breast slices, avocado, tomato, lettuce and mustard.',
    },
    mealTypes: ['lunch'],
    items: [
      { foodSlug: 'bread_whole_wheat', grams: 100 },
      { foodSlug: 'turkey_breast_deli_sliced', grams: 100 },
      { foodSlug: 'avocado', grams: 50 },
      { foodSlug: 'tomato', grams: 60 },
      { foodSlug: 'romaine_lettuce', grams: 30 },
      { foodSlug: 'mustard_yellow', grams: 10 },
    ],
    prepMinutes: 5,
  },
  {
    slug: 'chickpea_sweet_potato_buddha_bowl',
    name: { he: 'קערת בודהה עם חומוס גרגרים ובטטה', en: 'Chickpea and sweet potato Buddha bowl' },
    description: {
      he: 'קינואה, בטטה אפויה, גרגרי חומוס וקייל ברוטב טחינה.',
      en: 'Quinoa, roasted sweet potato, chickpeas and kale with tahini sauce.',
    },
    mealTypes: ['lunch', 'dinner'],
    items: [
      { foodSlug: 'quinoa_cooked', grams: 200 },
      { foodSlug: 'chickpeas_cooked', grams: 100 },
      { foodSlug: 'sweet_potato_baked', grams: 150 },
      { foodSlug: 'kale_raw', grams: 50 },
      { foodSlug: 'tahini_sauce_prepared', grams: 30 },
    ],
    prepMinutes: 35,
  },
  {
    slug: 'black_bean_burrito_bowl',
    name: { he: 'קערת בוריטו שעועית שחורה', en: 'Black bean burrito bowl' },
    description: {
      he: 'אורז מלא, שעועית שחורה, תירס, אבוקדו ועגבנייה – טבעוני וללא גלוטן.',
      en: 'Brown rice, black beans, corn, avocado and tomato – vegan and gluten-free.',
    },
    mealTypes: ['lunch', 'dinner'],
    items: [
      { foodSlug: 'rice_brown_cooked', grams: 180 },
      { foodSlug: 'black_beans_cooked', grams: 150 },
      { foodSlug: 'sweet_corn_kernels_cooked', grams: 80 },
      { foodSlug: 'avocado', grams: 60 },
      { foodSlug: 'tomato', grams: 100 },
    ],
    prepMinutes: 20,
  },
  {
    slug: 'chicken_thigh_couscous',
    name: { he: 'פרגית בתנור עם קוסקוס וירקות', en: 'Roast chicken thigh with couscous and vegetables' },
    description: {
      he: 'פרגיות צלויות לצד קוסקוס וקישואים וגזר אפויים.',
      en: 'Roasted boneless chicken thighs with couscous, baked zucchini and carrots.',
    },
    mealTypes: ['lunch', 'dinner'],
    items: [
      { foodSlug: 'chicken_thigh_cooked', grams: 150 },
      { foodSlug: 'couscous_cooked', grams: 200 },
      { foodSlug: 'zucchini_raw', grams: 150 },
      { foodSlug: 'carrot_raw', grams: 100 },
      { foodSlug: 'olive_oil', grams: 5 },
    ],
    prepMinutes: 40,
  },

  // ─────────────────────────────── Dinner ──────────────────────────────
  {
    slug: 'salmon_sweet_potato_green_beans',
    name: { he: 'סלמון עם בטטה ושעועית ירוקה', en: 'Salmon with sweet potato and green beans' },
    description: {
      he: 'פילה סלמון אפוי עם בטטה בתנור ושעועית ירוקה מאודה.',
      en: 'Baked salmon fillet with oven-roasted sweet potato and steamed green beans.',
    },
    mealTypes: ['dinner', 'lunch'],
    items: [
      { foodSlug: 'salmon_cooked', grams: 150 },
      { foodSlug: 'sweet_potato_baked', grams: 200 },
      { foodSlug: 'green_beans_cooked', grams: 150 },
      { foodSlug: 'olive_oil', grams: 5 },
    ],
    prepMinutes: 30,
  },
  {
    slug: 'beef_kebab_bulgur_tahini',
    name: { he: 'קבב בקר עם בורגול וטחינה', en: 'Beef kebab with bulgur and tahini' },
    description: {
      he: 'קבב על הגריל עם בורגול, סלט ישראלי ומעט טחינה.',
      en: 'Grilled beef kebab with bulgur, Israeli salad and a little tahini.',
    },
    mealTypes: ['dinner', 'lunch'],
    items: [
      { foodSlug: 'beef_kebab_grilled', grams: 150 },
      { foodSlug: 'bulgur_cooked', grams: 200 },
      { foodSlug: 'israeli_salad_olive_oil', grams: 150 },
      { foodSlug: 'tahini_sauce_prepared', grams: 25 },
    ],
    prepMinutes: 30,
  },
  {
    slug: 'schnitzel_potatoes_broccoli',
    name: { he: 'שניצל עם תפוחי אדמה וברוקולי', en: 'Schnitzel with potatoes and broccoli' },
    description: {
      he: 'שניצל עוף ביתי עם תפוחי אדמה מבושלים וברוקולי – ארוחת ערב משפחתית.',
      en: 'Homestyle chicken schnitzel with boiled potatoes and broccoli – a family dinner favorite.',
    },
    mealTypes: ['dinner', 'lunch'],
    items: [
      { foodSlug: 'chicken_schnitzel_fried', grams: 150 },
      { foodSlug: 'potato_boiled', grams: 250 },
      { foodSlug: 'broccoli_cooked', grams: 150 },
    ],
    prepMinutes: 35,
  },
  {
    slug: 'tofu_vegetable_stir_fry',
    name: { he: 'מוקפץ טופו וירקות עם אורז מלא', en: 'Tofu vegetable stir-fry with brown rice' },
    description: {
      he: 'טופו מוקפץ עם ברוקולי ופלפל אדום ברוטב סויה, על אורז מלא.',
      en: 'Tofu stir-fried with broccoli and red pepper in soy sauce over brown rice.',
    },
    mealTypes: ['dinner', 'lunch'],
    items: [
      { foodSlug: 'tofu_firm', grams: 200 },
      { foodSlug: 'rice_brown_cooked', grams: 180 },
      { foodSlug: 'broccoli_raw', grams: 100 },
      { foodSlug: 'red_bell_pepper_raw', grams: 100 },
      { foodSlug: 'soy_sauce', grams: 15 },
      { foodSlug: 'canola_oil', grams: 10 },
    ],
    prepMinutes: 20,
  },
  {
    slug: 'lentil_bolognese_pasta',
    name: { he: 'פסטה מלאה ברוטב בולונז עדשים', en: 'Whole-wheat pasta with lentil bolognese' },
    description: {
      he: 'פסטה מלאה ברוטב עגבניות עשיר עם עדשים ובצל – גרסה טבעונית לבולונז.',
      en: 'Whole-wheat pasta in a rich tomato sauce with lentils and onion – a vegan take on bolognese.',
    },
    mealTypes: ['dinner', 'lunch'],
    items: [
      { foodSlug: 'pasta_whole_wheat_cooked', grams: 220 },
      { foodSlug: 'lentils_cooked', grams: 150 },
      { foodSlug: 'tomato', grams: 150 },
      { foodSlug: 'onion_raw', grams: 50 },
      { foodSlug: 'olive_oil', grams: 10 },
    ],
    prepMinutes: 30,
  },
  {
    slug: 'sea_bream_rice_salad',
    name: { he: 'דניס על הגריל עם אורז וסלט', en: 'Grilled sea bream with rice and salad' },
    description: {
      he: 'דג דניס צלוי עם אורז לבן וסלט ישראלי טרי.',
      en: 'Grilled gilthead sea bream with white rice and fresh Israeli salad.',
    },
    mealTypes: ['dinner', 'lunch'],
    items: [
      { foodSlug: 'sea_bream_cooked', grams: 200 },
      { foodSlug: 'rice_white_cooked', grams: 180 },
      { foodSlug: 'israeli_salad_olive_oil', grams: 150 },
    ],
    prepMinutes: 30,
  },
  {
    slug: 'ricotta_spinach_pasta',
    name: { he: 'פסטה ריקוטה ותרד', en: 'Ricotta and spinach pasta' },
    description: {
      he: 'פסטה עם ריקוטה, תרד טרי, עגבניות שרי ופרמזן מגורד.',
      en: 'Pasta tossed with ricotta, fresh spinach, cherry tomatoes and grated parmesan.',
    },
    mealTypes: ['dinner', 'lunch'],
    items: [
      { foodSlug: 'pasta_cooked', grams: 220 },
      { foodSlug: 'ricotta_whole_milk', grams: 100 },
      { foodSlug: 'spinach_raw', grams: 80 },
      { foodSlug: 'cherry_tomatoes', grams: 100 },
      { foodSlug: 'parmesan_hard', grams: 15 },
    ],
    prepMinutes: 20,
  },
  {
    slug: 'kidney_bean_chili_rice',
    name: { he: 'צ׳ילי שעועית אדומה עם אורז', en: 'Kidney bean chili with rice' },
    description: {
      he: 'תבשיל שעועית אדומה עם עגבניות, בצל ופלפל, מוגש על אורז לבן.',
      en: 'Red kidney bean stew with tomatoes, onion and pepper, served over white rice.',
    },
    mealTypes: ['dinner', 'lunch'],
    items: [
      { foodSlug: 'kidney_beans_red_cooked', grams: 200 },
      { foodSlug: 'rice_white_cooked', grams: 150 },
      { foodSlug: 'tomato', grams: 150 },
      { foodSlug: 'onion_raw', grams: 60 },
      { foodSlug: 'red_bell_pepper_raw', grams: 100 },
      { foodSlug: 'olive_oil', grams: 10 },
    ],
    prepMinutes: 35,
  },

  // ─────────────────────────────── Snacks ──────────────────────────────
  {
    slug: 'apple_peanut_butter',
    name: { he: 'תפוח עם חמאת בוטנים', en: 'Apple with peanut butter' },
    description: {
      he: 'פלחי תפוח טבולים בחמאת בוטנים טבעית – מתוק, פריך ומשביע.',
      en: 'Apple slices dipped in natural peanut butter – sweet, crunchy and satisfying.',
    },
    mealTypes: ['snack'],
    items: [
      { foodSlug: 'apple', grams: 180 },
      { foodSlug: 'peanut_butter_natural', grams: 25 },
    ],
    prepMinutes: 2,
  },
  {
    slug: 'cottage_rice_cakes',
    name: { he: 'פריכיות עם קוטג׳ ועגבניות שרי', en: 'Rice cakes with cottage cheese' },
    description: {
      he: 'פריכיות אורז מלא עם קוטג׳ ועגבניות שרי – נשנוש חלבוני וקליל.',
      en: 'Brown rice cakes topped with cottage cheese and cherry tomatoes – a light protein snack.',
    },
    mealTypes: ['snack'],
    items: [
      { foodSlug: 'cottage_cheese_3pct', grams: 200 },
      { foodSlug: 'rice_cakes_brown_unsalted', grams: 20 },
      { foodSlug: 'cherry_tomatoes', grams: 100 },
    ],
    prepMinutes: 3,
  },
  {
    slug: 'protein_yogurt_berries_walnuts',
    name: { he: 'יוגורט חלבון עם פירות יער ואגוזי מלך', en: 'Protein yogurt with berries and walnuts' },
    description: {
      he: 'יוגורט עשיר בחלבון עם אוכמניות וקומץ אגוזי מלך.',
      en: 'High-protein yogurt with blueberries and a handful of walnuts.',
    },
    mealTypes: ['snack', 'breakfast'],
    items: [
      { foodSlug: 'high_protein_yogurt', grams: 200 },
      { foodSlug: 'blueberries', grams: 100 },
      { foodSlug: 'walnuts', grams: 15 },
    ],
    prepMinutes: 2,
  },
  {
    slug: 'hummus_veggie_sticks',
    name: { he: 'חומוס עם מקלות ירקות', en: 'Hummus with veggie sticks' },
    description: {
      he: 'חומוס לטבילה עם מקלות גזר, מלפפון ופלפל אדום.',
      en: 'Hummus for dipping with carrot, cucumber and red pepper sticks.',
    },
    mealTypes: ['snack'],
    items: [
      { foodSlug: 'hummus', grams: 80 },
      { foodSlug: 'carrot_raw', grams: 100 },
      { foodSlug: 'cucumber', grams: 100 },
      { foodSlug: 'red_bell_pepper_raw', grams: 80 },
    ],
    prepMinutes: 5,
  },
  {
    slug: 'edamame_clementines',
    name: { he: 'אדממה וקלמנטינות', en: 'Edamame and clementines' },
    description: {
      he: 'אדממה מבושלת עם קורט מלח וקלמנטינות טריות – טבעוני וללא אגוזים.',
      en: 'Cooked edamame with a pinch of salt and fresh clementines – vegan and nut-free.',
    },
    mealTypes: ['snack'],
    items: [
      { foodSlug: 'edamame_shelled_cooked', grams: 150 },
      { foodSlug: 'clementine', grams: 150 },
    ],
    prepMinutes: 5,
  },
  {
    slug: 'whey_banana_shake',
    name: { he: 'שייק חלבון ובננה', en: 'Whey protein banana shake' },
    description: {
      he: 'אבקת חלבון מי גבינה עם חלב 1% ובננה – מושלם אחרי אימון.',
      en: 'Whey protein blended with 1% milk and banana – ideal after a workout.',
    },
    mealTypes: ['snack', 'breakfast'],
    items: [
      { foodSlug: 'whey_protein_powder', grams: 30 },
      { foodSlug: 'milk_1pct', grams: 250 },
      { foodSlug: 'banana', grams: 100 },
    ],
    prepMinutes: 3,
  },
  {
    slug: 'pea_protein_berry_smoothie',
    name: { he: 'שייק חלבון צמחי ותותים', en: 'Plant protein berry smoothie' },
    description: {
      he: 'חלבון אפונה עם משקה סויה, תותים ובננה – שייק התאוששות טבעוני.',
      en: 'Pea protein with soy drink, strawberries and banana – a vegan recovery smoothie.',
    },
    mealTypes: ['snack', 'breakfast'],
    items: [
      { foodSlug: 'pea_protein_powder', grams: 30 },
      { foodSlug: 'soy_milk_unsweetened', grams: 250 },
      { foodSlug: 'strawberries', grams: 150 },
      { foodSlug: 'banana', grams: 80 },
    ],
    prepMinutes: 3,
  },
  {
    slug: 'tuna_rice_cakes',
    name: { he: 'פריכיות עם טונה', en: 'Tuna on rice cakes' },
    description: {
      he: 'טונה במים עם חרדל על פריכיות אורז, לצד מקלות מלפפון.',
      en: 'Water-packed tuna with mustard on rice cakes, with cucumber sticks on the side.',
    },
    mealTypes: ['snack'],
    items: [
      { foodSlug: 'tuna_canned_water_drained', grams: 100 },
      { foodSlug: 'rice_cakes_brown_unsalted', grams: 20 },
      { foodSlug: 'cucumber', grams: 80 },
      { foodSlug: 'mustard_yellow', grams: 10 },
    ],
    prepMinutes: 5,
  },
  {
    slug: 'seed_raisin_chocolate_mix',
    name: { he: 'מיקס גרעיני דלעת, צימוקים ושוקולד', en: 'Pumpkin seed, raisin and chocolate mix' },
    description: {
      he: 'תערובת של גרעיני דלעת, צימוקים ושוקולד מריר – ללא אגוזים.',
      en: 'A mix of pumpkin seeds, raisins and dark chocolate – nut-free trail mix.',
    },
    mealTypes: ['snack'],
    items: [
      { foodSlug: 'pumpkin_seeds_hulled', grams: 20 },
      { foodSlug: 'raisins', grams: 30 },
      { foodSlug: 'dark_chocolate_70pct', grams: 15 },
    ],
    prepMinutes: 1,
  },
];
