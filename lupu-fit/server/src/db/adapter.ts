/** Minimal database port. Core code depends only on this, never on `pg` or PGlite directly. */
export interface DbAdapter {
  query<T = Record<string, unknown>>(sql: string, params?: readonly unknown[]): Promise<T[]>;
  /** Runs `fn` in a transaction; commits on resolve, rolls back on throw. */
  transaction<T>(fn: (tx: DbAdapter) => Promise<T>): Promise<T>;
  /**
   * Optional: returns only when everything committed so far is on durable storage. PostgreSQL has that at commit; PGlite over IndexedDB
   * writes its files after the statement and can answer first (a sync that is already queued is not waited for), so a big write whose
   * loss would be unrecoverable (a backup restore) asks for it.
   */
  flush?(): Promise<void>;
}
