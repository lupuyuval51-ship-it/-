/**
 * `advisor` Edge Function entrypoint (deploy: `supabase functions deploy advisor`).
 * Contract: AdvisorRequestSchema / AdvisorEvent in supabase/functions/_shared/domain/ai-api.ts.
 */
import { handleAdvisor } from './handler.ts';

Deno.serve((req) => handleAdvisor(req));
