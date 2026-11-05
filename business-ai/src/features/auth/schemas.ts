import { z } from 'zod';
import { LocaleSchema } from '@domain/ai-api';
import { fieldMessage } from '@/lib/forms';

export const PASSWORD_MIN_LENGTH = 8;
/** bcrypt (Supabase Auth) ignores bytes beyond 72. */
export const PASSWORD_MAX_LENGTH = 72;
export const DISPLAY_NAME_MAX_LENGTH = 100;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const LETTER = /[A-Za-zÀ-ɏ֐-׿]/;
const DIGIT = /\d/;

export interface PasswordRuleState {
  minLength: boolean;
  letterAndNumber: boolean;
}

/** Live checklist state shown under new-password fields. */
export function passwordRules(password: string): PasswordRuleState {
  return {
    minLength: password.length >= PASSWORD_MIN_LENGTH,
    letterAndNumber: LETTER.test(password) && DIGIT.test(password),
  };
}

export const emailSchema = z
  .string()
  .trim()
  .min(1, fieldMessage('errors.field.required'))
  .max(254, fieldMessage('errors.field.tooLong', { max: 254 }))
  .regex(EMAIL_PATTERN, fieldMessage('errors.field.emailInvalid'));

/** Existing password (sign in): only required — never reveal policy details at sign-in. */
const currentPasswordSchema = z.string().min(1, fieldMessage('errors.field.required'));

/** New password: ≥ 8 characters, at least one letter and one number. */
export const newPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, fieldMessage('errors.field.passwordTooShort', { min: PASSWORD_MIN_LENGTH }))
  .max(PASSWORD_MAX_LENGTH, fieldMessage('errors.field.passwordTooLong', { max: PASSWORD_MAX_LENGTH }))
  .refine((p) => passwordRules(p).letterAndNumber, fieldMessage('errors.field.passwordNeedsLetterAndNumber'));

export const displayNameSchema = z
  .string()
  .trim()
  .min(1, fieldMessage('errors.field.required'))
  .max(DISPLAY_NAME_MAX_LENGTH, fieldMessage('errors.field.tooLong', { max: DISPLAY_NAME_MAX_LENGTH }));

export const signInSchema = z.object({ email: emailSchema, password: currentPasswordSchema });
export type SignInValues = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
  displayName: displayNameSchema,
  email: emailSchema,
  password: newPasswordSchema,
  locale: LocaleSchema,
});
export type SignUpValues = z.infer<typeof signUpSchema>;

export const forgotPasswordSchema = z.object({ email: emailSchema });
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: newPasswordSchema,
    confirm: z.string().min(1, fieldMessage('errors.field.required')),
  })
  .refine((v) => v.password === v.confirm, { message: fieldMessage('errors.field.passwordsDontMatch'), path: ['confirm'] });
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
