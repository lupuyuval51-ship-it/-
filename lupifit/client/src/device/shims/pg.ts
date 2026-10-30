/**
 * `pg` (node-postgres) for device mode: the server's SQL runs unchanged on PGlite, real PostgreSQL
 * compiled to WebAssembly, inside the app. The bundler aliases `pg` to this module.
 *
 * What it implements (the part server/src/db uses):
 * - `new Pool({ connectionString })`: the connection string is the PGlite data directory:
 *   `idb://<name>` (IndexedDB, the app), `memory://` (tests) or `opfs-ahp://<name>`. A postgres:// URL is
 *   refused. Every Pool on the same data directory shares ONE PGlite instance, created lazily on the first
 *   query, with the `pg_trgm` extension loaded. `pool.end()` leaves it open (see `closeDeviceDatabase`).
 * - `pool.query(text, params)` and `pool.connect()` → `{ query, release }`. Like node-postgres, a query
 *   without parameters uses the simple protocol (PGlite `exec`, so multi-statement migration files work)
 *   and returns one result per statement when there are several; with parameters it uses the extended
 *   protocol (PGlite `query`). Results are `{ command, rowCount, rows, fields }`; `rowCount` is the
 *   command-tag count as in node-postgres (rows for SELECT, affected rows for INSERT/UPDATE/DELETE, null
 *   for other commands). PGlite's `affectedRows` is not used: it is 0 for SELECT.
 * - `BEGIN` / `COMMIT` / `ROLLBACK` on a client run through PGlite's own transaction API, so PGlite does
 *   not flush its storage after every statement inside a transaction; the shim flushes once after COMMIT
 *   (`syncToFs`), which makes a committed transaction durable before COMMIT returns. In 'manual' flush mode
   (the app, see `FlushMode` and worker/runtime.ts) storage is written only by `flushDeviceDatabase()`,
   which the worker calls after each write request.
 * - `types.setTypeParser(oid, parser)`: registered parsers apply to every result (server/src/db/pool.ts
 *   registers NUMERIC → number, BIGINT → number, DATE → 'YYYY-MM-DD'). As in node-postgres, BIGINT is a
 *   string unless a parser is registered. Other types use PGlite's parsers, which match node-postgres for
 *   everything the server reads (int/float/bool/text/uuid/json/jsonb, timestamptz → Date, text[], int[],
 *   numeric[]); `timestamp without time zone` is read as UTC, like a server process running in UTC,
 *   whatever the phone's time zone. Arrays use their element's parser, so BIGINT[] and DATE[] (never read
 *   by the server) would come back as numbers and strings where node-postgres gives strings and Dates.
 * - Errors are PGlite's DatabaseError, which has node-postgres' shape (`code` such as '23505', `detail`,
 *   `constraint`, `severity`…). The query parameters PGlite attaches are removed so that a logged error
 *   never contains them (node-postgres errors do not carry them either).
 * - Clock: PGlite's clock has millisecond resolution, so `clock_timestamp()` repeats within a
 *   millisecond, while the server relies on it for a stable order of rows written in quick succession
 *   (notifications, XP events, coach messages, food entries). Each database therefore gets a
 *   `public.clock_timestamp()` that returns the real clock, moved forward by a microsecond whenever it
 *   would not be later than the previous value, and the session searches `public` before `pg_catalog`.
 *
 * One connection: a PGlite database is a single Postgres backend. Two lease modes decide what happens
 * when several callers use it:
 * - 'shared' (default, the app): requests are handled one at a time (see `createDispatcher` in
 *   ./express.ts), so a query arriving while a client is checked out belongs to the same request: it runs
 *   on that client's transaction, and a `db.tx` nested in a `db.tx` becomes a savepoint. Both are
 *   counted in `deviceDatabaseStats()` (Postgres would use a second connection there).
 * - 'exclusive' (Node tests with concurrent callers): the connection behaves like a pool of size one;
 *   clients and pool queries wait their turn (FIFO). A pool query (or a second `db.tx`) made by code that
 *   holds a transaction would wait forever here, so a green server test suite in this mode shows that no
 *   path it covers does that, and for those paths shared mode behaves exactly like Postgres. Waiting
 *   longer than `leaseWarnMs` logs a warning with the waiting call's stack.
 */
import { IdbFs, PGlite, type PGliteOptions, type Results, type Transaction } from '@electric-sql/pglite';
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';

export type TypeParser = (value: string) => unknown;

/** OIDs of the built-in types the server reads (subset of node-postgres' `types.builtins`). */
export const builtins = {
  BOOL: 16,
  INT8: 20,
  INT2: 21,
  INT4: 23,
  TEXT: 25,
  OID: 26,
  JSON: 114,
  FLOAT4: 700,
  FLOAT8: 701,
  DATE: 1082,
  TIMESTAMP: 1114,
  TIMESTAMPTZ: 1184,
  NUMERIC: 1700,
  UUID: 2950,
  JSONB: 3802,
} as const;

/** node-postgres defaults that differ from PGlite's: BIGINT stays a string unless a parser is registered. */
const PG_DEFAULTS: Record<number, TypeParser> = { [builtins.INT8]: (v) => v };
const registered = new Map<number, TypeParser>();

function currentParsers(): Record<number, TypeParser> {
  return { ...PG_DEFAULTS, ...Object.fromEntries(registered) };
}

export const types = {
  builtins,
  /** `setTypeParser(oid, parser)` or `setTypeParser(oid, 'text', parser)`; results are always text format here. */
  setTypeParser(oid: number, formatOrParser: 'text' | 'binary' | TypeParser, maybeParser?: TypeParser): void {
    const parser = typeof formatOrParser === 'function' ? formatOrParser : maybeParser;
    if (typeof parser !== 'function') throw new TypeError('setTypeParser needs a parser function');
    if (formatOrParser === 'binary') return;
    registered.set(oid, parser);
    for (const conn of connections.values()) conn.applyParser(oid, parser);
  },
  getTypeParser(oid: number): TypeParser {
    return registered.get(oid) ?? PG_DEFAULTS[oid] ?? ((v: string) => v);
  },
};

export interface QueryResult<R = Record<string, unknown>> {
  command: string;
  rowCount: number | null;
  oid: number;
  rows: R[];
  fields: { name: string; dataTypeID: number }[];
}

export interface QueryConfig {
  text: string;
  values?: unknown[];
}

export type LeaseMode = 'shared' | 'exclusive';

/**
 * When an IndexedDB database is written:
 * - 'auto' (PGlite's default): after every statement outside a transaction and after every COMMIT,
 *   and PGlite waits for it.
 * - 'manual': only when `flushDeviceDatabase()` is called (the app calls it after every write request).
 *   Each flush runs in PGlite's query queue, so no statement changes the files while they are written:
 *   every flush is a consistent snapshot in one IndexedDB transaction. (PGlite's `relaxedDurability`
 *   would also stop waiting, but its background flushes run beside later statements and can store files
 *   from different moments.) Only for `idb://` data directories.
 */
export type FlushMode = 'auto' | 'manual';

export interface DeviceDatabaseOptions {
  /** PGlite options other than the data directory, file system, extensions and parsers (e.g. `debug`). */
  pglite?: Omit<PGliteOptions, 'dataDir' | 'fs' | 'extensions' | 'parsers'>;
  leaseMode?: LeaseMode;
  /** Exclusive mode: warn when a caller has waited this long for the connection. */
  leaseWarnMs?: number;
  flush?: FlushMode;
}

const settings: { pglite: NonNullable<DeviceDatabaseOptions['pglite']>; leaseMode: LeaseMode; leaseWarnMs: number; flush: FlushMode } = {
  pglite: {},
  leaseMode: 'shared',
  leaseWarnMs: 5_000,
  flush: 'auto',
};

/** IndexedDB storage that PGlite's own flushes leave alone; `flushNow()` writes it (see `FlushMode`). */
class ManualIdbFs extends IdbFs {
  override async syncToFs(_relaxedDurability?: boolean): Promise<void> {
    // PGlite calls this after statements and COMMITs: the app flushes per request instead.
  }

  flushNow(): Promise<void> {
    return super.syncToFs(false);
  }
}

/** Call before the first query (PGlite options only apply to databases created afterwards). */
export function configureDeviceDatabase(options: DeviceDatabaseOptions): void {
  if (options.pglite) settings.pglite = { ...options.pglite };
  if (options.leaseMode) settings.leaseMode = options.leaseMode;
  if (options.leaseWarnMs != null) settings.leaseWarnMs = options.leaseWarnMs;
  if (options.flush) settings.flush = options.flush;
}

export interface DeviceDatabaseStats {
  /** Statements sent to PGlite. */
  queries: number;
  /** Transactions opened with BEGIN on a client. */
  transactions: number;
  /** Shared mode: pool queries that ran while a client was checked out (inside its transaction). */
  nestedQueries: number;
  /** Shared mode: clients checked out while another one was (their BEGIN/COMMIT became a savepoint). */
  nestedClients: number;
}

/**
 * A strictly increasing `clock_timestamp()` (see the module comment). The last value lives in a session
 * setting; a rolled-back transaction takes its value back with its rows, which is all ordering needs.
 */
const SESSION_SQL = `
CREATE OR REPLACE FUNCTION public.clock_timestamp() RETURNS timestamptz LANGUAGE plpgsql VOLATILE AS $clock$
DECLARE
  t timestamptz := pg_catalog.clock_timestamp();
  last timestamptz := NULLIF(pg_catalog.current_setting('device.last_clock', true), '')::timestamptz;
BEGIN
  IF last IS NOT NULL AND t <= last THEN
    t := last + interval '1 microsecond';
  END IF;
  PERFORM pg_catalog.set_config('device.last_clock', t::text, false);
  RETURN t;
END
$clock$;
SET search_path TO "$user", public, pg_catalog;
`;

const BEGIN = /^\s*(BEGIN|START\s+TRANSACTION)(\s+(WORK|TRANSACTION))?\s*;?\s*$/i;
const COMMIT = /^\s*(COMMIT|END)(\s+(WORK|TRANSACTION))?\s*;?\s*$/i;
const ROLLBACK = /^\s*(ROLLBACK|ABORT)(\s+(WORK|TRANSACTION))?\s*;?\s*$/i;
const DML = new Set(['INSERT', 'UPDATE', 'DELETE', 'MERGE', 'COPY']);

function toResult<R>(r: Results): QueryResult<R> {
  const command = r.command ?? '';
  const rowCount =
    r.rowCount !== undefined ? r.rowCount : DML.has(command) ? (r.affectedRows ?? 0) : command === 'SELECT' ? r.rows.length : null;
  return { command, rowCount, oid: 0, rows: r.rows as R[], fields: r.fields.map((f) => ({ name: f.name, dataTypeID: f.dataTypeID })) };
}

const emptyResult = <R>(command: string): QueryResult<R> => ({ command, rowCount: null, oid: 0, rows: [], fields: [] });

/** node-postgres errors do not carry the query parameters; PGlite adds them, so they are removed. */
function cleanError(err: unknown): unknown {
  if (err && typeof err === 'object') {
    for (const key of ['params', 'queryOptions', 'query']) delete (err as Record<string, unknown>)[key];
  }
  return err;
}

/** FIFO mutex: `release` hands the lock to the next waiter. */
class Mutex {
  #locked = false;
  #waiters: (() => void)[] = [];

  async acquire(): Promise<void> {
    if (!this.#locked) {
      this.#locked = true;
      return;
    }
    await new Promise<void>((resolve) => this.#waiters.push(resolve));
  }

  release(): void {
    const next = this.#waiters.shift();
    if (next) next();
    else this.#locked = false;
  }
}

interface OpenTransaction {
  tx: Transaction;
  owner: PoolClient;
  decide: (action: 'commit' | 'rollback') => void;
  done: Promise<void>;
}

let savepointSeq = 0;

class Connection {
  readonly stats: DeviceDatabaseStats = { queries: 0, transactions: 0, nestedQueries: 0, nestedClients: 0 };
  #db: Promise<PGlite> | null = null;
  #instance: PGlite | null = null;
  #mutex = new Mutex();
  #holder: PoolClient | null = null;
  #tx: OpenTransaction | null = null;

  constructor(readonly dataDir: string) {}

  database(): Promise<PGlite> {
    if (!this.#db) {
      const created = (async () => {
        const manual = settings.flush === 'manual' && this.dataDir.startsWith('idb://');
        const storage = manual ? { fs: new ManualIdbFs(this.dataDir.slice('idb://'.length)) } : { dataDir: this.dataDir };
        const db = new PGlite({ ...settings.pglite, ...storage, extensions: { pg_trgm }, parsers: currentParsers() });
        await db.waitReady;
        // Parsers registered while PGlite was starting.
        Object.assign(db.parsers, currentParsers());
        await db.exec(SESSION_SQL);
        this.#instance = db;
        return db;
      })();
      this.#db = created;
      created.catch(() => {
        if (this.#db === created) this.#db = null;
      });
    }
    return this.#db;
  }

  applyParser(oid: number, parser: TypeParser): void {
    if (this.#instance) this.#instance.parsers[oid] = parser;
  }

  async close(): Promise<void> {
    const pending = this.#db;
    this.#db = null;
    this.#instance = null;
    if (pending) await (await pending).close();
  }

  // ------------------------------------------------------------ pool level

  async poolQuery<R>(text: string, params?: unknown[]): Promise<QueryResult<R> | QueryResult<R>[]> {
    if (settings.leaseMode === 'shared') {
      if (this.#holder) this.stats.nestedQueries++;
      return this.#run<R>(text, params);
    }
    await this.#acquire(new Error('pool.query waited for the connection'));
    try {
      return await this.#run<R>(text, params);
    } finally {
      this.#mutex.release();
    }
  }

  async connect(): Promise<PoolClient> {
    if (settings.leaseMode === 'shared') {
      if (this.#holder) {
        this.stats.nestedClients++;
        return new PoolClient(this, true);
      }
      const client = new PoolClient(this, false);
      this.#holder = client;
      return client;
    }
    await this.#acquire(new Error('pool.connect waited for the connection'));
    const client = new PoolClient(this, false);
    this.#holder = client;
    return client;
  }

  async #acquire(waitedAt: Error): Promise<void> {
    const timer = setTimeout(() => {
      console.warn(
        `[device-db] waited ${settings.leaseWarnMs} ms for the single database connection; a db call made while the same flow holds a transaction never gets it.`,
        waitedAt.stack,
      );
    }, settings.leaseWarnMs);
    try {
      await this.#mutex.acquire();
    } finally {
      clearTimeout(timer);
    }
  }

  // ------------------------------------------------------------ client level

  async clientQuery<R>(client: PoolClient, text: string, params?: unknown[]): Promise<QueryResult<R> | QueryResult<R>[]> {
    const plain = !params || params.length === 0;
    const kind = !plain ? null : BEGIN.test(text) ? 'begin' : COMMIT.test(text) ? 'commit' : ROLLBACK.test(text) ? 'rollback' : null;
    if (kind === 'begin') {
      if (this.#tx) {
        if (!client.nested || client.savepoint) return this.#run<R>(text, params); // Postgres warns and carries on
        client.savepoint = `device_nested_${++savepointSeq}`;
        await this.#run(`SAVEPOINT ${client.savepoint}`);
        return emptyResult<R>('BEGIN');
      }
      await this.#begin(client);
      return emptyResult<R>('BEGIN');
    }
    if (kind === 'commit' || kind === 'rollback') {
      if (client.savepoint) {
        const name = client.savepoint;
        client.savepoint = null;
        if (kind === 'rollback') await this.#run(`ROLLBACK TO SAVEPOINT ${name}`);
        await this.#run(`RELEASE SAVEPOINT ${name}`);
        return emptyResult<R>(kind === 'commit' ? 'COMMIT' : 'ROLLBACK');
      }
      if (this.#tx?.owner === client) {
        await this.#finish(kind);
        return emptyResult<R>(kind === 'commit' ? 'COMMIT' : 'ROLLBACK');
      }
    }
    return this.#run<R>(text, params);
  }

  async release(client: PoolClient): Promise<void> {
    try {
      if (client.savepoint) {
        const name = client.savepoint;
        client.savepoint = null;
        await this.#run(`ROLLBACK TO SAVEPOINT ${name}`).catch(() => undefined);
      }
      if (this.#tx?.owner === client) {
        console.warn('[device-db] a client was released inside an open transaction; rolling it back');
        await this.#finish('rollback').catch(() => undefined);
      }
    } finally {
      if (!client.nested && this.#holder === client) {
        this.#holder = null;
        if (settings.leaseMode === 'exclusive') this.#mutex.release();
      }
    }
  }

  async #begin(owner: PoolClient): Promise<void> {
    const db = await this.database();
    let decide!: (action: 'commit' | 'rollback') => void;
    const decided = new Promise<'commit' | 'rollback'>((resolve) => (decide = resolve));
    let opened!: (tx: Transaction) => void;
    const ready = new Promise<Transaction>((resolve) => (opened = resolve));
    // PGlite runs BEGIN, calls back with the transaction, and COMMITs when the callback returns
    // (after `decide('commit')`) or skips that after an explicit rollback.
    const done = db.transaction(async (tx) => {
      opened(tx);
      if ((await decided) === 'rollback') await tx.rollback();
    });
    const started = await Promise.race([ready.then((tx) => ({ tx })), done.then(() => ({ tx: null }), (err: unknown) => ({ err }))]);
    if ('err' in started) throw cleanError(started.err);
    if (!started.tx) throw new Error('The transaction ended before it began');
    this.stats.transactions++;
    this.#tx = { tx: started.tx, owner, decide, done };
  }

  async #finish(action: 'commit' | 'rollback'): Promise<void> {
    const open = this.#tx;
    if (!open) return;
    this.#tx = null;
    open.decide(action);
    try {
      await open.done;
    } catch (err) {
      throw cleanError(err);
    }
    // Make the committed transaction durable before COMMIT returns (IndexedDB is written once per transaction).
    if (action === 'commit') await (await this.database()).syncToFs();
  }

  async #run<R>(text: string, params?: unknown[]): Promise<QueryResult<R> | QueryResult<R>[]> {
    const db = await this.database();
    const target: Pick<Transaction, 'query' | 'exec'> = this.#tx?.tx ?? db;
    this.stats.queries++;
    try {
      if (!params || params.length === 0) {
        const results = await target.exec(text);
        if (results.length === 1) return toResult<R>(results[0]!);
        return results.length === 0 ? emptyResult<R>('') : results.map((r) => toResult<R>(r));
      }
      return toResult<R>(await target.query(text, params));
    } catch (err) {
      throw cleanError(err);
    }
  }
}

export class PoolClient {
  /** Name of the savepoint that stands in for this (nested) client's transaction. */
  savepoint: string | null = null;
  #released = false;

  constructor(
    private readonly conn: Connection,
    /** Shared mode: checked out while another client was. */
    readonly nested: boolean,
  ) {}

  query<R = Record<string, unknown>>(textOrConfig: string | QueryConfig, values?: unknown[]): Promise<QueryResult<R>> {
    const { text, params } = typeof textOrConfig === 'string' ? { text: textOrConfig, params: values } : { text: textOrConfig.text, params: textOrConfig.values };
    if (this.#released) return Promise.reject(new Error('Client was closed and is not queryable'));
    return this.conn.clientQuery<R>(this, text, params) as Promise<QueryResult<R>>;
  }

  /** Like node-postgres: synchronous to call; a transaction left open is rolled back before the connection is reused. */
  release(_err?: unknown): void {
    if (this.#released) throw new Error('Release called on client which has already been released to the pool.');
    this.#released = true;
    void this.conn.release(this);
  }
}

const connections = new Map<string, Connection>();

/** PGlite data directory for a connection string (see the module comment). */
export function dataDirFor(connectionString: string | undefined): string {
  const value = (connectionString ?? '').trim();
  if (/^(idb|memory|opfs-ahp):\/\//.test(value)) return value;
  if (value && !value.includes('://')) return value; // a directory (Node only)
  throw new Error('Device mode keeps its database in PGlite: DATABASE_URL must be idb://<name>, memory:// or opfs-ahp://<name>');
}

function connectionFor(dataDir: string): Connection {
  let conn = connections.get(dataDir);
  if (!conn) {
    conn = new Connection(dataDir);
    connections.set(dataDir, conn);
  }
  return conn;
}

function onlyConnection(dataDir?: string): Connection {
  if (dataDir) return connectionFor(dataDirFor(dataDir));
  const [first, ...rest] = connections.values();
  if (!first || rest.length) throw new Error('Name the data directory: no single device database is open');
  return first;
}

export interface PoolConfig {
  connectionString?: string;
  [option: string]: unknown;
}

export class Pool {
  readonly #conn: Connection;
  #ended = false;

  constructor(config: PoolConfig = {}) {
    this.#conn = connectionFor(dataDirFor(config.connectionString));
  }

  query<R = Record<string, unknown>>(textOrConfig: string | QueryConfig, values?: unknown[]): Promise<QueryResult<R>> {
    if (this.#ended) return Promise.reject(new Error('Cannot use a pool after calling end on the pool'));
    const { text, params } = typeof textOrConfig === 'string' ? { text: textOrConfig, params: values } : { text: textOrConfig.text, params: textOrConfig.values };
    return this.#conn.poolQuery<R>(text, params) as Promise<QueryResult<R>>;
  }

  connect(): Promise<PoolClient> {
    if (this.#ended) return Promise.reject(new Error('Cannot use a pool after calling end on the pool'));
    return this.#conn.connect();
  }

  /** Ends this pool object only: the PGlite database stays open for the next pool (see `closeDeviceDatabase`). */
  async end(): Promise<void> {
    this.#ended = true;
  }

  /** node-postgres reports errors of idle clients here; PGlite has none. */
  on(_event: string, _listener: (...args: unknown[]) => void): this {
    return this;
  }
}

/** The PGlite instance behind a data directory (e.g. for `dumpDataDir` backups). */
export function deviceDatabase(dataDir?: string): Promise<PGlite> {
  return onlyConnection(dataDir).database();
}

export function deviceDatabaseStats(dataDir?: string): DeviceDatabaseStats {
  return { ...onlyConnection(dataDir).stats };
}

/**
 * Writes everything PGlite holds in memory to its storage (IndexedDB) and waits until it is stored (the
 * only writes in 'manual' flush mode). Runs in PGlite's query queue, so it covers every statement sent
 * before it and none runs while the files are written. Call it between requests, never while a
 * transaction is open.
 */
export async function flushDeviceDatabase(dataDir?: string): Promise<void> {
  const db = await onlyConnection(dataDir).database();
  await db.runExclusive(async () => {
    if (db.fs instanceof ManualIdbFs) await db.fs.flushNow();
    else await db.fs?.syncToFs(false);
  });
}

/** Closes PGlite (flushes storage). The next query opens it again. */
export async function closeDeviceDatabase(dataDir?: string): Promise<void> {
  await onlyConnection(dataDir).close();
}

const pg = { Pool, types };
export default pg;
