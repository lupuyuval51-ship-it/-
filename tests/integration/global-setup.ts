import { execSync } from "node:child_process";

/** Applies the real migrations to the TEST database before the integration suite runs. */
export default function setup(): void {
  const url = process.env.TEST_DATABASE_URL ?? "postgresql://levelup:levelup@127.0.0.1:54329/levelup_test";
  const dbName = new URL(url).pathname.replace(/^\//, "");
  if (!/test/i.test(dbName)) {
    throw new Error(`Refusing to run integration tests against database "${dbName}": its name must contain "test".`);
  }
  try {
    execSync("npx prisma migrate deploy", { stdio: "pipe", env: { ...process.env, DATABASE_URL: url } });
  } catch (err) {
    const e = err as { stdout?: Buffer; stderr?: Buffer };
    const out = `${e.stdout ?? ""}${e.stderr ?? ""}` || String(err);
    throw new Error(`Could not migrate the test database at ${url}.\nStart PostgreSQL first (npm run db:up or docker compose up -d db).\n${out}`);
  }
}
