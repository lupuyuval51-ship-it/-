import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { guardAiRequest } from "@/services/ai/guard";
import { resetRateLimits } from "@/services/ai/ratelimit";
import { POST as chatPOST } from "@/app/api/ai/chat/route";

const SB = "https://project.supabase.co";

function req(headers: Record<string, string> = {}) {
  return new Request("http://localhost:3000/api/ai/chat", { method: "POST", headers: { host: "localhost:3000", "x-lupu-client": "web", "x-forwarded-for": "1.2.3.4", ...headers }, body: "{}" });
}

function mockSupabaseAuth(validToken: string, userId = "user-1") {
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    if (String(url).startsWith(`${SB}/auth/v1/user`)) {
      const auth = (init?.headers as Record<string, string>).authorization;
      return auth === `Bearer ${validToken}` ? new Response(JSON.stringify({ id: userId }), { status: 200 }) : new Response("{}", { status: 401 });
    }
    return new Response("{}", { status: 500 });
  }));
}

beforeEach(() => {
  resetRateLimits();
  process.env.NEXT_PUBLIC_SUPABASE_URL = SB;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
  process.env.AI_RATE_LIMIT_PER_MINUTE = "100";
  process.env.AI_GUEST_RATE_LIMIT_PER_DAY = "3";
  process.env.AI_RATE_LIMIT_PER_DAY = "6";
});
afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  delete process.env.AI_GUEST_RATE_LIMIT_PER_DAY;
  delete process.env.AI_RATE_LIMIT_PER_DAY;
});

describe("הרשאות משתמשים בנתיבי AI (עם Supabase מוגדר)", () => {
  it("אסימון תקין → משתמש מחובר", async () => {
    mockSupabaseAuth("good");
    const g = await guardAiRequest(req({ authorization: "Bearer good" }), { maxBytes: 1000, scope: "t" });
    expect(g).toMatchObject({ ok: true, identity: { type: "user", id: "user-1" } });
  });

  it("אסימון מזויף או שפג תוקפו → 401", async () => {
    mockSupabaseAuth("good");
    const g = await guardAiRequest(req({ authorization: "Bearer forged" }), { maxBytes: 1000, scope: "t" });
    expect(g.ok).toBe(false);
    if (!g.ok) expect(g.response.status).toBe(401);
  });

  it("בלי אסימון → אורח עם מכסה יומית נמוכה יותר, שמסתיימת בהודעה שמפנה להתחברות", async () => {
    mockSupabaseAuth("good");
    for (let i = 0; i < 3; i++) expect((await guardAiRequest(req(), { maxBytes: 1000, scope: "t" })).ok).toBe(true);
    const g = await guardAiRequest(req(), { maxBytes: 1000, scope: "t" });
    expect(g.ok).toBe(false);
    if (!g.ok) {
      expect(g.response.status).toBe(429);
      expect((await g.response.json()).error.message).toContain("אורח");
    }
  });

  it("משתמש מחובר מקבל מכסה גדולה יותר מאורח, וכל משתמש נספר בנפרד", async () => {
    mockSupabaseAuth("good", "user-A");
    for (let i = 0; i < 6; i++) expect((await guardAiRequest(req({ authorization: "Bearer good" }), { maxBytes: 1000, scope: "t" })).ok).toBe(true);
    expect((await guardAiRequest(req({ authorization: "Bearer good" }), { maxBytes: 1000, scope: "t" })).ok).toBe(false);
    mockSupabaseAuth("good2", "user-B");
    expect((await guardAiRequest(req({ authorization: "Bearer good2" }), { maxBytes: 1000, scope: "t" })).ok).toBe(true);
  });

  it("נתיב ה-chat דוחה אסימון לא תקין עוד לפני שמגיעים למודל", async () => {
    mockSupabaseAuth("good");
    process.env.ANTHROPIC_API_KEY = "k";
    const res = await chatPOST(new Request("http://localhost:3000/api/ai/chat", { method: "POST", headers: { host: "localhost:3000", "x-lupu-client": "web", authorization: "Bearer nope", "content-type": "application/json" }, body: JSON.stringify({ messages: [{ role: "user", content: "x" }], mode: "explain", level: "standard", grade: 8 }) }));
    expect(res.status).toBe(401);
    delete process.env.ANTHROPIC_API_KEY;
  });
});
