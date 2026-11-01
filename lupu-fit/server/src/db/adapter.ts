/** Minimal database port. Core code depends only on this, never on `pg` or PGlite directly. */
export interface DbAdapter {
  query<T = Record<string, unknown>>(sql: string, params?: readonly unknown[]): Promise<T[]>;
  /** Runs `fn` in a transaction; commits on resolve, rolls back on throw. */
  transaction<T>(fn: (tx: DbAdapter) => Promise<T>): Promise<T>;
}
