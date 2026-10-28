/**
 * Barcode lookup: the user's own food → global foods (built-in or cached) → Open Food
 * Facts (when enabled). Products fetched from Open Food Facts are validated, mapped to
 * our food model and cached as global `source='openfoodfacts'` foods so the next lookup
 * is local.
 */
import { z } from 'zod';
import type { Allergen, AnimalSource, FoodCategory, FoodContains } from '@shared/constants';
import { config } from '../../config';
import type { Sql } from '../../db/pool';
import { HttpError, badGateway, notFound, unprocessable } from '../../lib/errors';
import { foodSearchText, type FoodRow } from './foods';

export const OFF_FIELDS = [
  'product_name',
  'product_name_en',
  'product_name_he',
  'brands',
  'nutriments',
  'serving_quantity',
  'allergens_tags',
  'categories_tags',
  'ingredients_analysis_tags',
].join(',');

const ALLERGEN_TAGS: Record<string, Allergen> = {
  'en:gluten': 'gluten',
  'en:milk': 'dairy',
  'en:eggs': 'egg',
  'en:peanuts': 'peanut',
  'en:nuts': 'tree_nut',
  'en:soybeans': 'soy',
  'en:fish': 'fish',
  'en:crustaceans': 'shellfish',
  'en:molluscs': 'shellfish',
  'en:sesame-seeds': 'sesame',
};

/** First matching rule wins (more specific categories first). */
const CATEGORY_RULES: [RegExp, FoodCategory][] = [
  [/^en:(dietary-supplements|protein-powders|whey-proteins)/, 'supplements'],
  [/^en:(alcoholic-beverages|beers|wines|spirits)/, 'beverages'],
  [/^en:(poultries|poultry|chickens|turkeys)/, 'poultry'],
  [/^en:(fishes|fish|seafood|tunas|salmons|sardines|crustaceans|shrimps)/, 'fish_seafood'],
  [/^en:(meats|meat|hams|sausages|beef|pork|lamb|prepared-meats)/, 'meat'],
  [/^en:eggs/, 'eggs'],
  [/^en:(tofu|tempeh|meat-analogues|legumes|pulses|hummus|beans|lentils|chickpeas)/, 'plant_protein'],
  [/^en:(dairies|dairy|cheeses|yogurts|milks|fermented-milk-products|desserts-dairy)/, 'dairy'],
  [/^en:(nuts|seeds|nut-butters|peanut-butters)/, 'nuts_seeds'],
  [/^en:(fats|vegetable-oils|olive-oils|butters|margarines)/, 'fats_oils'],
  [/^en:(sauces|condiments|spreads|dressings|ketchup|mustards|mayonnaises)/, 'condiments_sauces'],
  [/^en:(snacks|sweet-snacks|salty-snacks|chocolates|biscuits|confectioneries|candies|cakes|crisps)/, 'snacks_sweets'],
  [/^en:(beverages|waters|juices|sodas|teas|coffees|plant-based-milks)/, 'beverages'],
  [/^en:(fruits|dried-fruits|fruit-based)/, 'fruits'],
  [/^en:(vegetables|vegetable-based|frozen-vegetables)/, 'vegetables'],
  [/^en:(cereals-and-potatoes|cereals|breads|pastas|rices|breakfast-cereals|flours|crackers)/, 'grains'],
  [/^en:(meals|prepared-meals|pizzas|sandwiches|soups|salads)/, 'prepared_dishes'],
];

const MEAT_CATEGORY = /^en:(meats|meat|poultries|poultry|chickens|turkeys|hams|sausages|beef|pork|lamb|prepared-meats)/;
const FISH_CATEGORY = /^en:(fishes|fish|seafood|tunas|salmons|sardines|crustaceans|shrimps)/;
const PLANT_CATEGORIES: FoodCategory[] = ['vegetables', 'fruits', 'grains', 'nuts_seeds', 'plant_protein', 'fats_oils'];

/** Zod-validated subset of an Open Food Facts v2 product. Impossible values are rejected. */
const nutrient = z.coerce.number().finite();
const offProductSchema = z.object({
  product_name: z.string().optional().nullable(),
  product_name_en: z.string().optional().nullable(),
  product_name_he: z.string().optional().nullable(),
  brands: z.string().optional().nullable(),
  serving_quantity: z.union([z.number(), z.string()]).optional().nullable(),
  allergens_tags: z.array(z.string()).optional().nullable(),
  categories_tags: z.array(z.string()).optional().nullable(),
  ingredients_analysis_tags: z.array(z.string()).optional().nullable(),
  nutriments: z.record(z.unknown()).optional().nullable(),
});

const mappedNutrientsSchema = z
  .object({
    kcal: z.number().min(0).max(900),
    protein: z.number().min(0).max(100),
    carbs: z.number().min(0).max(100),
    fat: z.number().min(0).max(100),
    fiber: z.number().min(0).max(100),
    sugar: z.number().min(0).max(100).nullable(),
    sodiumMg: z.number().min(0).max(100000).nullable(),
  })
  .refine((n) => n.protein + n.carbs + n.fat <= 105, 'macros_exceed_100g')
  .refine((n) => n.sugar == null || n.sugar <= n.carbs + 0.5, 'sugar_exceeds_carbs');

export interface MappedOffProduct {
  name: { en: string; he: string };
  brand: string | null;
  category: FoodCategory;
  per100g: z.output<typeof mappedNutrientsSchema>;
  servingGrams: number;
  allergens: Allergen[];
  animalSource: AnimalSource;
  contains: FoodContains[];
}

const round = (n: number, step: number) => Math.round(n / step) * step;
const clean = (s: string | null | undefined, max: number) =>
  (s ?? '')
    .replace(/[\u0000-\u001F\u007F<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);

function readNumber(n: Record<string, unknown>, key: string): number | null {
  const v = n[key];
  if (v === undefined || v === null || v === '') return null;
  const parsed = nutrient.safeParse(v);
  return parsed.success ? parsed.data : null;
}

/** Maps an Open Food Facts product to our food model; throws 422 `barcode_incomplete` when unusable. */
export function mapOffProduct(raw: unknown): MappedOffProduct {
  const parsed = offProductSchema.safeParse(raw);
  if (!parsed.success) throw unprocessable('barcode_incomplete', 'Product data is incomplete');
  const p = parsed.data;
  const n = (p.nutriments ?? {}) as Record<string, unknown>;

  let kcal = readNumber(n, 'energy-kcal_100g');
  if (kcal == null) {
    const kj = readNumber(n, 'energy-kj_100g');
    if (kj != null) kcal = kj / 4.184;
  }
  const protein = readNumber(n, 'proteins_100g');
  const carbs = readNumber(n, 'carbohydrates_100g');
  const fat = readNumber(n, 'fat_100g');
  const baseName = clean(p.product_name, 120) || clean(p.product_name_en, 120) || clean(p.product_name_he, 120);
  if (kcal == null || protein == null || carbs == null || fat == null || !baseName) {
    throw unprocessable('barcode_incomplete', 'Product data is incomplete (missing name, energy or macronutrients)');
  }
  const sodiumG = readNumber(n, 'sodium_100g');
  const nutrients = mappedNutrientsSchema.safeParse({
    kcal: round(kcal, 0.1),
    protein: round(protein, 0.01),
    carbs: round(carbs, 0.01),
    fat: round(fat, 0.01),
    fiber: round(readNumber(n, 'fiber_100g') ?? 0, 0.01),
    sugar: (() => {
      const s = readNumber(n, 'sugars_100g');
      return s == null ? null : round(s, 0.01);
    })(),
    sodiumMg: sodiumG == null ? null : round(sodiumG * 1000, 0.1),
  });
  if (!nutrients.success) throw unprocessable('barcode_incomplete', 'Product nutrition values are not plausible');

  const allergenTags = p.allergens_tags ?? [];
  const categoryTags = p.categories_tags ?? [];
  const analysis = p.ingredients_analysis_tags ?? [];
  const allergens = Array.from(new Set(allergenTags.map((t) => ALLERGEN_TAGS[t]).filter((a): a is Allergen => a != null)));

  let category: FoodCategory = 'prepared_dishes';
  outer: for (const tag of categoryTags) {
    for (const [re, cat] of CATEGORY_RULES) {
      if (re.test(tag)) {
        category = cat;
        break outer;
      }
    }
  }

  // Animal source: conservative — anything not positively known to be plant-based is not
  // presented as vegan/vegetarian.
  const hasMeat = categoryTags.some((t) => MEAT_CATEGORY.test(t));
  const hasFish = categoryTags.some((t) => FISH_CATEGORY.test(t)) || allergens.includes('fish') || allergens.includes('shellfish');
  let animalSource: AnimalSource;
  if (hasMeat || (analysis.includes('en:non-vegetarian') && !hasFish)) animalSource = 'meat';
  else if (hasFish) animalSource = 'fish';
  else if (analysis.includes('en:vegan')) animalSource = 'none';
  else if (analysis.includes('en:non-vegan') || analysis.includes('en:vegetarian') || allergens.includes('dairy') || allergens.includes('egg')) animalSource = 'dairy_egg';
  else {
    // Unknown status: assume it may contain animal products unless it is a plant-based category.
    animalSource = PLANT_CATEGORIES.includes(category) ? 'none' : 'dairy_egg';
  }

  const contains = new Set<FoodContains>();
  if (allergens.includes('gluten')) contains.add('gluten');
  if (allergens.includes('dairy')) contains.add('lactose');
  if (allergens.includes('shellfish')) contains.add('shellfish');
  if (categoryTags.some((t) => /^en:(pork|hams|bacon)/.test(t))) contains.add('pork');
  if (categoryTags.some((t) => /^en:beef/.test(t))) contains.add('beef');
  if (categoryTags.some((t) => /^en:(alcoholic-beverages|beers|wines|spirits)/.test(t))) contains.add('alcohol');

  const servingRaw = p.serving_quantity == null ? NaN : Number(p.serving_quantity);
  const servingGrams = Number.isFinite(servingRaw) && servingRaw > 0 && servingRaw <= 2000 ? round(servingRaw, 0.1) : 100;

  return {
    name: {
      en: clean(p.product_name_en, 120) || baseName,
      he: clean(p.product_name_he, 120) || baseName,
    },
    brand: clean(p.brands?.split(',')[0], 80) || null,
    category,
    per100g: nutrients.data,
    servingGrams,
    allergens,
    animalSource,
    contains: Array.from(contains),
  };
}

/** Fetches a product from Open Food Facts. 404 → not found; network/timeout/5xx → 502. */
export async function fetchOffProduct(code: string): Promise<unknown> {
  const url = `${config.openFoodFacts.baseUrl.replace(/\/+$/, '')}/api/v2/product/${encodeURIComponent(code)}.json?fields=${OFF_FIELDS}`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { 'User-Agent': config.openFoodFacts.userAgent, Accept: 'application/json' },
      signal: AbortSignal.timeout(config.openFoodFacts.timeoutMs),
      redirect: 'follow',
    });
  } catch {
    throw badGateway('barcode_lookup_failed', 'Could not reach the product database');
  }
  if (res.status === 404) throw notFound('barcode_not_found', 'No product with this barcode');
  if (!res.ok) throw badGateway('barcode_lookup_failed', `Product database error (${res.status})`);
  let body: { status?: number; product?: unknown } | null;
  try {
    body = (await res.json()) as { status?: number; product?: unknown } | null;
  } catch {
    throw badGateway('barcode_lookup_failed', 'Product database returned an invalid response');
  }
  if (!body || body.status === 0 || !body.product || typeof body.product !== 'object') {
    throw notFound('barcode_not_found', 'No product with this barcode');
  }
  return body.product;
}

/** Local lookup: the user's own food first, then any global food with that barcode. */
export async function findLocalByBarcode(sql: Sql, userId: string, code: string): Promise<FoodRow | null> {
  return sql.maybeOne<FoodRow>(
    `SELECT f.* FROM foods f
      WHERE f.barcode = $1 AND (f.owner_user_id = $2 OR f.owner_user_id IS NULL)
      ORDER BY (f.owner_user_id IS NULL), f.updated_at DESC
      LIMIT 1`,
    [code, userId],
  );
}

/** Caches a mapped product as a global food (race-safe on the unique global barcode index). */
export async function cacheOffProduct(sql: Sql, code: string, p: MappedOffProduct): Promise<FoodRow> {
  await sql.exec(
    `INSERT INTO foods (owner_user_id, source, name, brand, barcode, category, kcal, protein_g, carbs_g, fat_g, fiber_g, sugar_g,
        sodium_mg, serving_grams, serving_label, allergens, animal_source, contains, search_text)
     VALUES (NULL, 'openfoodfacts', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
     ON CONFLICT (barcode) WHERE owner_user_id IS NULL AND barcode IS NOT NULL DO NOTHING`,
    [
      JSON.stringify(p.name),
      p.brand,
      code,
      p.category,
      p.per100g.kcal,
      p.per100g.protein,
      p.per100g.carbs,
      p.per100g.fat,
      p.per100g.fiber,
      p.per100g.sugar,
      p.per100g.sodiumMg,
      p.servingGrams,
      JSON.stringify({ en: '', he: '' }),
      p.allergens,
      p.animalSource,
      p.contains,
      foodSearchText(p.name.en, p.name.he !== p.name.en ? p.name.he : null, p.brand),
    ],
  );
  return sql.one<FoodRow>('SELECT f.* FROM foods f WHERE f.barcode = $1 AND f.owner_user_id IS NULL', [code]);
}

export async function lookupBarcode(sql: Sql, userId: string, code: string): Promise<FoodRow> {
  const local = await findLocalByBarcode(sql, userId, code);
  if (local) return local;
  if (!config.openFoodFacts.enabled) throw notFound('barcode_not_found', 'No product with this barcode');
  const raw = await fetchOffProduct(code);
  const mapped = mapOffProduct(raw);
  try {
    return await cacheOffProduct(sql, code, mapped);
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw badGateway('barcode_lookup_failed', 'Could not store the product');
  }
}
