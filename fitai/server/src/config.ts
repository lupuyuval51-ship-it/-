/**
 * Centralized, validated runtime configuration. Secrets (API keys, DB password)
 * live only in environment variables / .env on the server and are never sent to
 * the client.
 */
import fs from 'node:fs';
import path from 'node:path';

// Load a local .env file (if any) without overriding real environment variables.
for (const candidate of [path.resolve(process.cwd(), '.env'), path.resolve(process.cwd(), '..', '.env')]) {
  if (fs.existsSync(candidate)) {
    try {
      process.loadEnvFile(candidate);
    } catch {
      /* malformed .env — ignore and rely on the environment */
    }
    break;
  }
}

const env = process.env;
const nodeEnv = env.NODE_ENV ?? 'development';
const isProduction = nodeEnv === 'production';
const isTest = nodeEnv === 'test' || env.VITEST === 'true';

const int = (v: string | undefined, d: number, min = -Infinity, max = Infinity) => {
  const n = v == null || v === '' ? NaN : Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.trunc(n))) : d;
};
const bool = (v: string | undefined, d: boolean) => (v == null || v === '' ? d : ['1', 'true', 'yes', 'on'].includes(v.toLowerCase()));

const DEV_DATABASE_URL = 'postgres://fitai:fitai_dev_password@127.0.0.1:5432/fitai';
const DEV_SESSION_SECRET = 'dev-only-session-secret-change-me';

export const config = {
  env: nodeEnv,
  isProduction,
  isTest,
  version: '1.0.0',
  host: env.HOST ?? '0.0.0.0',
  port: int(env.PORT, 3000, 1, 65535),
  appUrl: env.APP_URL ?? 'http://localhost:3000',
  /** Extra allowed Origins for state-changing requests (comma separated), e.g. the Vite dev server. */
  allowedOrigins: (env.ALLOWED_ORIGINS ?? 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  trustProxy: bool(env.TRUST_PROXY, false),

  databaseUrl: env.DATABASE_URL ?? (isProduction ? '' : DEV_DATABASE_URL),
  databasePoolMax: int(env.DATABASE_POOL_MAX, 10, 1, 100),
  /** Run migrations + content seed automatically on startup (default on outside production). */
  autoMigrate: bool(env.DB_AUTO_MIGRATE, !isProduction),

  session: {
    cookieName: isProduction ? '__Host-fitai_session' : 'fitai_session',
    ttlDays: int(env.SESSION_TTL_DAYS, 30, 1, 365),
    secureCookie: bool(env.COOKIE_SECURE, isProduction),
    /** Used only to derive non-secret identifiers; session tokens are random and stored hashed. */
    secret: env.SESSION_SECRET ?? DEV_SESSION_SECRET,
  },

  password: {
    /** scrypt cost (N). Lowered automatically in tests for speed. */
    scryptN: int(env.PASSWORD_SCRYPT_N, isTest ? 1024 : 32768, 1024, 1 << 20),
    maxFailedLogins: int(env.MAX_FAILED_LOGINS, 5, 1, 100),
    lockoutMinutes: int(env.LOCKOUT_MINUTES, 15, 1, 1440),
  },

  rateLimit: {
    enabled: bool(env.RATE_LIMIT_ENABLED, true),
    /** Multiplies every limit (tests use a large multiplier except in rate-limit tests). */
    multiplier: Math.max(0.01, Number(env.RATE_LIMIT_MULTIPLIER ?? (isTest ? 100 : 1)) || 1),
  },

  ai: {
    provider: (env.AI_PROVIDER ?? 'anthropic').toLowerCase(),
    apiKey: env.AI_API_KEY ?? env.ANTHROPIC_API_KEY ?? '',
    model: env.AI_MODEL ?? 'claude-opus-5-5',
    /** Optional override (proxies, local test doubles). Defaults to the official API. */
    baseUrl: env.AI_BASE_URL ?? 'https://api.anthropic.com',
    effort: (['low', 'medium', 'high'].includes(env.AI_EFFORT ?? '') ? env.AI_EFFORT : 'medium') as 'low' | 'medium' | 'high',
    timeoutMs: int(env.AI_TIMEOUT_MS, 90_000, 5_000, 600_000),
    maxRetries: int(env.AI_MAX_RETRIES, 2, 0, 5),
    /** Server-side refusal fallback (Claude API only). */
    refusalFallback: bool(env.AI_REFUSAL_FALLBACK, true),
    coachDailyLimit: int(env.COACH_DAILY_MESSAGE_LIMIT, 50, 1, 10_000),
    photoDailyLimit: int(env.PHOTO_ANALYSIS_DAILY_LIMIT, 20, 1, 10_000),
  },

  openFoodFacts: {
    enabled: bool(env.OPENFOODFACTS_ENABLED, !isTest),
    baseUrl: env.OPENFOODFACTS_BASE_URL ?? 'https://world.openfoodfacts.org',
    timeoutMs: int(env.OPENFOODFACTS_TIMEOUT_MS, 6000, 1000, 30_000),
    userAgent: env.OPENFOODFACTS_USER_AGENT ?? 'FITAI/1.0 (self-hosted fitness app)',
  },

  mail: {
    /** No transactional email provider is bundled; see README. */
    from: env.MAIL_FROM ?? 'FITAI <no-reply@localhost>',
  },

  logRequests: bool(env.LOG_REQUESTS, !isTest),
  staticDir: env.STATIC_DIR ?? '',
};

export const aiConfigured = () => config.ai.provider === 'anthropic' && config.ai.apiKey.length > 0;

/** Fail fast on unsafe production configuration. */
export function assertProductionConfig(): void {
  if (!config.isProduction) return;
  const problems: string[] = [];
  if (!config.databaseUrl) problems.push('DATABASE_URL is required in production');
  if (config.session.secret === DEV_SESSION_SECRET || config.session.secret.length < 32) {
    problems.push('SESSION_SECRET must be set to a random string of at least 32 characters in production');
  }
  if (problems.length) throw new Error(`Invalid production configuration:\n- ${problems.join('\n- ')}`);
}
