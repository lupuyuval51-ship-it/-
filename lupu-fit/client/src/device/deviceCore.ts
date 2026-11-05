/**
 * Device Mode core (no worker globals, so it is unit-testable): the portable API app over one PGlite database that belongs to the one
 * person using this install. A hidden local account is provisioned on first boot; its credential lives in app_meta (never localStorage).
 *
 * Account deletion is physical here: a SQL DELETE only marks rows dead and the text stays in the heap files and the WAL, so after a
 * successful DELETE /api/account the whole database is closed and removed from storage, then a fresh one is created. Every step is
 * self-healing: if the app is closed (or storage fails) half-way, the next boot sees a stored credential without a user row and finishes
 * the job instead of failing to log in forever.
 */
import { buildApp } from '../../../server/src/createApp.ts';
import { randomHex } from '../../../server/src/crypto/portableCrypto.ts';
import { migrate } from '../../../server/src/db/migrate.ts';
import { PgliteAdapter } from '../../../server/src/db/pgliteAdapter.ts';
import { extraRoutes } from '../../../server/src/routes/index.ts';
import type { ApiApp } from '../../../server/src/core/app.ts';
import type { Deps } from '../../../server/src/core/types.ts';
import type { TransportRequest, TransportResponse } from '../api/transport.ts';

export interface DbStore {
  open(): Promise<PgliteAdapter>;
  /** Closes the database and removes all of its storage (heap, WAL, counters). */
  destroy(db: PgliteAdapter): Promise<void>;
}

export const DEVICE_DATA_DIR = 'idb://lupu-fit-pgdata';

type IdbfsModule = { Module?: { FS?: { filesystems?: { IDBFS?: { dbs?: Record<string, IDBDatabase> } } } } };

/** The real store: PGlite persisted by Emscripten IDBFS in the IndexedDB database `/pglite/<name>`. */
export function idbStore(dataDir = DEVICE_DATA_DIR, idb: () => IDBFactory = () => indexedDB, timeoutMs = 15_000): DbStore {
  const name = `/pglite/${dataDir.replace(/^idb:\/\//, '')}`;
  return {
    open: () => PgliteAdapter.create(dataDir),
    async destroy(db) {
      // PGlite 0.3 looks its IndexedDB connection up under the wrong key on close and leaves it open; deleteDatabase would then wait
      // for it forever. Close every connection this instance opened ourselves.
      const conns = Object.values((db.db as unknown as IdbfsModule).Module?.FS?.filesystems?.IDBFS?.dbs ?? {});
      await db.close().catch(() => undefined); // the files are about to be deleted, a failed flush does not matter
      for (const c of conns) { try { c.close(); } catch { /* already closed */ } }
      await new Promise<void>((resolve, reject) => {
        const req = idb().deleteDatabase(name);
        const timer = setTimeout(() => reject(new Error('device_wipe_blocked')), timeoutMs);
        req.onsuccess = () => { clearTimeout(timer); resolve(); };
        req.onerror = () => { clearTimeout(timer); reject(req.error ?? new Error('device_wipe_failed')); };
      });
    },
  };
}

type Cred = { username: string; password: string };
type StoredCred = { username?: string; email?: string; password: string };

export interface DeviceServer {
  /** Opens (and if needed repairs) the database and signs the hidden account in. */
  boot(): Promise<void>;
  /** Handles one request. For a successful account deletion `after` wipes and re-provisions; the caller answers first, then runs it. */
  handle(req: TransportRequest): Promise<{ res: TransportResponse; after?: () => Promise<void> }>;
  close(): Promise<void>;
}

export function createDeviceServer(store: DbStore, makeDeps: (db: PgliteAdapter) => Deps): DeviceServer {
  let db: PgliteAdapter | null = null;
  let app: ApiApp | null = null;
  let jar = { cookie: '', csrf: '' };

  async function raw(req: TransportRequest, auth = true): Promise<TransportResponse> {
    const headers: Record<string, string> = { ...(req.headers ?? {}) };
    if (auth && jar.cookie) headers['cookie'] = jar.cookie;
    if (auth && jar.csrf && req.method !== 'GET') headers['x-csrf-token'] = jar.csrf;
    const bodyBytes = req.body === undefined ? 0 : JSON.stringify(req.body).length;
    const res = await (app as ApiApp).handle({ method: req.method, path: req.path, query: req.query ?? {}, headers, body: req.body, ip: 'device', bodyBytes });
    const set = res.setCookies?.[0];
    if (set) jar.cookie = set.startsWith('lf_session=;') ? '' : (set.split(';')[0] as string);
    const csrf = (res.body as { csrfToken?: string } | undefined)?.csrfToken;
    if (csrf) jar.csrf = csrf;
    return { status: res.status, body: res.body ?? null, headers: res.headers ?? {} };
  }

  async function openFresh(): Promise<PgliteAdapter> { const d = await store.open(); await migrate(d); return d; }

  async function readCred(d: PgliteAdapter): Promise<Cred | undefined> {
    const s = (await d.query<{ value: StoredCred }>("SELECT value FROM app_meta WHERE key = 'device_credential'"))[0]?.value;
    // Older devices stored device-<hex>@lupu-fit.local; migration 0003 turned that account into device_<hex>.
    return s ? { username: s.username ?? `device_${(s.email ?? '').slice(7).split('@')[0]}`, password: s.password } : undefined;
  }

  async function boot(): Promise<void> {
    try { await bootOnce(); } catch (e) { app = null; throw e; } // handle() retries on the next request
  }

  async function bootOnce(): Promise<void> {
    if (db) { const old = db; db = null; app = null; await old.close().catch(() => undefined); }
    let d = await openFresh();
    let cred = await readCred(d);
    if (cred && (await d.query('SELECT 1 FROM users WHERE lower(username) = $1', [cred.username.toLowerCase()])).length === 0) {
      // The account is gone (deleted, or its registration never finished) but the wipe did not happen. With nobody else in here the
      // whole database is removed, so the deleted person's text does not linger; otherwise only the dead credential is dropped.
      if ((await d.query('SELECT 1 FROM users LIMIT 1')).length === 0) { await store.destroy(d); d = await openFresh(); }
      else await d.query("DELETE FROM app_meta WHERE key = 'device_credential'");
      cred = undefined;
    }
    db = d; app = buildApp(makeDeps(d), extraRoutes); jar = { cookie: '', csrf: '' };
    if (!cred) {
      cred = { username: `device_${randomHex(8)}`, password: randomHex(24) };
      // Stored BEFORE registering: if registration fails or the app is closed now, the next boot finds a credential without a user
      // and starts over, instead of a user nobody can sign in to.
      await d.query("INSERT INTO app_meta (key, value) VALUES ('device_credential', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value", [JSON.stringify(cred)]);
      const reg = await raw({ method: 'POST', path: '/api/auth/register', body: cred }, false);
      if (reg.status !== 201) throw new Error(`device_register_failed:${reg.status}`);
      return;
    }
    const login = await raw({ method: 'POST', path: '/api/auth/login', body: cred }, false);
    if (login.status !== 200) throw new Error(`device_login_failed:${login.status}`);
  }

  async function wipeAndBoot(): Promise<void> {
    const d = db; db = null; app = null; jar = { cookie: '', csrf: '' };
    if (d) await store.destroy(d);
    await boot();
  }

  return {
    boot,
    async handle(req) {
      if (!app) await boot(); // an earlier boot or wipe failed: try again rather than staying broken
      const res = await raw(req);
      // After the account is deleted the app stays usable: a fresh database and hidden account (a new onboarding starts).
      if (req.method === 'DELETE' && req.path === '/api/account' && res.status === 200) return { res, after: wipeAndBoot };
      return { res };
    },
    async close() { const d = db; db = null; app = null; if (d) await d.close(); },
  };
}
