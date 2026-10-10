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

export async function setGraphicsPreference(email: string, tier: "A" | "B" | "C"): Promise<void> {
  const pool = new pg.Pool({ connectionString: URL, max: 1 });
  try {
    await pool.query('UPDATE "UserProfile" SET "graphicsPreference" = $2::"GraphicsTier" WHERE "userId" = (SELECT id FROM "User" WHERE email = $1)', [email, tier]);
  } finally {
    await pool.end();
  }
}
