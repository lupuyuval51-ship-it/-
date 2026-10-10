import "server-only";
import { z } from "zod";

/** Treat empty strings (as shipped in .env.example) as "not set". */
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), schema.optional());

const bool = z.preprocess((v) => (typeof v === "string" ? ["1", "true", "yes", "on"].includes(v.toLowerCase()) : v), z.boolean());

const schema = z.object({
  APP_ENV: z.enum(["local", "test", "production"]).default("local"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters"),
  TRUST_PROXY: bool.default(false),

  AI_PROVIDER: z.enum(["auto", "anthropic", "openai", "demo"]).default("auto"),
  ANTHROPIC_API_KEY: optional(z.string()),
  ANTHROPIC_MODEL: z.string().default("claude-sonnet-5-5"),
  OPENAI_API_KEY: optional(z.string()),
  OPENAI_BASE_URL: z.string().url().default("https://api.openai.com/v1"),
  OPENAI_MODEL: z.string().default("gpt-4.1"),
  AI_CALL_TIMEOUT_MS: z.coerce.number().int().min(1000).max(600_000).default(90_000),
  AI_JOB_DEADLINE_MS: z.coerce.number().int().min(5_000).max(900_000).default(240_000),

  PAYMENTS_MODE: z.enum(["disabled", "stripe", "dev"]).default("disabled"),
  STRIPE_SECRET_KEY: optional(z.string()),
  STRIPE_WEBHOOK_SECRET: optional(z.string()),
  STRIPE_PRICE_PLUS: optional(z.string()),
  STRIPE_PRICE_PRO: optional(z.string()),

  CRON_SECRET: optional(z.string().min(16)),
  ENABLE_TEST_HOOKS: bool.default(false),
});

export type Env = z.infer<typeof schema>;

let cached: Env | null = null;

/** Lazily parsed so `next build` never needs runtime secrets. Throws a clear error for bad configuration. */
export function getEnv(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid environment configuration — ${issues}`);
  }
  const env = parsed.data;
  if (env.APP_ENV === "production") {
    // Hard guards: simulators and test hooks must never be reachable in production.
    if (env.PAYMENTS_MODE === "dev") throw new Error("PAYMENTS_MODE=dev is not allowed when APP_ENV=production");
    if (env.ENABLE_TEST_HOOKS) throw new Error("ENABLE_TEST_HOOKS=true is not allowed when APP_ENV=production");
    if (/replace-with|local-dev-only|change-me/i.test(env.SESSION_SECRET)) throw new Error("SESSION_SECRET must be a real random secret in production");
  }
  cached = env;
  return env;
}

/** Test seam: forget the cached configuration. */
export function resetEnvForTests(): void {
  cached = null;
}

export const isProduction = (): boolean => getEnv().APP_ENV === "production";
export const secureCookies = (): boolean => getEnv().APP_ENV === "production" || getEnv().APP_URL.startsWith("https://");
