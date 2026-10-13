import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { getEnv } from "../../env";

/**
 * Sign in with Google — the protocol half: pure functions plus one injectable `fetch`, no database, no cookies.
 *
 * Flow: OAuth 2.0 Authorization Code with PKCE (S256) + OpenID Connect `nonce`, run entirely on the server.
 * ID-token trust model (the simplest correct option): the server exchanges the code at Google's token endpoint over TLS,
 * authenticating with the client secret AND the PKCE verifier, and reads the claims from THAT response. OpenID Connect
 * Core §3.1.3.7 lets a client skip checking the JWT signature when the token comes straight from the token endpoint over
 * TLS. We still check `iss`, `aud`, `exp`, `nonce`, `sub` and `email_verified` (below), so a response from anything other
 * than Google's endpoint with our credentials is never accepted. No JWKS fetching, no extra dependency.
 */

export const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
export const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"] as const;
export const GOOGLE_STATE_COOKIE = "levelup_gauth";
export const GOOGLE_STATE_TTL_MS = 10 * 60_000;
export const GOOGLE_CALLBACK_PATH = "/api/auth/google/callback";

export type GoogleIntent = "login" | "link" | "reauth";

export interface GoogleConfig {
  clientId: string;
  clientSecret: string;
  /** Always derived from APP_URL, never from request headers. */
  redirectUri: string;
}

/** `null` unless BOTH credentials are set: the feature does not exist then. */
export function googleConfig(): GoogleConfig | null {
  const env = getEnv();
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return null;
  return { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET, redirectUri: `${new URL(env.APP_URL).origin}${GOOGLE_CALLBACK_PATH}` };
}

export const isGoogleEnabled = (): boolean => googleConfig() !== null;

export class GoogleAuthError extends Error {
  constructor(public readonly code: "exchange_failed" | "bad_token" | "bad_claims" | "unverified_email", message: string) {
    super(message);
    this.name = "GoogleAuthError";
  }
}

// ───────────────────────────── PKCE + state ─────────────────────────────

const b64url = (buf: Buffer): string => buf.toString("base64url");

export const pkceChallenge = (verifier: string): string => b64url(createHash("sha256").update(verifier).digest());

export interface FlowState {
  /** Opaque `state` echoed back by Google. */
  s: string;
  /** PKCE code verifier (only ever inside the sealed, HttpOnly cookie). */
  v: string;
  /** OIDC nonce expected inside the ID token. */
  n: string;
  /** Same-site path to land on (already passed through safeNext). */
  next: string;
  intent: GoogleIntent;
  /** The signed-in user the flow was started for (link / reauth), so a callback cannot be replayed into another session. */
  uid?: string;
  /** Expiry, ms since epoch. */
  exp: number;
}

export function newFlowState(opts: { next: string; intent: GoogleIntent; uid?: string }, now = Date.now()): FlowState {
  return { s: b64url(randomBytes(24)), v: b64url(randomBytes(48)), n: b64url(randomBytes(24)), next: opts.next, intent: opts.intent, ...(opts.uid ? { uid: opts.uid } : {}), exp: now + GOOGLE_STATE_TTL_MS };
}

/** The state cookie is HMAC-sealed with a key derived from the client secret, so a planted cookie (cookie tossing, MITM on http) is rejected. */
const sealKey = (clientSecret: string): Buffer => createHmac("sha256", "levelup/google-flow-state/v1").update(clientSecret).digest();
const mac = (payload: string, clientSecret: string): string => b64url(createHmac("sha256", sealKey(clientSecret)).update(payload).digest());

export function sealFlowState(state: FlowState, clientSecret: string): string {
  const payload = b64url(Buffer.from(JSON.stringify(state), "utf8"));
  return `${payload}.${mac(payload, clientSecret)}`;
}

export const constantTimeEqual = (a: string, b: string): boolean => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

/** `null` for anything missing, tampered, malformed or expired. */
export function openFlowState(cookie: string | undefined, clientSecret: string, now = Date.now()): FlowState | null {
  if (!cookie || cookie.length > 2000) return null;
  const dot = cookie.indexOf(".");
  if (dot < 1) return null;
  const payload = cookie.slice(0, dot);
  if (!constantTimeEqual(cookie.slice(dot + 1), mac(payload, clientSecret))) return null;
  try {
    const st = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<FlowState>;
    const okStr = (v: unknown): v is string => typeof v === "string" && v.length > 0 && v.length < 600;
    if (!okStr(st.s) || !okStr(st.v) || !okStr(st.n) || !okStr(st.next) || typeof st.exp !== "number") return null;
    if (st.intent !== "login" && st.intent !== "link" && st.intent !== "reauth") return null;
    if (st.uid !== undefined && !okStr(st.uid)) return null;
    if (st.exp <= now) return null;
    return st as FlowState;
  } catch {
    return null;
  }
}

export function buildAuthUrl(cfg: GoogleConfig, st: FlowState): string {
  const u = new URL(GOOGLE_AUTH_ENDPOINT);
  u.searchParams.set("client_id", cfg.clientId);
  u.searchParams.set("redirect_uri", cfg.redirectUri);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", "openid email profile");
  u.searchParams.set("state", st.s);
  u.searchParams.set("nonce", st.n);
  u.searchParams.set("code_challenge", pkceChallenge(st.v));
  u.searchParams.set("code_challenge_method", "S256");
  // Link / re-authentication must be an explicit choice of account, never a silent reuse of whichever one is signed in.
  if (st.intent !== "login") u.searchParams.set("prompt", "select_account");
  return u.toString();
}

// ───────────────────────────── token exchange + claims ─────────────────────────────

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export function decodeJwtPayload(jwt: unknown): Record<string, unknown> {
  if (typeof jwt !== "string" || jwt.length > 8000) throw new GoogleAuthError("bad_token", "Missing or oversized id_token.");
  const parts = jwt.split(".");
  if (parts.length !== 3) throw new GoogleAuthError("bad_token", "id_token is not a JWT.");
  try {
    const payload = JSON.parse(Buffer.from(parts[1]!, "base64url").toString("utf8")) as unknown;
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("not an object");
    return payload as Record<string, unknown>;
  } catch {
    throw new GoogleAuthError("bad_token", "id_token payload is unreadable.");
  }
}

/** Server-to-server code exchange. Resolves to the raw `id_token` string; every failure is a GoogleAuthError. */
export async function exchangeCode(cfg: GoogleConfig, code: string, verifier: string, fetchImpl: FetchLike = fetch): Promise<string> {
  const body = new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: cfg.redirectUri, client_id: cfg.clientId, client_secret: cfg.clientSecret, code_verifier: verifier });
  let res: Response;
  try {
    res = await fetchImpl(GOOGLE_TOKEN_ENDPOINT, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" }, body: body.toString(), signal: AbortSignal.timeout(10_000), redirect: "error" });
  } catch {
    throw new GoogleAuthError("exchange_failed", "Could not reach the token endpoint.");
  }
  if (!res.ok) throw new GoogleAuthError("exchange_failed", `Token endpoint answered ${res.status}.`);
  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new GoogleAuthError("exchange_failed", "Token endpoint returned a non-JSON body.");
  }
  const idToken = (json as { id_token?: unknown } | null)?.id_token;
  if (typeof idToken !== "string") throw new GoogleAuthError("bad_token", "Token response has no id_token.");
  return idToken;
}

export interface GoogleProfile {
  /** Google's stable, never-reused account id. The ONLY key an identity is stored under. */
  sub: string;
  /** Lower-cased, verified. */
  email: string;
  name: string | null;
}

const CLOCK_SKEW_SEC = 120;

/** Throws GoogleAuthError unless the claims are exactly what we asked Google for. `now` is ms since epoch. */
export function validateClaims(claims: Record<string, unknown>, expect: { clientId: string; nonce: string; now?: number }): GoogleProfile {
  const nowSec = Math.floor((expect.now ?? Date.now()) / 1000);
  const { iss, aud, exp, iat, nonce, sub, email, email_verified: verified, name } = claims;
  if (typeof iss !== "string" || !(GOOGLE_ISSUERS as readonly string[]).includes(iss)) throw new GoogleAuthError("bad_claims", "Wrong issuer.");
  // `aud` is a string for Google ID tokens; an array is accepted only when it is exactly our client id.
  const audOk = typeof aud === "string" ? aud === expect.clientId : Array.isArray(aud) && aud.length === 1 && aud[0] === expect.clientId;
  if (!audOk) throw new GoogleAuthError("bad_claims", "Wrong audience.");
  if (typeof exp !== "number" || !Number.isFinite(exp) || exp + CLOCK_SKEW_SEC <= nowSec) throw new GoogleAuthError("bad_claims", "Token expired.");
  if (iat !== undefined && (typeof iat !== "number" || iat - CLOCK_SKEW_SEC > nowSec)) throw new GoogleAuthError("bad_claims", "Token issued in the future.");
  if (typeof nonce !== "string" || !constantTimeEqual(nonce, expect.nonce)) throw new GoogleAuthError("bad_claims", "Nonce mismatch.");
  if (typeof sub !== "string" || sub.length === 0 || sub.length > 255) throw new GoogleAuthError("bad_claims", "Missing subject.");
  if (typeof email !== "string" || email.length > 254 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new GoogleAuthError("bad_claims", "Missing email.");
  if (verified !== true) throw new GoogleAuthError("unverified_email", "Google has not verified this email address.");
  return { sub, email: email.trim().toLowerCase(), name: typeof name === "string" && name.trim() ? name.trim().slice(0, 60) : null };
}
