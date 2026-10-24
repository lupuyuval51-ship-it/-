/**
 * The Deno side of the `generate-game` Edge Function (project `levelup-ai`): bundled by `scripts/build-ai-function.mjs`
 * into `supabase/functions/generate-game/game.js`. All logic and its tests are in `./generate-game.ts`.
 */
import { createEdgeDeps, handleGenerate } from "./generate-game";

declare const Deno: { serve(handler: (req: Request) => Response | Promise<Response>): void; env: { get(name: string): string | undefined } };

Deno.serve((req) => handleGenerate(req, createEdgeDeps((name) => Deno.env.get(name))));
