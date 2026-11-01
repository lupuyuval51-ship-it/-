import pg from 'pg';
import type { DbAdapter } from './adapter.ts';

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
  static fromUrl(url: string): PgAdapter { return new PgAdapter(new pg.Pool({ connectionString: url, max: 10 })); }
  async query<T>(sql: string, params: readonly unknown[] = []): Promise<T[]> {
    return (await this.pool.query(sql, params as unknown[])).rows as T[];
  }
  async transaction<T>(fn: (tx: DbAdapter) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
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
