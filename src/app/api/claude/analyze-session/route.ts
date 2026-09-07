/** POST /api/claude/analyze-session – see src/server/ai/handlers/analyzeSession.ts. Guests allowed (x-dc-guest), account cookie optional. */
import { createAiRoute } from "@/server/ai/pipeline";
import { analyzeSessionHandler } from "@/server/ai/handlers/analyzeSession";

export const runtime = "nodejs";
export const maxDuration = 120;

export const POST = createAiRoute(analyzeSessionHandler);
