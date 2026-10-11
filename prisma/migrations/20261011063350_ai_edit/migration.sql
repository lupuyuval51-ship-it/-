-- CreateEnum
CREATE TYPE "EditStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');

-- AlterTable
ALTER TABLE "GameRevision" ADD COLUMN     "note" TEXT;

-- CreateTable
CREATE TABLE "AiEdit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "instruction" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" "EditStatus" NOT NULL DEFAULT 'PENDING',
    "plan" "PlanId" NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "baseRevision" INTEGER NOT NULL,
    "resultRevision" INTEGER,
    "summary" TEXT,
    "model" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "deadlineAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "AiEdit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiEdit_userId_periodStart_status_idx" ON "AiEdit"("userId", "periodStart", "status");

-- CreateIndex
CREATE INDEX "AiEdit_gameId_createdAt_idx" ON "AiEdit"("gameId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AiEdit_userId_idempotencyKey_key" ON "AiEdit"("userId", "idempotencyKey");

-- AddForeignKey
ALTER TABLE "AiEdit" ADD CONSTRAINT "AiEdit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiEdit" ADD CONSTRAINT "AiEdit_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Hand-written: at most ONE edit in flight per user (the database, not application code, enforces it).
CREATE UNIQUE INDEX "AiEdit_one_pending_per_user" ON "AiEdit"("userId") WHERE "status" = 'PENDING';

-- Hand-written: an edit's outcome fields are consistent with its status.
ALTER TABLE "AiEdit" ADD CONSTRAINT "AiEdit_status_consistent" CHECK (
  ("status" = 'PENDING' AND "finishedAt" IS NULL AND "resultRevision" IS NULL)
  OR ("status" = 'SUCCEEDED' AND "finishedAt" IS NOT NULL AND "resultRevision" IS NOT NULL)
  OR ("status" = 'FAILED' AND "finishedAt" IS NOT NULL AND "resultRevision" IS NULL)
);
