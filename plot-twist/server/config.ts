/**
 * Server configuration from the environment. Provider credentials live ONLY here,
 * on the server — they are never sent to the browser.
 */
import { existsSync } from 'node:fs';
import { isIP } from 'node:net';
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
  /** Generations allowed per client per window. Each IPv6 /48 also shares NETWORK_RATE_FACTOR × max. */
  rateLimit: { max: number; windowMs: number };
  /** Concurrent generations across all clients. */
  maxConcurrent: number;
  /** Concurrent open generation streams per client. */
  maxStreamsPerClient: number;
  /** Concurrent open generation streams per IPv6 /48 (one holder of a routed /48 has 65,536 /64 clients). */
  maxStreamsPerNetwork: number;
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

/** An IPv6 /48 may use this many times one client's rate limit. */
export const NETWORK_RATE_FACTOR = 4;

function intFromEnv(env: NodeJS.ProcessEnv, name: string, fallback: number, min: number, max: number): number {
  const raw = env[name];
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= min && n <= max ? n : fallback;
}

/** Printable ASCII without spaces: what an HTTP header value (and every real API key) can carry. */
const KEY_CHARS = /^[\x21-\x7e]+$/;

/** A host a browser can put in an Origin header: a DNS name or IPv4 address, or a bracketed IPv6 address. */
function usableHost(host: string): boolean {
  if (/^[a-z0-9.-]+$/.test(host)) return /[a-z0-9]/.test(host);
  const v6 = /^\[([0-9a-f:.]+)\]$/.exec(host);
  return v6 !== null && isIP(v6[1]) === 6;
}

/**
 * Parses one PLOT_TWIST_ALLOWED_ORIGINS entry: `https://app.example` → its origin,
 * `app.example[:port]` or `[::1]:8080` → a lowercase host. An entry that can never
 * match what a browser sends is refused with the reason: a wildcard, a `;` or space
 * where a comma was meant, another scheme, or a host with other characters.
 */
export function parseAllowedOrigin(entry: string): { origin: string } | { problem: string } {
  const value = entry.trim();
  if (!value) return { problem: 'empty' };
  if (value.includes('*')) return { problem: 'wildcards are not supported: list every origin' };
  if (/[;\s]/.test(value)) return { problem: 'separate entries with commas' };
  if (value.includes('://')) {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      return { problem: 'not a valid URL' };
    }
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return { problem: 'only http:// and https:// origins can call the API' };
    if (!usableHost(url.hostname)) return { problem: 'the host may only use a-z, 0-9, "." and "-", or be a [bracketed] IPv6 address' };
    return { origin: url.origin.toLowerCase() };
  }
  const m = /^(\[[^\]]*\]|[^:/]*)(?::(\d{1,5}))?$/.exec(value.toLowerCase());
  if (!m || !usableHost(m[1])) return { problem: 'expected https://host[:port] or host[:port]' };
  if (m[2] !== undefined && (Number(m[2]) < 1 || Number(m[2]) > 65_535)) return { problem: 'the port must be 1-65535' };
  return { origin: value.toLowerCase() };
}

/** One PLOT_TWIST_ALLOWED_ORIGINS entry, normalized, or null when unusable (see parseAllowedOrigin). */
export function normalizeAllowedOrigin(entry: string): string | null {
  const parsed = parseAllowedOrigin(entry);
  return 'origin' in parsed ? parsed.origin : null;
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
    let parsed: ReturnType<typeof parseAllowedOrigin>;
    try {
      parsed = parseAllowedOrigin(entry);
    } catch {
      parsed = { problem: 'could not be read' };
    }
    if ('origin' in parsed) {
      if (!allowedOrigins.includes(parsed.origin)) allowedOrigins.push(parsed.origin);
    } else {
      warnings.push(`PLOT_TWIST_ALLOWED_ORIGINS: ignoring ${JSON.stringify(entry.trim().slice(0, 80))} (${parsed.problem})`);
    }
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
    maxStreamsPerNetwork: 4,
    trustProxy: env.PLOT_TWIST_TRUST_PROXY === '1',
    trustedHops: intFromEnv(env, 'PLOT_TWIST_TRUSTED_HOPS', 1, 1, 10),
    allowedOrigins,
    port: intFromEnv(env, 'PORT', 8787, 1, 65_535),
    warnings,
  };
}
