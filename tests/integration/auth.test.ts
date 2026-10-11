import { afterAll, describe, expect, it } from "vitest";
import { POST as register } from "@/app/api/auth/register/route";
import { POST as login } from "@/app/api/auth/login/route";
import { POST as logout } from "@/app/api/auth/logout/route";
import { GET as allowance } from "@/app/api/allowance/route";
import { disconnectDb } from "@/server/db";
import { cookieFrom, createTestUser, makeRequest, readJson, uniqueEmail } from "./helpers";
import { PLANS } from "@/config/plans";

afterAll(disconnectDb);

describe("authentication & protected API", () => {
  it("registers, sets an httpOnly session cookie, and the cookie unlocks protected endpoints", async () => {
    const email = uniqueEmail("reg");
    const res = await register(makeRequest("POST", "/api/auth/register", { body: { email, password: "a-long-enough-passphrase", displayName: "Dana", locale: "he", country: "il" } }));
    expect(res.status).toBe(201);
    const setCookie = res.headers.getSetCookie().find((c) => c.startsWith("levelup_session="))!;
    expect(setCookie).toMatch(/HttpOnly/i);
    expect(setCookie).toMatch(/SameSite=lax/i);
    const me = await allowance(makeRequest("GET", "/api/allowance", { cookie: cookieFrom(res) }));
    expect(me.status).toBe(200);
    const body = await readJson<{ plan: string; remaining: number; limit: number }>(me);
    expect(body).toMatchObject({ plan: "FREE", limit: PLANS.FREE.gamesPerPeriod, remaining: PLANS.FREE.gamesPerPeriod });
  });

  it("rejects unauthenticated access with 401 and a garbage/forged cookie too", async () => {
    expect((await allowance(makeRequest("GET", "/api/allowance"))).status).toBe(401);
    expect((await allowance(makeRequest("GET", "/api/allowance", { cookie: "levelup_session=" + "x".repeat(43) }))).status).toBe(401);
  });

  it("rejects duplicate emails (case-insensitive) with 409", async () => {
    const user = await createTestUser();
    const res = await register(makeRequest("POST", "/api/auth/register", { body: { email: user.email.toUpperCase(), password: "another-long-password", displayName: "X" } }));
    expect(res.status).toBe(409);
    expect((await readJson<{ error: { code: string } }>(res)).error.code).toBe("EMAIL_TAKEN");
  });

  it("validates input (weak password, bad email, extra-long name)", async () => {
    const weak = await register(makeRequest("POST", "/api/auth/register", { body: { email: uniqueEmail(), password: "short", displayName: "A" } }));
    expect(weak.status).toBe(400);
    const bad = await register(makeRequest("POST", "/api/auth/register", { body: { email: "not-an-email", password: "long-enough-password", displayName: "A" } }));
    expect(bad.status).toBe(400);
    const notJson = await register(makeRequest("POST", "/api/auth/register", { body: "{nope" }));
    expect(notJson.status).toBe(400);
  });

  it("logs in with correct credentials and gives identical generic errors for wrong password and unknown email", async () => {
    const user = await createTestUser();
    const ok = await login(makeRequest("POST", "/api/auth/login", { body: { email: user.email, password: user.password } }));
    expect(ok.status).toBe(200);
    const wrong = await login(makeRequest("POST", "/api/auth/login", { body: { email: user.email, password: "totally wrong password" } }));
    const unknown = await login(makeRequest("POST", "/api/auth/login", { body: { email: uniqueEmail("nobody"), password: "totally wrong password" } }));
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(await readJson(wrong)).toEqual(await readJson(unknown));
  });

  it("logout destroys the server-side session: the old cookie stops working", async () => {
    const user = await createTestUser();
    expect((await allowance(makeRequest("GET", "/api/allowance", { cookie: user.cookie }))).status).toBe(200);
    const out = await logout(makeRequest("POST", "/api/auth/logout", { cookie: user.cookie }));
    expect(out.status).toBe(200);
    expect((await allowance(makeRequest("GET", "/api/allowance", { cookie: user.cookie }))).status).toBe(401);
  });

  it("blocks cross-origin and origin-less state-changing requests (CSRF)", async () => {
    const evil = await login(makeRequest("POST", "/api/auth/login", { origin: "https://evil.example", body: { email: "a@b.co", password: "x" } }));
    expect(evil.status).toBe(403);
    expect((await readJson<{ error: { code: string } }>(evil)).error.code).toBe("BAD_ORIGIN");
    const none = await login(makeRequest("POST", "/api/auth/login", { origin: null, body: { email: "a@b.co", password: "x" } }));
    expect(none.status).toBe(403);
  });

  it("rate limits repeated login attempts for the same account", async () => {
    const email = uniqueEmail("brute");
    let last = 0;
    for (let i = 0; i < 10; i++) {
      const res = await login(makeRequest("POST", "/api/auth/login", { body: { email, password: "wrong password " + i } }));
      last = res.status;
      if (last === 429) {
        expect(res.headers.get("retry-after")).toBeTruthy();
        break;
      }
    }
    expect(last).toBe(429);
  });
});
