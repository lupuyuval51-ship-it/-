/**
 * `ai` Edge Function entrypoint (deploy: `supabase functions deploy ai`).
 * Contract: supabase/functions/_shared/domain/ai-api.ts (AiRequestSchema / AiResponseMap).
 */
import { handleAi } from './handler.ts';

Deno.serve((req) => handleAi(req));
