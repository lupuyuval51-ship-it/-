/** Allergen filter, deterministic daily menu builder, shopping list. Pure. */
import type { Allergen, DietType, DietaryRestriction, MealSlot } from './enums.js';
import { seededRandom } from './training.js';

/* ============================================================ allergens */

const HE_FINALS: Record<string, string> = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };

/** Strip niqqud/geresh/punctuation, fold final letters, lowercase. Idempotent. */
export function normalizeText(s: string): string {
  return s
    .normalize('NFC')
    .replace(/[֑-ׇ]/g, '')
    .replace(/[׳״'"`’‘“”]/g, '')
    .replace(/[ךםןףץ]/g, (c) => HE_FINALS[c] ?? c)
    .toLowerCase();
}

function tokenize(s: string): string[] {
  return normalizeText(s).split(/[^a-zא-ת]+/).filter((t) => t.length > 0);
}

const PREFIX_LETTERS = new Set(['ו', 'ב', 'ל', 'מ', 'כ', 'ה', 'ש']);

/** All candidate stems of a Hebrew token after stripping 0–3 proclitics (over-stripping only errs toward hiding). */
function hebrewCandidates(tok: string): string[] {
  const out = [tok];
  for (let k = 1; k <= 3 && k < tok.length; k++) {
    const head = tok.slice(0, k);
    if (![...head].every((c) => PREFIX_LETTERS.has(c))) break;
    const rest = tok.slice(k);
    if (rest.length >= 3) out.push(rest);
  }
  return out;
}

interface HeStem { stem: string; open?: boolean }
const hs = (stem: string, open = false): HeStem => ({ stem: normalizeText(stem), open });

/** Inflection suffixes (normalized) a closed stem may carry: singular/plural/construct. */
const HE_SUFFIXES = ['', 'ה', 'ת', 'י', 'ות', 'ימ', 'ית', 'יות', 'יימ'].map(normalizeText);

const HE_DICT: Record<Allergen, HeStem[]> = {
  dairy: [hs('חלב'), hs('גבינ', true), hs('יוגורט'), hs('חמא'), hs('קוטג', true), hs('שמנת'), hs('לאבנ'), hs('ריקוט'), hs('מוצרל'), hs('פרמזנ'), hs('פטה'), hs('קפיר'), hs('מעדנ'), hs('וויי'), hs('קזאינ')],
  egg: [hs('ביצ'), hs('חביתה'), hs('חביתות'), hs('שקשוק'), hs('מיונז', true), hs('מרנג', true)],
  peanut: [hs('בוטנ'), hs('בוטן')],
  tree_nut: [hs('שקד'), hs('אגוז'), hs('לוז'), hs('פקאנ'), hs('קשיו'), hs('פיסטוק'), hs('מקדמיה'), hs('מרציפנ', true), hs('ערמונ')],
  sesame: [hs('שומשומ'), hs('טחינ'), hs('חלווה'), hs('חומוס'), hs('סומסומ')],
  soy: [hs('סויה'), hs('סוי'), hs('טופו'), hs('אדממ'), hs('טמפה'), hs('מיסו'), hs('טמרי')],
  gluten: [hs('חיט'), hs('גלוטנ'), hs('שיבולת'), hs('שעור'), hs('לחמ'), hs('לחמני', true), hs('פסט'), hs('בורגול'), hs('סולת'), hs('קמח'), hs('פית'), hs('קוסקוס'), hs('אטריות'), hs('ספגטי'), hs('פתית'), hs('בייגל'), hs('קרקר'), hs('סייטנ'), hs('טורטיה'), hs('שניצל', true), hs('פירורי', true)],
  fish: [hs('דג'), hs('סלמונ'), hs('טונה'), hs('בקלה'), hs('סרדינ'), hs('אנשובי'), hs('טילפיה'), hs('מקרל'), hs('הרינג'), hs('פורל'), hs('לוקוס'), hs('אמנונ'), hs('מוסר')],
  shellfish: [hs('שרימפס'), hs('סרטנ'), hs('לובסטר'), hs('צדפ'), hs('קלמרי'), hs('תמנונ'), hs('מולוסק'), hs('חסילונ')],
};

const EN_DICT: Record<Allergen, string[]> = {
  dairy: ['milk', 'cheese', 'cheddar', 'mozzarella', 'parmesan', 'feta', 'ricotta', 'yogurt', 'yoghurt', 'butter', 'cream', 'whey', 'casein', 'kefir', 'labneh', 'cottage', 'ghee', 'custard', 'dairy', 'paneer', 'halloumi'],
  egg: ['egg', 'omelet', 'omelette', 'mayonnaise', 'mayo', 'meringue', 'albumen', 'shakshuka', 'frittata'],
  peanut: ['peanut', 'groundnut'],
  tree_nut: ['almond', 'walnut', 'hazelnut', 'cashew', 'pecan', 'pistachio', 'macadamia', 'marzipan', 'praline', 'chestnut', 'brazil'],
  sesame: ['sesame', 'tahini', 'tahina', 'halva', 'halvah', 'hummus', 'hommus'],
  soy: ['soy', 'soya', 'tofu', 'edamame', 'tempeh', 'miso', 'tamari'],
  gluten: ['wheat', 'gluten', 'barley', 'rye', 'oat', 'oats', 'bread', 'pasta', 'bulgur', 'semolina', 'couscous', 'flour', 'noodle', 'noodles', 'pita', 'bagel', 'cracker', 'seitan', 'spaghetti', 'tortilla', 'schnitzel', 'breadcrumbs', 'granola', 'muesli', 'wrap'],
  fish: ['fish', 'salmon', 'tuna', 'cod', 'sardine', 'anchovy', 'tilapia', 'mackerel', 'herring', 'trout', 'bass', 'haddock', 'sole'],
  shellfish: ['shrimp', 'prawn', 'crab', 'lobster', 'mussel', 'clam', 'oyster', 'scallop', 'squid', 'calamari', 'octopus', 'shellfish'],
};

const EN_PLANT_MILK_PREFIX = new Set(['almond', 'soy', 'soya', 'oat', 'coconut', 'rice', 'cashew', 'hazelnut', 'peanut', 'nut', 'cocoa', 'shea', 'seed']);
const HE_PLANT_NEXT = ['שקד', 'סוי', 'שיבולת', 'קוקוס', 'אורז', 'קשיו', 'בוטנ', 'אגוז', 'שומשומ', 'לוז', 'טחינ'].map(normalizeText);

function enTokenMatches(tok: string, stem: string): boolean {
  return tok === stem || tok === `${stem}s` || tok === `${stem}es` || (stem.endsWith('y') && tok === `${stem.slice(0, -1)}ies`);
}

function hebrewMatches(candidate: string, st: HeStem): boolean {
  if (!candidate.startsWith(st.stem)) return false;
  if (st.open) return true;
  return HE_SUFFIXES.includes(candidate.slice(st.stem.length));
}

/** Allergens detected in free text (bilingual, inflection-aware). Conservative: errs toward hiding. */
export function detectAllergensInText(text: string): Set<Allergen> {
  const found = new Set<Allergen>();
  const toks = tokenize(text);
  toks.forEach((tok, idx) => {
    const prev = toks[idx - 1];
    const next = toks[idx + 1];
    const isHe = /[א-ת]/.test(tok);
    for (const a of Object.keys(HE_DICT) as Allergen[]) {
      if (isHe) {
        for (const cand of hebrewCandidates(tok)) {
          if (!(HE_DICT[a].some((st) => hebrewMatches(cand, st)))) continue;
          const isMilkLike = a === 'dairy' && (cand.startsWith(normalizeText('חלב')) || cand.startsWith(normalizeText('חמא')));
          if (isMilkLike && next && HE_PLANT_NEXT.some((p) => hebrewCandidates(next).some((c) => c.startsWith(p)))) continue;
          if (cand === normalizeText('חלבון')) continue; // "protein", not milk
          // "גרגרי חומוס" are chickpeas, not the tahini-based spread (a bare "חומוס" still counts as sesame, conservatively)
          if (a === 'sesame' && cand.startsWith(normalizeText('חומוס')) && prev && hebrewCandidates(prev).some((c) => c.startsWith(normalizeText('גרגר')) || c.startsWith(normalizeText('גרגיר')))) continue;
          found.add(a);
        }
      } else {
        for (const stem of EN_DICT[a]) {
          if (!enTokenMatches(tok, stem)) continue;
          if (a === 'dairy' && (stem === 'milk' || stem === 'butter' || stem === 'cream') && prev && EN_PLANT_MILK_PREFIX.has(prev)) continue;
          found.add(a);
        }
      }
    }
  });
  return found;
}

export interface DishIngredient { foodId?: string; nameHe: string; nameEn: string; grams: number }
export interface Dish {
  id: string; nameHe: string; nameEn: string;
  slots: readonly MealSlot[];
  kcal: number; proteinG: number; carbsG: number; fatG: number; // per 1.0 serving
  ingredients: readonly DishIngredient[];
  allergens: readonly Allergen[];
  diets: readonly DietType[];
  restrictionTags: readonly DietaryRestriction[];
}

/** Structured tags UNION keyword detection over names and ingredient strings. */
export function dishAllergens(d: Dish): Set<Allergen> {
  const out = new Set<Allergen>(d.allergens);
  const texts = [d.nameHe, d.nameEn, ...d.ingredients.flatMap((i) => [i.nameHe, i.nameEn])];
  for (const t of texts) for (const a of detectAllergensInText(t)) out.add(a);
  return out;
}

export function isDishAllowed(d: Dish, opts: { diet: DietType; restrictions: readonly DietaryRestriction[]; allergies: readonly Allergen[] }): boolean {
  if (opts.diet !== 'omnivore' && !d.diets.includes(opts.diet)) return false;
  if (!opts.restrictions.every((r) => d.restrictionTags.includes(r))) return false;
  if (opts.allergies.length === 0) return true;
  const present = dishAllergens(d);
  return !opts.allergies.some((a) => present.has(a));
}

/* =========================================================== daily menu */

export const PORTION_MIN = 0.5;
export const PORTION_MAX = 1.75;
export const SNACK_KCAL_CAP = 350;

export interface MenuTargets { kcal: number }
export interface MenuOptions {
  mealCount: 3 | 4 | 5;
  seed: number;
  diet: DietType;
  restrictions: readonly DietaryRestriction[];
  allergies: readonly Allergen[];
}
export interface MenuItem {
  slot: MealSlot; dishId: string; portion: number;
  kcal: number; proteinG: number; carbsG: number; fatG: number;
}
export interface DailyMenu { items: MenuItem[]; totals: { kcal: number; proteinG: number; carbsG: number; fatG: number }; missingSlots: MealSlot[] }

const SLOT_PLAN: Record<3 | 4 | 5, { slot: MealSlot; share: number }[]> = {
  3: [{ slot: 'breakfast', share: 0.27 }, { slot: 'lunch', share: 0.38 }, { slot: 'dinner', share: 0.35 }],
  4: [{ slot: 'breakfast', share: 0.25 }, { slot: 'lunch', share: 0.33 }, { slot: 'dinner', share: 0.30 }, { slot: 'snack', share: 0.12 }],
  5: [{ slot: 'breakfast', share: 0.22 }, { slot: 'snack', share: 0.10 }, { slot: 'lunch', share: 0.30 }, { slot: 'snack', share: 0.10 }, { slot: 'dinner', share: 0.28 }],
};

const roundQuarter = (x: number) => Math.round(x * 4) / 4;

function scaleItem(slot: MealSlot, dish: Dish, targetKcal: number): MenuItem {
  let portion = roundQuarter(Math.min(PORTION_MAX, Math.max(PORTION_MIN, targetKcal / dish.kcal)));
  if (slot === 'snack') {
    while (portion * dish.kcal > SNACK_KCAL_CAP && portion > PORTION_MIN) portion -= 0.25;
  }
  return {
    slot, dishId: dish.id, portion,
    kcal: Math.round(dish.kcal * portion), proteinG: Math.round(dish.proteinG * portion),
    carbsG: Math.round(dish.carbsG * portion), fatG: Math.round(dish.fatG * portion),
  };
}

function totalsOf(items: readonly MenuItem[]) {
  return items.reduce((t, i) => ({ kcal: t.kcal + i.kcal, proteinG: t.proteinG + i.proteinG, carbsG: t.carbsG + i.carbsG, fatG: t.fatG + i.fatG }), { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 });
}

export function buildDailyMenu(dishes: readonly Dish[], targets: MenuTargets, o: MenuOptions, exclude: ReadonlySet<string> = new Set()): DailyMenu {
  const rand = seededRandom(o.seed);
  const allowed = dishes.filter((d) => isDishAllowed(d, o));
  const used = new Set<string>(exclude);
  const items: MenuItem[] = [];
  const missingSlots: MealSlot[] = [];
  for (const { slot, share } of SLOT_PLAN[o.mealCount]) {
    const target = targets.kcal * share;
    const pool = allowed.filter((d) => d.slots.includes(slot) && !used.has(d.id) && (slot !== 'snack' || d.kcal * PORTION_MIN <= SNACK_KCAL_CAP));
    if (pool.length === 0) { missingSlots.push(slot); continue; }
    const ranked = pool
      .map((d) => ({ d, score: Math.abs(Math.log(target / d.kcal)) }))
      .sort((a, b) => a.score - b.score || a.d.id.localeCompare(b.d.id))
      .slice(0, 5);
    const pick = ranked[Math.floor(rand() * ranked.length)]?.d;
    if (!pick) { missingSlots.push(slot); continue; }
    used.add(pick.id);
    items.push(scaleItem(slot, pick, target));
  }
  return { items, totals: totalsOf(items), missingSlots };
}

/** Replace one item with a different allowed dish for the same slot. */
export function swapDish(dishes: readonly Dish[], menu: DailyMenu, index: number, targets: MenuTargets, o: MenuOptions): DailyMenu {
  const cur = menu.items[index];
  if (!cur) return menu;
  const used = new Set(menu.items.map((i) => i.dishId));
  const rand = seededRandom(o.seed + index + 1);
  const share = SLOT_PLAN[o.mealCount].filter((s) => s.slot === cur.slot)[0]?.share ?? 0.3;
  const pool = dishes.filter((d) => isDishAllowed(d, o) && d.slots.includes(cur.slot) && !used.has(d.id) && (cur.slot !== 'snack' || d.kcal * PORTION_MIN <= SNACK_KCAL_CAP));
  if (pool.length === 0) return menu;
  const pick = pool[Math.floor(rand() * pool.length)];
  if (!pick) return menu;
  const items = menu.items.map((it, i) => (i === index ? scaleItem(cur.slot, pick, targets.kcal * share) : it));
  return { items, totals: totalsOf(items), missingSlots: menu.missingSlots };
}

/* ======================================================== shopping list */

export interface ShoppingLine { key: string; nameHe: string; nameEn: string; grams: number }

export function buildShoppingList(menus: readonly DailyMenu[], dishById: ReadonlyMap<string, Dish>): ShoppingLine[] {
  const acc = new Map<string, ShoppingLine>();
  for (const m of menus) {
    for (const it of m.items) {
      const dish = dishById.get(it.dishId);
      if (!dish) continue;
      for (const ing of dish.ingredients) {
        const key = ing.foodId ?? normalizeText(ing.nameEn);
        const prev = acc.get(key);
        const grams = ing.grams * it.portion;
        if (prev) prev.grams += grams;
        else acc.set(key, { key, nameHe: ing.nameHe, nameEn: ing.nameEn, grams });
      }
    }
  }
  return [...acc.values()].map((l) => ({ ...l, grams: Math.round(l.grams) })).sort((a, b) => a.nameEn.localeCompare(b.nameEn));
}
