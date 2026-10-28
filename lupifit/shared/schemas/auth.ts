import { z } from 'zod';
import { LIMITS, LOCALES } from '../constants';
import { requiredText, timeZone } from './common';

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .email('invalid_email');

/** Minimum 8 characters with at least one letter and one digit. */
export const passwordSchema = z
  .string()
  .min(LIMITS.passwordMin, 'password_too_short')
  .max(LIMITS.passwordMax, 'password_too_long')
  .refine((p) => /[A-Za-z֐-׿]/.test(p) && /\d/.test(p), { message: 'password_too_weak' });

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: requiredText(60),
  locale: z.enum(LOCALES).optional(),
  timezone: timeZone.optional(),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(LIMITS.passwordMax),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(LIMITS.passwordMax),
  newPassword: passwordSchema,
});

export const passwordResetRequestSchema = z.object({ email: emailSchema });
export const passwordResetConfirmSchema = z.object({
  token: z.string().min(20).max(200),
  newPassword: passwordSchema,
});
