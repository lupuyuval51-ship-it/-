/** POST /api/claude/weekly-review – see src/server/ai/handlers/weeklyReview.ts. Guests allowed (x-dc-guest), account cookie optional. */
import { createAiRoute } from "@/server/ai/pipeline";
import { weeklyReviewHandler } from "@/server/ai/handlers/weeklyReview";

export const runtime = "nodejs";
export const maxDuration = 120;

export const POST = createAiRoute(weeklyReviewHandler);
