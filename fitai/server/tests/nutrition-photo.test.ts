import { randomBytes } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { todayInTimeZone } from '@shared/dates';
import type { PhotoAnalysisDTO } from '@shared/types';
import { config } from '../src/config';
import { db } from '../src/db/pool';
import { disableLlm, startFakeLlm, useFakeLlm, type FakeLlm, type FakeLlmRequest } from './helpers/fakeLlm';
import { onboardedUser, startTestServer, type TestClient, type TestServer } from './helpers/server';

let server: TestServer;
let fake: FakeLlm;
let user: TestClient;
const savedLimit = config.ai.photoDailyLimit;

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), randomBytes(300)]);
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), randomBytes(300)]);
const WEBP = Buffer.concat([Buffer.from('RIFF'), Buffer.from([0x10, 0, 0, 0]), Buffer.from('WEBPVP8 '), randomBytes(300)]);

const photo = (img: Buffer, mediaType = 'image/png', extra: Record<string, unknown> = {}) => ({ imageBase64: img.toString('base64'), mediaType, ...extra });

const GOOD_REPLY = {
  items: [
    { name: 'grilled chicken breast', estimatedGrams: 150.4, matchQuery: 'chicken breast', per100g: { kcal: 165, protein: 31, carbs: 0, fat: 3.6 }, confidence: 'medium' },
    { name: 'white rice', estimatedGrams: 180, matchQuery: 'white rice', per100g: { kcal: 130, protein: 2.7, carbs: 28, fat: 0.3 }, confidence: 'high' },
    { name: 'zqxvy alien sauce', estimatedGrams: 20, matchQuery: 'zqxvy', per100g: { kcal: 300, protein: 1, carbs: 10, fat: 28 }, confidence: 'low' },
  ],
  notes: ['Portion of rice partly hidden.'],
};

const usageCount = async (c: TestClient) =>
  (await db.one<{ n: number }>("SELECT count(*)::int AS n FROM ai_usage_events WHERE user_id = $1 AND kind = 'photo_analysis'", [c.userId])).n;

beforeAll(async () => {
  server = await startTestServer();
  fake = await startFakeLlm();
  useFakeLlm(fake.url);
  user = await onboardedUser(server.baseUrl);
});
afterEach(() => {
  config.ai.photoDailyLimit = savedLimit;
  useFakeLlm(fake.url);
});
afterAll(async () => {
  disableLlm();
  await fake.close();
  await server.close();
  await db.close();
});

describe('meal photo analysis', () => {
  it('returns 503 ai_not_configured without an AI key', async () => {
    disableLlm();
    const res = await user.post('/api/nutrition/photo-analysis', photo(PNG));
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('ai_not_configured');
  });

  it('analyses a photo with a FOOD_PHOTO prompt, matches items to the database and logs nothing', async () => {
    const c = await onboardedUser(server.baseUrl);
    let seen: FakeLlmRequest | null = null;
    fake.setHandler((req) => {
      seen = req;
      return { kind: 'json', data: GOOD_REPLY };
    });
    const res = await c.post('/api/nutrition/photo-analysis', photo(JPEG, 'image/jpeg', { mealType: 'lunch' }));
    expect(res.status).toBe(200);
    const body: PhotoAnalysisDTO = res.body;
    expect(body.items).toHaveLength(3);
    expect(body.items[0]).toMatchObject({ name: 'grilled chicken breast', estimatedGrams: 150, confidence: 'medium', estimatedPer100g: { kcal: 165, protein: 31, carbs: 0, fat: 3.6 } });
    // "grilled" in the item name picks the cooked variant over the (shorter) raw one.
    expect(body.items[0]!.match?.slug).toBe('chicken_breast_cooked');
    expect(body.items[1]!.match?.name.en.toLowerCase()).toContain('rice');
    expect(body.items[2]!.match).toBeNull();
    expect(body.notes).toEqual(['Portion of rice partly hidden.']);
    expect(body.model).toBe(config.ai.model);

    const req = seen as unknown as FakeLlmRequest;
    expect(String(req.system).startsWith('FOOD_PHOTO\n')).toBe(true);
    expect(req.output_config?.format?.type).toBe('json_schema');
    const schema = req.output_config!.format!.schema as { additionalProperties: boolean; required: string[] };
    expect(schema.additionalProperties).toBe(false);
    expect(schema.required).toEqual(['items', 'notes']);
    const content = req.messages[0]!.content as { type: string; source?: { media_type: string; data: string } }[];
    expect(content[0]).toMatchObject({ type: 'image', source: { media_type: 'image/jpeg', data: JPEG.toString('base64') } });
    expect(content[1]!.type).toBe('text');

    const day = await c.get(`/api/nutrition/day?date=${todayInTimeZone('UTC')}`);
    expect(day.body.totals.kcal).toBe(0);
    expect(await usageCount(c)).toBe(1);
    // The image is never stored.
    const stored = await db.many("SELECT 1 FROM food_log_entries WHERE user_id = $1", [c.userId]);
    expect(stored).toEqual([]);
  });

  it('accepts PNG and WEBP when the content matches the declared type', async () => {
    fake.setHandler(() => ({ kind: 'json', data: { items: [], notes: ['No food visible.'] } }));
    expect((await user.post('/api/nutrition/photo-analysis', photo(PNG, 'image/png'))).status).toBe(200);
    expect((await user.post('/api/nutrition/photo-analysis', photo(WEBP, 'image/webp'))).status).toBe(200);
  });

  it('rejects invalid images with 422 invalid_image (and does not call the model)', async () => {
    const before = fake.requests.length;
    const mismatched = await user.post('/api/nutrition/photo-analysis', photo(JPEG, 'image/png'));
    expect(mismatched.status).toBe(422);
    expect(mismatched.body.error.code).toBe('invalid_image');
    const notBase64 = await user.post('/api/nutrition/photo-analysis', { imageBase64: '%%%'.repeat(50), mediaType: 'image/png' });
    expect(notBase64.body.error.code).toBe('invalid_image');
    const tooBig = Buffer.concat([JPEG, Buffer.alloc(5 * 1024 * 1024)]);
    const big = await user.post('/api/nutrition/photo-analysis', photo(tooBig, 'image/jpeg'));
    expect(big.status).toBe(422);
    expect(big.body.error.code).toBe('invalid_image');
    expect(fake.requests.length).toBe(before);
    expect((await user.post('/api/nutrition/photo-analysis', photo(PNG, 'image/gif'))).status).toBe(400);
    expect((await user.post('/api/nutrition/photo-analysis', { mediaType: 'image/png' })).status).toBe(400);
  });

  it('maps a refusal to 422 ai_refused', async () => {
    fake.setHandler(() => ({ kind: 'refusal' }));
    const res = await user.post('/api/nutrition/photo-analysis', photo(PNG));
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('ai_refused');
  });

  it('maps invalid model output to 502 ai_bad_response', async () => {
    fake.setHandler(() => ({ kind: 'json', data: { items: [{ ...GOOD_REPLY.items[0], estimatedGrams: 99999 }], notes: [] } }));
    const outOfRange = await user.post('/api/nutrition/photo-analysis', photo(PNG));
    expect(outOfRange.status).toBe(502);
    expect(outOfRange.body.error.code).toBe('ai_bad_response');
    fake.setHandler(() => ({ kind: 'text', text: 'not json at all' }));
    expect((await user.post('/api/nutrition/photo-analysis', photo(PNG))).body.error.code).toBe('ai_bad_response');
    fake.setHandler(() => ({ kind: 'json', data: { items: Array.from({ length: 13 }, () => GOOD_REPLY.items[0]), notes: [] } }));
    expect((await user.post('/api/nutrition/photo-analysis', photo(PNG))).body.error.code).toBe('ai_bad_response');
  });

  it('maps provider outages to 503 and does not charge the quota for them', async () => {
    const c = await onboardedUser(server.baseUrl);
    fake.setHandler(() => ({ kind: 'error', status: 500 }));
    const down = await c.post('/api/nutrition/photo-analysis', photo(PNG));
    expect(down.status).toBe(503);
    expect(down.body.error.code).toBe('ai_unavailable');
    fake.setHandler(() => ({ kind: 'error', status: 429, type: 'rate_limit_error' }));
    const limited = await c.post('/api/nutrition/photo-analysis', photo(PNG));
    expect(limited.status).toBe(503);
    expect(limited.body.error.code).toBe('ai_rate_limited');
    expect(await usageCount(c)).toBe(0);
  });

  it('enforces the per-user daily quota with 429 quota_exceeded', async () => {
    const c = await onboardedUser(server.baseUrl);
    const other = await onboardedUser(server.baseUrl);
    config.ai.photoDailyLimit = 2;
    fake.setHandler(() => ({ kind: 'json', data: GOOD_REPLY }));
    expect((await c.post('/api/nutrition/photo-analysis', photo(PNG))).status).toBe(200);
    expect((await c.post('/api/nutrition/photo-analysis', photo(PNG))).status).toBe(200);
    const third = await c.post('/api/nutrition/photo-analysis', photo(PNG));
    expect(third.status).toBe(429);
    expect(third.body.error.code).toBe('quota_exceeded');
    expect(Number(third.headers.get('retry-after'))).toBeGreaterThan(0);
    // Quotas are per user.
    expect((await other.post('/api/nutrition/photo-analysis', photo(PNG))).status).toBe(200);
  });
});
