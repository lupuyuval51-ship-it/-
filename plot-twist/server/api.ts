/**
 * PLOT TWIST API — framework-free (node:http), mounted by the production server
 * and by the Vite dev server.
 *
 *   GET  /api/status             → DirectorStatus (real, verified connection state)
 *   POST /api/episodes/generate  → text/event-stream of GenerateEvent
 *   GET  /api/health             → { ok: true, build }
 */
import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from 'node:http';
import { isIP } from 'node:net';
import { BUDGET_OPTIONS, COMPANY_OPTIONS, KINDS, MINUTES_OPTIONS, MOOD_OPTIONS, SETTING_OPTIONS, WEIRDNESS_OPTIONS } from '../shared/constants.ts';
import { sanitizeInline } from '../shared/template.ts';
import type { Kind, Prefs } from '../shared/types.ts';
import { createAnthropicBackend, type Backend } from './backend.ts';
import { loadDotEnv, NETWORK_RATE_FACTOR, readConfig, type ServerConfig } from './config.ts';
import { deadlineReason, generateEpisode, type GenerateEvent } from './director.ts';
import type { BriefInput } from './prompt.ts';
import { RateLimiter, takeAll } from './rateLimit.ts';
import { StatusTracker, type DirectorStatus } from './status.ts';

export interface ApiOptions {
  config?: ServerConfig;
  /** Override the model backend (tests). `null` = not configured. */
  backend?: Backend | null;
  now?: () => number;
  log?: (message: string) => void;
  /** Override `config.trustProxy` (tests). */
  trustProxy?: boolean;
  /** When the served build was made (ISO string), for /api/health. The production server passes it. */
  build?: () => string | null;
}

export type ApiHandler = ((req: IncomingMessage, res: ServerResponse) => Promise<void>) & {
  status: StatusTracker;
  config: ServerConfig;
};

const MAX_BODY_BYTES = 8 * 1024;
export const MAX_DETAIL_LENGTH = 140;
export const MAX_AVOID_TITLE_LENGTH = 60;
/** How long a request waits for a status check before it goes on with the cached status. */
export const STATUS_WAIT_MS = 10_000;

function sendJson(res: ServerResponse, status: number, body: unknown, extra: Record<string, string> = {}) {
  if (res.headersSent) return;
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    ...extra,
  });
  res.end(payload);
}

async function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(Object.assign(new Error('body too large'), { code: 'too_large' }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

/** Cuts to `max` UTF-16 units without leaving half of a surrogate pair. */
function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return (/[\ud800-\udbff]$/.test(cut) ? cut.slice(0, -1) : cut).trimEnd();
}

/** Quote characters are stripped from titles: they are only ever data, and quotes are how injected text breaks out of a list. */
const QUOTES = /["“”„‟«»`]/g;

type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

/** Strict validation of the generate request body. Exported for tests. */
export function parseGenerateBody(raw: unknown): Parsed<BriefInput> {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return { ok: false, error: 'body must be a JSON object' };
  const body = raw as Record<string, unknown>;
  const p = body.prefs as Record<string, unknown> | undefined;
  if (typeof p !== 'object' || p === null) return { ok: false, error: 'prefs is required' };
  const checks: [keyof Prefs, readonly unknown[]][] = [
    ['minutes', MINUTES_OPTIONS],
    ['budget', BUDGET_OPTIONS],
    ['setting', SETTING_OPTIONS],
    ['company', COMPANY_OPTIONS],
    ['mood', MOOD_OPTIONS],
    ['weirdness', WEIRDNESS_OPTIONS],
  ];
  for (const [key, allowed] of checks) {
    if (!allowed.includes(p[key])) return { ok: false, error: `prefs.${key} is invalid` };
  }
  const prefs = {
    minutes: p.minutes,
    budget: p.budget,
    setting: p.setting,
    company: p.company,
    mood: p.mood,
    weirdness: p.weirdness,
  } as Prefs;

  let detail: string | undefined;
  if (body.detail !== undefined && body.detail !== null && body.detail !== '') {
    if (typeof body.detail !== 'string') return { ok: false, error: 'detail must be a string' };
    if (body.detail.length > MAX_DETAIL_LENGTH * 2) return { ok: false, error: 'detail is too long' };
    // The whole detail (up to 140 characters, as the UI allows) reaches the model on one line.
    detail = clip(sanitizeInline(body.detail), MAX_DETAIL_LENGTH) || undefined;
  }

  let localHour: number | undefined;
  if (body.localHour !== undefined) {
    if (typeof body.localHour !== 'number' || !Number.isInteger(body.localHour) || body.localHour < 0 || body.localHour > 23) {
      return { ok: false, error: 'localHour must be an integer 0-23' };
    }
    localHour = body.localHour;
  }

  const avoidTitles: string[] = [];
  if (body.avoidTitles !== undefined) {
    if (!Array.isArray(body.avoidTitles) || body.avoidTitles.length > 12) return { ok: false, error: 'avoidTitles is invalid' };
    for (const t of body.avoidTitles) {
      if (typeof t !== 'string') return { ok: false, error: 'avoidTitles is invalid' };
      const clean = clip(sanitizeInline(t.replace(QUOTES, '')), MAX_AVOID_TITLE_LENGTH);
      if (clean) avoidTitles.push(clean);
    }
  }

  const avoidKinds: Kind[] = [];
  if (body.avoidKinds !== undefined) {
    if (!Array.isArray(body.avoidKinds) || body.avoidKinds.length > 6) return { ok: false, error: 'avoidKinds is invalid' };
    for (const k of body.avoidKinds) {
      if (!KINDS.includes(k as Kind)) return { ok: false, error: 'avoidKinds is invalid' };
      avoidKinds.push(k as Kind);
    }
  }

  return { ok: true, value: { prefs, detail, localHour, avoidTitles, avoidKinds } };
}

// ── client identity ──────────────────────────────────────────────────

/** Expands an IPv6 address (validated by net.isIP) into its eight 16-bit groups. */
function ipv6Groups(ip: string): number[] {
  let s = ip.toLowerCase();
  const v4 = /(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(s);
  if (v4) {
    const [a, b, c, d] = v4.slice(1).map(Number);
    s = `${s.slice(0, v4.index)}${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`;
  }
  const [head, tail] = s.split('::');
  const h = head ? head.split(':') : [];
  const t = tail ? tail.split(':') : [];
  const fill = s.includes('::') ? 8 - h.length - t.length : 0;
  return [...h, ...Array<string>(Math.max(0, fill)).fill('0'), ...t].map((x) => Number.parseInt(x, 16) || 0);
}

/**
 * A rate-limit key for an address: IPv4 as is (IPv4-mapped IPv6 unwrapped),
 * IPv6 grouped by its /64 (one household or device usually owns a whole /64).
 * Returns null for anything that is not an IP address. Exported for tests.
 */
export function normalizeIp(raw: string): string | null {
  let s = raw.trim();
  const bracketed = /^\[([^\]]+)\](?::\d+)?$/.exec(s);
  if (bracketed) s = bracketed[1];
  else if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(s)) s = s.slice(0, s.lastIndexOf(':')); // "203.0.113.7:51234"
  const zone = s.indexOf('%');
  if (zone >= 0) s = s.slice(0, zone);
  const family = isIP(s);
  if (family === 4) return s;
  if (family !== 6) return null;
  const g = ipv6Groups(s);
  if (g.slice(0, 5).every((x) => x === 0) && g[5] === 0xffff) return `${g[6] >> 8}.${g[6] & 255}.${g[7] >> 8}.${g[7] & 255}`;
  return `${g.slice(0, 4).map((x) => x.toString(16)).join(':')}::/64`;
}

/**
 * The IPv6 /48 a client key belongs to ("2001:db8:77::/48"), or null for IPv4 and
 * anything else. A routed /48 (free from tunnel brokers) holds 65,536 /64 clients, so
 * every /48 also shares one, larger, set of limits. Exported for tests.
 */
export function networkOf(key: string): string | null {
  const m = /^([0-9a-f]{1,4}):([0-9a-f]{1,4}):([0-9a-f]{1,4}):[0-9a-f]{1,4}::\/64$/.exec(key);
  return m ? `${m[1]}:${m[2]}:${m[3]}::/48` : null;
}

/**
 * The client a request counts against. Behind trusted proxies, the client is the
 * Nth X-Forwarded-For entry from the RIGHT (N = trusted hops): each proxy appends
 * the address it saw, so entries further left are whatever the client sent and
 * cannot be trusted. Anything unusable falls back to the socket address.
 */
export function clientKey(req: Pick<IncomingMessage, 'headers' | 'socket'>, opts: { trustProxy: boolean; trustedHops: number }): string {
  if (opts.trustProxy) {
    const header = req.headers['x-forwarded-for'];
    const entries = (Array.isArray(header) ? header.join(',') : (header ?? ''))
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const candidate = entries[entries.length - Math.max(1, opts.trustedHops)];
    const ip = candidate ? normalizeIp(candidate) : null;
    if (ip) return ip;
  }
  return normalizeIp(req.socket.remoteAddress ?? '') ?? 'unknown';
}

const firstValue = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.split(',')[0]?.trim().toLowerCase() || '';

/**
 * Rejects cross-site POSTs (cost abuse) while allowing same-origin browsers and
 * non-browser clients. Behind a trusted proxy that rewrites Host (nginx's default
 * `proxy_set_header Host $proxy_host`), the public host arrives in X-Forwarded-Host.
 * PLOT_TWIST_ALLOWED_ORIGINS adds explicit origins. Exported for tests.
 */
export function originAllowed(headers: IncomingHttpHeaders, opts: { trustProxy: boolean; allowedOrigins: readonly string[] }): boolean {
  const origin = headers.origin;
  if (!origin) return true;
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }
  const host = url.host.toLowerCase();
  if (host === firstValue(headers.host)) return true;
  if (opts.trustProxy && host === firstValue(headers['x-forwarded-host'])) return true;
  return opts.allowedOrigins.includes(url.origin.toLowerCase()) || opts.allowedOrigins.includes(host);
}

// ── handler ──────────────────────────────────────────────────────────

export function createApiHandler(opts: ApiOptions = {}): ApiHandler {
  loadDotEnv();
  const config = opts.config ?? readConfig();
  const now = opts.now ?? Date.now;
  const log = opts.log ?? ((m: string) => console.log(`[plot-twist] ${m}`));
  const backend = opts.backend !== undefined ? opts.backend : config.apiKey ? createAnthropicBackend(config) : null;
  const status = new StatusTracker(backend, config.model, now, { misconfigured: !backend && Boolean(config.apiKeyProblem), log });
  const limiter = new RateLimiter(config.rateLimit.max, config.rateLimit.windowMs, now);
  const networkLimiter = new RateLimiter(config.rateLimit.max * NETWORK_RATE_FACTOR, config.rateLimit.windowMs, now);
  const trustProxy = opts.trustProxy ?? config.trustProxy;
  const identity = { trustProxy, trustedHops: config.trustedHops };
  const origins = { trustProxy, allowedOrigins: config.allowedOrigins };
  let active = 0;
  /** Open streams per client key and per IPv6 /48. */
  const openStreams = new Map<string, number>();
  const streamsOf = (key: string | null) => (key ? (openStreams.get(key) ?? 0) : 0);
  const holdStream = (key: string | null, delta: 1 | -1) => {
    if (!key) return;
    const left = streamsOf(key) + delta;
    if (left > 0) openStreams.set(key, left);
    else openStreams.delete(key);
  };

  /** The status after a check if one is due (an expired hold, a stale result), bounded by STATUS_WAIT_MS. */
  const currentStatus = async (force: boolean): Promise<DirectorStatus> => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const fallback = new Promise<DirectorStatus>((resolve) => {
      timer = setTimeout(() => resolve(status.snapshot()), STATUS_WAIT_MS);
    });
    try {
      return await Promise.race([status.refresh(force), fallback]);
    } finally {
      clearTimeout(timer);
    }
  };

  for (const warning of config.warnings) log(warning);
  if (backend) {
    log(`AI Director configured with ${config.model} (effort ${config.effort}); verifying…`);
    void status.refresh(true).then((s) => log(`AI Director status: ${s.state}`));
  } else if (config.apiKeyProblem) {
    log(`${config.apiKeyProblem} Curated episodes only.`);
  } else {
    log('AI Director not configured (set ANTHROPIC_API_KEY to enable personalized episodes). Curated episodes only.');
  }

  const handler = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const method = req.method ?? 'GET';

    if (url.pathname === '/api/health') {
      let build: string | null = null;
      try {
        build = opts.build?.() ?? null;
      } catch {
        build = null;
      }
      return sendJson(res, 200, { ok: true, build });
    }

    if (url.pathname === '/api/status') {
      if (method !== 'GET' && method !== 'HEAD') return sendJson(res, 405, { error: 'method_not_allowed' }, { allow: 'GET' });
      return sendJson(res, 200, await currentStatus(url.searchParams.get('refresh') === '1'));
    }

    if (url.pathname === '/api/episodes/generate') {
      if (method !== 'POST') return sendJson(res, 405, { error: 'method_not_allowed' }, { allow: 'POST' });
      if (!originAllowed(req.headers, origins)) return sendJson(res, 403, { error: 'cross_origin' });
      const type = req.headers['content-type'] ?? '';
      if (!type.includes('application/json')) return sendJson(res, 415, { error: 'expected application/json' });

      let raw: unknown;
      try {
        raw = JSON.parse(await readBody(req));
      } catch (err) {
        const tooLarge = (err as { code?: string }).code === 'too_large';
        return sendJson(res, tooLarge ? 413 : 400, { error: tooLarge ? 'body_too_large' : 'invalid_json' });
      }
      const parsed = parseGenerateBody(raw);
      if (!parsed.ok) return sendJson(res, 400, { error: 'invalid_request', message: parsed.error });

      if (!backend) return sendJson(res, 503, { error: config.apiKeyProblem ? 'unavailable' : 'not_configured', status: status.snapshot() });
      // Not just the cached snapshot: a provider failure is held for 30 s, and once that has
      // passed the next request re-checks (as /api/status would) instead of being refused
      // until someone happens to load the status.
      const snap = await currentStatus(false);
      if (res.destroyed || req.socket.destroyed) return; // the caller left while the status was checked
      if (!snap.canGenerate && snap.state !== 'checking') {
        return sendJson(res, 503, { error: 'unavailable', status: snap });
      }
      // Capacity first, quota second: a request turned away as busy must not use up the caller's quota.
      const key = clientKey(req, identity);
      const network = networkOf(key);
      if (active >= config.maxConcurrent) return sendJson(res, 503, { error: 'busy' }, { 'retry-after': '20' });
      // The last free slot is kept for a client with nothing open yet, so one client (or one /48)
      // can never hold every slot.
      if (config.maxConcurrent > 1 && active === config.maxConcurrent - 1 && (streamsOf(key) > 0 || streamsOf(network) > 0)) {
        return sendJson(res, 503, { error: 'busy' }, { 'retry-after': '20' });
      }
      if (streamsOf(key) >= config.maxStreamsPerClient) {
        return sendJson(res, 429, { error: 'too_many_streams', message: 'Finish or cancel the episode being written first.' }, { 'retry-after': '20' });
      }
      if (network && streamsOf(network) >= config.maxStreamsPerNetwork) {
        return sendJson(res, 429, { error: 'too_many_streams', message: 'Too many episodes are being written from your network right now.' }, { 'retry-after': '20' });
      }
      const allowed = takeAll(network ? [[limiter, key], [networkLimiter, network]] : [[limiter, key]]);
      if (!allowed.ok) {
        return sendJson(res, 429, { error: 'rate_limited', retryAfterMs: allowed.retryAfterMs }, { 'retry-after': String(Math.ceil(allowed.retryAfterMs / 1000)) });
      }

      active++;
      holdStream(key, 1);
      holdStream(network, 1);
      const controller = new AbortController();
      const onClose = () => {
        if (!res.writableEnded) controller.abort();
      };
      res.on('close', onClose);
      res.writeHead(200, {
        'content-type': 'text/event-stream; charset=utf-8',
        'cache-control': 'no-store, no-transform',
        connection: 'keep-alive',
        'x-accel-buffering': 'no',
        'x-content-type-options': 'nosniff',
      });
      res.flushHeaders?.();
      const send = (event: GenerateEvent) => {
        if (res.writableEnded || res.destroyed) return;
        res.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
      };
      res.write(': plot twist incoming\n\n');
      const ping = setInterval(() => {
        if (!res.writableEnded) res.write(': ping\n\n');
      }, 15_000);
      // Backstop only: the Director enforces the deadline itself. A deadline reason makes it report
      // "timeout" (a stalled provider), never "Cancelled.".
      const backstop = setTimeout(() => controller.abort(deadlineReason()), config.deadlineMs + 5_000);
      try {
        await generateEpisode(
          parsed.value,
          { backend, effort: config.effort, status, log, attemptTimeoutMs: config.timeoutMs, deadlineMs: config.deadlineMs },
          controller.signal,
          send,
        );
      } finally {
        clearInterval(ping);
        clearTimeout(backstop);
        res.off('close', onClose);
        active--;
        holdStream(key, -1);
        holdStream(network, -1);
        if (!res.writableEnded) res.end();
      }
      return;
    }

    return sendJson(res, 404, { error: 'not_found' });
  };

  return Object.assign(handler, { status, config });
}
