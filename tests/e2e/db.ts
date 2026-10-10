import pg from "pg";

const URL = process.env.TEST_DATABASE_URL ?? "postgresql://levelup:levelup@127.0.0.1:54329/levelup_test";

/** Test-only: set up subscription state the way the verified payment webhook would. */
export async function setPlan(email: string, plan: "PLUS" | "PRO" | "FREE", status = "ACTIVE"): Promise<void> {
  const pool = new pg.Pool({ connectionString: URL, max: 1 });
  try {
    const { rows } = await pool.query('SELECT id FROM "User" WHERE email = $1', [email]);
    const userId = rows[0]?.id as string | undefined;
    if (!userId) throw new Error(`no user ${email}`);
    await pool.query('DELETE FROM "Subscription" WHERE "userId" = $1', [userId]);
    if (plan === "FREE") return;
    const start = new Date(Date.now() - 2 * 86_400_000);
    const end = new Date(start.getTime() + 30 * 86_400_000);
    await pool.query(
      `INSERT INTO "Subscription" (id, "userId", provider, "providerCustomerId", "providerSubscriptionId", plan, status, "currentPeriodStart", "currentPeriodEnd", "lastEventAt", "updatedAt")
       VALUES ($1, $2, 'DEV', $3, $4, $5::"PlanId", $6::"SubscriptionStatus", $7, $8, now(), now())`,
      [`sub_${userId}`, userId, `cus_${userId}`, `sub_dev_${userId}`, plan, status, start, end],
    );
  } finally {
    await pool.end();
  }
}

/** `null` = automatic (the plan's default tier). */
export async function setGraphicsPreference(email: string, tier: "A" | "B" | "C" | null): Promise<void> {
  const pool = new pg.Pool({ connectionString: URL, max: 1 });
  try {
    await pool.query('UPDATE "UserProfile" SET "graphicsPreference" = $2::"GraphicsTier" WHERE "userId" = (SELECT id FROM "User" WHERE email = $1)', [email, tier]);
  } finally {
    await pool.end();
  }
}

async function query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
  const pool = new pg.Pool({ connectionString: URL, max: 1 });
  try {
    return (await pool.query(sql, params)).rows as T[];
  } finally {
    await pool.end();
  }
}

/** The stored game spec (server-side truth, including answer keys the browser never receives). */
export async function getGameSpec(gameId: string): Promise<import("@/lib/game/spec/schema").GameSpec> {
  const rows = await query<{ spec: import("@/lib/game/spec/schema").GameSpec }>('SELECT spec FROM "Game" WHERE id = $1', [gameId]);
  if (!rows[0]) throw new Error(`no game ${gameId}`);
  return rows[0].spec;
}

export async function userIdOf(email: string): Promise<string> {
  const rows = await query<{ id: string }>('SELECT id FROM "User" WHERE email = $1', [email]);
  if (!rows[0]) throw new Error(`no user ${email}`);
  return rows[0].id;
}

export async function dbCount(sql: string, params: unknown[] = []): Promise<number> {
  const rows = await query<{ n: string }>(sql, params);
  return Number(rows[0]?.n ?? 0);
}

export async function dbRows<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
  return query<T>(sql, params);
}
