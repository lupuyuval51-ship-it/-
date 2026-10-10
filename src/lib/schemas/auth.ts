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

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: z.string().trim().min(1).max(INPUT_LIMITS.nameMax),
  locale: localeSchema.default("he"),
  country: countrySchema.nullish(),
});
export type RegisterBody = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(INPUT_LIMITS.passwordMax),
});
export type LoginBody = z.infer<typeof loginSchema>;
