/** POST /api/claude/chat – see src/server/ai/handlers/chat.ts. Guests allowed (x-dc-guest), account cookie optional. */
import { createAiRoute } from "@/server/ai/pipeline";
import { chatHandler } from "@/server/ai/handlers/chat";

export const runtime = "nodejs";
export const maxDuration = 120;

export const POST = createAiRoute(chatHandler);
