/**
 * Prepares the test database once per run: applies migrations and seeds built-in content.
 * Uses TEST_DATABASE_URL (default: local fitai_test). Each test creates its own users,
 * so test files can run in parallel without truncating tables.
 */
export const DEFAULT_TEST_DATABASE_URL = 'postgres://fitai:fitai_dev_password@127.0.0.1:5432/fitai_test';

export default async function setup() {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? DEFAULT_TEST_DATABASE_URL;
  const { migrate } = await import('../src/db/migrate');
  const { seedContent } = await import('../src/db/seed');
  const { db } = await import('../src/db/pool');
  try {
    await migrate();
    await seedContent();
  } finally {
    await db.close();
  }
}
