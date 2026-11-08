/**
 * Server configuration from the environment. Provider credentials live ONLY here,
 * on the server — they are never sent to the browser.
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export type Effort = 'low' | 'medium' | 'high' | 'xhigh' | 'max';

export interface ServerConfig {
  /** Anthropic API key, or null when the AI Director is not configured. */
  apiKey: string | null;
  model: string;
  effort: Effort;
  /** API base URL. Defaults to the public API; PLOT_TWIST_ANTHROPIC_BASE_URL overrides it (tests). */
  baseURL: string;
  /** Per-request timeout for a generation, ms. */
  timeoutMs: number;
  /** SDK retries for transient errors (429 / 5xx / connection). */
  maxRetries: number;
  /** Generations allowed per client IP per window. */
  rateLimit: { max: number; windowMs: number };
  /** Concurrent generations across all clients. */
  maxConcurrent: number;
  port: number;
}

const EFFORTS: readonly Effort[] = ['low', 'medium', 'high', 'xhigh', 'max'];

function intFromEnv(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= min && n <= max ? n : fallback;
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
  const key = (env.PLOT_TWIST_ANTHROPIC_API_KEY || env.ANTHROPIC_API_KEY || '').trim();
  const effort = (env.PLOT_TWIST_EFFORT || 'medium').trim() as Effort;
  return {
    apiKey: key.length > 0 ? key : null,
    model: (env.PLOT_TWIST_MODEL || 'claude-opus-5-5').trim(),
    effort: EFFORTS.includes(effort) ? effort : 'medium',
    // Deliberately NOT reading ANTHROPIC_BASE_URL: tooling environments often set it for other purposes.
    baseURL: (env.PLOT_TWIST_ANTHROPIC_BASE_URL || 'https://api.anthropic.com').trim(),
    timeoutMs: intFromEnv('PLOT_TWIST_TIMEOUT_MS', 150_000, 5_000, 600_000),
    maxRetries: intFromEnv('PLOT_TWIST_MAX_RETRIES', 1, 0, 4),
    rateLimit: {
      max: intFromEnv('PLOT_TWIST_RATE_LIMIT', 8, 1, 1000),
      windowMs: intFromEnv('PLOT_TWIST_RATE_WINDOW_MS', 10 * 60_000, 1_000, 24 * 3_600_000),
    },
    maxConcurrent: intFromEnv('PLOT_TWIST_MAX_CONCURRENT', 4, 1, 64),
    port: intFromEnv('PORT', 8787, 1, 65_535),
  };
}
