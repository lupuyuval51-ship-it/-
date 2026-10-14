-- Allowance POINTS (src/config/plans.ts, PLANS[plan].allowance): each game costs points according to its level.
-- Every job and every counter before this migration held exactly one credit per game, which is one point, so the
-- default backfills existing jobs correctly and "used"/"reserved" keep their values.
ALTER TABLE "GenerationJob" ADD COLUMN "cost" INTEGER NOT NULL DEFAULT 1;

-- Hand-written (Prisma cannot express CHECK constraints): a job always holds at least one point.
ALTER TABLE "GenerationJob" ADD CONSTRAINT "GenerationJob_cost_positive" CHECK ("cost" >= 1);

-- Backfill: periods that are still open get the points budget of their plan (FREE 2, PLUS 3, PRO 10 at the time of
-- this migration). ensurePeriod() refreshes "limit" from the config on the next generation anyway; this only keeps the
-- stored rows truthful in the meantime. Closed periods keep the limit they had.
UPDATE "AllowancePeriod"
   SET "limit" = CASE "plan" WHEN 'FREE' THEN 2 WHEN 'PLUS' THEN 3 WHEN 'PRO' THEN 10 END,
       "updatedAt" = now()
 WHERE "periodEnd" > now();
