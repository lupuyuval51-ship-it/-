/**
 * Diet / allergen / dislike filtering for dishes.
 *
 * The dishes carry no allergen data, only a short ingredient list, so this works from ingredient and dish
 * names with deliberately broad keyword rules (English + Hebrew). It errs on the side of hiding a dish:
 * a false "contains" costs the user one alternative, a false "safe" could cost far more. It can still miss
 * hidden ingredients (a sauce, a coating), so the UI must say the check is name-based and never present a
 * dish as allergen-free.
 *
 * Writing patterns (text is normalized first, see normalizeText):
 * - English: `\b…\b` with optional plural endings; hyphens and apostrophes are already gone.
 * - Hebrew: `\b` does not work on Hebrew letters and prefixes (ב ה ל ו ש מ כ) attach to the word, so patterns are
 *   plain substrings. End a stem one letter early when the word ends in a final form (ן ם ץ ף ך), because
 *   plurals use the regular letter (שומשום → שומשומ). No geresh in patterns: it is stripped from the text.
 */
import type { Allergen, DietaryRestriction, DietType } from '../constants';
import type { Dish } from './index';

/** Lower-cases, strips Hebrew niqqud / Latin diacritics, geresh and apostrophes, turns other punctuation into spaces. */
export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[֑-ׇ]/g, '')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['"׳״`´]/g, '')
    .replace(/[\-_,.;:()[\]{}/\\|!?*+&#@~^=<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const rx = (...parts: string[]) => new RegExp(parts.join('|'));
/** English words: whole words, optional plural. */
const en = (words: string) => `\\b(?:${words})\\b`;

const NOT_CHICKEN_OR_TURKEY = '(?<!chicken )(?<!turkey )';
const PLANT_BASED_PREFIX = '(?<!peanut )(?<!almond )(?<!nut )(?<!soy )(?<!oat )(?<!coconut )(?<!cashew )(?<!rice )';

const MEAT = rx(
  en(
    'chicken|beef|turkey|meat|lamb|steak|sirloin|rib ?eye|shawarma|schnitzel|nuggets?|meatballs?|meatloaf|burgers?|hamburgers?|sausages?|bacon|ham|pork|wings?|veal|duck|goose|salami|prosciutto|pepperoni|hot ?dogs?|kebabs?|kofta|gyros?|pastrami|liver|mortadella|jerky|mutton|goat|rabbit|ribs|oxtail|chorizo|pancetta|lard|bone broth|brisket|bolognese',
  ),
  'עוף|חזה|הודו|בקר|בשר|כבש|סטייק|אנטריקוט|שווארמה|שניצל|נאגטס|קציצות (?:עוף|הודו|בקר|בשר)|קציצת (?:עוף|הודו|בקר|בשר)|נקניק|בייקון|חזיר|כנפיים|המבורגר|פרגית|פרגיות|עגל|טלה|כבד|קבב|קובה|צלי|אווז|ברווז|לשון',
);
const PORK = rx(en('pork|bacon|ham|prosciutto|pancetta|lard|chorizo|sausages?|pepperoni|salami|hot ?dogs?|mortadella|gelatin'), 'חזיר|בייקון|פרושוטו|נקניק|פפרוני|סלמי|גלטין');
const BEEF = rx(
  en('beef|steak|sirloin|rib ?eye|veal|brisket|ground meat|minced meat|meat|bolognese|salami|meatloaf|ribs|oxtail|pastrami') +
    '|' +
    NOT_CHICKEN_OR_TURKEY +
    en('burgers?|hamburgers?|meatballs?|kebabs?|kofta|shawarma|patt(?:y|ies)'),
  'בקר|סטייק|אנטריקוט|בשר|בולונז|עגל|המבורגר|קבב',
);
const ALCOHOL = rx(en('wine|beer|vodka|whisk(?:e)?y|rum|liqueur|alcohol|brandy|gin|cider|mirin|sake|champagne|tequila|amaretto|sherry|marsala'), 'יין|בירה|וודקה|וויסקי|ויסקי|ליקר|אלכוהול|ברנדי|מירין|סאקה|שמפניה|ערק|קוניאק');

const FISH = rx(
  en(
    'fish|tuna|salmon|cod|tilapia|sardines?|anchov(?:y|ies)|mackerel|herring|trout|sea ?bass|sushi|poke|caesar|worcestershire|lox|gefilte|haddock|halibut|sole|bream|mullet|pollock|snapper|carp|swordfish|eel|roe|caviar|surimi|dashi|bonito|fish sauce',
  ),
  'דג(?!ן|נ)|טונה|סלמון|בקלה|אמנון|סרדינ|אנשובי|הרינג|פורל|לברק|סושי|פוקה|קיסר|גפילטע|לוקוס|דניס|מוסר|לוקס|נילוס',
);
const SHELLFISH = rx(
  en('shrimps?|prawns?|crabs?|lobsters?|crayfish|clams?|mussels?|oysters?|scallops?|squid|calamari|octopus|shellfish|seafood|paella|langoustines?|cuttlefish|krill'),
  'שרימפס|סרט[נן]|לובסטר|צדפ|קלמארי|תמנונ|תמנון|פירות ים|חסילון|מולים|דיונון',
);
const DAIRY = rx(
  en(
    'cheeses?|yogh?urts?|creams?|kefir|labneh|labane|whey|mozzarella|feta|parmesan|ricotta|halloumi|cottage|bechamel|ghee|custard|ice cream|latte|cappuccino|tzatziki|quiche|lasagn[ae]|pesto|bourekas|malawach|jachnun|chocolate|cocoa|pancakes?|waffles?|crepes?|croissants?|pastry|pastries|cookies?|cake|cakes|cheesecake|granola bar|cereal bar|protein powder|protein pudding|protein yogh?urt|white cheese|cheese sandwich|string cheese|caesar|mashed|mash|milkshake|buttermilk|cheddar|gouda|skyr|quark|mascarpone|burrata|paneer|alfredo|carbonara|gelato|tiramisu|mousse|muffins?|brownies?|donuts?|doughnuts?|curry',
  ) +
    '|' +
    PLANT_BASED_PREFIX +
    en('milk|butter'),
  'חלב(?!ון|ה)|גבינ|יוגורט|חמאה|שמנת|קפיר|לאבנה|מוצרלה|פטה|פרמזן|ריקוטה|חלומי|קוטג|בשמל|גלידה|לאטה|קפוצ|צזיקי|קיש(?!ו)|לזניה|פסטו|בורקס|מלוואח|מלאווח|גחנון|שוקולד|שוקו|קקאו|פנקייק|וופל|קרפ|קרואסון|מאפה|עוגי|עוג(?:ה|ת)|אבקת חלבון|פודינג|פירה|מחית|מילקשייק|צפתית|קשקבל|קארי',
);
const EGG = rx(
  en(
    'eggs?|omelet+e?|(?<!tofu )shakshuka|mayo|mayonnaise|quiche|pancakes?|waffles?|crepes?|challah|brioche|cookies?|cake|cakes|pastry|pastries|croissants?|noodles?|lasagn[ae]|bourekas|malawach|jachnun|caesar|meringue|custard|egg ?salad|batter|dough|schnitzel|nuggets?|meatballs?|patt(?:y|ies)|moussaka|musaka|bechamel|aioli|pasta|spaghetti|macaroni|gnocchi|ravioli|tortellini|muffins?|brownies?|donuts?|doughnuts?|mousse|tiramisu|carbonara',
  ),
  'ביצ|חבית|שקשוק(?!ה עם טופו)|מיונז|קיש(?!ו)|פנקייק|וופל|קרפ|חלה|חלות|בריוש|עוגי|עוג(?:ה|ת)|מאפה|קרואסון|אטריות|לזניה|בורקס|מלוואח|מלאווח|גחנון|קיסר|מרנג|בצק|שניצל|נאגטס|קציצ|מוסקה|בשמל|איולי|חלמון|פסטה|ספגטי|ניוקי|רביולי|מקרוני',
);
const PEANUT = rx(
  en(
    'peanuts?|groundnuts?|satay|chocolate spread|nut butter|mixed nuts?|nuts|granola|muesli|cereal bar|granola bar|protein bar|energy bar|trail mix|nutella|biscotti|amaretto|frangipane|pad thai|bamba',
  ),
  'בוטנ|בוטן|סאטה|ממרח שוקולד|חמאת אגוזים|אגוזים|גרנולה|מוזלי|נוטלה|במבה',
);
const TREE_NUT = rx(
  en(
    'almonds?|walnuts?|cashews?|pistachios?|hazelnuts?|pecans?|macadamia|pine nuts?|brazil nuts?|nuts?|nut milk|granola|pesto|chocolate spread|nut butter|marzipan|praline|nougat|cereal bar|granola bar|baklava|halva|muesli|trail mix|energy bar|protein bar|nutella|biscotti|amaretto|frangipane',
  ),
  'שקד|אגוז|קשיו|פיסטוק|לוז|פקאן|מקדמיה|צנובר|גרנולה|פסטו|ממרח שוקולד|חמאת אגוזים|מרציפן|פרלין|נוגט|חטיף דגנים|בקלאווה|חלבה|מוזלי|נוטלה',
);
const SOY = rx(
  en('soy|soya|tofu|edamame|tempeh|miso|teriyaki|tamari|seitan|soy ?sauce|soy ?milk|soy ?drink|soy yogh?urt|protein powder|protein bar|sushi|vegetarian (?:patty|patties|burger)'),
  'סויה|טופו|אדממה|טמפה|מיסו|טריאקי|סייטן|משקה סויה|אבקת חלבון|סושי',
);
const SESAME = rx(
  en(
    'sesame|tahini|tahina|hummus|houmous|halva|halvah|falafel|zaatar|bagels?|buns?|burgers?|shawarma|pita chips|sushi|sambusak|bourekas|malawach|challah|rolls?|poke|teriyaki',
  ),
  'שומשומ|טחינ|חומוס|חלבה|פלאפל|זעתר|בייגל|לחמני|המבורגר|שווארמה|סושי|סמבוסק|בורקס|מלוואח|מלאווח|חלה|חלות|לחמניות|פוקה|טריאקי',
);
const GLUTEN = rx(
  en(
    'breads?|toasts?|pitas?|pita chips|bagels?|buns?|rolls?|challah|sourdough|baguettes?|brioche|tortillas?|wraps?|sandwich(?:es)?|croutons?|crackers?|pasta|spaghetti|macaroni|noodles?|lasagn[ae]|couscous|bulgur|ptitim|semolina|oats?|oatmeal|granola|cereal|cornflakes|muesli|wheat|wholewheat|wholegrain|flour|dough|batter|pancakes?|waffles?|crepes?|croissants?|pastry|pastries|bourekas|malawach|jachnun|pizzas?|cookies?|cakes?|schnitzel|nuggets?|meatballs?|patt(?:y|ies)|burgers?|falafel|dumplings?|seitan|soy ?sauce|teriyaki|bechamel|breaded|barley|rye|spelt|freekeh|beer|cereal bar|granola bar|malt|poke|sushi|muffins?|brownies?|donuts?|doughnuts?|pies?|tarts?|strudel|wafers?|biscuits?|bran|laffa|naan|matzo|matzah|orzo|ramen|udon|soba|gnocchi|ravioli|tortellini|panko|breadcrumbs?|tempura|kibbeh|kubba|moussaka|musaka',
  ),
  'לחם|טוסט|פיתה|פיתות|בייגל|לחמני|חלה|חלות|מחמצת|באגט|בריוש|טורטי|לאפ|כריך|סנדוויץ|קרוטונ|קרקר|פסטה|ספגטי|מקרוני|אטריות|נודלס|לזניה|קוסקוס|בורגול|פתיתים|סולת|שיבולת|גרנולה|דגני בוקר|קורנפלקס|מוזלי|חיטה|קמח|בצק|פנקייק|וופל|קרפ|קרואסון|מאפה|בורקס|מלוואח|מלאווח|גחנון|פיצה|עוגי|עוג(?:ה|ת)|שניצל|נאגטס|קציצ|המבורגר|פלאפל|כופתא|סייטן|רוטב סויה|טריאקי|בשמל|שעורה|שיפון|כוסמין|פריקה|בירה|חטיף|ניוקי|מצה|בגט|פשטידה|פנקו|טמפורה|סושי|פוקה|מוסקה|רביולי',
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

/** Animal-derived ingredients other than meat/fish (vegan check). Plant "milks" and "butters" are not animal-derived. */
const ANIMAL_NON_MEAT = rx(
  en('eggs?|cheeses?|yogh?urts?|creams?|honey|gelatin|whey|kefir|labneh|mayo|mozzarella|feta|parmesan|ricotta|halloumi|cottage|pesto|tzatziki|ghee|custard|casein|milk chocolate|aioli|meringue') +
    '|' +
    PLANT_BASED_PREFIX +
    en('milk|butter'),
  'ביצ|חלב(?!ון|ה)|גבינ|יוגורט|חמאה|שמנת|דבש|גלטין|קפיר|לאבנה|מיונז|מוצרלה|פטה|פרמזן|ריקוטה|חלומי|קוטג|פסטו|צזיקי',
);
/** Not meat as such, but not vegetarian either. */
const NOT_VEGETARIAN = rx(en('gelatin|lard|tallow|rennet|bone broth|fish sauce|anchov(?:y|ies)'), 'גלטין');

/** Whether the dish fits the diet type (meat/fish use keywords and the dataset's own vegetarian/vegan tags). */
export function fitsDiet(dish: Dish, diet: DietType | null): boolean {
  if (!diet || diet === 'omnivore') return true;
  const text = dishText(dish);
  const meat = MEAT.test(text) || PORK.test(text);
  switch (diet) {
    case 'vegetarian':
      return !meat && !FISH.test(text) && !SHELLFISH.test(text) && !NOT_VEGETARIAN.test(text) && (dish.tags.includes('v') || dish.tags.includes('vg'));
    case 'vegan':
      return dish.tags.includes('vg') && !meat && !FISH.test(text) && !SHELLFISH.test(text) && !NOT_VEGETARIAN.test(text) && !ANIMAL_NON_MEAT.test(text);
    case 'pescatarian':
      return !meat;
  }
}

const RESTRICTION_RULES: Record<DietaryRestriction, (text: string) => boolean> = {
  no_pork: (text) => !PORK.test(text),
  no_beef: (text) => !BEEF.test(text),
  no_shellfish: (text) => !SHELLFISH.test(text),
  no_alcohol: (text) => !ALCOHOL.test(text),
  lactose_free: (text) => !DAIRY.test(text),
  gluten_free: (text) => !GLUTEN.test(text),
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
    if (restrictions.some((r) => !RESTRICTION_RULES[r](text))) return false;
    return !mentionsDisliked(dish, disliked);
  };
}

/** Allergens flagged in free text (ingredient names) — used by tests and tooling. */
export function textAllergens(text: string): Allergen[] {
  const n = normalizeText(text);
  return (Object.keys(ALLERGEN_RULES) as Allergen[]).filter((a) => ALLERGEN_RULES[a].test(n));
}
