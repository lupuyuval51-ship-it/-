/** POST /api/claude/generate-workout – see src/server/ai/handlers/generateWorkout.ts. Guests allowed (x-dc-guest), account cookie optional. */
import { createAiRoute } from "@/server/ai/pipeline";
import { generateWorkoutHandler } from "@/server/ai/handlers/generateWorkout";

export const runtime = "nodejs";
export const maxDuration = 120;

export const POST = createAiRoute(generateWorkoutHandler);
