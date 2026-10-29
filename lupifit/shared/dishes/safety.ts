/**
 * Diet / allergen / dislike filtering for dishes.
 *
 * The dishes carry no allergen data, only a short ingredient list, so this works from ingredient and dish
 * names with deliberately broad keyword rules (English + Hebrew). It errs on the side of hiding a dish:
 * a false "contains" costs the user one alternative, a false "safe" could cost far more. It can still miss
 * hidden ingredients (a sauce, a coating), so the UI must say the check is name-based and never present a
 * dish as allergen-free.
 */
import type { Allergen, DietaryRestriction, DietType } from '../constants';
import type { Dish } from './index';

/** Lower-cases, strips Hebrew niqqud / Latin diacritics and punctuation, collapses spaces. */
export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[֑-ׇ]/g, '')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[\-_'"׳״`´,.;:()[\]{}/\\|!?*+&#@~^=<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// `\b` does not work on Hebrew letters in JS regexes; Hebrew prefixes (ב ה ל ו ש מ כ) attach to the word, so Hebrew patterns are plain substrings.
const rx = (...parts: string[]) => new RegExp(parts.join('|'));

const MEAT = rx(
  '\\b(?:chicken|beef|turkey|meat|lamb|steak|sirloin|rib-?eye|shawarma|schnitzel|nuggets?|meatballs?|burger|sausage|bacon|ham|pork|wings?|veal|duck|salami|prosciutto)\\b',
  'עוף|חזה|הודו|בקר|בשר|כבש|סטייק|אנטריקוט|שווארמה|שניצל|נאגטס|קציצות (?:עוף|הודו|בקר|בשר)|קציצות בשר|נקניק|בייקון|חזיר|כנפיים|המבורגר',
);
const PORK = rx('\\b(?:pork|bacon|ham|prosciutto|pancetta|lard|chorizo)\\b', 'חזיר|בייקון|פרושוטו');
const BEEF = rx(
  '\\b(?:beef|steak|sirloin|rib-?eye|veal|brisket|ground meat|minced meat|meat|bolognese|salami)\\b',
  'בקר|סטייק|אנטריקוט|בשר|בולונז',
);
const ALCOHOL = rx('\\b(?:wine|beer|vodka|whisk(?:e)?y|rum|liqueur|alcohol|brandy|gin|cider)\\b', 'יין|בירה|וודקה|וויסקי|ליקר|אלכוהול|ברנדי');

const FISH = rx(
  '\\b(?:fish|tuna|salmon|cod|tilapia|sardines?|anchov(?:y|ies)|mackerel|herring|trout|sea ?bass|sushi|caesar|worcestershire|lox|gefilte)\\b',
  'דג(?!ן|נ)|טונה|סלמון|בקלה|אמנון|סרדין|אנשובי|הרינג|פורל|לברק|סושי|קיסר|גפילטע',
);
const SHELLFISH = rx(
  '\\b(?:shrimps?|prawns?|crab|lobster|crayfish|clams?|mussels?|oysters?|scallops?|squid|calamari|octopus|shellfish)\\b',
  'שרימפס|סרטן|לובסטר|צדפות|קלמארי|תמנון|פירות ים',
);
const DAIRY = rx(
  '\\b(?:milk|cheese|yogh?urt|butter|cream|kefir|labneh|labane|whey|mozzarella|feta|parmesan|ricotta|halloumi|cottage|bechamel|béchamel|ghee|custard|ice cream|latte|cappuccino|tzatziki|quiche|lasagn[ae]|pesto|bourekas|malawach|jachnun|chocolate|cocoa|pancakes?|waffles?|crepes?|croissant|pastry|cookies?|cake|granola bar|cereal bar|protein powder|protein pudding|protein yogh?urt|white cheese|cheese sandwich|string cheese|caesar|mashed|mash)\\b',
  'חלב(?!ון|ה)|גבינ|יוגורט|חמאה|שמנת|קפיר|מוצרלה|פטה|פרמזן|ריקוטה|חלומי|קוטג|בשמל|גלידה|לאטה|קפוצ|צזיקי|קיש|לזניה|פסטו|בורקס|מלוואח|מלאווח|ג׳חנון|גחנון|שוקולד|קקאו|פנקייק|וופל|קרפ|קרואסון|מאפה|עוגי|עוגה|אבקת חלבון|פודינג|פירה|מחית',
);
const EGG = rx(
  '\\b(?:eggs?|omelet+e?|(?<!tofu )shakshuka|mayo|mayonnaise|quiche|pancakes?|waffles?|crepes?|challah|brioche|cookies?|cake|pastry|croissant|noodles?|lasagn[ae]|bourekas|malawach|jachnun|caesar|meringue|custard|egg ?salad|protein pancakes?|batter|dough|schnitzel|nuggets?|meatballs?|patt(?:y|ies))\\b',
  'ביצ|חביתה|שקשוקה(?! עם טופו)|מיונז|קיש|פנקייק|וופל|קרפ|חלה|בריוש|עוגי|עוגה|מאפה|קרואסון|אטריות|לזניה|בורקס|מלוואח|מלאווח|ג׳חנון|גחנון|קיסר|מרנג|בצק|שניצל|נאגטס|קציצות',
);
const PEANUT = rx('\\b(?:peanuts?|satay|chocolate spread|nut butter|mixed nuts?|nuts)\\b', 'בוטנ|סאטה|ממרח שוקולד|חמאת אגוזים|אגוזים');
const TREE_NUT = rx(
  '\\b(?:almonds?|walnuts?|cashews?|pistachios?|hazelnuts?|pecans?|macadamia|pine nuts?|brazil nuts?|nuts|granola|pesto|chocolate spread|nut butter|marzipan|praline|nougat|cereal bar|granola bar|baklava|halva)\\b',
  'שקד|אגוז|קשיו|פיסטוק|לוז|פקאן|מקדמיה|צנובר|גרנולה|פסטו|ממרח שוקולד|חמאת אגוזים|מרציפן|פרלין|נוגט|חטיף דגנים|בקלאווה|חלבה',
);
const SOY = rx(
  '\\b(?:soy|soya|tofu|edamame|tempeh|miso|teriyaki|tamari|seitan|soy ?sauce|soy ?milk|soy ?drink|soy yogh?urt|protein powder|protein bar|vegetarian (?:patty|patties|burger))\\b',
  'סויה|טופו|אדממה|טמפה|מיסו|טריאקי|תמרי|סייטן|משקה סויה|אבקת חלבון',
);
const SESAME = rx(
  '\\b(?:sesame|tahini|tahina|hummus|houmous|halva|halvah|falafel|za.?atar|bagel|bun|burger|shawarma|pita chips|sushi|sambusak)\\b',
  'שומשום|טחינה|טחינ|חומוס|חלבה|פלאפל|זעתר|בייגל|לחמניה|המבורגר|שווארמה|סושי|סמבוסק',
);
const GLUTEN = rx(
  '\\b(?:bread|toast|pitas?|pita chips|bagel|bun|rolls?|challah|sourdough|baguette|brioche|tortilla|wraps?|sandwich|croutons?|crackers?|rice crackers? with|pasta|spaghetti|macaroni|noodles?|lasagn[ae]|couscous|bulgur|ptitim|semolina|oats?|oatmeal|granola|cereal|cornflakes|muesli|wheat|wholewheat|wholegrain|flour|dough|batter|pancakes?|waffles?|crepes?|croissant|pastry|bourekas|malawach|jachnun|pizza|cookies?|cake|schnitzel|nuggets?|meatballs?|patt(?:y|ies)|burger|falafel|dumplings?|seitan|soy ?sauce|teriyaki|bechamel|béchamel|breaded|barley|rye|spelt|freekeh|beer|cereal bar|granola bar|malt)\\b',
  'לחם|טוסט|פיתה|פיתות|בייגל|לחמניה|חלה|מחמצת|באגט|בריוש|טורטיה|לאפה|כריך|סנדוויץ|קרוטונ|קרקר|פסטה|ספגטי|מקרוני|אטריות|לזניה|קוסקוס|בורגול|פתיתים|סולת|שיבולת|גרנולה|דגני בוקר|קורנפלקס|מוזלי|חיטה|קמח|בצק|פנקייק|וופל|קרפ|קרואסון|מאפה|בורקס|מלוואח|מלאווח|ג׳חנון|גחנון|פיצה|עוגי|עוגה|שניצל|נאגטס|קציצות|המבורגר|פלאפל|כופתא|סייטן|רוטב סויה|טריאקי|בשמל|שעורה|שיפון|כוסמין|פריקה|בירה|חטיף',
);

const ALLERGEN_RULES: Record<Allergen, RegExp> = {
  gluten: GLUTEN,
  dairy: DAIRY,
  egg: EGG,
  peanut: PEANUT,
  tree_nut: TREE_NUT,
  soy: SOY,
  fish: FISH,
  shellfish: SHELLFISH,
  sesame: SESAME,
};

/** Everything text-wise that identifies what is in a dish. */
export function dishText(dish: Dish): string {
  return normalizeText(`${dish.name.en} ${dish.ingredients.en} ${dish.name.he} ${dish.ingredients.he}`);
}

/** Allergens a dish may contain, judged from its names and ingredients (broad; see file header). */
export function dishAllergens(dish: Dish): Allergen[] {
  const text = dishText(dish);
  return (Object.keys(ALLERGEN_RULES) as Allergen[]).filter((a) => ALLERGEN_RULES[a].test(text));
}

const ANIMAL_NON_MEAT = rx('\\b(?:egg|eggs|milk|cheese|yogh?urt|butter|cream|honey|gelatin|whey|kefir|labneh|mayo)\\b', 'ביצ|חלב|גבינ|יוגורט|חמאה|שמנת|דבש|ג׳לטין|קפיר|לבנה|מיונז');

/** Whether the dish fits the diet type (meat/fish use keywords and the dataset's own vegetarian/vegan tags). */
export function fitsDiet(dish: Dish, diet: DietType | null): boolean {
  if (!diet || diet === 'omnivore') return true;
  const text = dishText(dish);
  const meat = MEAT.test(text);
  switch (diet) {
    case 'vegetarian':
      return !meat && !FISH.test(text) && !SHELLFISH.test(text) && (dish.tags.includes('v') || dish.tags.includes('vg'));
    case 'vegan':
      return dish.tags.includes('vg') && !meat && !FISH.test(text) && !SHELLFISH.test(text) && !ANIMAL_NON_MEAT.test(text);
    case 'pescatarian':
      return !meat && !PORK.test(text);
  }
}

const RESTRICTION_RULES: Record<DietaryRestriction, (dish: Dish, text: string) => boolean> = {
  no_pork: (_d, text) => !PORK.test(text),
  no_beef: (_d, text) => !BEEF.test(text),
  no_shellfish: (_d, text) => !SHELLFISH.test(text),
  no_alcohol: (_d, text) => !ALCOHOL.test(text),
  lactose_free: (_d, text) => !DAIRY.test(text),
  gluten_free: (_d, text) => !GLUTEN.test(text),
};

/** Keywords from the free-text "disliked foods" answer (EN/HE), with naive singular stems. */
export function dislikedKeywords(text: string): string[] {
  const out = new Set<string>();
  for (const part of text.split(/[,;\n\r/|•·،]+|\s+(?:and|or|או)\s+/i)) {
    const k = normalizeText(part);
    if (k.length < 2) continue;
    out.add(k);
    if (/[a-z]{4,}es$/.test(k)) out.add(k.slice(0, -2));
    if (/[a-z]{3,}s$/.test(k)) out.add(k.slice(0, -1));
    if (/[א-ת]{3,}(ים|ות)$/.test(k)) out.add(k.slice(0, -2));
  }
  return Array.from(out).slice(0, 60);
}

export function mentionsDisliked(dish: Dish, keywords: readonly string[]): boolean {
  if (!keywords.length) return false;
  const hay = ` ${dishText(dish)} `;
  return keywords.some((k) => (k.length <= 3 ? hay.includes(` ${k} `) || hay.includes(` ${k}`) : hay.includes(k)));
}

export interface DishPreferences {
  dietType: DietType | null;
  allergies: readonly Allergen[];
  dietaryRestrictions: readonly DietaryRestriction[];
  dislikedFoods: string;
}

export const NO_PREFERENCES: DishPreferences = { dietType: null, allergies: [], dietaryRestrictions: [], dislikedFoods: '' };

/** Builds a reusable predicate: true when the dish may be offered to someone with these preferences. */
export function dishFilter(prefs: DishPreferences): (dish: Dish) => boolean {
  const disliked = dislikedKeywords(prefs.dislikedFoods);
  const allergies = Array.from(new Set(prefs.allergies));
  const restrictions = Array.from(new Set(prefs.dietaryRestrictions));
  return (dish) => {
    if (!fitsDiet(dish, prefs.dietType)) return false;
    const text = dishText(dish);
    if (allergies.some((a) => ALLERGEN_RULES[a].test(text))) return false;
    if (restrictions.some((r) => !RESTRICTION_RULES[r](dish, text))) return false;
    return !mentionsDisliked(dish, disliked);
  };
}
