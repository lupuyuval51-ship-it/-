import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, SESSION_COOKIE } from "@/config/limits";
import { safeNext } from "@/lib/safe-redirect";
import { getEnv, secureCookies } from "../../env";
import { sha256Hex } from "../../security/tokens";
import { createSession, getUserBySessionToken, readCookie, sessionCookie } from "../session";
import { linkedGoogleSubject, linkGoogleIdentity, markSessionReauthed, resolveGoogleLogin } from "./identity";
import {
  GOOGLE_STATE_COOKIE,
  GOOGLE_STATE_TTL_MS,
  GoogleAuthError,
  buildAuthUrl,
  constantTimeEqual,
  decodeJwtPayload,
  exchangeCode,
  googleConfig,
  newFlowState,
  openFlowState,
  sealFlowState,
  validateClaims,
  type FetchLike,
  type GoogleIntent,
} from "./protocol";

/**
 * The two HTTP halves of the flow, as plain functions so integration tests can drive them with a fake Google.
 * Failures NEVER explain themselves to the browser: the user lands on /login (or /account) with a short, fixed error key.
 */

let fetchOverride: FetchLike | null = null;
/** Test seam: replace the call to Google's token endpoint. Pass null to restore the real `fetch`. */
export function setGoogleFetchForTests(fn: FetchLike | null): void {
  fetchOverride = fn;
}

const base = (): string => new URL(getEnv().APP_URL).origin;
const to = (path: string, status = 303): NextResponse => {
  const res = NextResponse.redirect(new URL(path, base()), status);
  res.headers.set("Cache-Control", "no-store");
  return res;
};
const clearState = (res: NextResponse): NextResponse => {
  res.cookies.set({ name: GOOGLE_STATE_COOKIE, value: "", httpOnly: true, sameSite: "lax", secure: secureCookies(), path: "/api/auth/google", maxAge: 0 });
  return res;
};

export type LoginErrorKey = "failed" | "cancelled" | "unverified" | "email_exists" | "rate_limited";
export const LOGIN_ERROR_KEYS: readonly LoginErrorKey[] = ["failed", "cancelled", "unverified", "email_exists", "rate_limited"];

const loginError = (key: LoginErrorKey, next?: string): NextResponse => clearState(to(`/login?error=google_${key}${next && next !== "/dashboard" ? `&next=${encodeURIComponent(next)}` : ""}`));
const accountResult = (key: string): NextResponse => clearState(to(`/account?google=${key}`));

/** Used by the routes when something unexpected blew up: a browser must never be shown an error body here. */
export const unexpectedFailureRedirect = (): NextResponse => loginError("failed");

export function rateLimitedRedirect(intent: string | null): NextResponse {
  return intent === "link" || intent === "reauth" ? accountResult("failed") : loginError("rate_limited");
}

/** GET /api/auth/google/start */
export async function startGoogle(req: NextRequest): Promise<NextResponse> {
  const cfg = googleConfig();
  if (!cfg) return new NextResponse(null, { status: 404 });
  const url = new URL(req.url);
  const rawIntent = url.searchParams.get("intent");
  const intent: GoogleIntent = rawIntent === "link" || rawIntent === "reauth" ? rawIntent : "login";
  let uid: string | undefined;
  if (intent !== "login") {
    const user = await getUserBySessionToken(readCookie(req.headers.get("cookie"), SESSION_COOKIE));
    if (!user) return to("/login?next=" + encodeURIComponent("/account"));
    uid = user.id;
  }
  const next = intent === "login" ? safeNext(url.searchParams.get("next")) : "/account";
  const st = newFlowState({ next, intent, uid });
  const res = NextResponse.redirect(buildAuthUrl(cfg, st), 303);
  res.headers.set("Cache-Control", "no-store");
  res.cookies.set({ name: GOOGLE_STATE_COOKIE, value: sealFlowState(st, cfg.clientSecret), httpOnly: true, sameSite: "lax", secure: secureCookies(), path: "/api/auth/google", maxAge: Math.floor(GOOGLE_STATE_TTL_MS / 1000) });
  return res;
}

/** GET /api/auth/google/callback */
export async function finishGoogle(req: NextRequest): Promise<NextResponse> {
  const cfg = googleConfig();
  if (!cfg) return new NextResponse(null, { status: 404 });
  const st = openFlowState(readCookie(req.headers.get("cookie"), GOOGLE_STATE_COOKIE), cfg.clientSecret);
  if (!st) return loginError("failed"); // missing, forged, replayed (cookie is single-use) or expired
  const fail = (key: LoginErrorKey): NextResponse => (st.intent === "login" ? loginError(key, st.next) : accountResult(key === "cancelled" ? "cancelled" : "failed"));

  const q = new URL(req.url).searchParams;
  const stateParam = q.get("state") ?? "";
  if (!constantTimeEqual(stateParam, st.s)) return fail("failed");
  if (q.get("error")) return fail(q.get("error") === "access_denied" ? "cancelled" : "failed");
  const code = q.get("code");
  if (!code || code.length > 2048) return fail("failed");

  let profile;
  try {
    const idToken = await exchangeCode(cfg, code, st.v, fetchOverride ?? fetch);
    profile = validateClaims(decodeJwtPayload(idToken), { clientId: cfg.clientId, nonce: st.n });
  } catch (err) {
    if (err instanceof GoogleAuthError) {
      console.warn(`[auth/google] refused: ${err.code}`); // fixed code only: never the token, the code or Google's body
      return fail(err.code === "unverified_email" ? "unverified" : "failed");
    }
    throw err;
  }

  const cookieHeader = req.headers.get("cookie");
  const sessionToken = readCookie(cookieHeader, SESSION_COOKIE);

  if (st.intent === "login") {
    const locale = readCookie(cookieHeader, LOCALE_COOKIE) === "en" ? "en" : "he";
    const result = await resolveGoogleLogin(profile, locale);
    if (result.kind === "email_exists") return fail("email_exists");
    const { token, expiresAt } = await createSession(result.userId, req.headers.get("user-agent")); // always a fresh token: no session fixation
    const res = to(st.next);
    res.cookies.set(sessionCookie(token, expiresAt));
    return clearState(res);
  }

  // link / reauth: the callback must arrive in the very session (user) that started the flow.
  const user = await getUserBySessionToken(sessionToken);
  if (!user || user.id !== st.uid) return accountResult("failed");

  if (st.intent === "link") {
    const r = await linkGoogleIdentity(user.id, profile);
    return accountResult(r === "linked" || r === "already_linked" ? "linked" : r);
  }

  const subject = await linkedGoogleSubject(user.id);
  if (!subject || subject !== profile.sub) return accountResult("wrong_account");
  if (!(await markSessionReauthed(sha256Hex(sessionToken!)))) return accountResult("failed");
  return accountResult("reauth");
}
