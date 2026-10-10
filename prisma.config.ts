import { defineConfig } from "prisma/config";

// Prisma 7 does not load .env on its own. Node >= 20.12 can do it natively.
try {
  process.loadEnvFile(".env");
} catch {
  /* no .env file: rely on the process environment */
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    // `prisma generate` does not need a live database, so fall back to a placeholder URL there.
    url: process.env.DATABASE_URL ?? "postgresql://levelup:levelup@127.0.0.1:54329/levelup",
  },
});
