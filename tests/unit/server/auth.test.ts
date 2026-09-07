import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { cookieFrom, makeRequest, readJson, registerAccount, setupTestEnv } from "./helpers";

const env = setupTestEnv("auth");

import { POST as register } from "@/app/api/auth/register/route";
import { POST as login } from "@/app/api/auth/login/route";
import { POST as logout } from "@/app/api/auth/logout/route";
import { GET as me } from "@/app/api/auth/me/route";
import { POST as deleteAccount } from "@/app/api/auth/delete-account/route";
import { GET as exportData } from "@/app/api/auth/export/route";
import { resetAuthRateLimit } from "@/server/auth/rateLimit";
import { getSessionUser, requireUser } from "@/server/auth/session";

afterAll(() => env.teardown());
beforeEach(() => resetAuthRateLimit());

describe("auth routes", () => {
  it("registers the first account as admin (first-run rule) and later accounts as users", async () => {
    const first = await registerAccount("First.Person@Example.com");
    expect(first.user.role).toBe("admin");
    expect(first.user.email).toBe("first.person@example.com");
    const second = await registerAccount("second@example.com");
    expect(second.user.role).toBe("user");
  });

  it("rejects a duplicate email, weak passwords, bad emails and missing CSRF header", async () => {
    const dup = await register(makeRequest("/api/auth/register", { body: { email: "second@example.com", password: "another-long-pass" } }));
    expect(dup.status).toBe(409);
    const dupBody = await readJson(dup);
    expect(dupBody.ok).toBe(false);
    expect(dupBody.code).toBe("email_taken");
    expect(typeof dupBody.message).toBe("string");
    expect(/[֐-׿]/.test(String(dupBody.message))).toBe(true);

    const weak = await register(makeRequest("/api/auth/register", { body: { email: "weak@example.com", password: "short" } }));
    expect(weak.status).toBe(400);
    expect((await readJson(weak)).code).toBe("validation");

    const badEmail = await register(makeRequest("/api/auth/register", { body: { email: "not-an-email", password: "long-enough-pass" } }));
    expect(badEmail.status).toBe(400);

    const noCsrf = await register(makeRequest("/api/auth/register", { body: { email: "x@example.com", password: "long-enough-pass" }, csrf: false }));
    expect(noCsrf.status).toBe(403);
    expect((await readJson(noCsrf)).code).toBe("csrf");
  });

  it("logs in with the right password only and returns the session user from /me", async () => {
    const wrong = await login(makeRequest("/api/auth/login", { body: { email: "second@example.com", password: "wrong-password" } }));
    expect(wrong.status).toBe(401);
    expect((await readJson(wrong)).code).toBe("invalid_credentials");

    const ok = await login(makeRequest("/api/auth/login", { body: { email: "SECOND@example.com", password: "correct-horse-battery" } }));
    expect(ok.status).toBe(200);
    const cookie = cookieFrom(ok);
    expect(cookie).toMatch(/^dc_session=/);
    expect(ok.headers.get("set-cookie")).toContain("HttpOnly");
    expect(ok.headers.get("set-cookie")).toContain("SameSite=Lax");

    const meRes = await me(makeRequest("/api/auth/me", { cookie }));
    const meBody = await readJson<{ ok: boolean; user: { email: string; role: string } | null }>(meRes);
    expect(meBody.user?.email).toBe("second@example.com");
    expect(meBody.user?.role).toBe("user");

    const guest = await readJson<{ user: unknown }>(await me(makeRequest("/api/auth/me")));
    expect(guest.user).toBeNull();
    const bogus = await readJson<{ user: unknown }>(await me(makeRequest("/api/auth/me", { cookie: "dc_session=definitely-not-a-valid-token-value" })));
    expect(bogus.user).toBeNull();
  });

  it("logout revokes the session and requireUser throws 401 afterwards", async () => {
    const acc = await registerAccount("logout@example.com");
    expect(await getSessionUser(makeRequest("/api/auth/me", { cookie: acc.cookie }))).not.toBeNull();
    const res = await logout(makeRequest("/api/auth/logout", { method: "POST", cookie: acc.cookie }));
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toContain("Max-Age=0");
    expect(await getSessionUser(makeRequest("/api/auth/me", { cookie: acc.cookie }))).toBeNull();
    await expect(requireUser(makeRequest("/api/auth/me", { cookie: acc.cookie }))).rejects.toMatchObject({ status: 401, code: "unauthorized" });
  });

  it("exports data and deletes the account with all its rows", async () => {
    const acc = await registerAccount("delete-me@example.com");
    const exp = await exportData(makeRequest("/api/auth/export", { cookie: acc.cookie }));
    expect(exp.status).toBe(200);
    expect(exp.headers.get("content-disposition")).toContain("attachment");
    const expBody = await readJson<{ ok: boolean; user: { email: string }; collections: Record<string, unknown[]> }>(exp);
    expect(expBody.user.email).toBe("delete-me@example.com");
    expect(typeof expBody.collections).toBe("object");

    const del = await deleteAccount(makeRequest("/api/auth/delete-account", { method: "POST", cookie: acc.cookie }));
    expect(del.status).toBe(200);
    expect(await getSessionUser(makeRequest("/api/auth/me", { cookie: acc.cookie }))).toBeNull();
    const again = await login(makeRequest("/api/auth/login", { body: { email: "delete-me@example.com", password: "correct-horse-battery" } }));
    expect(again.status).toBe(401);
    const unauth = await deleteAccount(makeRequest("/api/auth/delete-account", { method: "POST" }));
    expect(unauth.status).toBe(401);
  });

  it("rate-limits auth attempts per IP", async () => {
    process.env.AUTH_RATE_LIMIT_PER_15M = "3";
    try {
      resetAuthRateLimit();
      const attempt = () => login(makeRequest("/api/auth/login", { body: { email: "second@example.com", password: "wrong-password" }, headers: { "x-forwarded-for": "203.0.113.9" } }));
      expect((await attempt()).status).toBe(401);
      expect((await attempt()).status).toBe(401);
      expect((await attempt()).status).toBe(401);
      const limited = await attempt();
      expect(limited.status).toBe(429);
      const body = await readJson<{ code: string; retryAfterSeconds: number }>(limited);
      expect(body.code).toBe("rate_limited");
      expect(body.retryAfterSeconds).toBeGreaterThan(0);
      expect(limited.headers.get("retry-after")).toBeTruthy();
      // A different IP is unaffected.
      const other = await login(makeRequest("/api/auth/login", { body: { email: "second@example.com", password: "wrong-password" }, headers: { "x-forwarded-for": "198.51.100.1" } }));
      expect(other.status).toBe(401);
    } finally {
      delete process.env.AUTH_RATE_LIMIT_PER_15M;
      resetAuthRateLimit();
    }
  });
});
