import { z } from 'zod';
import { isValidDateString, isValidTimeZone } from '../dates';

/** Strips control characters and angle brackets, trims, and limits length. */
export const cleanText = (max: number) =>
  z
    .string()
    .max(max * 2) // reject absurd payloads before transforming
    .transform((s) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F<>]/g, '').trim())
    .pipe(z.string().max(max));

export const requiredText = (max: number) => cleanText(max).pipe(z.string().min(1, 'required').max(max));

export const dateString = z.string().refine(isValidDateString, { message: 'invalid_date' });
export const timeZone = z.string().max(64).refine(isValidTimeZone, { message: 'invalid_timezone' });
export const uuid = z.string().uuid();
export const slugId = z.string().regex(/^[a-z0-9]+(?:_[a-z0-9]+)*$/).max(80);
export const timeOfDay = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'invalid_time');

/** Accepts numbers or numeric strings (query params) and coerces. */
export const intParam = (min: number, max: number) => z.coerce.number().int().min(min).max(max);
export const boolParam = z
  .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
  .transform((v) => v === true || v === 'true' || v === '1');

export const nullableNumber = (min: number, max: number) => z.number().min(min).max(max).nullable();
export const nullableInt = (min: number, max: number) => z.number().int().min(min).max(max).nullable();

export const localizedTextInput = z.object({ en: cleanText(200), he: cleanText(200) });
