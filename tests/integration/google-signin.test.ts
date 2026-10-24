import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { GET as startRoute } from "@/app/api/auth/google/start/route";
import { GET as callbackRoute } from "@/app/api/auth/google/callback/route";
import { GET as allowance } from "@/app/api/allowance/route";
import { POST as login } from "@/app/api/auth/login/route";
import { DELETE as deleteAccountRoute } from "@/app/api/account/route";
import { DELETE as unlinkRoute } from "@/app/api/account/identities/google/route";
import { setGoogleFetchForTests } from "@/server/auth/google/flow";
import { pkceChallenge } from "@/server/auth/google/protocol";
import { hasUsablePassword } from "@/server/security/password";
import { db, disconnectDb } from "@/server/db";
import { resetEnvForTests } from "@/server/env";
import { createTestUser, makeRequest, uniqueEmail } from "./helpers";

const CID = "fake-client-id-123456.apps.googleusercontent.com";
const SECRET = "fake-client-secret-123456";
const saved = { id: process.env.GOOGLE_CLIENT_ID, secret: process.env.GOOGLE_CLIENT_SECRET, url: process.env.APP_URL };

beforeAll(() => {
  process.env.GOOGLE_CLIENT_ID = CID;
  process.env.GOOGLE_CLIENT_SECRET = SECRET;
  resetEnvForTests();
});
afterAll(async () => {
  for (const [k, v] of [["GOOGLE_CLIENT_ID", saved.id], ["GOOGLE_CLIENT_SECRET", saved.secret], ["APP_URL", saved.url]] as const) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  resetEnvForTests();
  await disconnectDb();
});
afterEach(() => {
  setGoogleFetchForTests(null);
  vi.useRealTimers();
});

const ip = () => `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;
const jwt = (payload: unknown) => `e30.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.sig`;
const newSub = () => `sub-${randomUUID()}`;

interface Started {
  res: Response;
  location: URL;
  state: string;
  nonce: string;
  challenge: string;
  stateCookie: string; // "levelup_gauth=…" ready for a Cookie header
}

/** The browser's first leg: GET /api/auth/google/start. */
async function begin(path = "/api/auth/google/start", extraCookie = "", headers: Record<string, string> = {}): Promise<Started> {
  const res = await startRoute(makeRequest("GET", path, { cookie: extraCookie || undefined, origin: null, ip: ip(), headers }) as NextRequest);
  expect(res.status).toBe(303);
  const location = new URL(res.headers.get("location")!);
  const set = res.headers.getSetCookie().find((c) => c.startsWith("levelup_gauth="))!;
  return { res, location, state: location.searchParams.get("state")!, nonce: location.searchParams.get("nonce")!, challenge: location.searchParams.get("code_challenge")!, stateCookie: set.split(";")[0]! };
}

/** A fake Google token endpoint that behaves like the real one: single-use codes, PKCE check, id_token carrying the nonce. */
function fakeGoogle(started: Started, claims: Record<string, unknown>, opts: { aud?: string } = {}) {
  const now = Math.floor(Date.now() / 1000);
  const issued = new Set<string>();
  const calls: URLSearchParams[] = [];
  const code = `code-${randomUUID()}`;
  setGoogleFetchForTests(async (url, init) => {
    expect(url).toBe("https://oauth2.googleapis.com/token");
    const body = new URLSearchParams(String(init?.body));
    calls.push(body);
    if (body.get("code") !== code || issued.has(code)) return new Response(JSON.stringify({ error: "invalid_grant", detail: "leaky upstream text" }), { status: 400 });
    issued.add(code);
    if (pkceChallenge(body.get("code_verifier") ?? "") !== started.challenge) return new Response(JSON.stringify({ error: "invalid_grant" }), { status: 400 });
    if (body.get("client_id") !== CID || body.get("client_secret") !== SECRET || body.get("redirect_uri") !== "http://localhost:3000/api/auth/google/callback") return new Response("{}", { status: 401 });
    return new Response(JSON.stringify({ access_token: "ignored", id_token: jwt({ iss: "https://accounts.google.com", aud: opts.aud ?? CID, iat: now, exp: now + 3600, nonce: started.nonce, sub: newSub(), email: uniqueEmail("g"), email_verified: true, name: "Gil Google", ...claims }) }), { status: 200, headers: { "content-type": "application/json" } });
  });
  return { code, calls };
}

async function callback(started: Started, code: string, opts: { state?: string; cookie?: string; extraCookie?: string; query?: string } = {}) {
  const q = opts.query ?? `code=${encodeURIComponent(code)}&state=${encodeURIComponent(opts.state ?? started.state)}`;
  const cookie = [opts.cookie ?? started.stateCookie, opts.extraCookie].filter(Boolean).join("; ");
  return callbackRoute(makeRequest("GET", `/api/auth/google/callback?${q}`, { cookie, origin: null, ip: ip() }) as NextRequest);
}

const sessionSetCookie = (res: Response) => res.headers.getSetCookie().find((c) => c.startsWith("levelup_session="));
const sessionCookieOf = (res: Response) => sessionSetCookie(res)!.split(";")[0]!;
const where = (res: Response) => new URL(res.headers.get("location")!);

/** Full happy path for a brand-new Google user. */
async function googleSignUp(claims: Record<string, unknown> = {}, extraCookie = "") {
  const started = await begin("/api/auth/google/start", extraCookie);
  const g = fakeGoogle(started, claims);
  const res = await callback(started, g.code, { extraCookie });
  return { started, res, g };
}

describe("Google sign-in: availability", () => {
  it("the routes do not exist (404) unless both credentials are configured", async () => {
    delete process.env.GOOGLE_CLIENT_SECRET;
    resetEnvForTests();
    try {
      expect((await startRoute(makeRequest("GET", "/api/auth/google/start", { origin: null }) as NextRequest)).status).toBe(404);
      expect((await callbackRoute(makeRequest("GET", "/api/auth/google/callback?code=x&state=y", { origin: null }) as NextRequest)).status).toBe(404);
    } finally {
      process.env.GOOGLE_CLIENT_SECRET = SECRET;
      resetEnvForTests();
    }
  });
});

describe("Google sign-in: start", () => {
  it("redirects to Google with state, nonce and an S256 challenge, redirect_uri from APP_URL (not from headers), and a short-lived sealed cookie", async () => {
    const s = await begin("/api/auth/google/start?next=/games", "", { host: "evil.example", "x-forwarded-host": "evil.example", origin: "https://evil.example" });
    expect(s.location.origin + s.location.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    expect(s.location.searchParams.get("redirect_uri")).toBe("http://localhost:3000/api/auth/google/callback");
    expect(s.location.searchParams.get("client_id")).toBe(CID);
    expect(s.location.searchParams.get("scope")).toBe("openid email profile");
    expect(s.location.searchParams.get("code_challenge_method")).toBe("S256");
    expect(s.state.length).toBeGreaterThanOrEqual(32);
    const cookie = s.res.headers.getSetCookie().find((c) => c.startsWith("levelup_gauth="))!;
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=lax/i);
    expect(cookie).toMatch(/Max-Age=600/i);
    expect(cookie).toMatch(/Path=\/api\/auth\/google/i);
    expect(cookie).not.toContain(SECRET);
    expect(s.res.headers.get("cache-control")).toBe("no-store");
  });

  it("marks the state cookie Secure when APP_URL is https", async () => {
    process.env.APP_URL = "https://levelup.example";
    resetEnvForTests();
    try {
      const s = await begin();
      expect(s.res.headers.getSetCookie().find((c) => c.startsWith("levelup_gauth="))).toMatch(/;\s*Secure/i);
      expect(s.location.searchParams.get("redirect_uri")).toBe("https://levelup.example/api/auth/google/callback");
    } finally {
      process.env.APP_URL = saved.url ?? "http://localhost:3000";
      resetEnvForTests();
    }
  });

  it("is rate limited per IP like the login route, redirecting back with a fixed error key", async () => {
    const fixedIp = ip();
    let last: Response | null = null;
    for (let i = 0; i < 31; i++) last = await startRoute(makeRequest("GET", "/api/auth/google/start", { origin: null, ip: fixedIp }) as NextRequest);
    expect(last!.status).toBe(303);
    expect(where(last!).pathname + where(last!).search).toBe("/login?error=google_rate_limited");
  });

  it("link and re-authentication need a signed-in user; otherwise the visitor is sent to the login page", async () => {
    for (const intent of ["link", "reauth"]) {
      const res = await startRoute(makeRequest("GET", `/api/auth/google/start?intent=${intent}`, { origin: null, ip: ip() }) as NextRequest);
      expect(res.status).toBe(303);
      expect(where(res).pathname).toBe("/login");
      expect(res.headers.getSetCookie().some((c) => c.startsWith("levelup_gauth=") && !/Max-Age=0/i.test(c))).toBe(false);
    }
  });
});

describe("Google sign-in: new user", () => {
  it("creates a private Free account from the verified email, with no usable password, and signs in with the normal session cookie", async () => {
    const email = uniqueEmail("new");
    const sub = newSub();
    const { res } = await googleSignUp({ email: email.toUpperCase(), sub, name: "  Gil Google  " }, "levelup_lang=en");
    expect(res.status).toBe(303);
    expect(where(res).pathname).toBe("/dashboard");

    const setCookie = sessionSetCookie(res)!;
    expect(setCookie).toMatch(/HttpOnly/i);
    expect(setCookie).toMatch(/SameSite=lax/i);
    expect(setCookie).toMatch(/Path=\//i);
    expect(setCookie).toMatch(/Expires=/i);
    // the single-use state cookie is cleared
    expect(res.headers.getSetCookie().find((c) => c.startsWith("levelup_gauth="))).toMatch(/Max-Age=0/i);

    const user = await db.user.findUniqueOrThrow({ where: { email: email.toLowerCase() }, include: { profile: true, identities: true } });
    expect(hasUsablePassword(user.passwordHash)).toBe(false);
    expect(user.profile).toMatchObject({ displayName: "Gil Google", locale: "en", country: null, visibility: "PRIVATE" });
    expect(user.identities).toHaveLength(1);
    expect(user.identities[0]).toMatchObject({ provider: "google", subject: sub, email: email.toLowerCase() });

    const me = await allowance(makeRequest("GET", "/api/allowance", { cookie: sessionCookieOf(res) }));
    expect(me.status).toBe(200);
    expect((await me.json()).plan).toBe("FREE");

    // nobody can get into a Google-only account with a password
    for (const password of ["!", "", "any password at all", "correct horse battery staple"]) {
      const r = await login(makeRequest("POST", "/api/auth/login", { body: { email, password: password || "x" } }));
      expect(r.status).toBe(401);
    }
  });

  it("defaults to Hebrew and falls back to the e-mail name when Google sends no name", async () => {
    const email = uniqueEmail("noname");
    await googleSignUp({ email, name: undefined });
    const p = await db.userProfile.findFirstOrThrow({ where: { user: { email } } });
    expect(p.locale).toBe("he");
    expect(p.displayName).toBe(email.split("@")[0]);
  });

  it("lands on a safe ?next= and never on an external or protocol-relative one", async () => {
    for (const evil of ["//evil.example", "https://evil.example/x", "/\\evil.example", "javascript:alert(1)", "/\t/evil.example"]) {
      const s = await begin(`/api/auth/google/start?next=${encodeURIComponent(evil)}`);
      const res = await callback(s, fakeGoogle(s, {}).code);
      expect(res.status).toBe(303);
      const target = where(res);
      expect(target.origin).toBe("http://localhost:3000");
      expect(target.pathname + target.search).toBe("/dashboard");
    }
    const s = await begin("/api/auth/google/start?next=%2Fgames");
    expect(where(await callback(s, fakeGoogle(s, {}).code)).pathname).toBe("/games");
  });
});

describe("Google sign-in: returning user", () => {
  it("is recognised by the stable sub, even when the e-mail changed at Google, and no second account appears", async () => {
    const sub = newSub();
    const first = await googleSignUp({ sub, email: uniqueEmail("ret") });
    const userId = (await db.authIdentity.findUniqueOrThrow({ where: { provider_subject: { provider: "google", subject: sub } } })).userId;
    const before = await db.user.count();
    const again = await googleSignUp({ sub, email: uniqueEmail("changed") });
    expect(again.res.status).toBe(303);
    expect(sessionSetCookie(again.res)).toBeTruthy();
    expect(sessionCookieOf(again.res)).not.toBe(sessionCookieOf(first.res)); // a fresh session token each time
    expect(await db.user.count()).toBe(before);
    const me = await allowance(makeRequest("GET", "/api/allowance", { cookie: sessionCookieOf(again.res) }));
    expect(me.status).toBe(200);
    expect(await db.session.count({ where: { userId } })).toBe(2);
  });
});

describe("Google sign-in: existing e-mail is never taken over", () => {
  it("refuses, creates no session and no identity, and tells the user to sign in with the password and link Google", async () => {
    const owner = await createTestUser();
    const sub = newSub();
    const { res } = await googleSignUp({ email: owner.email, sub });
    expect(res.status).toBe(303);
    expect(sessionSetCookie(res)).toBeUndefined();
    expect(where(res).pathname + where(res).search).toBe("/login?error=google_email_exists");
    expect(await db.authIdentity.count({ where: { subject: sub } })).toBe(0);
    expect(await db.session.count({ where: { userId: owner.id } })).toBe(1); // only the one from registration
  });

  it("after signing in with the password the owner links Google from the account page, and Google then signs in to THAT account", async () => {
    const owner = await createTestUser();
    const sub = newSub();
    const linkStart = await begin("/api/auth/google/start?intent=link", owner.cookie);
    expect(linkStart.location.searchParams.get("prompt")).toBe("select_account");
    const res = await callback(linkStart, fakeGoogle(linkStart, { sub, email: owner.email }).code, { extraCookie: owner.cookie });
    expect(where(res).pathname + where(res).search).toBe("/account?google=linked");
    expect(sessionSetCookie(res)).toBeUndefined(); // linking never swaps the session
    expect((await db.authIdentity.findUniqueOrThrow({ where: { provider_subject: { provider: "google", subject: sub } } })).userId).toBe(owner.id);

    const { res: signIn } = await googleSignUp({ sub, email: owner.email });
    const me = await allowance(makeRequest("GET", "/api/allowance", { cookie: sessionCookieOf(signIn) }));
    expect(me.status).toBe(200);
    expect(await db.session.count({ where: { userId: owner.id } })).toBe(2);
  });

  it("a Google account that belongs to someone else cannot be linked; a second Google account cannot be added", async () => {
    const a = await createTestUser();
    const b = await createTestUser();
    const sub = newSub();
    const l1 = await begin("/api/auth/google/start?intent=link", a.cookie);
    await callback(l1, fakeGoogle(l1, { sub }).code, { extraCookie: a.cookie });
    const l2 = await begin("/api/auth/google/start?intent=link", b.cookie);
    const taken = await callback(l2, fakeGoogle(l2, { sub }).code, { extraCookie: b.cookie });
    expect(where(taken).search).toBe("?google=in_use");
    const l3 = await begin("/api/auth/google/start?intent=link", a.cookie);
    const second = await callback(l3, fakeGoogle(l3, { sub: newSub() }).code, { extraCookie: a.cookie });
    expect(where(second).search).toBe("?google=other_google_linked");
    expect(await db.authIdentity.count({ where: { userId: a.id } })).toBe(1);
    expect(await db.authIdentity.count({ where: { userId: b.id } })).toBe(0);
  });

  it("a link flow started by one user cannot be completed in another user's (or no) session", async () => {
    const a = await createTestUser();
    const b = await createTestUser();
    const s = await begin("/api/auth/google/start?intent=link", a.cookie);
    const g = fakeGoogle(s, { sub: newSub() });
    const res = await callback(s, g.code, { extraCookie: b.cookie });
    expect(where(res).search).toBe("?google=failed");
    expect(await db.authIdentity.count({ where: { userId: { in: [a.id, b.id] } } })).toBe(0);
    const s2 = await begin("/api/auth/google/start?intent=link", a.cookie);
    expect(where(await callback(s2, fakeGoogle(s2, { sub: newSub() }).code)).search).toBe("?google=failed");
  });
});

describe("Google sign-in: refusals", () => {
  const expectRefused = (res: Response, key: string) => {
    expect(res.status).toBe(303);
    expect(sessionSetCookie(res)).toBeUndefined();
    expect(where(res).pathname).toBe("/login");
    expect(where(res).searchParams.get("error")).toBe(`google_${key}`);
    expect(res.headers.getSetCookie().find((c) => c.startsWith("levelup_gauth="))).toMatch(/Max-Age=0/i);
  };

  it("refuses an unverified e-mail (false, missing or the string 'true') and creates nothing", async () => {
    for (const email_verified of [false, undefined, "true"]) {
      const email = uniqueEmail("unv");
      const { res } = await googleSignUp({ email, email_verified });
      expectRefused(res, "unverified");
      expect(await db.user.count({ where: { email } })).toBe(0);
    }
  });

  it("refuses a forged or missing state: wrong state parameter, tampered cookie, no cookie, cookie from another secret", async () => {
    const s = await begin();
    const g = fakeGoogle(s, {});
    expectRefused(await callback(s, g.code, { state: "attacker-chosen-state" }), "failed");
    expect(g.calls).toHaveLength(0); // we never even called Google
    const tampered = s.stateCookie.replace(/\.([^.]+)$/, (_m, mac: string) => `.${mac.slice(0, -2)}${mac.endsWith("A") ? "B" : "A"}`);
    expectRefused(await callback(s, g.code, { cookie: tampered }), "failed");
    expectRefused(await callback(s, g.code, { cookie: "" }), "failed");
    expectRefused(await callback(s, g.code, { cookie: "levelup_gauth=garbage" }), "failed");
    // login CSRF: a state cookie sealed by someone who does not hold our client secret
    const { sealFlowState, newFlowState } = await import("@/server/auth/google/protocol");
    const mine = newFlowState({ next: "/dashboard", intent: "login" });
    expectRefused(await callback(s, g.code, { cookie: `levelup_gauth=${sealFlowState(mine, "not-the-secret")}`, state: mine.s }), "failed");
    expect(g.calls).toHaveLength(0);
  });

  it("refuses a replayed callback: the code is single-use at Google, so the second attempt fails and no new session appears", async () => {
    const s = await begin();
    const g = fakeGoogle(s, { email: uniqueEmail("replay") });
    const first = await callback(s, g.code);
    expect(sessionSetCookie(first)).toBeTruthy();
    const replay = await callback(s, g.code);
    expectRefused(replay, "failed");
    expect(JSON.stringify([...replay.headers])).not.toMatch(/leaky|invalid_grant|ECONN/);
  });

  it("refuses an expired state (ten minutes)", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const s = await begin();
    const g = fakeGoogle(s, {});
    vi.setSystemTime(Date.now() + 10 * 60_000 + 5_000);
    expectRefused(await callback(s, g.code), "failed");
    expect(g.calls).toHaveLength(0);
  });

  it("refuses a wrong nonce, audience, issuer or an expired token, and never leaks why", async () => {
    for (const [over, opts] of [[{ nonce: "other" }, {}], [{}, { aud: "another-client" }], [{ iss: "https://evil.example" }, {}], [{ exp: Math.floor(Date.now() / 1000) - 3600 }, {}]] as const) {
      const s = await begin();
      const res = await callback(s, fakeGoogle(s, { ...over }, opts).code);
      expectRefused(res, "failed");
      expect(res.headers.get("location")).not.toMatch(/nonce|aud|iss|exp/i);
    }
  });

  it("an error from Google (user pressed Cancel) or a missing code goes back to login without calling Google", async () => {
    const s = await begin();
    const g = fakeGoogle(s, {});
    expectRefused(await callback(s, "", { query: `error=access_denied&state=${s.state}` }), "cancelled");
    const s2 = await begin();
    expectRefused(await callback(s2, "", { query: `error=server_error&state=${s2.state}` }), "failed");
    const s3 = await begin();
    expectRefused(await callback(s3, "", { query: `state=${s3.state}` }), "failed");
    expect(g.calls).toHaveLength(0);
  });

  it("a Google outage (fetch throws) is a generic failure, not a 500", async () => {
    const s = await begin();
    setGoogleFetchForTests(async () => {
      throw new Error("connect ECONNREFUSED 142.250.0.1:443");
    });
    const res = await callback(s, "whatever");
    expectRefused(res, "failed");
  });
});

describe("Google sign-in: connected methods and deleting a Google-only account", () => {
  it("unlinking works for a password account and is refused (409) for a Google-only account, which keeps working", async () => {
    const pw = await createTestUser();
    const sub = newSub();
    const l = await begin("/api/auth/google/start?intent=link", pw.cookie);
    await callback(l, fakeGoogle(l, { sub }).code, { extraCookie: pw.cookie });
    const ok = await unlinkRoute(makeRequest("DELETE", "/api/account/identities/google", { cookie: pw.cookie }));
    expect(ok.status).toBe(200);
    expect(await db.authIdentity.count({ where: { userId: pw.id } })).toBe(0);

    const { res } = await googleSignUp({ email: uniqueEmail("only") });
    const cookie = sessionCookieOf(res);
    const refused = await unlinkRoute(makeRequest("DELETE", "/api/account/identities/google", { cookie }));
    expect(refused.status).toBe(409);
    expect((await refused.json()).error.code).toBe("LAST_SIGN_IN_METHOD");
    expect((await allowance(makeRequest("GET", "/api/allowance", { cookie }))).status).toBe(200);
  });

  it("unlink needs a session and the same-origin check", async () => {
    expect((await unlinkRoute(makeRequest("DELETE", "/api/account/identities/google"))).status).toBe(401);
    const u = await createTestUser();
    expect((await unlinkRoute(makeRequest("DELETE", "/api/account/identities/google", { cookie: u.cookie, origin: "https://evil.example" }))).status).toBe(403);
  });

  async function reauth(cookie: string, claims: Record<string, unknown>) {
    const s = await begin("/api/auth/google/start?intent=reauth", cookie);
    expect(s.location.searchParams.get("prompt")).toBe("select_account");
    return callback(s, fakeGoogle(s, claims).code, { extraCookie: cookie });
  }
  const del = (cookie: string, body: unknown) => deleteAccountRoute(makeRequest("DELETE", "/api/account", { cookie, body }));

  it("a Google-only user deletes the account only after a fresh Google re-authentication with the SAME Google account", async () => {
    const sub = newSub();
    const email = uniqueEmail("bye");
    const { res } = await googleSignUp({ sub, email });
    const cookie = sessionCookieOf(res);
    const user = await db.user.findUniqueOrThrow({ where: { email } });

    // a password confirmation can never succeed, and without re-auth the Google confirmation is refused
    expect((await del(cookie, { password: "anything-at-all" })).status).toBe(403);
    const early = await del(cookie, { googleReauth: true });
    expect(early.status).toBe(403);
    expect((await early.json()).error.code).toBe("REAUTH_REQUIRED");

    // another Google account does not count
    const wrong = await reauth(cookie, { sub: newSub(), email: uniqueEmail("other") });
    expect(where(wrong).search).toBe("?google=wrong_account");
    expect((await del(cookie, { googleReauth: true })).status).toBe(403);

    // the same one does, for five minutes
    const good = await reauth(cookie, { sub, email });
    expect(where(good).search).toBe("?google=reauth");
    expect(sessionSetCookie(good)).toBeUndefined();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(Date.now() + 6 * 60_000);
    expect((await del(cookie, { googleReauth: true })).status).toBe(403); // stale
    vi.useRealTimers();

    const again = await reauth(cookie, { sub, email });
    expect(where(again).search).toBe("?google=reauth");
    const gone = await del(cookie, { googleReauth: true });
    expect(gone.status).toBe(200);
    expect(gone.headers.getSetCookie().find((c) => c.startsWith("levelup_session="))).toMatch(/Max-Age=0/i);
    expect(await db.user.count({ where: { id: user.id } })).toBe(0);
    expect(await db.authIdentity.count({ where: { userId: user.id } })).toBe(0);
    expect((await allowance(makeRequest("GET", "/api/allowance", { cookie }))).status).toBe(401);
  });

  it("re-authentication is session-bound: another session of the same user does not inherit it", async () => {
    const sub = newSub();
    const email = uniqueEmail("two");
    const { res } = await googleSignUp({ sub, email });
    const other = await googleSignUp({ sub, email });
    await reauth(sessionCookieOf(res), { sub, email });
    expect((await del(sessionCookieOf(other.res), { googleReauth: true })).status).toBe(403);
    expect((await del(sessionCookieOf(res), { googleReauth: true })).status).toBe(200);
  });

  it("a password account can never be deleted through Google re-authentication alone, only with its password", async () => {
    const pw = await createTestUser();
    const sub = newSub();
    const l = await begin("/api/auth/google/start?intent=link", pw.cookie);
    await callback(l, fakeGoogle(l, { sub }).code, { extraCookie: pw.cookie });
    await reauth(pw.cookie, { sub });
    const viaGoogle = await del(pw.cookie, { googleReauth: true });
    expect(viaGoogle.status).toBe(403);
    expect(await db.user.count({ where: { id: pw.id } })).toBe(1);
    expect((await del(pw.cookie, { password: "wrong password here" })).status).toBe(403);
    expect((await del(pw.cookie, { password: pw.password })).status).toBe(200);
  });

  it("re-authentication of an account without Google linked never marks the session", async () => {
    const pw = await createTestUser();
    const res = await reauth(pw.cookie, { sub: newSub() });
    expect(where(res).search).toBe("?google=wrong_account");
    const row = await db.session.findFirstOrThrow({ where: { userId: pw.id } });
    expect(row.reauthAt).toBeNull();
  });
});
