/**
 * LEVEL UP AI for the Android app: the Supabase Edge Function `generate-game` (project `levelup-ai`).
 *
 * The app has no AI key. A signed-in learner sends a generation request here; this function checks the caller's
 * `levelup-app` sign-in, reserves one of the learner's daily slots, runs the SAME pipeline as the website's server
 * (prompts, repair loop, `validateGameSpec`), clamps the game to the feature tier, fits it to a phone and returns the
 * validated spec, labelled `generatorKind: "ai"`. A failed generation releases the slot (it never costs anything).
 * The app validates the spec again before saving it.
 *
 * Everything outside is injected (`EdgeDeps`), so the handler is unit-tested in Node; `createEdgeDeps` wires the real
 * world inside Deno. Bundled for Deno by `scripts/build-ai-function.mjs`.
 */
import "server-only"; // (stubbed to nothing when bundled for Deno, see scripts/build-ai-function.mjs)
import type { FeatureTier } from "@/config/plans";
import { fitForDevice } from "@/lib/game/spec/device";
import type { GameSpec } from "@/lib/game/spec/schema";
import { clampToFeatureTier } from "@/lib/game/spec/tier";
import { validateGameSpec } from "@/lib/game/spec/validate";
import { generationRequestSchema, type GenerationRequest } from "@/lib/schemas/generation";
import { ProviderError } from "../errors";
import { createAnthropicBackend } from "../providers/anthropic";
import { createOpenAiCompatBackend } from "../providers/openai";
import type { LlmBackend } from "../types";
import { PipelineError, runPipeline } from "../../generation/pipeline";

/** The app's own Supabase project (accounts). Both values are public; the publishable key only identifies the project. */
export const APP_PROJECT_URL = "https://yhxwgfgodxbzdvaqtqjz.supabase.co";
export const APP_PUBLISHABLE_KEY = "sb_publishable_mhowyylc3sDlIerXlS9ujw_emr9KYvd";
/** Origins of the Capacitor WebView (and a local preview); anything else is not the app. */
export const ALLOWED_ORIGINS = ["https://localhost", "capacitor://localhost", "http://localhost"] as const;
/** Supabase Edge Functions stop a request at 150 s on the free plan: leave room to answer. */
export const DEADLINE_MS = 135_000;
export const CALL_TIMEOUT_MS = 120_000;
export const DEFAULT_DAILY_LIMIT = 5;

export type Slot = { ok: true; id: string } | { ok: false; reason: "LIMIT" | "BUSY" };

export interface EdgeDeps {
  env: (name: string) => string | undefined;
  /** The caller's user id in `levelup-app`, or null when the token is not a valid sign-in there. */
  verifyUser: (authorization: string) => Promise<string | null>;
  /** Atomically reserves one generation for the user (one at a time, `limit` per 24 h). */
  reserve: (userId: string, limit: number) => Promise<Slot>;
  /** Marks the reservation done (counts) or failed (released). */
  finish: (slotId: string, ok: boolean) => Promise<void>;
  /** The model backend; null when no AI key is configured. */
  backend: () => LlmBackend | null;
  now: () => number;
}

function cors(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  return {
    "Access-Control-Allow-Origin": (ALLOWED_ORIGINS as readonly string[]).includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

const json = (req: Request, status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), { status, headers: { ...cors(req), "Content-Type": "application/json" } });
const fail = (req: Request, status: number, code: string, message: string): Response => json(req, status, { error: { code, message } });

const TIERS: readonly FeatureTier[] = ["A", "B", "C"];
const tierFrom = (v: string | undefined): FeatureTier => (TIERS.includes(v as FeatureTier) ? (v as FeatureTier) : "A");
const limitFrom = (v: string | undefined): number => {
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 && n <= 1000 ? n : DEFAULT_DAILY_LIMIT;
};

export async function handleGenerate(req: Request, deps: EdgeDeps): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });
  if (req.method !== "POST") return fail(req, 405, "METHOD", "Use POST.");

  const authorization = req.headers.get("Authorization") ?? "";
  if (!/^Bearer \S+$/.test(authorization)) return fail(req, 401, "UNAUTHENTICATED", "Sign in to use LEVEL UP AI.");
  const userId = await deps.verifyUser(authorization).catch(() => null);
  if (!userId) return fail(req, 401, "UNAUTHENTICATED", "Sign in to use LEVEL UP AI.");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail(req, 400, "INVALID_REQUEST", "The request is not valid JSON.");
  }
  const parsed = generationRequestSchema.safeParse(body);
  if (!parsed.success) return fail(req, 400, "INVALID_REQUEST", parsed.error.issues[0]?.message ?? "The request is invalid.");
  const request: GenerationRequest = parsed.data;
  // The topic library and extending a saved game run on the phone; this endpoint only writes new games with the model.
  if (request.topicId) return fail(req, 400, "USE_LIBRARY", "Topic-library games are built on the phone, without AI.");
  if (request.mode === "EXTEND") return fail(req, 400, "UNSUPPORTED_MODE", "Extending a game is not available here yet.");

  const backend = deps.backend();
  if (!backend) return fail(req, 503, "AI_UNAVAILABLE", "LEVEL UP AI is not available right now. Nothing was used.");

  const slot = await deps.reserve(userId, limitFrom(deps.env("AI_DAILY_LIMIT"))).catch(() => null);
  if (!slot) return fail(req, 503, "AI_UNAVAILABLE", "LEVEL UP AI is not available right now. Nothing was used.");
  if (!slot.ok) {
    return slot.reason === "BUSY"
      ? fail(req, 409, "ONE_AT_A_TIME", "A game is already being made for you. Wait for it to finish.")
      : fail(req, 429, "DAILY_LIMIT", "You have used today's LEVEL UP AI games. Try again tomorrow.");
  }

  let ok = false;
  try {
    const tier = tierFrom(deps.env("AI_FEATURE_TIER"));
    const out = await runPipeline({
      backend, request, tier, base: null,
      deadline: deps.now() + DEADLINE_MS, callTimeoutMs: CALL_TIMEOUT_MS, onStage: () => {}, now: deps.now,
    });
    const clamped = clampToFeatureTier(out.spec, tier);
    if (!clamped.ok) return fail(req, 422, "TIER_BUILD_FAILED", "We could not build this game. Nothing was used — try a different topic or game type.");
    // The app always plays on a phone: fit the game to a touch screen (challenges and answers never change).
    const fitted = fitForDevice(clamped.spec, "phone").spec;
    // Untrusted output, checked once more after every change made here.
    const final = validateGameSpec(fitted, { alignGameType: request.gameType });
    if (!final.ok) return fail(req, 502, "INVALID_OUTPUT", "The AI answer did not make a valid game. Nothing was used — try again.");
    // Honest label, stamped last (validation rebuilds the spec): the app shows "AI-generated (LEVEL UP AI)", never the vendor.
    const spec: GameSpec = { ...final.spec, meta: { ...final.spec.meta, generator: { kind: "ai", provider: backend.info.id, model: out.model.slice(0, 80), mode: request.mode, generatedAt: new Date(deps.now()).toISOString() } } };
    ok = true;
    return json(req, 200, { spec, warnings: [...out.warnings, ...final.warnings].slice(0, 20) });
  } catch (err) {
    if (err instanceof PipelineError) return fail(req, err.code === "TIMEOUT" ? 504 : 502, err.code, err.userMessage);
    if (err instanceof ProviderError) return fail(req, err.code === "PROVIDER_RATE_LIMITED" ? 503 : 502, err.code, err.userMessage);
    return fail(req, 500, "INTERNAL", "Something went wrong. Nothing was used — try again.");
  } finally {
    await deps.finish(slot.id, ok).catch(() => {});
  }
}

/** The configured model: Anthropic, or any OpenAI-compatible endpoint (OpenAI, DeepSeek, Gemini's OpenAI endpoint, ...). */
export function backendFromEnv(env: (name: string) => string | undefined, fetchImpl?: typeof fetch): LlmBackend | null {
  const provider = env("AI_PROVIDER") ?? "auto";
  const anthropicKey = env("ANTHROPIC_API_KEY");
  const openaiKey = env("OPENAI_API_KEY");
  const anthropic = () => (anthropicKey ? createAnthropicBackend({ apiKey: anthropicKey, model: env("ANTHROPIC_MODEL") ?? "claude-opus-5-5", refusalFallback: env("ANTHROPIC_REFUSAL_FALLBACK") !== "false" }) : null);
  const openai = () => (openaiKey ? createOpenAiCompatBackend({ apiKey: openaiKey, baseUrl: env("OPENAI_BASE_URL") ?? "https://api.openai.com/v1", model: env("OPENAI_MODEL") ?? "gpt-4.1", fetchImpl }) : null);
  if (provider === "anthropic") return anthropic();
  if (provider === "openai") return openai();
  return anthropic() ?? openai();
}

/** The real world, inside the Edge Function: Deno env, the app project's Auth, and this project's database. */
export function createEdgeDeps(env: (name: string) => string | undefined, fetchImpl: typeof fetch = fetch): EdgeDeps {
  const ownUrl = env("SUPABASE_URL") ?? "";
  const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const rpc = async (fn: string, args: Record<string, unknown>): Promise<unknown> => {
    const res = await fetchImpl(`${ownUrl}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(args),
    });
    if (!res.ok) throw new Error(`${fn}: HTTP ${res.status}`);
    return res.json();
  };
  return {
    env,
    now: () => Date.now(),
    backend: () => backendFromEnv(env, fetchImpl),
    async verifyUser(authorization) {
      const res = await fetchImpl(`${env("APP_PROJECT_URL") ?? APP_PROJECT_URL}/auth/v1/user`, {
        headers: { apikey: env("APP_PUBLISHABLE_KEY") ?? APP_PUBLISHABLE_KEY, Authorization: authorization },
      });
      if (!res.ok) return null;
      const user = (await res.json()) as { id?: unknown };
      return typeof user.id === "string" && /^[0-9a-f-]{36}$/i.test(user.id) ? user.id : null;
    },
    async reserve(userId, limit) {
      const out = (await rpc("reserve_ai_request", { p_user: userId, p_daily: limit })) as { id?: string; refused?: string };
      if (out.id) return { ok: true, id: out.id };
      return { ok: false, reason: out.refused === "BUSY" ? "BUSY" : "LIMIT" };
    },
    async finish(slotId, ok) {
      await rpc("finish_ai_request", { p_id: slotId, p_ok: ok });
    },
  };
}
