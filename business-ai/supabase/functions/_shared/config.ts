/**
 * Environment configuration for the Edge Functions (see docs/AI.md for the full table).
 * Everything is read once per request through an injectable getter so tests can supply values.
 */
import { AppError } from './errors.ts';

export type EnvGetter = (name: string) => string | undefined;

export const DEFAULT_AI_MODEL = 'claude-opus-5-5';
export const DEFAULT_AI_API_BASE_URL = 'https://api.anthropic.com';
export const DEFAULT_AI_MAX_RETRIES = 2;
export const DEFAULT_AI_TIMEOUT_MS = 120_000;

export interface AiConfig {
  /** null when ANTHROPIC_API_KEY is missing → every AI call answers `not_configured`. */
  apiKey: string | null;
  model: string;
  /** Always explicit so the SDK never picks up an ambient ANTHROPIC_BASE_URL. */
  baseURL: string;
  maxRetries: number;
  timeoutMs: number;
}

export interface FunctionConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  corsAllowedOrigins: string[];
  ai: AiConfig;
}

export const denoEnv: EnvGetter = (name) => {
  try {
    return Deno.env.get(name);
  } catch {
    return undefined;
  }
};

function nonEmpty(value: string | undefined): string | null {
  const v = value?.trim();
  return v ? v : null;
}

function intInRange(raw: string | undefined, fallback: number, min: number, max: number): number {
  const v = nonEmpty(raw);
  if (v === null) return fallback;
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) return fallback;
  return n;
}

function validBaseUrl(raw: string | undefined): string {
  const v = nonEmpty(raw);
  if (v === null) return DEFAULT_AI_API_BASE_URL;
  try {
    const url = new URL(v);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return DEFAULT_AI_API_BASE_URL;
    return v.replace(/\/+$/, '');
  } catch {
    return DEFAULT_AI_API_BASE_URL;
  }
}

export function loadAiConfig(env: EnvGetter = denoEnv): AiConfig {
  return {
    apiKey: nonEmpty(env('ANTHROPIC_API_KEY')),
    model: nonEmpty(env('AI_MODEL')) ?? DEFAULT_AI_MODEL,
    baseURL: validBaseUrl(env('AI_API_BASE_URL')),
    maxRetries: intInRange(env('AI_MAX_RETRIES'), DEFAULT_AI_MAX_RETRIES, 0, 10),
    timeoutMs: intInRange(env('AI_TIMEOUT_MS'), DEFAULT_AI_TIMEOUT_MS, 1_000, 900_000),
  };
}

/**
 * Loads the full configuration. Missing Supabase variables are a deployment error (`internal`);
 * the Supabase runtime always injects them, so this only fires on a misconfigured host.
 */
export function loadConfig(env: EnvGetter = denoEnv): FunctionConfig {
  const supabaseUrl = nonEmpty(env('SUPABASE_URL'));
  const supabaseAnonKey = nonEmpty(env('SUPABASE_ANON_KEY')) ?? nonEmpty(env('SUPABASE_PUBLISHABLE_KEY'));
  const supabaseServiceRoleKey = nonEmpty(env('SUPABASE_SERVICE_ROLE_KEY')) ?? nonEmpty(env('SUPABASE_SECRET_KEY'));
  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    throw new AppError('internal', 'Server configuration is incomplete.', {
      details: { op: 'config', reason: 'SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY missing' },
    });
  }
  const origins = (env('CORS_ALLOWED_ORIGINS') ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter((o) => o.length > 0);
  return {
    supabaseUrl,
    supabaseAnonKey,
    supabaseServiceRoleKey,
    corsAllowedOrigins: origins,
    ai: loadAiConfig(env),
  };
}
