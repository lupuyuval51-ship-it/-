/**
 * Where the worker keeps the hidden device account: one row in `device.account`, inside the PGlite
 * database (IndexedDB). It is not part of the server's schema (no migration: the hosted server never has
 * it) and nothing in the server reads it. Keeping it in the same database as the data means a lost
 * database never leaves credentials for an account that no longer exists, and a kept database never
 * loses the way into its account.
 */
import type { Database } from '../../../../server/src/db/pool';
import type { AccountStore, StoredAccount } from './session';

export async function createAccountStore(db: Database): Promise<AccountStore> {
  await db.exec('CREATE SCHEMA IF NOT EXISTS device');
  await db.exec(
    `CREATE TABLE IF NOT EXISTS device.account (
       id smallint PRIMARY KEY CHECK (id = 1),
       email text NOT NULL,
       password text NOT NULL,
       cookie text,
       updated_at timestamptz NOT NULL DEFAULT now()
     )`,
  );
  return {
    async load() {
      return db.maybeOne<StoredAccount>('SELECT email, password, cookie FROM device.account WHERE id = 1');
    },
    async save(account) {
      await db.exec(
        `INSERT INTO device.account (id, email, password, cookie) VALUES (1, $1, $2, $3)
         ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, password = EXCLUDED.password, cookie = EXCLUDED.cookie, updated_at = now()`,
        [account.email, account.password, account.cookie],
      );
    },
    async clear() {
      await db.exec('DELETE FROM device.account');
    },
  };
}
