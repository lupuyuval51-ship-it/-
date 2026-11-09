/**
 * Server configuration from the environment. Provider credentials live ONLY here,
 * on the server — they are never sent to the browser.
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export type Effort = 'low' | 'medium' | 'high' | 'xhigh' | 'max';

export interface ServerConfig {
  /** Anthropic API key, or null when the AI Director is not configured (or the key is unusable). */
  apiKey: string | null;
  /**
   * Why a key that was set cannot be used (safe to log: never contains the key),
   * or null. When set, `apiKey` is null and the AI Director reports "misconfigured".
   */
  apiKeyProblem: string | null;
  model: string;
  effort: Effort;
  /** API base URL. Defaults to the public API; PLOT_TWIST_ANTHROPIC_BASE_URL overrides it (tests). */
  baseURL: string;
  /** Upper bound for ONE model attempt, response stream included, ms. */
  timeoutMs: number;
  /** Overall budget for one generation, repair round included, ms (the user is waiting on a phone). */
  deadlineMs: number;
  /** SDK client default retries. Streaming generation never retries (it would only eat the deadline). */
  maxRetries: number;
  /** Generations allowed per client per window. */
  rateLimit: { max: number; windowMs: number };
  /** Concurrent generations across all clients. */
  maxConcurrent: number;
  /** Concurrent open generation streams per client. */
  maxStreamsPerClient: number;
  /** Behind a trusted reverse proxy: read the client address from X-Forwarded-For and accept X-Forwarded-Host as our host. */
  trustProxy: boolean;
  /** How many trusted proxies append to X-Forwarded-For; the client is the Nth entry from the right. */
  trustedHops: number;
  /** Extra origins allowed to POST generations (normalized `scheme://host[:port]`, or a bare `host[:port]`). */
  allowedOrigins: string[];
  port: number;
  /** Non-fatal configuration problems worth logging once (never contain secrets). */
  warnings: string[];
}

const EFFORTS: readonly Effort[] = ['low', 'medium', 'high', 'xhigh', 'max'];

function intFromEnv(env: NodeJS.ProcessEnv, name: string, fallback: number, min: number, max: number): number {
  const raw = env[name];
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= min && n <= max ? n : fallback;
}

/** Printable ASCII without spaces: what an HTTP header value (and every real API key) can carry. */
const KEY_CHARS = /^[\x21-\x7e]+$/;

/**
 * Normalizes one PLOT_TWIST_ALLOWED_ORIGINS entry: `https://app.example` → its
 * origin, `app.example[:port]` → a lowercase host. Returns null when unusable.
 */
export function normalizeAllowedOrigin(entry: string): string | null {
  const value = entry.trim();
  if (!value) return null;
  if (value.includes('://')) {
    try {
      const url = new URL(value);
      return url.origin === 'null' ? null : url.origin.toLowerCase();
    } catch {
      return null;
    }
  }
  return /^[a-z0-9.-]+(?::\d{1,5})?$/i.test(value) ? value.toLowerCase() : null;
}

let envLoaded = false;
/** Loads ./.env once if present (Node's built-in loader; never overrides real env vars). */
export function loadDotEnv(cwd = process.cwd()): void {
  if (envLoaded) return;
  envLoaded = true;
  const file = resolve(cwd, '.env');
  if (!existsSync(file)) return;
  try {
    process.loadEnvFile(file);
  } catch (err) {
    console.warn('[plot-twist] could not read .env:', (err as Error).message);
  }
}

export function readConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const warnings: string[] = [];
  const keyVar = env.PLOT_TWIST_ANTHROPIC_API_KEY ? 'PLOT_TWIST_ANTHROPIC_API_KEY' : 'ANTHROPIC_API_KEY';
  const key = (env[keyVar] || '').trim();
  // A control character or space inside the key (an escaped or multi-line .env value) would make
  // the HTTP client throw an error that quotes the whole key. Refuse it here, without echoing it.
  const apiKeyProblem =
    key.length > 0 && !KEY_CHARS.test(key)
      ? `${keyVar} contains invalid characters (only printable ASCII, no spaces). The AI Director is disabled until it is fixed.`
      : null;

  const effort = (env.PLOT_TWIST_EFFORT || 'medium').trim() as Effort;

  const allowedOrigins: string[] = [];
  for (const entry of (env.PLOT_TWIST_ALLOWED_ORIGINS ?? '').split(',')) {
    if (!entry.trim()) continue;
    const normalized = normalizeAllowedOrigin(entry);
    if (normalized) allowedOrigins.push(normalized);
    else warnings.push(`PLOT_TWIST_ALLOWED_ORIGINS: ignoring ${JSON.stringify(entry.trim().slice(0, 80))} (expected https://host or host[:port])`);
  }

  return {
    apiKey: key.length > 0 && !apiKeyProblem ? key : null,
    apiKeyProblem,
    model: (env.PLOT_TWIST_MODEL || 'claude-opus-5-5').trim(),
    effort: EFFORTS.includes(effort) ? effort : 'medium',
    // Deliberately NOT reading ANTHROPIC_BASE_URL: tooling environments often set it for other purposes.
    baseURL: (env.PLOT_TWIST_ANTHROPIC_BASE_URL || 'https://api.anthropic.com').trim(),
    timeoutMs: intFromEnv(env, 'PLOT_TWIST_TIMEOUT_MS', 120_000, 5_000, 600_000),
    deadlineMs: intFromEnv(env, 'PLOT_TWIST_DEADLINE_MS', 150_000, 10_000, 600_000),
    maxRetries: intFromEnv(env, 'PLOT_TWIST_MAX_RETRIES', 1, 0, 4),
    rateLimit: {
      max: intFromEnv(env, 'PLOT_TWIST_RATE_LIMIT', 8, 1, 1000),
      windowMs: intFromEnv(env, 'PLOT_TWIST_RATE_WINDOW_MS', 10 * 60_000, 1_000, 24 * 3_600_000),
    },
    maxConcurrent: intFromEnv(env, 'PLOT_TWIST_MAX_CONCURRENT', 4, 1, 64),
    maxStreamsPerClient: 2,
    trustProxy: env.PLOT_TWIST_TRUST_PROXY === '1',
    trustedHops: intFromEnv(env, 'PLOT_TWIST_TRUSTED_HOPS', 1, 1, 10),
    allowedOrigins,
    port: intFromEnv(env, 'PORT', 8787, 1, 65_535),
    warnings,
  };
}
