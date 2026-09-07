/** POST /api/claude/generate-plan – see src/server/ai/handlers/generatePlan.ts. Guests allowed (x-dc-guest), account cookie optional. */
import { createAiRoute } from "@/server/ai/pipeline";
import { generatePlanHandler } from "@/server/ai/handlers/generatePlan";

export const runtime = "nodejs";
export const maxDuration = 120;

export const POST = createAiRoute(generatePlanHandler);
