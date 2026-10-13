import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resetEnvForTests } from "@/server/env";
import {
  GOOGLE_TOKEN_ENDPOINT,
  GoogleAuthError,
  buildAuthUrl,
  decodeJwtPayload,
  exchangeCode,
  googleConfig,
  newFlowState,
  openFlowState,
  pkceChallenge,
  sealFlowState,
  validateClaims,
} from "@/server/auth/google/protocol";
import { hasUsablePassword, NO_PASSWORD_HASH, verifyPassword } from "@/server/security/password";

const CID = "1234567890-abc.apps.googleusercontent.com";
const SECRET = "GOCSPX-unit-test-secret-value";
const NOW = Date.UTC(2026, 9, 13, 15, 0, 0);
const cfg = { clientId: CID, clientSecret: SECRET, redirectUri: "https://levelup.example/api/auth/google/callback" };

const jwt = (payload: unknown) => `${Buffer.from('{"alg":"RS256"}').toString("base64url")}.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.sig`;
const goodClaims = (over: Record<string, unknown> = {}) => ({ iss: "https://accounts.google.com", aud: CID, exp: NOW / 1000 + 3000, iat: NOW / 1000, nonce: "n0nce", sub: "110169484474386276334", email: "Dana@Example.com", email_verified: true, name: "Dana L", ...over });
const expectCode = (fn: () => unknown, code: string) => {
  try {
    fn();
  } catch (e) {
    expect(e).toBeInstanceOf(GoogleAuthError);
    expect((e as GoogleAuthError).code).toBe(code);
    return;
  }
  throw new Error("expected a GoogleAuthError");
};

describe("PKCE and the authorisation URL", () => {
  it("S256 challenge is base64url(sha256(verifier)) (RFC 7636 appendix B vector)", () => {
    expect(pkceChallenge("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk")).toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
    expect(pkceChallenge("abc")).toBe(createHash("sha256").update("abc").digest("base64url"));
  });

  it("asks for openid email profile with state, nonce and an S256 challenge, and a fixed redirect uri", () => {
    const st = newFlowState({ next: "/dashboard", intent: "login" }, NOW);
    const u = new URL(buildAuthUrl(cfg, st));
    expect(u.origin + u.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    const p = u.searchParams;
    expect(p.get("client_id")).toBe(CID);
    expect(p.get("redirect_uri")).toBe(cfg.redirectUri);
    expect(p.get("response_type")).toBe("code");
    expect(p.get("scope")).toBe("openid email profile");
    expect(p.get("state")).toBe(st.s);
    expect(p.get("nonce")).toBe(st.n);
    expect(p.get("code_challenge")).toBe(pkceChallenge(st.v));
    expect(p.get("code_challenge_method")).toBe("S256");
    expect(p.get("prompt")).toBeNull(); // plain sign-in may reuse the signed-in Google account
    expect(new URL(buildAuthUrl(cfg, newFlowState({ next: "/account", intent: "link", uid: "u1" }, NOW))).searchParams.get("prompt")).toBe("select_account");
  });

  it("never reuses state, verifier or nonce, and they are long and unguessable", () => {
    const a = newFlowState({ next: "/", intent: "login" }, NOW);
    const b = newFlowState({ next: "/", intent: "login" }, NOW);
    for (const k of ["s", "v", "n"] as const) {
      expect(a[k]).not.toBe(b[k]);
      expect(a[k].length).toBeGreaterThanOrEqual(32);
    }
    expect(a.v.length).toBeGreaterThanOrEqual(43); // RFC 7636 minimum
  });
});

describe("sealed state cookie", () => {
  const st = newFlowState({ next: "/games", intent: "login" }, NOW);

  it("round-trips, and expires after ten minutes", () => {
    const sealed = sealFlowState(st, SECRET);
    expect(openFlowState(sealed, SECRET, NOW + 1000)).toEqual(st);
    expect(openFlowState(sealed, SECRET, NOW + 10 * 60_000 + 1)).toBeNull();
  });

  it("rejects tampering, a different secret, truncation and garbage", () => {
    const sealed = sealFlowState(st, SECRET);
    const [payload, mac] = sealed.split(".") as [string, string];
    const forged = Buffer.from(JSON.stringify({ ...st, next: "//evil.example" })).toString("base64url");
    expect(openFlowState(`${forged}.${mac}`, SECRET, NOW)).toBeNull();
    expect(openFlowState(sealed, SECRET + "x", NOW)).toBeNull();
    expect(openFlowState(payload, SECRET, NOW)).toBeNull();
    expect(openFlowState(`${payload}.`, SECRET, NOW)).toBeNull();
    for (const junk of [undefined, "", ".", "a.b", "x".repeat(3000)]) expect(openFlowState(junk, SECRET, NOW)).toBeNull();
  });

  it("an attacker who knows the format but not the secret cannot mint a state of their own", () => {
    const own = sealFlowState(newFlowState({ next: "/", intent: "login" }, NOW), "attacker-guess-of-the-secret");
    expect(openFlowState(own, SECRET, NOW)).toBeNull();
  });
});

describe("ID token claims", () => {
  const expectation = { clientId: CID, nonce: "n0nce", now: NOW };

  it("accepts a good token and normalises the email", () => {
    expect(validateClaims(goodClaims(), expectation)).toEqual({ sub: "110169484474386276334", email: "dana@example.com", name: "Dana L" });
    expect(validateClaims(goodClaims({ iss: "accounts.google.com", name: undefined }), expectation).name).toBeNull();
  });

  it("requires email_verified to be exactly true", () => {
    for (const v of [false, "true", 1, undefined, null]) expectCode(() => validateClaims(goodClaims({ email_verified: v }), expectation), "unverified_email");
  });

  it("checks issuer, audience, expiry, nonce, subject and email", () => {
    expectCode(() => validateClaims(goodClaims({ iss: "https://evil.example" }), expectation), "bad_claims");
    expectCode(() => validateClaims(goodClaims({ aud: "someone-else" }), expectation), "bad_claims");
    expectCode(() => validateClaims(goodClaims({ aud: [CID, "other"] }), expectation), "bad_claims");
    expectCode(() => validateClaims(goodClaims({ exp: NOW / 1000 - 3600 }), expectation), "bad_claims");
    expectCode(() => validateClaims(goodClaims({ exp: "soon" }), expectation), "bad_claims");
    expectCode(() => validateClaims(goodClaims({ iat: NOW / 1000 + 3600 }), expectation), "bad_claims");
    expectCode(() => validateClaims(goodClaims({ nonce: "other" }), expectation), "bad_claims");
    expectCode(() => validateClaims(goodClaims({ nonce: undefined }), expectation), "bad_claims");
    expectCode(() => validateClaims(goodClaims({ sub: "" }), expectation), "bad_claims");
    expectCode(() => validateClaims(goodClaims({ sub: 42 }), expectation), "bad_claims");
    expectCode(() => validateClaims(goodClaims({ email: "not-an-email" }), expectation), "bad_claims");
  });

  it("decodes only well-formed JWT payloads", () => {
    expect(decodeJwtPayload(jwt({ a: 1 }))).toEqual({ a: 1 });
    for (const bad of [undefined, 5, "a.b", "a.b.c.d", jwt([1]), `x.${Buffer.from("not json").toString("base64url")}.y`, "x".repeat(9000)]) expectCode(() => decodeJwtPayload(bad), "bad_token");
  });
});

describe("code exchange (fake Google)", () => {
  it("posts the code, the PKCE verifier and the client credentials to Google's token endpoint, and returns the id_token", async () => {
    let seen: { url: string; body: URLSearchParams } | null = null;
    const idToken = await exchangeCode(cfg, "the-code", "the-verifier", async (url, init) => {
      seen = { url, body: new URLSearchParams(String(init?.body)) };
      return new Response(JSON.stringify({ id_token: "a.b.c", access_token: "ignored" }), { status: 200 });
    });
    expect(idToken).toBe("a.b.c");
    expect(seen!.url).toBe(GOOGLE_TOKEN_ENDPOINT);
    expect(Object.fromEntries(seen!.body)).toMatchObject({ grant_type: "authorization_code", code: "the-code", code_verifier: "the-verifier", client_id: CID, client_secret: SECRET, redirect_uri: cfg.redirectUri });
  });

  it("turns every failure into a GoogleAuthError that carries no upstream detail", async () => {
    const run = (f: () => Promise<Response>) => exchangeCode(cfg, "c", "v", f).catch((e: unknown) => e);
    for (const e of [await run(async () => new Response("secret upstream detail", { status: 400 })), await run(async () => { throw new Error("ECONNRESET to 1.2.3.4"); }), await run(async () => new Response("<html>", { status: 200 })), await run(async () => new Response("{}", { status: 200 }))]) {
      expect(e).toBeInstanceOf(GoogleAuthError);
      expect((e as Error).message).not.toMatch(/secret upstream|1\.2\.3\.4|<html>/);
    }
  });
});

describe("configuration", () => {
  const saved = { id: process.env.GOOGLE_CLIENT_ID, secret: process.env.GOOGLE_CLIENT_SECRET, url: process.env.APP_URL };
  beforeEach(() => resetEnvForTests());
  afterEach(() => {
    for (const [k, v] of [["GOOGLE_CLIENT_ID", saved.id], ["GOOGLE_CLIENT_SECRET", saved.secret], ["APP_URL", saved.url]] as const) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
    resetEnvForTests();
  });

  it("is off unless BOTH credentials are set, and treats empty strings as unset", () => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    expect(googleConfig()).toBeNull();
    process.env.GOOGLE_CLIENT_ID = CID;
    resetEnvForTests();
    expect(googleConfig()).toBeNull();
    process.env.GOOGLE_CLIENT_SECRET = "";
    resetEnvForTests();
    expect(googleConfig()).toBeNull();
  });

  it("derives the redirect uri from APP_URL only", () => {
    process.env.GOOGLE_CLIENT_ID = CID;
    process.env.GOOGLE_CLIENT_SECRET = SECRET;
    process.env.APP_URL = "https://levelup.example/some/path/";
    resetEnvForTests();
    expect(googleConfig()?.redirectUri).toBe("https://levelup.example/api/auth/google/callback");
  });
});

describe("accounts without a password", () => {
  it("the marker can never be verified as a password and is not a usable hash", async () => {
    expect(hasUsablePassword(NO_PASSWORD_HASH)).toBe(false);
    expect(hasUsablePassword("scrypt$32768$8$1$c2FsdA==$a2V5")).toBe(true);
    for (const guess of ["", "!", "password", NO_PASSWORD_HASH]) expect(await verifyPassword(guess, NO_PASSWORD_HASH)).toBe(false);
  });
});
