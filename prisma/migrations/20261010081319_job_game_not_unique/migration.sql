-- DropIndex
DROP INDEX "GenerationJob_gameId_key";

-- CreateIndex
CREATE INDEX "GenerationJob_gameId_idx" ON "GenerationJob"("gameId");
