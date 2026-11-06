import { PGlite, type Transaction } from '@electric-sql/pglite';
import type { DbAdapter } from './adapter.ts';

class TxAdapter implements DbAdapter {
  constructor(private readonly tx: Transaction) {}
  async query<T>(sql: string, params: readonly unknown[] = []): Promise<T[]> {
    return (await this.tx.query<T>(sql, params as unknown[])).rows;
  }
  async transaction<T>(fn: (tx: DbAdapter) => Promise<T>): Promise<T> { return fn(this); }
}

/** PGlite (WASM Postgres). Works in Node (tests) and in the browser worker (IndexedDB via `idb://`). */
export class PgliteAdapter implements DbAdapter {
  constructor(readonly db: PGlite) {}
  static async create(dataDir?: string): Promise<PgliteAdapter> {
    // DATE columns stay 'YYYY-MM-DD' strings (same as the pg adapter), never JS Dates, so calendar logic is timezone-safe.
    const db = new PGlite({ ...(dataDir ? { dataDir } : {}), parsers: { 1082: (v: string) => v } });
    await db.waitReady;
    return new PgliteAdapter(db);
  }
  async query<T>(sql: string, params: readonly unknown[] = []): Promise<T[]> {
    return (await this.db.query<T>(sql, params as unknown[])).rows;
  }
  async transaction<T>(fn: (tx: DbAdapter) => Promise<T>): Promise<T> {
    return this.db.transaction((tx) => fn(new TxAdapter(tx)));
  }
  /** A direct filesystem sync (not `PGlite.syncToFs`, which returns at once when another sync is already queued). */
  async flush(): Promise<void> { await this.db.fs?.syncToFs(false); }
  close(): Promise<void> { return this.db.close(); }
}
