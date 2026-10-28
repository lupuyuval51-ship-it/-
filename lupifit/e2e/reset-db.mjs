// Drops and recreates the E2E database schema so every run starts clean.
import pg from 'pg';

const url = process.env.DATABASE_URL;
if (!url || !/fitai_e2e/.test(url)) {
  console.error('reset-db: refusing to reset a database whose name does not contain "fitai_e2e"');
  process.exit(1);
}
const client = new pg.Client({ connectionString: url });
await client.connect();
await client.query('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;');
await client.end();
console.log('reset-db: e2e schema recreated');
