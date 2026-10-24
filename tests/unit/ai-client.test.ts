import { describe, expect, it, vi } from "vitest";
import { buildDemoSpec } from "../support/samples";
import { validateGameSpec } from "@/lib/game/spec/validate";
import { TIER_MAX_AREAS } from "@/config/plans";
import { OfflineGenerationError } from "@/lib/offline/generate";
import { AiError, generateWithAi } from "../../mobile/src/cloud/ai";
import { AI_URL } from "../../mobile/src/cloud/config";
import { request } from "./helpers";

const req = request({ mode: "FAST", device: "phone" });
const valid = (kind: "ai" | "demo") => {
  const spec = validateGameSpec(buildDemoSpec(req).raw, { alignGameType: req.gameType });
  if (!spec.ok) throw new Error("fixture");
  return { ...spec.spec, meta: { ...spec.spec.meta, generator: { kind, provider: "x", model: "m", mode: "FAST", generatedAt: "2026-10-17T00:00:00.000Z" } } };
};
const reply = (status: number, body: unknown) => (async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;
const failure = async (f: typeof fetch) => (await generateWithAi(req, "tok", undefined, f).then(() => null, (e: unknown) => e)) as AiError;

describe("LEVEL UP AI client (the app side)", () => {
  it("sends the request with the learner's token to the levelup-ai function and returns a validated, AI-labelled game", async () => {
    const f = vi.fn(reply(200, { spec: valid("ai") }));
    const spec = await generateWithAi(req, "tok", undefined, f as unknown as typeof fetch);
    expect(spec.meta.generator?.kind).toBe("ai");
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`${AI_URL}/functions/v1/generate-game`);
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tok");
    expect(JSON.parse(init.body as string)).toMatchObject({ subject: req.subject, device: "phone" });
  });

  it("never keeps a game that is not labelled as AI-made, or that is not valid", async () => {
    expect((await failure(reply(200, { spec: valid("demo") }))).failure).toBe("INVALID");
    expect((await failure(reply(200, { spec: { nonsense: true } }))).failure).toBe("INVALID");
  });

  it("turns every failure into a plain reason", async () => {
    expect((await failure(async () => { throw new TypeError("network"); })).failure).toBe("OFFLINE");
    for (const [code, want] of [["UNAUTHENTICATED", "SIGN_IN"], ["DAILY_LIMIT", "DAILY_LIMIT"], ["ONE_AT_A_TIME", "BUSY"], ["AI_UNAVAILABLE", "UNAVAILABLE"], ["TIMEOUT", "TIMEOUT"], ["INVALID_OUTPUT", "INVALID"], ["OUTPUT_TRUNCATED", "INVALID"], ["PROVIDER_REFUSED", "INVALID"], ["???", "GENERIC"]] as const) {
      expect((await failure(reply(400, { error: { code, message: "details never shown" } }))).failure, code).toBe(want);
    }
    expect((await failure((async () => new Response("<html>", { status: 502 })) as unknown as typeof fetch)).failure).toBe("GENERIC");
  });

  // The function writes every game at one server-wide tier (AI_FEATURE_TIER, default A): the phone cuts it down to its own plan.
  describe("the phone's feature tier", () => {
    const fullReq = request({ mode: "FULL", device: "phone" });
    const full = () => {
      const spec = validateGameSpec(buildDemoSpec(fullReq).raw, { alignGameType: fullReq.gameType });
      if (!spec.ok) throw new Error("fixture");
      return { ...spec.spec, meta: { ...spec.spec.meta, generator: { kind: "ai", provider: "x", model: "m", mode: "FULL", generatedAt: "2026-10-17T00:00:00.000Z" } } };
    };

    it("keeps an A-tier answer as it is on a phone with tier A", async () => {
      const answer = full();
      expect(answer.mechanics).toContain("adaptive_difficulty");
      const spec = await generateWithAi(fullReq, "tok", undefined, reply(200, { spec: answer }), "A");
      expect(spec.areas.length).toBe(answer.areas.length);
      expect(spec.mechanics).toContain("adaptive_difficulty");
      expect(spec.meta.generator?.kind).toBe("ai");
    });

    it("cuts the answer down to the tier of a Free phone and keeps the AI label", async () => {
      const spec = await generateWithAi(fullReq, "tok", undefined, reply(200, { spec: full() }), "B");
      expect(spec.areas.length).toBeLessThanOrEqual(TIER_MAX_AREAS.B);
      expect(spec.mechanics).not.toContain("adaptive_difficulty"); // a tier-A feature
      expect(spec.meta.featureTier).toBe("B");
      expect(spec.meta.generator?.kind).toBe("ai");
      expect(validateGameSpec(spec, { alignGameType: spec.meta.gameType }).ok).toBe(true);
    });

    it("tells the function the phone's level, so it writes the game at that level (it can only lower its own)", async () => {
      let sent: Record<string, unknown> = {};
      const capture = (async (_url: string, init: RequestInit) => { sent = JSON.parse(init.body as string) as Record<string, unknown>; return new Response(JSON.stringify({ spec: full() }), { status: 200 }); }) as unknown as typeof fetch;
      await generateWithAi(fullReq, "tok", undefined, capture, "B");
      expect(sent.level).toBe("B");
    });

    it("a single-area tier gets a single-area game", async () => {
      const fast = request({ mode: "FAST", gameType: "exploration", device: "phone" });
      const spec = await generateWithAi(fast, "tok", undefined, reply(200, { spec: full() }), "C");
      expect(spec.areas.length).toBe(1);
      expect(spec.meta.featureTier).toBe("C");
      expect(spec.meta.generator?.kind).toBe("ai");
    });

    it("refuses a mode or game type the tier lacks before anything is sent (nothing is used)", async () => {
      const f = vi.fn(reply(200, { spec: full() }));
      const err = await generateWithAi(fullReq, "tok", undefined, f as unknown as typeof fetch, "C").then(() => null, (e: unknown) => e);
      expect(err).toBeInstanceOf(OfflineGenerationError);
      expect((err as OfflineGenerationError).code).toBe("TIER_LOCKED");
      expect(f).not.toHaveBeenCalled();
    });
  });
});
