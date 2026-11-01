/// <reference lib="webworker" />
/**
 * Device Mode worker: the SAME portable API app that the hosted server uses, running over PGlite persisted in IndexedDB.
 *  - one worker = one writer; requests are serialised through a promise queue so transactions never interleave
 *  - a hidden local account is provisioned on first boot; its credential lives in the app_meta table (never localStorage)
 *  - network egress is restricted to same-origin, Open Food Facts and the optional AI proxy
 */
import { buildApp, DEFAULT_DEPS } from '../../../server/src/createApp.ts';
import { randomHex } from '../../../server/src/crypto/portableCrypto.ts';
import { migrate } from '../../../server/src/db/migrate.ts';
import { PgliteAdapter } from '../../../server/src/db/pgliteAdapter.ts';
import { extraRoutes } from '../../../server/src/routes/index.ts';
import type { ApiApp } from '../../../server/src/core/app.ts';
import type { TransportRequest, TransportResponse } from '../api/transport.ts';
import { ProxyAiProvider } from './proxyAi.ts';

const ctx = self as unknown as DedicatedWorkerGlobalScope;
const ALLOWED_HOSTS = new Set(['world.openfoodfacts.org']);

export function makeGuardedFetch(aiProxy: string | undefined, base: typeof fetch = fetch): typeof fetch {
  const proxyHost = aiProxy ? new URL(aiProxy).host : null;
  return ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url, ctx.location.href);
    const ok = url.origin === ctx.location.origin || ALLOWED_HOSTS.has(url.host) || (proxyHost !== null && url.host === proxyHost);
    if (!ok) return Promise.reject(new Error(`egress_blocked:${url.host}`));
    return base(input, init);
  }) as typeof fetch;
}

let app: ApiApp;
let jar = { cookie: '', csrf: '' };
let queue: Promise<unknown> = Promise.resolve();

async function raw(req: TransportRequest, auth = true): Promise<TransportResponse> {
  const headers: Record<string, string> = { ...(req.headers ?? {}) };
  if (auth && jar.cookie) headers['cookie'] = jar.cookie;
  if (auth && jar.csrf && req.method !== 'GET') headers['x-csrf-token'] = jar.csrf;
  const bodyBytes = req.body === undefined ? 0 : JSON.stringify(req.body).length;
  const res = await app.handle({ method: req.method, path: req.path, query: req.query ?? {}, headers, body: req.body, ip: 'device', bodyBytes });
  const set = res.setCookies?.[0];
  if (set) jar.cookie = set.startsWith('lf_session=;') ? '' : (set.split(';')[0] as string);
  const csrf = (res.body as { csrfToken?: string } | undefined)?.csrfToken;
  if (csrf) jar.csrf = csrf;
  return { status: res.status, body: res.body ?? null, headers: res.headers ?? {} };
}

async function provision(db: PgliteAdapter, force = false): Promise<void> {
  const meta = force ? [] : await db.query<{ value: { email: string; password: string } }>("SELECT value FROM app_meta WHERE key = 'device_credential'");
  let cred = meta[0]?.value;
  if (!cred) {
    cred = { email: `device-${randomHex(8)}@lupu-fit.local`, password: randomHex(24) };
    const reg = await raw({ method: 'POST', path: '/api/auth/register', body: cred }, false);
    if (reg.status !== 201) throw new Error(`device_register_failed:${reg.status}`);
    await db.query("INSERT INTO app_meta (key, value) VALUES ('device_credential', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value", [JSON.stringify(cred)]);
    return;
  }
  const login = await raw({ method: 'POST', path: '/api/auth/login', body: cred }, false);
  if (login.status !== 200) throw new Error(`device_login_failed:${login.status}`);
}

async function init(): Promise<void> {
  const db = await PgliteAdapter.create('idb://lupu-fit-pgdata');
  await migrate(db);
  const aiProxy = (import.meta.env['VITE_AI_PROXY_URL'] as string | undefined) || undefined;
  const f = makeGuardedFetch(aiProxy);
  app = buildApp({
    db, mode: 'device', clock: () => new Date(), ...DEFAULT_DEPS, sessionTtlDays: 3650, secureCookies: false, fetch: f,
    ...(aiProxy ? { ai: new ProxyAiProvider(aiProxy, f) } : {}),
  }, extraRoutes);
  await provision(db);
  (ctx as unknown as { __db: PgliteAdapter }).__db = db;
}

ctx.onmessage = (e: MessageEvent<{ type: 'init' } | { type: 'req'; id: number; req: TransportRequest }>) => {
  const m = e.data;
  if (m.type === 'init') {
    init().then(() => ctx.postMessage({ type: 'ready' }), (err: unknown) => ctx.postMessage({ type: 'fatal', message: err instanceof Error ? err.message : String(err) }));
    return;
  }
  queue = queue.then(async () => {
    try {
      const res = await raw(m.req);
      // After the account is deleted the app stays usable: provision a fresh hidden account (a new onboarding starts).
      if (m.req.method === 'DELETE' && m.req.path === '/api/account' && res.status === 200) { jar = { cookie: '', csrf: '' }; await provision((ctx as unknown as { __db: PgliteAdapter }).__db, true); }
      ctx.postMessage({ type: 'res', id: m.id, res });
    } catch (err) { ctx.postMessage({ type: 'err', id: m.id, message: err instanceof Error ? err.message : 'worker_error' }); }
  });
};
