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
  TRUST_PROXY: bool.default(false),
  /** With TRUST_PROXY: how many proxies we own sit in front of the app (the client IP is that many entries from the right of X-Forwarded-For). */
  TRUSTED_PROXY_HOPS: z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), z.coerce.number().int().min(1).max(5).default(1)),

  /** "demo" is the old name of "none" (there are no demo games any more); kept so an older deployment's setting still starts. */
  AI_PROVIDER: z.preprocess((v) => (v === "demo" ? "none" : v), z.enum(["auto", "anthropic", "openai", "none"]).default("auto")),
  ANTHROPIC_API_KEY: optional(z.string()),
  ANTHROPIC_MODEL: z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), z.string().default("claude-opus-5-5")), // a blank value is unset, as in the edge function
  ANTHROPIC_REFUSAL_FALLBACK: bool.default(true),
  OPENAI_API_KEY: optional(z.string()),
  OPENAI_BASE_URL: z.string().url().default("https://api.openai.com/v1"),
  OPENAI_MODEL: z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), z.string().default("gpt-4.1")), // a blank value is unset, as in the edge function
  AI_CALL_TIMEOUT_MS: z.coerce.number().int().min(1000).max(600_000).default(240_000),
  AI_JOB_DEADLINE_MS: z.coerce.number().int().min(5_000).max(1_800_000).default(600_000),

  /** Plans (Free/Plus/Pro), pricing and checkout. Off = everybody gets the full product and no plan is shown anywhere; the code stays so it can be switched back on. */
  PLANS_ENABLED: bool.default(false),
  /** With plans off: still show the plans and prices (pricing page, landing, nav) as information, with no way to buy. */
  PLANS_SHOWN: bool.default(true),
  PAYMENTS_MODE: z.enum(["disabled", "stripe", "dev"]).default("disabled"),
  /**
   * Display switch (it never unlocks anything; the server still enforces every rule). Off by default, because it does
   * not help a learner learn: editing a game's look and mechanics (rename, time of day, mechanics, the AI edit robot and
   * version history). The code and the API stay; the test suites switch it on.
   */
  GAME_EDITING: bool.default(false),
  STRIPE_SECRET_KEY: optional(z.string()),
  STRIPE_WEBHOOK_SECRET: optional(z.string()),

  /** Sign in with Google (website). Both must be set, otherwise the button and the /api/auth/google/* routes do not exist. */
  GOOGLE_CLIENT_ID: optional(z.string().min(10)),
  GOOGLE_CLIENT_SECRET: optional(z.string().min(10)),

  CRON_SECRET: optional(z.string().min(16)),
  /** Secret behind the opaque answer ids players see (see answer-seed.ts). Defaults to a value derived from DATABASE_URL, which clients never see. */
  ANSWER_SEED_SECRET: optional(z.string().min(16)),
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
    if (!env.APP_URL.startsWith("https://")) throw new Error("APP_URL must be an https:// URL when APP_ENV=production (cookies are Secure and Stripe redirects use it)");
  }
  cached = env;
  return env;
}

/** Test seam: forget the cached configuration. */
export function resetEnvForTests(): void {
  cached = null;
}

export const plansEnabled = (): boolean => getEnv().PLANS_ENABLED;
/** Plans and prices are visible (as information when plans are off). */
export const plansShown = (): boolean => getEnv().PLANS_ENABLED || getEnv().PLANS_SHOWN;
/** The game page shows the editing tools (manual edits, AI edits, version history). */
export const gameEditingShown = (): boolean => getEnv().GAME_EDITING;
export const isProduction = (): boolean => getEnv().APP_ENV === "production";
export const secureCookies = (): boolean => getEnv().APP_ENV === "production" || getEnv().APP_URL.startsWith("https://");
