/**
 * PostgreSQL access layer. All queries are parameterized. Services receive an `Sql`
 * handle (either the pool or a transaction) so they can be composed inside `db.tx`.
 */
import pg from 'pg';
import { config } from '../config';

// NUMERIC → number, BIGINT (counts) → number, DATE → 'YYYY-MM-DD' string (no TZ shifting).
pg.types.setTypeParser(1700, (v) => (v === null ? null : parseFloat(v)));
pg.types.setTypeParser(20, (v) => (v === null ? null : parseInt(v, 10)));
pg.types.setTypeParser(1082, (v) => v);

export interface Sql {
  /** All rows. */
  many<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]>;
  /** Exactly one row (throws if none). */
  one<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T>;
  /** One row or null. */
  maybeOne<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T | null>;
  /** Number of affected rows. */
  exec(text: string, params?: unknown[]): Promise<number>;
}

export interface Database extends Sql {
  /** Runs `fn` in a transaction (BEGIN/COMMIT, ROLLBACK on error). Do not nest. */
  tx<T>(fn: (tx: Sql) => Promise<T>): Promise<T>;
  pool(): pg.Pool;
  close(): Promise<void>;
}

interface Queryable {
  query(text: string, params?: unknown[]): Promise<pg.QueryResult>;
}

export class NoRowError extends Error {
  constructor() {
    super('Expected one row, got none');
    this.name = 'NoRowError';
  }
}

function makeSql(q: Queryable): Sql {
  return {
    async many(text, params) {
      return (await q.query(text, params)).rows;
    },
    async one(text, params) {
      const { rows } = await q.query(text, params);
      if (!rows[0]) throw new NoRowError();
      return rows[0];
    },
    async maybeOne(text, params) {
      const { rows } = await q.query(text, params);
      return rows[0] ?? null;
    },
    async exec(text, params) {
      return (await q.query(text, params)).rowCount ?? 0;
    },
  };
}

let poolInstance: pg.Pool | null = null;

function getPool(): pg.Pool {
  if (!poolInstance) {
    if (!config.databaseUrl) throw new Error('DATABASE_URL is not configured');
    poolInstance = new pg.Pool({
      connectionString: config.databaseUrl,
      max: config.databasePoolMax,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      statement_timeout: 30_000,
    });
    poolInstance.on('error', (err) => {
      console.error('[db] idle client error', err.message);
    });
  }
  return poolInstance;
}

const poolSql = makeSql({ query: (text, params) => getPool().query(text, params) });

export const db: Database = {
  ...poolSql,
  async tx(fn) {
    const client = await getPool().connect();
    try {
      await client.query('BEGIN');
      const result = await fn(makeSql(client));
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw err;
    } finally {
      client.release();
    }
  },
  pool: getPool,
  async close() {
    if (poolInstance) {
      const p = poolInstance;
      poolInstance = null;
      await p.end();
    }
  },
};

/** Postgres error codes we translate into HTTP errors. */
export const PG = {
  uniqueViolation: '23505',
  foreignKeyViolation: '23503',
  checkViolation: '23514',
  notNullViolation: '23502',
  invalidTextRepresentation: '22P02',
} as const;

export function pgErrorCode(err: unknown): string | null {
  return typeof err === 'object' && err && 'code' in err && typeof (err as { code: unknown }).code === 'string'
    ? ((err as { code: string }).code)
    : null;
}
