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
    const raw = part.slice(i + 1).trim();
    let value = raw;
    // A malformed %-escape from some other cookie on the same host must not turn every request into a 500.
    try { value = decodeURIComponent(raw); } catch { /* keep the raw text */ }
    out[part.slice(0, i).trim()] = value;
  }
  return out;
}

export function sessionCookie(deps: Deps, token: string, remember = true): string {
  const max = remember ? `; Max-Age=${deps.sessionTtlDays * 86400}` : ""; // no Max-Age = dies when the browser closes
  return `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/${max}${deps.secureCookies ? '; Secure' : ''}`;
}
export function clearedCookie(deps: Deps): string {
  return `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${deps.secureCookies ? '; Secure' : ''}`;
}

function normalise(r: HandlerResult): ApiResponse {
  if ('json' in r) return { status: r.status ?? 200, body: r.json, ...(r.setCookies ? { setCookies: r.setCookies } : {}), ...(r.headers ? { headers: r.headers } : {}) };
  return r;
}

export interface ApiApp {
  handle(req: ApiRequest): Promise<ApiResponse>;
  /** The session behind a request's cookie, or null (one indexed SELECT). Lets a transport refuse before it reads a large body. */
  authenticate(headers: Record<string, string>): Promise<{ user: NonNullable<Ctx['user']>; session: NonNullable<Ctx['session']> } | null>;
  router: Router; deps: Deps;
}

/** An Idempotency-Key claimed less than this long ago is still being worked on; an older unfinished claim (crashed request) is taken over. */
export const IDEMPOTENCY_CLAIM_MS = 60_000;

/** The admin list is the single source of truth: a stored role 'admin' counts only while the username is still listed. */
export function effectiveRole(deps: Deps, username: string, stored: 'user' | 'admin'): 'user' | 'admin' {
  return stored === 'admin' && (deps.adminUsernames ?? []).some((n) => n.toLowerCase() === username.toLowerCase()) ? 'admin' : 'user';
}

/** SHA-256 hex of a session token, through the injected synchronous hash when the host provides one. */
export const tokenHash = async (deps: Deps, token: string): Promise<string> => (deps.sha256 ? deps.sha256(token) : sha256Hex(token));

export function createApiApp(deps: Deps, router: Router): ApiApp {
  async function authenticate(headers: Record<string, string>) {
    const token = parseCookies(headers['cookie'])[SESSION_COOKIE];
    if (!token || !/^[0-9a-f]{64}$/.test(token)) return null;
    const rows = await deps.db.query<{ sid: string; csrf: string; uid: string; username: string; role: 'user' | 'admin' }>(
      'SELECT s.id AS sid, s.csrf_token AS csrf, u.id AS uid, u.username, u.role FROM auth_sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = $1 AND s.expires_at > $2',
      [await tokenHash(deps, token), deps.clock().toISOString()]);
    const r = rows[0];
    return r ? { user: { id: r.uid, username: r.username, role: effectiveRole(deps, r.username, r.role) }, session: { id: r.sid, csrf: r.csrf } } : null;
  }

  async function handle(req: ApiRequest): Promise<ApiResponse> {
    try { return await dispatch(req); }
    catch (e) {
      if (e instanceof ApiError) return { status: e.status, body: { error: e.code, ...(e.extra ?? {}) }, ...(e.headers ? { headers: e.headers } : {}) };
      // Database data errors caused by the request itself (impossible date, out-of-range number, too-long text) are client errors.
      const pgCode = typeof e === 'object' && e !== null && 'code' in e ? String((e as { code?: unknown }).code) : '';
      if (/^22[0-9A-Z]{3}$/.test(pgCode)) return { status: 400, body: { error: 'validation_error' } };
      if (pgCode === '23505') return { status: 409, body: { error: 'conflict' } };
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
    const auth = await authenticate(req.headers);
    const user: Ctx['user'] = auth?.user ?? null; const session: Ctx['session'] = auth?.session ?? null;
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

    // --- idempotency: the key is CLAIMED before the handler runs, so parallel replays of one key (two tabs flushing the same offline
    // outbox) cannot both run it. A claim is a row with status_code 0; it becomes the stored answer on success and is removed otherwise.
    const idemKey = req.headers['idempotency-key'];
    const useIdem = !!idemKey && !!user && MUTATING.has(method) && route.opts.idempotent !== false && idemKey.length <= 128;
    let claimed = false;
    if (useIdem && user && idemKey) {
      claimed = (await deps.db.query('INSERT INTO idempotency_keys (user_id, key, method, path, status_code, response_body, created_at) VALUES ($1,$2,$3,$4,0,NULL,$5) ON CONFLICT DO NOTHING RETURNING 1', [user.id, idemKey, method, req.path, now.toISOString()])).length > 0;
      if (!claimed) {
        const p = (await deps.db.query<{ method: string; path: string; status_code: number; response_body: unknown; created_at: Date | string }>('SELECT method, path, status_code, response_body, created_at FROM idempotency_keys WHERE user_id = $1 AND key = $2', [user.id, idemKey]))[0];
        if (p && (p.method !== method || p.path !== req.path)) throw new ApiError(422, 'idempotency_key_reused');
        if (p && p.status_code !== 0) return { status: p.status_code, body: p.response_body ?? undefined, headers: { 'idempotent-replay': 'true' } };
        // Still running elsewhere (or the claim vanished a moment ago): ask the client to retry shortly. A stale claim is taken over.
        const stale = new Date(now.getTime() - IDEMPOTENCY_CLAIM_MS).toISOString();
        if (p) claimed = (await deps.db.query('UPDATE idempotency_keys SET created_at = $3 WHERE user_id = $1 AND key = $2 AND status_code = 0 AND created_at < $4 RETURNING 1', [user.id, idemKey, now.toISOString(), stale])).length > 0;
        if (!claimed) throw new ApiError(429, 'rate_limited', { reason: 'idempotency_in_progress' }, { 'retry-after': '1' });
      }
    }
    const release = () => (user && idemKey ? deps.db.query('DELETE FROM idempotency_keys WHERE user_id = $1 AND key = $2 AND status_code = 0', [user.id, idemKey]).catch(() => undefined) : undefined);

    let res: ApiResponse;
    try {
      res = normalise(await route.handler(ctx));
      // Canonical JSON (Dates -> ISO strings): every transport (HTTP, device worker, tests) sees byte-identical bodies.
      if (res.body !== undefined) res.body = JSON.parse(JSON.stringify(res.body)) as unknown;
    } catch (e) { if (claimed) await release(); throw e; }
    if (claimed && user && idemKey) {
      // After DELETE /api/account the claim has cascaded away with the user: updating 0 rows is fine.
      // replayBody:false routes keep only the status: their answers (coach chats, the profile, photo estimates) hold private text.
      const stored = route.opts.replayBody === false ? null : JSON.stringify(res.body ?? null);
      if (res.status >= 200 && res.status < 300) await deps.db.query('UPDATE idempotency_keys SET status_code = $3, response_body = $4::jsonb WHERE user_id = $1 AND key = $2', [user.id, idemKey, res.status, stored]);
      else await release();
    }
    return res;
  }

  return { handle, authenticate, router, deps };
}

export { randomId, randomHex };
