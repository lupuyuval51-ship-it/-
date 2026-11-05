import pg from 'pg';
import { ApiError } from '../core/errors.ts';
import type { DbAdapter } from './adapter.ts';

/**
 * Pool settings for the hosted server. Every wait is bounded: a request waits at most 5 s for a free connection (then 503, so a
 * saturated pool fails fast instead of hanging every request), a statement runs at most 15 s, and an idle open transaction is
 * ended by the server after 30 s. Routes that need longer (restore) raise statement_timeout locally with SET LOCAL.
 */
export const POOL_OPTIONS = {
  max: 10, connectionTimeoutMillis: 5_000, idleTimeoutMillis: 30_000,
  statement_timeout: 15_000, query_timeout: 20_000, idle_in_transaction_session_timeout: 30_000,
} as const;

/** pg's "no free connection in time" error becomes a retryable 503 instead of a 500. */
function poolWait(e: unknown): never {
  if (e instanceof Error && /timeout exceeded when trying to connect/i.test(e.message)) throw new ApiError(503, 'rate_limited', undefined, { 'retry-after': '2' });
  throw e;
}

// Return DATE columns as 'YYYY-MM-DD' strings instead of JS Dates (timezone-safe).
pg.types.setTypeParser(1082, (v: string) => v);

class PgClientAdapter implements DbAdapter {
  constructor(private readonly client: pg.PoolClient) {}
  async query<T>(sql: string, params: readonly unknown[] = []): Promise<T[]> {
    return (await this.client.query(sql, params as unknown[])).rows as T[];
  }
  async transaction<T>(fn: (tx: DbAdapter) => Promise<T>): Promise<T> { return fn(this); } // already inside one
}

export class PgAdapter implements DbAdapter {
  constructor(readonly pool: pg.Pool) {}
  static fromUrl(url: string): PgAdapter {
    const pool = new pg.Pool({ connectionString: url, ...POOL_OPTIONS });
    // An idle client whose connection drops (database restart, failover, idle timeout, network blip) is reported here. Without a
    // listener Node treats it as an unhandled 'error' event and exits; with one, pg discards that client and opens a new one on demand.
    pool.on('error', (e) => console.error('[db] idle client error', e.message));
    return new PgAdapter(pool);
  }
  async query<T>(sql: string, params: readonly unknown[] = []): Promise<T[]> {
    return (await this.pool.query(sql, params as unknown[]).catch(poolWait)).rows as T[];
  }
  async transaction<T>(fn: (tx: DbAdapter) => Promise<T>): Promise<T> {
    const client = await this.pool.connect().catch(poolWait);
    try {
      await client.query('BEGIN');
      const out = await fn(new PgClientAdapter(client));
      await client.query('COMMIT');
      return out;
    } catch (e) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw e;
    } finally { client.release(); }
  }
  close(): Promise<void> { return this.pool.end(); }
}
