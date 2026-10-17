import { describe, expect, it, vi } from "vitest";
import { buildDemoSpec } from "@/lib/game/demo";
import { validateGameSpec } from "@/lib/game/spec/validate";
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
    for (const [code, want] of [["UNAUTHENTICATED", "SIGN_IN"], ["DAILY_LIMIT", "DAILY_LIMIT"], ["ONE_AT_A_TIME", "BUSY"], ["AI_UNAVAILABLE", "UNAVAILABLE"], ["TIMEOUT", "TIMEOUT"], ["INVALID_OUTPUT", "INVALID"], ["???", "GENERIC"]] as const) {
      expect((await failure(reply(400, { error: { code, message: "details never shown" } }))).failure, code).toBe(want);
    }
    expect((await failure((async () => new Response("<html>", { status: 502 })) as unknown as typeof fetch)).failure).toBe("GENERIC");
  });
});
