/** POST /api/claude/replace-exercise – see src/server/ai/handlers/replaceExercise.ts. Guests allowed (x-dc-guest), account cookie optional. */
import { createAiRoute } from "@/server/ai/pipeline";
import { replaceExerciseHandler } from "@/server/ai/handlers/replaceExercise";

export const runtime = "nodejs";
export const maxDuration = 120;

export const POST = createAiRoute(replaceExerciseHandler);
