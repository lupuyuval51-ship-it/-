-- Plus and Pro make level C games for free and without limit (src/config/plans.ts: cost C = 0), so a job's cost may be
-- 0 now. Hand-written (Prisma cannot express CHECK constraints): the cost is never negative.
ALTER TABLE "GenerationJob" DROP CONSTRAINT "GenerationJob_cost_positive";
ALTER TABLE "GenerationJob" ADD CONSTRAINT "GenerationJob_cost_nonnegative" CHECK ("cost" >= 0);
