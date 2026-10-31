-- The allowance is no longer a shared points budget: every game level (feature tier A/B/C) has its OWN quota of games
-- per period (src/config/plans.ts, PLANS[plan].allowance), and using one level never reduces another. Each period gets
-- one counter row per level; a generation job holds exactly one game of its own stored level ("featureTier"), so the
-- period-wide points counters and the job's point "cost" are no longer needed and are dropped below.

-- CreateTable
CREATE TABLE "AllowanceQuota" (
    "allowancePeriodId" TEXT NOT NULL,
    "level" "GraphicsTier" NOT NULL,
    "limit" INTEGER,
    "used" INTEGER NOT NULL DEFAULT 0,
    "reserved" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AllowanceQuota_pkey" PRIMARY KEY ("allowancePeriodId","level")
);

-- AddForeignKey
ALTER TABLE "AllowanceQuota" ADD CONSTRAINT "AllowanceQuota_allowancePeriodId_fkey" FOREIGN KEY ("allowancePeriodId") REFERENCES "AllowancePeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Hand-written (Prisma cannot express CHECK constraints): counters can never go negative, whatever the application does.
-- "limit" NULL means unlimited, 0 means the plan does not offer the level. There is deliberately no "used <= limit" check:
-- a downgrade inside a period keeps what was already used at each level, which may be above the new limit.
ALTER TABLE "AllowanceQuota"
  ADD CONSTRAINT "AllowanceQuota_counters_non_negative" CHECK ("used" >= 0 AND "reserved" >= 0 AND ("limit" IS NULL OR "limit" >= 0));

-- Backfill. The app is not live yet, so per-level usage starts at 0 for every open period (points spent before this
-- migration cannot be split into levels and are not carried over). Jobs still in flight keep their hold: "reserved" counts
-- them per level, so they can still commit or release exactly one game of their level. The limits are the quotas of the
-- plan at the time of this migration (FREE: A not offered, B 1, C 5; PLUS: A 3, B 5, C unlimited; PRO: A 5, B 10,
-- C unlimited); ensurePeriod() refreshes them from the config on the next generation anyway. Closed periods without a job
-- in flight get no rows (nothing is enforced on them any more).
INSERT INTO "AllowanceQuota" ("allowancePeriodId", "level", "limit", "used", "reserved", "updatedAt")
SELECT p."id",
       l."level",
       CASE p."plan"
         WHEN 'FREE' THEN CASE l."level" WHEN 'A' THEN 0 WHEN 'B' THEN 1 ELSE 5 END
         WHEN 'PLUS' THEN CASE l."level" WHEN 'A' THEN 3 WHEN 'B' THEN 5 ELSE NULL END
         ELSE CASE l."level" WHEN 'A' THEN 5 WHEN 'B' THEN 10 ELSE NULL END
       END,
       0,
       (SELECT count(*)::integer FROM "GenerationJob" j
         WHERE j."allowancePeriodId" = p."id" AND j."featureTier" = l."level" AND j."status" IN ('PENDING', 'RUNNING')),
       now()
  FROM "AllowancePeriod" p
 CROSS JOIN (VALUES ('A'::"GraphicsTier"), ('B'::"GraphicsTier"), ('C'::"GraphicsTier")) AS l("level")
 WHERE p."periodEnd" > now()
    OR EXISTS (SELECT 1 FROM "GenerationJob" j WHERE j."allowancePeriodId" = p."id" AND j."status" IN ('PENDING', 'RUNNING'));

-- The period-wide points counters move to the per-level rows above.
ALTER TABLE "AllowancePeriod" DROP CONSTRAINT "AllowancePeriod_counters_non_negative";
-- AlterTable
ALTER TABLE "AllowancePeriod" DROP COLUMN "limit",
DROP COLUMN "reserved",
DROP COLUMN "used";

-- A job always holds exactly one game of its own level ("featureTier"), so its points cost is gone with its CHECK.
ALTER TABLE "GenerationJob" DROP CONSTRAINT "GenerationJob_cost_nonnegative";
-- AlterTable
ALTER TABLE "GenerationJob" DROP COLUMN "cost";
