import { z } from 'zod';
import { randomHex, randomId, sha256Hex } from '../crypto/portableCrypto.ts';
import { ApiError } from './errors.ts';
import { Router } from './router.ts';
import type { ApiRequest, ApiResponse, Ctx, Deps, HandlerResult, Route } from './types.ts';

export const SESSION_COOKIE = 'lf_session';
const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const DEFAULT_MAX_BODY = 100 * 1024;

export function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export function sessionCookie(deps: Deps, token: string): string {
  const max = deps.sessionTtlDays * 86400;
  return `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${max}${deps.secureCookies ? '; Secure' : ''}`;
}
export function clearedCookie(deps: Deps): string {
  return `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${deps.secureCookies ? '; Secure' : ''}`;
}

function normalise(r: HandlerResult): ApiResponse {
  if ('json' in r) return { status: r.status ?? 200, body: r.json, ...(r.setCookies ? { setCookies: r.setCookies } : {}), ...(r.headers ? { headers: r.headers } : {}) };
  return r;
}

export interface ApiApp { handle(req: ApiRequest): Promise<ApiResponse>; router: Router; deps: Deps }

export function createApiApp(deps: Deps, router: Router): ApiApp {
  async function handle(req: ApiRequest): Promise<ApiResponse> {
    try { return await dispatch(req); }
    catch (e) {
      if (e instanceof ApiError) return { status: e.status, body: { error: e.code, ...(e.extra ?? {}) }, ...(e.headers ? { headers: e.headers } : {}) };
      // Never leak internals. The host logs the raw error through deps hooks if it wants to.
      console.error('[api] unhandled', e instanceof Error ? e.message : e);
      return { status: 500, body: { error: 'internal_error' } };
    }
  }

  async function dispatch(req: ApiRequest): Promise<ApiResponse> {
    const method = req.method.toUpperCase();
    const m = router.match(method, req.path);
    if (!('route' in m)) return { status: m.pathExists ? 405 : 404, body: { error: m.pathExists ? 'method_not_allowed' : 'not_found' } };
    const route: Route = m.route;
    const needsAuth = route.opts.auth !== false;
    const now = deps.clock();

    const limit = route.opts.maxBodyBytes ?? DEFAULT_MAX_BODY;
    if (req.bodyBytes !== undefined && req.bodyBytes > limit) throw new ApiError(413, 'payload_too_large');

    // --- session
    let user: Ctx['user'] = null; let session: Ctx['session'] = null;
    const token = parseCookies(req.headers['cookie'])[SESSION_COOKIE];
    if (token && /^[0-9a-f]{64}$/.test(token)) {
      const rows = await deps.db.query<{ sid: string; csrf: string; uid: string; username: string; role: 'user' | 'admin' }>(
        'SELECT s.id AS sid, s.csrf_token AS csrf, u.id AS uid, u.username, u.role FROM auth_sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = $1 AND s.expires_at > $2',
        [await sha256Hex(token), now.toISOString()]);
      const r = rows[0];
      if (r) { user = { id: r.uid, username: r.username, role: r.role }; session = { id: r.sid, csrf: r.csrf }; }
    }
    if (needsAuth && !user) throw new ApiError(401, 'unauthorized');

    // --- CSRF (only meaningful with a session cookie)
    if (needsAuth && route.opts.csrf !== false && MUTATING.has(method) && session) {
      if (req.headers['x-csrf-token'] !== session.csrf) throw new ApiError(403, 'csrf_invalid');
    }

    // --- body validation
    let body: unknown = req.body;
    if (route.opts.body) {
      const parsed = route.opts.body.safeParse(req.body ?? {});
      if (!parsed.success) throw new ApiError(400, 'validation_error', { issues: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })) });
      body = parsed.data;
    }

    const ctx: Ctx = { req, deps, db: deps.db, params: m.params, body, now, user, session };

    // --- idempotency
    const idemKey = req.headers['idempotency-key'];
    const useIdem = !!idemKey && !!user && MUTATING.has(method) && route.opts.idempotent !== false && idemKey.length <= 128;
    if (useIdem && user && idemKey) {
      const prev = await deps.db.query<{ method: string; path: string; status_code: number; response_body: unknown }>('SELECT method, path, status_code, response_body FROM idempotency_keys WHERE user_id = $1 AND key = $2', [user.id, idemKey]);
      const p = prev[0];
      if (p) {
        if (p.method !== method || p.path !== req.path) throw new ApiError(422, 'idempotency_key_reused');
        return { status: p.status_code, body: p.response_body ?? undefined, headers: { 'idempotent-replay': 'true' } };
      }
    }

    const res = normalise(await route.handler(ctx));
    // Canonical JSON (Dates -> ISO strings): every transport (HTTP, device worker, tests) sees byte-identical bodies.
    if (res.body !== undefined) res.body = JSON.parse(JSON.stringify(res.body)) as unknown;
    if (useIdem && user && idemKey && res.status >= 200 && res.status < 300) {
      await deps.db.query('INSERT INTO idempotency_keys (user_id, key, method, path, status_code, response_body) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING', [user.id, idemKey, method, req.path, res.status, JSON.stringify(res.body ?? null)]);
    }
    return res;
  }

  return { handle, router, deps };
}

export const idSchema = z.string().min(1).max(80);
export { randomId, randomHex };
