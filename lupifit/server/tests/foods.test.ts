import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { todayInTimeZone } from '@shared/dates';
import type { FoodDTO } from '@shared/types';
import { config } from '../src/config';
import { db } from '../src/db/pool';
import { onboardedUser, startTestServer, type TestClient, type TestServer } from './helpers/server';

let server: TestServer;
let omni: TestClient;
let veggie: TestClient; // vegetarian, sesame allergy, gluten-free
let other: TestClient;
const today = todayInTimeZone('UTC');

const idOf = async (slug: string) => (await db.one<{ id: string }>('SELECT id FROM foods WHERE slug = $1', [slug])).id;
const search = async (c: TestClient, params: Record<string, string>) => {
  const res = await c.get(`/api/foods/search?${new URLSearchParams(params)}`);
  expect(res.status).toBe(200);
  return res.body.foods as FoodDTO[];
};

const CUSTOM = {
  name: 'Zorblax protein bar',
  brand: 'Acme',
  category: 'snacks_sweets',
  per100g: { kcal: 380, protein: 33, carbs: 35, fat: 12, fiber: 6 },
  servingGrams: 60,
  servingLabel: '1 bar',
  allergens: ['dairy', 'soy'],
  animalSource: 'dairy_egg',
  contains: ['lactose'],
};

beforeAll(async () => {
  server = await startTestServer();
  omni = await onboardedUser(server.baseUrl);
  veggie = await onboardedUser(server.baseUrl, { diet_type: 'vegetarian', allergies: ['sesame'], dietary_restrictions: ['gluten_free'] });
  other = await onboardedUser(server.baseUrl);
});
afterAll(async () => {
  await server.close();
  await db.close();
});

describe('food search', () => {
  it('finds foods in English, including partial words, ranking word-prefix matches first', async () => {
    const chickenId = await idOf('chicken_breast_cooked');
    const exact = await search(omni, { q: 'chicken breast' });
    expect(exact[0]!.name.en.toLowerCase().startsWith('chicken breast')).toBe(true);
    expect(exact.some((f) => f.id === chickenId)).toBe(true);
    const partial = await search(omni, { q: 'chick' });
    expect(partial.some((f) => f.id === chickenId)).toBe(true);
    for (const f of partial.slice(0, 3)) expect(f.name.en.toLowerCase()).toMatch(/\bchick/);
    const rice = await search(omni, { q: 'rice' });
    expect(rice.length).toBeGreaterThan(2);
    expect(rice[0]!.name.en.toLowerCase()).toMatch(/(^|\W)rice/);
    const typo = await search(omni, { q: 'chiken breast' });
    expect(typo.some((f) => f.id === chickenId)).toBe(true);
    expect(await search(omni, { q: 'zzqqxxyy' })).toEqual([]);
  });

  it('finds foods in Hebrew (full and partial words)', async () => {
    const chickenId = await idOf('chicken_breast_cooked');
    const he = await search(omni, { q: 'חזה עוף' });
    expect(he.some((f) => f.id === chickenId)).toBe(true);
    const partial = await search(omni, { q: 'טחינ' });
    expect(partial.some((f) => f.slug === 'tahini_raw')).toBe(true);
  });

  it('filters by category and respects the limit', async () => {
    const grains = await search(omni, { q: '', category: 'grains', limit: '5' });
    expect(grains).toHaveLength(5);
    for (const f of grains) expect(f.category).toBe('grains');
    expect((await omni.get('/api/foods/search?limit=100')).status).toBe(400);
    expect((await omni.get('/api/foods/search?category=pizza')).status).toBe(400);
  });

  it('flags conflicts with allergies, diet and restrictions, and compatibleOnly hides them', async () => {
    const tahini = (await search(veggie, { q: 'tahini' })).find((f) => f.slug === 'tahini_raw')!;
    expect(tahini.conflicts).toEqual([{ type: 'allergen', value: 'sesame' }]);
    const chicken = (await search(veggie, { q: 'chicken breast' })).find((f) => f.slug === 'chicken_breast_cooked')!;
    expect(chicken.conflicts).toEqual([{ type: 'diet', value: 'vegetarian' }]);
    const bread = (await search(veggie, { q: 'white bread' })).find((f) => f.slug === 'bread_white')!;
    expect(bread.conflicts).toEqual([{ type: 'restriction', value: 'gluten_free' }]);
    // Same foods are fine for an omnivore without allergies.
    expect((await search(omni, { q: 'tahini' })).find((f) => f.slug === 'tahini_raw')!.conflicts).toEqual([]);

    for (const q of ['tahini', 'chicken', 'bread', '']) {
      const compatible = await search(veggie, { q, compatibleOnly: 'true', limit: '50' });
      for (const f of compatible) expect(f.conflicts, `${q}: ${f.name.en}`).toEqual([]);
    }
    expect((await search(veggie, { q: 'tahini', compatibleOnly: 'true' })).some((f) => f.slug === 'tahini_raw')).toBe(false);
  });

  it("shows the user's frequent foods first when the query is empty", async () => {
    const c = await onboardedUser(server.baseUrl);
    const lentils = await idOf('lentils_cooked');
    for (let i = 0; i < 2; i++) await c.post('/api/nutrition/logs', { date: today, mealType: 'lunch', foodId: lentils, grams: 100 });
    const popular = await search(c, { q: '' });
    expect(popular[0]!.id).toBe(lentils);
    expect(popular.length).toBe(20);
    // Default list shows variety across categories.
    expect(new Set(popular.map((f) => f.category)).size).toBeGreaterThan(3);
  });
});

describe('custom foods', () => {
  it('creates, reads, updates and deletes own foods', async () => {
    const c = await onboardedUser(server.baseUrl);
    const created = await c.post('/api/foods', CUSTOM);
    expect(created.status).toBe(201);
    const food: FoodDTO = created.body.food;
    expect(food).toMatchObject({
      source: 'user',
      isOwn: true,
      slug: null,
      name: { en: CUSTOM.name, he: CUSTOM.name },
      brand: 'Acme',
      serving: { grams: 60, label: { en: '1 bar', he: '1 bar' } },
      per100g: { kcal: 380, protein: 33, carbs: 35, fat: 12, fiber: 6, sugar: null, sodiumMg: null },
      allergens: ['dairy', 'soy'],
      animalSource: 'dairy_egg',
      contains: ['lactose'],
    });
    expect((await search(c, { q: 'zorblax' }))[0]!.id).toBe(food.id);
    expect((await c.get('/api/foods/mine')).body.foods.map((f: FoodDTO) => f.id)).toEqual([food.id]);

    const patched = await c.patch(`/api/foods/${food.id}`, { name: 'Quuxberry bar', servingGrams: 50 });
    expect(patched.status).toBe(200);
    expect(patched.body.food).toMatchObject({ name: { en: 'Quuxberry bar' }, serving: { grams: 50 }, per100g: { kcal: 380 }, brand: 'Acme' });
    expect((await search(c, { q: 'quuxberry' })).map((f) => f.id)).toEqual([food.id]);
    expect(await search(c, { q: 'zorblax' })).toEqual([]);

    expect((await c.delete(`/api/foods/${food.id}`)).status).toBe(200);
    expect((await c.get(`/api/foods/${food.id}`)).status).toBe(404);
  });

  it('validates custom foods', async () => {
    const bad = [
      { ...CUSTOM, per100g: { kcal: 380, protein: 60, carbs: 40, fat: 10 } },
      { ...CUSTOM, per100g: { kcal: 950, protein: 1, carbs: 1, fat: 1 } },
      { ...CUSTOM, name: '   ' },
      { ...CUSTOM, servingGrams: 0 },
      { ...CUSTOM, barcode: '12ab' },
      { ...CUSTOM, allergens: ['gluten', 'unicorn'] },
    ];
    for (const body of bad) expect((await omni.post('/api/foods', body)).status, JSON.stringify(body)).toBe(400);
    const res = await omni.post('/api/foods', bad[0]);
    expect(res.body.error.details.issues[0].message).toBe('macros_exceed_100g');
    expect((await omni.patch(`/api/foods/${await idOf('rice_white_cooked')}`, { name: 'Hacked rice' })).status).toBe(404);
    expect((await omni.delete(`/api/foods/${await idOf('rice_white_cooked')}`)).status).toBe(404);
  });

  it("isolates users: B cannot see, search, log, edit or delete A's food", async () => {
    const a = await onboardedUser(server.baseUrl);
    const b = await onboardedUser(server.baseUrl);
    const { body } = await a.post('/api/foods', { ...CUSTOM, name: 'Secretfood Kugel' });
    const id = body.food.id;
    expect((await b.get(`/api/foods/${id}`)).status).toBe(404);
    expect((await b.get(`/api/foods/${id}`)).body.error.code).toBe('food_not_found');
    expect(await search(b, { q: 'secretfood' })).toEqual([]);
    expect((await b.post('/api/nutrition/logs', { date: today, mealType: 'lunch', foodId: id, grams: 100 })).status).toBe(404);
    expect((await b.post('/api/nutrition/saved-meals', { name: 'x', items: [{ foodId: id, grams: 10 }] })).status).toBe(404);
    expect((await b.patch(`/api/foods/${id}`, { name: 'Mine now' })).status).toBe(404);
    expect((await b.delete(`/api/foods/${id}`)).status).toBe(404);
    expect((await b.get(`/api/foods/${id}/alternatives`)).status).toBe(404);
    expect((await b.get('/api/foods/mine')).body.foods).toEqual([]);
    // A still has it, unchanged.
    expect((await a.get(`/api/foods/${id}`)).body.food.name.en).toBe('Secretfood Kugel');
  });
});

describe('alternatives', () => {
  it('returns compatible protein swaps for a vegetarian, excluding the food itself', async () => {
    const chickenId = await idOf('chicken_breast_cooked');
    const res = await veggie.get(`/api/foods/${chickenId}/alternatives`);
    expect(res.status).toBe(200);
    const alts: FoodDTO[] = res.body.alternatives;
    expect(alts.length).toBeGreaterThan(0);
    for (const f of alts) {
      expect(f.conflicts).toEqual([]);
      expect(f.id).not.toBe(chickenId);
      expect(['none', 'dairy_egg']).toContain(f.animalSource);
    }
    expect(alts.some((f) => f.category === 'plant_protein' || f.category === 'eggs' || f.category === 'dairy')).toBe(true);
    expect(alts.some((f) => f.slug === 'seitan')).toBe(false); // gluten-free restriction
  });

  it('keeps alternatives in the same category with the closest kcal & protein', async () => {
    const riceId = await idOf('rice_white_cooked');
    const alts: FoodDTO[] = (await omni.get(`/api/foods/${riceId}/alternatives`)).body.alternatives;
    expect(alts.length).toBeGreaterThan(2);
    for (const f of alts) expect(f.category).toBe('grains');
    expect(alts.some((f) => f.id === riceId)).toBe(false);
    // Closest first: the top alternative is within 60 kcal per 100 g of white rice.
    expect(Math.abs(alts[0]!.per100g.kcal - 130)).toBeLessThan(60);
    const soyAllergic = await onboardedUser(server.baseUrl, { allergies: ['soy'] });
    const chickenAlts: FoodDTO[] = (await soyAllergic.get(`/api/foods/${await idOf('chicken_breast_cooked')}/alternatives`)).body.alternatives;
    expect(chickenAlts.some((f) => f.allergens.includes('soy'))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Barcode lookup
// ---------------------------------------------------------------------------

interface OffRequest {
  url: string;
  userAgent: string | undefined;
}

const randomBarcode = () => `7${String(Date.now()).slice(-7)}${String(Math.floor(Math.random() * 1e5)).padStart(5, '0')}`;

describe('barcode lookup', () => {
  let off: http.Server;
  let offUrl: string;
  const requests: OffRequest[] = [];
  const products = new Map<string, { status: number; body?: unknown; hangMs?: number }>();
  const saved = { ...config.openFoodFacts };

  beforeAll(async () => {
    off = http.createServer((req, res) => {
      requests.push({ url: req.url ?? '', userAgent: req.headers['user-agent'] });
      const code = /\/api\/v2\/product\/(\d+)\.json/.exec(req.url ?? '')?.[1] ?? '';
      const p = products.get(code) ?? { status: 404, body: { status: 0, status_verbose: 'product not found' } };
      const send = () => {
        res.writeHead(p.status, { 'content-type': 'application/json' });
        res.end(JSON.stringify(p.body ?? {}));
      };
      if (p.hangMs) setTimeout(send, p.hangMs);
      else send();
    });
    await new Promise<void>((r) => off.listen(0, '127.0.0.1', r));
    offUrl = `http://127.0.0.1:${(off.address() as AddressInfo).port}`;
  });
  afterEach(() => {
    Object.assign(config.openFoodFacts, saved);
  });
  afterAll(async () => {
    off.closeAllConnections();
    await new Promise<void>((r) => off.close(() => r()));
  });

  const enable = (overrides: Partial<typeof config.openFoodFacts> = {}) =>
    Object.assign(config.openFoodFacts, { enabled: true, baseUrl: offUrl, userAgent: 'LUPU-FIT-test/1.0', timeoutMs: 2000 }, overrides);

  it("finds the user's own food first, then global foods, without calling Open Food Facts", async () => {
    enable();
    const code = randomBarcode();
    await db.exec(
      `INSERT INTO foods (source, name, barcode, category, kcal, protein_g, carbs_g, fat_g, serving_grams, serving_label, search_text)
       VALUES ('openfoodfacts', '{"en":"Global cereal","he":"דגני בוקר"}', $1, 'grains', 370, 8, 80, 2, 30, '{"en":"","he":""}', 'global cereal')`,
      [code],
    );
    const before = requests.length;
    const global = await omni.get(`/api/foods/barcode/${code}`);
    expect(global.status).toBe(200);
    expect(global.body.food).toMatchObject({ name: { en: 'Global cereal' }, isOwn: false, source: 'openfoodfacts' });
    const own = await omni.post('/api/foods', { ...CUSTOM, name: 'My own cereal', barcode: code });
    const mine = await omni.get(`/api/foods/barcode/${code}`);
    expect(mine.body.food).toMatchObject({ id: own.body.food.id, isOwn: true });
    // Other users never see someone else's food — they get the global one.
    expect((await other.get(`/api/foods/barcode/${code}`)).body.food.name.en).toBe('Global cereal');
    expect(requests.length).toBe(before);
  });

  it('fetches from Open Food Facts, maps nutrients/allergens and caches the product globally', async () => {
    enable();
    const code = randomBarcode();
    products.set(code, {
      status: 200,
      body: {
        status: 1,
        code,
        product: {
          product_name: 'Hummus Classic',
          product_name_he: 'חומוס קלאסי',
          brands: 'Sabra, Strauss',
          serving_quantity: '50',
          allergens_tags: ['en:sesame-seeds', 'en:gluten', 'en:milk', 'en:unknown-thing'],
          categories_tags: ['en:plant-based-foods', 'en:spreads', 'en:hummus'],
          ingredients_analysis_tags: ['en:non-vegan', 'en:vegetarian'],
          nutriments: {
            'energy-kcal_100g': 266.4,
            proteins_100g: 7.9,
            carbohydrates_100g: 14.31,
            fat_100g: 19.7,
            fiber_100g: '6',
            sugars_100g: 0.5,
            sodium_100g: 0.48,
          },
        },
      },
    });
    const res = await omni.get(`/api/foods/barcode/${code}`);
    expect(res.status).toBe(200);
    const food: FoodDTO = res.body.food;
    expect(food).toMatchObject({
      source: 'openfoodfacts',
      barcode: code,
      name: { en: 'Hummus Classic', he: 'חומוס קלאסי' },
      brand: 'Sabra',
      category: 'condiments_sauces',
      per100g: { kcal: 266.4, protein: 7.9, carbs: 14.31, fat: 19.7, fiber: 6, sugar: 0.5, sodiumMg: 480 },
      serving: { grams: 50 },
      animalSource: 'dairy_egg',
      isOwn: false,
    });
    expect(food.allergens.sort()).toEqual(['dairy', 'gluten', 'sesame']);
    expect(food.contains.sort()).toEqual(['gluten', 'lactose']);
    const req = requests.at(-1)!;
    expect(req.url).toContain(`/api/v2/product/${code}.json?fields=`);
    for (const f of ['product_name', 'product_name_en', 'product_name_he', 'brands', 'nutriments', 'serving_quantity', 'allergens_tags', 'categories_tags']) {
      expect(req.url).toContain(f);
    }
    expect(req.userAgent).toBe('LUPU-FIT-test/1.0');

    // Cached: second lookup (even by another user) is local.
    const count = requests.length;
    const again = await other.get(`/api/foods/barcode/${code}`);
    expect(again.body.food.id).toBe(food.id);
    expect(requests.length).toBe(count);
    const veg = await veggie.get(`/api/foods/barcode/${code}`);
    expect(veg.body.food.conflicts).toEqual(expect.arrayContaining([{ type: 'allergen', value: 'sesame' }, { type: 'restriction', value: 'gluten_free' }]));
    // Cached products are searchable.
    expect((await search(omni, { q: 'hummus classic' })).some((f) => f.id === food.id)).toBe(true);
  });

  it('returns 404 when the product does not exist and 422 when data is incomplete or implausible', async () => {
    enable();
    const missing = await omni.get(`/api/foods/barcode/${randomBarcode()}`);
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe('barcode_not_found');

    const statusZero = randomBarcode();
    products.set(statusZero, { status: 200, body: { status: 0 } });
    expect((await omni.get(`/api/foods/barcode/${statusZero}`)).body.error.code).toBe('barcode_not_found');

    const incomplete = randomBarcode();
    products.set(incomplete, { status: 200, body: { status: 1, product: { product_name: 'Mystery', nutriments: { proteins_100g: 3, fat_100g: 1 } } } });
    const inc = await omni.get(`/api/foods/barcode/${incomplete}`);
    expect(inc.status).toBe(422);
    expect(inc.body.error.code).toBe('barcode_incomplete');

    const impossible = randomBarcode();
    products.set(impossible, {
      status: 200,
      body: { status: 1, product: { product_name: 'Broken', nutriments: { 'energy-kcal_100g': 2500, proteins_100g: 80, carbohydrates_100g: 80, fat_100g: 80 } } },
    });
    expect((await omni.get(`/api/foods/barcode/${impossible}`)).body.error.code).toBe('barcode_incomplete');
    const stored = await db.many('SELECT id FROM foods WHERE barcode = ANY($1::text[])', [[incomplete, impossible]]);
    expect(stored).toEqual([]);
  });

  it('returns 502 on upstream errors, network failures and timeouts', async () => {
    enable();
    const err = randomBarcode();
    products.set(err, { status: 503, body: { error: 'down' } });
    const upstream = await omni.get(`/api/foods/barcode/${err}`);
    expect(upstream.status).toBe(502);
    expect(upstream.body.error.code).toBe('barcode_lookup_failed');

    enable({ baseUrl: 'http://127.0.0.1:1' });
    const network = await omni.get(`/api/foods/barcode/${randomBarcode()}`);
    expect(network.status).toBe(502);
    expect(network.body.error.code).toBe('barcode_lookup_failed');

    const slow = randomBarcode();
    products.set(slow, { status: 200, hangMs: 1500, body: { status: 0 } });
    enable({ timeoutMs: 200 });
    const timeout = await omni.get(`/api/foods/barcode/${slow}`);
    expect(timeout.status).toBe(502);
    expect(timeout.body.error.code).toBe('barcode_lookup_failed');
  });

  it('only looks up locally when Open Food Facts is disabled, and validates the code', async () => {
    Object.assign(config.openFoodFacts, { enabled: false, baseUrl: offUrl });
    const code = randomBarcode();
    products.set(code, { status: 200, body: { status: 1, product: { product_name: 'Should not be fetched', nutriments: { 'energy-kcal_100g': 100, proteins_100g: 1, carbohydrates_100g: 1, fat_100g: 1 } } } });
    const before = requests.length;
    const res = await omni.get(`/api/foods/barcode/${code}`);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('barcode_not_found');
    expect(requests.length).toBe(before);
    expect((await omni.get('/api/foods/barcode/12345')).status).toBe(400);
    expect((await omni.get('/api/foods/barcode/123456789012345')).status).toBe(400);
    expect((await omni.get('/api/foods/barcode/12345abc')).status).toBe(400);
  });
});
