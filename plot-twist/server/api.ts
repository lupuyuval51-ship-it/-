/**
 * PLOT TWIST API — framework-free (node:http), mounted by the production server
 * and by the Vite dev server.
 *
 *   GET  /api/status             → DirectorStatus (real, verified connection state)
 *   POST /api/episodes/generate  → text/event-stream of GenerateEvent
 *   GET  /api/health             → { ok: true }
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { BUDGET_OPTIONS, COMPANY_OPTIONS, KINDS, MINUTES_OPTIONS, MOOD_OPTIONS, SETTING_OPTIONS, WEIRDNESS_OPTIONS } from '../shared/constants.ts';
import { cleanNote } from '../shared/template.ts';
import type { Kind, Prefs } from '../shared/types.ts';
import { createAnthropicBackend, type Backend } from './backend.ts';
import { loadDotEnv, readConfig, type ServerConfig } from './config.ts';
import { generateEpisode, type GenerateEvent } from './director.ts';
import type { BriefInput } from './prompt.ts';
import { RateLimiter } from './rateLimit.ts';
import { StatusTracker } from './status.ts';

export interface ApiOptions {
  config?: ServerConfig;
  /** Override the model backend (tests). `null` = not configured. */
  backend?: Backend | null;
  now?: () => number;
  log?: (message: string) => void;
  /** Trust X-Forwarded-For for rate limiting (only behind a trusted proxy). */
  trustProxy?: boolean;
}

export type ApiHandler = ((req: IncomingMessage, res: ServerResponse) => Promise<void>) & {
  status: StatusTracker;
  config: ServerConfig;
};

const MAX_BODY_BYTES = 8 * 1024;
export const MAX_DETAIL_LENGTH = 140;

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
    detail = cleanNote(body.detail).slice(0, MAX_DETAIL_LENGTH) || undefined;
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
      const clean = cleanNote(t).slice(0, 60);
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

function clientKey(req: IncomingMessage, trustProxy: boolean): string {
  if (trustProxy) {
    const fwd = req.headers['x-forwarded-for'];
    const first = (Array.isArray(fwd) ? fwd[0] : fwd)?.split(',')[0]?.trim();
    if (first) return first;
  }
  return req.socket.remoteAddress ?? 'unknown';
}

/** Rejects cross-site POSTs (cost abuse) while allowing same-origin browsers and non-browser clients. */
function sameOrigin(req: IncomingMessage): boolean {
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
}

export function createApiHandler(opts: ApiOptions = {}): ApiHandler {
  loadDotEnv();
  const config = opts.config ?? readConfig();
  const now = opts.now ?? Date.now;
  const log = opts.log ?? ((m: string) => console.log(`[plot-twist] ${m}`));
  const backend = opts.backend !== undefined ? opts.backend : config.apiKey ? createAnthropicBackend(config) : null;
  const status = new StatusTracker(backend, config.model, now);
  const limiter = new RateLimiter(config.rateLimit.max, config.rateLimit.windowMs, now);
  const trustProxy = opts.trustProxy ?? process.env.PLOT_TWIST_TRUST_PROXY === '1';
  let active = 0;

  if (backend) {
    log(`AI Director configured with ${config.model} (effort ${config.effort}); verifying…`);
    void status.refresh(true).then((s) => log(`AI Director status: ${s.state}`));
  } else {
    log('AI Director not configured (set ANTHROPIC_API_KEY to enable personalized episodes). Curated episodes only.');
  }

  const handler = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const method = req.method ?? 'GET';

    if (url.pathname === '/api/health') {
      return sendJson(res, 200, { ok: true });
    }

    if (url.pathname === '/api/status') {
      if (method !== 'GET' && method !== 'HEAD') return sendJson(res, 405, { error: 'method_not_allowed' }, { allow: 'GET' });
      const snapshot = await Promise.race([
        status.refresh(url.searchParams.get('refresh') === '1'),
        new Promise<ReturnType<StatusTracker['snapshot']>>((r) => setTimeout(() => r(status.snapshot()), 10_000)),
      ]);
      return sendJson(res, 200, snapshot);
    }

    if (url.pathname === '/api/episodes/generate') {
      if (method !== 'POST') return sendJson(res, 405, { error: 'method_not_allowed' }, { allow: 'POST' });
      if (!sameOrigin(req)) return sendJson(res, 403, { error: 'cross_origin' });
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

      if (!backend) return sendJson(res, 503, { error: 'not_configured', status: status.snapshot() });
      const snap = status.snapshot();
      if (!snap.canGenerate && snap.state !== 'checking') {
        return sendJson(res, 503, { error: 'unavailable', status: snap });
      }
      const allowed = limiter.take(clientKey(req, trustProxy));
      if (!allowed.ok) {
        return sendJson(res, 429, { error: 'rate_limited', retryAfterMs: allowed.retryAfterMs }, { 'retry-after': String(Math.ceil(allowed.retryAfterMs / 1000)) });
      }
      if (active >= config.maxConcurrent) return sendJson(res, 503, { error: 'busy' }, { 'retry-after': '20' });

      active++;
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
      const timeout = setTimeout(() => controller.abort(), config.timeoutMs * 2 + 10_000);
      try {
        await generateEpisode(parsed.value, { backend, effort: config.effort, status, log }, controller.signal, send);
      } finally {
        clearInterval(ping);
        clearTimeout(timeout);
        res.off('close', onClose);
        active--;
        if (!res.writableEnded) res.end();
      }
      return;
    }

    return sendJson(res, 404, { error: 'not_found' });
  };

  return Object.assign(handler, { status, config });
}
