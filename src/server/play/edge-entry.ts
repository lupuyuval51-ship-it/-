/**
 * The Deno side of the `verify-purchase` Edge Function (project `levelup-app`): bundled by `scripts/build-verify-function.mjs`
 * into `supabase/functions/verify-purchase/index.ts`. All logic and its tests are in `./verify.ts`.
 */
import { createVerifyDeps, handleVerify } from "./verify";

declare const Deno: { serve(handler: (req: Request) => Response | Promise<Response>): void; env: { get(name: string): string | undefined } };

Deno.serve((req) => handleVerify(req, createVerifyDeps((name) => Deno.env.get(name))));
