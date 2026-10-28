import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getProvider } from "@/services/ai";
import { OpenAiCompatibleProvider } from "@/services/ai/openai-compatible";
import { AiError } from "@/services/ai/provider";

const sse = (parts: string[]) => {
  const enc = new TextEncoder();
  return new ReadableStream({ start(c) { for (const p of parts) c.enqueue(enc.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: p } }] })}\n\n`)); c.enqueue(enc.encode("data: [DONE]\n\n")); c.close(); } });
};

afterEach(() => { vi.unstubAllGlobals(); for (const k of ["AI_PROVIDER", "AI_MODEL", "AI_BASE_URL", "AI_API_KEY", "AI_VISION", "ANTHROPIC_API_KEY"]) delete process.env[k]; });
beforeEach(() => { for (const k of ["AI_PROVIDER", "AI_MODEL", "AI_BASE_URL", "AI_API_KEY", "AI_VISION", "ANTHROPIC_API_KEY"]) delete process.env[k]; });

describe("ספק תואם OpenAI (OpenCode Zen / big-pickle)", () => {
  it("נבחר לפי AI_PROVIDER, ברירת מחדל Zen, ורק עם מודל מוגדר", () => {
    process.env.AI_PROVIDER = "openai";
    expect(getProvider()).toBeNull();
    process.env.AI_MODEL = "big-pickle";
    const p = getProvider()!;
    expect(p.name).toBe("openai-compatible");
    expect(p.model).toBe("big-pickle");
    expect(p.vision).toBe(false);
    process.env.AI_VISION = "true";
    expect(getProvider()!.vision).toBe(true);
  });

  it("מזרים טקסט, שולח system כהודעה ראשונה, ובלי מפתח אין כותרת Authorization", async () => {
    const f = vi.fn(async () => new Response(sse(["שלום ", "עולם"]), { status: 200 }));
    vi.stubGlobal("fetch", f);
    const p = new OpenAiCompatibleProvider("https://opencode.ai/zen/v1", "big-pickle", undefined, false);
    let out = "";
    for await (const t of p.stream({ system: "SYS", messages: [{ role: "user", content: "היי" }], maxTokens: 50 })) out += t;
    expect(out).toBe("שלום עולם");
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://opencode.ai/zen/v1/chat/completions");
    expect((init.headers as Record<string, string>).authorization).toBeUndefined();
    expect(JSON.parse(String(init.body)).messages[0]).toEqual({ role: "system", content: "SYS" });
  });

  it("complete מחזיר טקסט; מכסת שימוש חינמי שנגמרה → rate_limited", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content: "תשובה" } }] }), { status: 200 })));
    const p = new OpenAiCompatibleProvider("http://x", "m", "key", false);
    expect((await p.complete({ system: "s", messages: [{ role: "user", content: "q" }], maxTokens: 10 })).text).toBe("תשובה");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ type: "error", error: { type: "FreeUsageLimitError", message: "Free usage limit reached" } }), { status: 200 })));
    await expect(p.complete({ system: "s", messages: [{ role: "user", content: "q" }], maxTokens: 10 })).rejects.toMatchObject({ code: "rate_limited" });
    vi.stubGlobal("fetch", vi.fn(async () => new Response("Free usage limit reached", { status: 401 })));
    await expect(p.complete({ system: "s", messages: [{ role: "user", content: "q" }], maxTokens: 10 })).rejects.toMatchObject({ code: "unauthorized" });
  });

  it("תמונות: נדחות במודל בלי vision, ונשלחות כ-image_url עם vision", async () => {
    const msg = [{ role: "user" as const, content: [{ type: "image" as const, mediaType: "image/png", data: "AAAA" }, { type: "text" as const, text: "מה זה" }] }];
    const f = vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content: "ok" } }] }), { status: 200 }));
    vi.stubGlobal("fetch", f);
    await expect(new OpenAiCompatibleProvider("http://x", "m", undefined, false).complete({ system: "s", messages: msg, maxTokens: 10 })).rejects.toBeInstanceOf(AiError);
    expect(f).not.toHaveBeenCalled();
    await new OpenAiCompatibleProvider("http://x", "m", undefined, true).complete({ system: "s", messages: msg, maxTokens: 10 });
    expect(JSON.stringify(JSON.parse(String((f.mock.calls[0] as unknown as [string, RequestInit])[1].body)).messages[1])).toContain("data:image/png;base64,AAAA");
  });

  it("ניתוק רשת → network", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("fetch failed"); }));
    await expect(new OpenAiCompatibleProvider("http://x", "m", undefined, false).complete({ system: "s", messages: [{ role: "user", content: "q" }], maxTokens: 10 })).rejects.toMatchObject({ code: "network" });
  });
});
