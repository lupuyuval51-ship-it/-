/**
 * Meal-photo analysis through the server-side LLM adapter. The image is validated
 * (size + magic bytes), sent once to the model and never stored. The model returns
 * structured estimates that are validated with zod and matched to the food database;
 * nothing is logged automatically — the user reviews every item first.
 */
import { z } from 'zod';
import type { Locale, MealType } from '@shared/constants';
import type { DietPreferences } from '@shared/nutrition';
import type { PhotoAnalysisDTO, PhotoAnalysisItemDTO } from '@shared/types';
import { LlmError, generateJson, isLlmConfigured, type ImageMediaType, type LlmJsonResult } from '../../ai/llm';
import { config } from '../../config';
import { db, type Sql } from '../../db/pool';
import { HttpError, badGateway, serviceUnavailable, unprocessable } from '../../lib/errors';
import { bestMatch } from './foods';

export const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const PHOTO_USAGE_KIND = 'photo_analysis';

export const FOOD_PHOTO_SYSTEM_PROMPT = [
  'FOOD_PHOTO',
  'You analyse a single photo of a meal for a nutrition-tracking app. The user will review and edit everything you return before anything is logged.',
  'Rules:',
  '- List only foods and drinks that are clearly visible. Never guess hidden ingredients (oil, butter, sugar, sauces inside the dish) and never invent items.',
  '- Estimate the edible weight of each item in grams conservatively, using plate size, utensils and typical portions as reference.',
  '- Give typical nutrition values per 100 g for each item as served (kcal, protein, carbs, fat in grams).',
  '- confidence is "high" only when the food and portion are unambiguous, "low" when the identification or portion is uncertain.',
  '- name: a short, specific English name (e.g. "grilled chicken breast", "white rice").',
  '- matchQuery: 1–3 plain English words for searching a food database (e.g. "chicken breast", "rice").',
  '- notes: up to 3 short, practical notes about uncertainty (e.g. portion hidden, sauce not visible), written in the language requested by the user.',
  '- If the photo does not show food, return an empty items list and explain in notes.',
  'Return only JSON matching the schema.',
].join('\n');

const photoItemSchema = z.object({
  name: z.string().trim().min(1).max(80),
  estimatedGrams: z.number().min(1).max(2000),
  matchQuery: z.string().trim().min(1).max(80),
  per100g: z.object({
    kcal: z.number().min(0).max(900),
    protein: z.number().min(0).max(100),
    carbs: z.number().min(0).max(100),
    fat: z.number().min(0).max(100),
  }),
  confidence: z.enum(['low', 'medium', 'high']),
});

export const photoResultSchema = z.object({
  items: z.array(photoItemSchema).max(12),
  notes: z.array(z.string().trim().max(400)).max(10),
});

export const PHOTO_JSON_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  required: ['items', 'notes'],
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'estimatedGrams', 'matchQuery', 'per100g', 'confidence'],
        properties: {
          name: { type: 'string' },
          estimatedGrams: { type: 'number' },
          matchQuery: { type: 'string' },
          per100g: {
            type: 'object',
            additionalProperties: false,
            required: ['kcal', 'protein', 'carbs', 'fat'],
            properties: {
              kcal: { type: 'number' },
              protein: { type: 'number' },
              carbs: { type: 'number' },
              fat: { type: 'number' },
            },
          },
          confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
        },
      },
    },
    notes: { type: 'array', items: { type: 'string' } },
  },
};

const MAGIC: Record<ImageMediaType, (b: Buffer) => boolean> = {
  'image/jpeg': (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/png': (b) => b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  'image/webp': (b) => b.length > 12 && b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP',
};

/** Decodes and validates the upload; returns canonical base64. Throws 422 `invalid_image`. */
export function validateImage(imageBase64: string, mediaType: ImageMediaType): string {
  const cleaned = imageBase64.replace(/\s+/g, '');
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(cleaned) || cleaned.length % 4 !== 0) {
    throw unprocessable('invalid_image', 'The image is not valid base64');
  }
  const buf = Buffer.from(cleaned, 'base64');
  if (buf.length === 0 || buf.length > PHOTO_MAX_BYTES) throw unprocessable('invalid_image', 'The image must be at most 5 MB');
  if (!MAGIC[mediaType](buf)) throw unprocessable('invalid_image', 'The file content does not match the image type');
  return cleaned;
}

async function safeTimeZone(sql: Sql, tz: string): Promise<string> {
  try {
    await sql.one('SELECT now() AT TIME ZONE $1 AS t', [tz]);
    return tz;
  } catch {
    return 'UTC';
  }
}

/** Reserves one unit of today's photo quota (calendar day in the user's time zone). */
export async function reservePhotoQuota(userId: string, timeZone: string): Promise<string> {
  const tz = await safeTimeZone(db, timeZone);
  return db.tx(async (tx) => {
    await tx.exec('SELECT pg_advisory_xact_lock(hashtext($1))', [`ai_usage:${PHOTO_USAGE_KIND}:${userId}`]);
    const { used, reset_in } = await tx.one<{ used: number; reset_in: number }>(
      `SELECT count(*)::int AS used,
              extract(epoch FROM ((date_trunc('day', now() AT TIME ZONE $3) + interval '1 day') AT TIME ZONE $3) - now())::float8 AS reset_in
         FROM ai_usage_events
        WHERE user_id = $1 AND kind = $2 AND created_at >= (date_trunc('day', now() AT TIME ZONE $3) AT TIME ZONE $3)`,
      [userId, PHOTO_USAGE_KIND, tz],
    );
    const limit = config.ai.photoDailyLimit;
    if (used >= limit) {
      const wait = Math.max(1, Math.ceil(reset_in));
      throw new HttpError(429, 'quota_exceeded', 'Daily photo analysis limit reached', { limit, retryAfterSeconds: wait }, { 'Retry-After': String(wait) });
    }
    const { id } = await tx.one<{ id: string }>('INSERT INTO ai_usage_events (user_id, kind) VALUES ($1, $2) RETURNING id', [userId, PHOTO_USAGE_KIND]);
    return id;
  });
}

/** Maps adapter failures to stable API errors. */
export function mapLlmError(err: unknown): HttpError {
  if (err instanceof HttpError) return err;
  if (!(err instanceof LlmError)) return new HttpError(500, 'internal_error', 'Something went wrong. Please try again.');
  switch (err.kind) {
    case 'not_configured':
      return serviceUnavailable('ai_not_configured', 'AI is not configured');
    case 'refused':
      return unprocessable('ai_refused', 'The AI declined to analyse this photo');
    case 'rate_limited':
      return serviceUnavailable('ai_rate_limited', 'The AI service is busy');
    case 'bad_response':
      return badGateway('ai_bad_response', 'The AI returned an unusable answer');
    default:
      // timeout, unavailable, auth, invalid_request (configuration problems are logged, not exposed)
      if (err.kind === 'auth' || err.kind === 'invalid_request') console.error(`[nutrition] photo analysis LLM error: ${err.kind}`);
      return serviceUnavailable('ai_unavailable', 'The AI service is unavailable');
  }
}

const REFUNDABLE = new Set(['unavailable', 'timeout', 'rate_limited', 'auth', 'invalid_request', 'not_configured']);

export async function analyzeMealPhoto(
  userId: string,
  user: { timezone: string; locale: Locale },
  prefs: DietPreferences,
  input: { imageBase64: string; mediaType: ImageMediaType; mealType?: MealType },
): Promise<PhotoAnalysisDTO> {
  if (!isLlmConfigured()) throw serviceUnavailable('ai_not_configured', 'AI is not configured');
  const base64 = validateImage(input.imageBase64, input.mediaType);
  const usageId = await reservePhotoQuota(userId, user.timezone);
  const language = user.locale === 'he' ? 'Hebrew' : 'English';
  let result: LlmJsonResult<z.output<typeof photoResultSchema>>;
  try {
    result = await generateJson({
      system: FOOD_PHOTO_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Identify the foods in this meal photo${input.mealType ? ` (${input.mealType})` : ''} and estimate the portions. Write the notes in ${language}.`,
        },
      ],
      jsonSchema: PHOTO_JSON_SCHEMA,
      validator: photoResultSchema,
      image: { base64, mediaType: input.mediaType },
    });
  } catch (err) {
    // Provider-side failures do not count against the user's daily quota.
    if (err instanceof LlmError && REFUNDABLE.has(err.kind)) await db.exec('DELETE FROM ai_usage_events WHERE id = $1', [usageId]).catch(() => undefined);
    throw mapLlmError(err);
  }
  const items: PhotoAnalysisItemDTO[] = [];
  for (const item of result.data.items) {
    const match = (await bestMatch(db, userId, prefs, item.matchQuery, item.name)) ?? (await bestMatch(db, userId, prefs, item.name));
    items.push({
      name: item.name,
      estimatedGrams: Math.round(item.estimatedGrams),
      match,
      estimatedPer100g: item.per100g,
      confidence: item.confidence,
    });
  }
  return { items, notes: result.data.notes.filter(Boolean).slice(0, 5), model: result.model };
}
