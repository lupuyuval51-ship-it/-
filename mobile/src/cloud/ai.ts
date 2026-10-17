import { validateGameSpec } from "@/lib/game/spec/validate";
import { generatorInfoSchema, type GameSpec } from "@/lib/game/spec/schema";
import type { GenerationRequest } from "@/lib/schemas/generation";
import { AI_URL } from "./config";

/** Why a LEVEL UP AI request failed, in the words the screen translates. Nothing is ever charged on a failure. */
export type AiFailure = "SIGN_IN" | "DAILY_LIMIT" | "BUSY" | "UNAVAILABLE" | "OFFLINE" | "TIMEOUT" | "INVALID" | "GENERIC";

export class AiError extends Error {
  constructor(public readonly failure: AiFailure) {
    super(failure);
    this.name = "AiError";
  }
}

const BY_CODE: Record<string, AiFailure> = {
  UNAUTHENTICATED: "SIGN_IN", DAILY_LIMIT: "DAILY_LIMIT", ONE_AT_A_TIME: "BUSY", AI_UNAVAILABLE: "UNAVAILABLE",
  TIMEOUT: "TIMEOUT", INVALID_OUTPUT: "INVALID", TIER_BUILD_FAILED: "INVALID",
  PROVIDER_UNAVAILABLE: "UNAVAILABLE", PROVIDER_RATE_LIMITED: "UNAVAILABLE", PROVIDER_AUTH: "UNAVAILABLE", PROVIDER_TIMEOUT: "TIMEOUT",
};

/**
 * Asks LEVEL UP AI for a new game. Only ever called after an explicit tap, and only for a signed-in learner: the request
 * (subject, goal, notes) goes to `levelup-ai`, which replies with a game. The reply is untrusted: it must pass `validateGameSpec`
 * here as well, and it must be labelled as AI-made, before the caller may save or play it.
 */
export async function generateWithAi(request: GenerationRequest, accessToken: string, signal?: AbortSignal, fetchImpl: typeof fetch = fetch): Promise<GameSpec> {
  let res: Response;
  try {
    res = await fetchImpl(`${AI_URL}/functions/v1/generate-game`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(request),
      signal,
    });
  } catch {
    throw new AiError("OFFLINE");
  }
  type Body = { spec?: unknown; error?: { code?: unknown } };
  const body: Body | null = await (res.json() as Promise<Body>).catch(() => null);
  if (!res.ok || !body?.spec) throw new AiError(BY_CODE[String(body?.error?.code)] ?? "GENERIC");
  const checked = validateGameSpec(body.spec, { alignGameType: request.gameType });
  // validation rebuilds the game and drops the provenance label, so the label is read from the answer itself and put back
  const label = generatorInfoSchema.safeParse((body.spec as { meta?: { generator?: unknown } } | null)?.meta?.generator);
  if (!checked.ok || !label.success || label.data.kind !== "ai") throw new AiError("INVALID");
  return { ...checked.spec, meta: { ...checked.spec.meta, generator: label.data } };
}
