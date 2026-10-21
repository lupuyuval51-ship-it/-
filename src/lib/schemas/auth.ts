import { z } from "zod";
import { INPUT_LIMITS } from "@/config/limits";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(INPUT_LIMITS.emailMax)
  .pipe(z.email());

export const passwordSchema = z
  .string()
  .min(INPUT_LIMITS.passwordMin, `Password must be at least ${INPUT_LIMITS.passwordMin} characters.`)
  .max(INPUT_LIMITS.passwordMax)
  .refine((p) => new Set(p).size >= 4, "Password is too repetitive.");

export const localeSchema = z.enum(["he", "en"]);
export const countrySchema = z.string().regex(/^[A-Za-z]{2}$/).transform((c) => c.toUpperCase());

/**
 * A name shown to the learner and on their games. Control characters are refused: PostgreSQL text cannot hold a NUL
 * (the insert failed with a 500 instead of a 400), and a line break or tab has no place in a one-line name.
 */
export const displayNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(INPUT_LIMITS.nameMax)
  .refine((s) => !/[\u0000-\u001F\u007F]/.test(s), "Control characters are not allowed.");

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: displayNameSchema,
  locale: localeSchema.default("he"),
  country: countrySchema.nullish(),
});
export type RegisterBody = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(INPUT_LIMITS.passwordMax),
});
export type LoginBody = z.infer<typeof loginSchema>;
