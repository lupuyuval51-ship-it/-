/**
 * Server-side check of Google Play purchases for the Android app: the Supabase Edge Function `verify-purchase` (project
 * `levelup-app`, next to the accounts).
 *
 * The phone sends the purchase tokens Google Play gave it. This function asks Google's own server (the Play Developer API,
 * with a service account whose key lives only in this function's secrets) whether each token is a paid purchase of one of
 * OUR products, never believing what the phone says about it: the plan comes from the product Google reports, the end date
 * from Google's answer. A token belongs to the first account that proves it (`claim_play_purchase`), so one purchase cannot
 * be handed to a second account. The verdicts are stored per account (`public.play_purchases`, owner-read-only) and returned.
 *
 * Pure and dependency-free (WebCrypto + fetch); everything outside is injected (`VerifyDeps`), so it is unit-tested in Node.
 * Bundled for Deno by `scripts/build-verify-function.mjs`.
 */
import { PAID_PLAN_IDS, type PaidPlanId } from "../../config/plans";
import { PLAY_LIFETIME_PRODUCTS, PLAY_PRODUCTS } from "../../lib/offline/billing-state";

export const PLAY_PACKAGE_NAME = "app.levelup.learn3d";
/** Origins of the Capacitor WebView (and a local preview); anything else is not the app. */
export const ALLOWED_ORIGINS = ["https://localhost", "capacitor://localhost", "http://localhost"] as const;
/** The auth and database calls answer in well under a second; Google's two calls a little slower. */
export const SERVICE_TIMEOUT_MS = 8_000;
export const GOOGLE_TIMEOUT_MS = 10_000;
/** A phone owns one or two purchases; more than this in one request is not the app. */
export const MAX_TOKENS = 6;
const SCOPE = "https://www.googleapis.com/auth/androidpublisher";
const API = "https://androidpublisher.googleapis.com/androidpublisher/v3/applications";
const TOKEN_SHAPE = /^[A-Za-z0-9._~-]{16,1024}$/;

export type Kind = "SUBSCRIPTION" | "LIFETIME";
export type TokenState = "ENTITLED" | "NOT_ENTITLED" | "NOT_FOUND" | "CLAIMED";
export type NotEntitledReason = "EXPIRED" | "REFUNDED" | "PENDING" | "ON_HOLD" | "PAUSED" | "UNKNOWN_PRODUCT" | "UNKNOWN_STATE";

/** What Google says about one purchase token. */
export type GoogleVerdict =
  | { state: "ENTITLED"; plan: PaidPlanId; productId: string; kind: Kind; expiresAt: number | null }
  | { state: "NOT_ENTITLED"; reason: NotEntitledReason; plan: PaidPlanId | null; productId: string | null; kind: Kind | null; expiresAt: number | null }
  | { state: "NOT_FOUND" };

export interface TokenResult { state: TokenState; plan?: PaidPlanId; kind?: Kind; expiresAt?: number | null; reason?: NotEntitledReason }

export interface VerifyResponse {
  /** The best plan among the entitled purchases that were sent (FREE when none). */
  plan: "FREE" | PaidPlanId;
  /** End of the paid period in epoch ms; null for Free and for a purchase made once. */
  expiresAt: number | null;
  /**
   * True when the answer covers every token: no token was held by another account. Only then may the phone take the plan from
   * this answer (a purchase is Free only when Google itself says so for all of them).
   */
  definitive: boolean;
  verifiedAt: number;
  results: TokenResult[];
}

export interface Claim {
  tokenHash: string;
  productId: string;
  plan: PaidPlanId | null;
  kind: Kind | null;
  entitled: boolean;
  reason: NotEntitledReason | null;
  expiresAt: number | null;
  verifiedAt: number;
}

export interface VerifyDeps {
  env: (name: string) => string | undefined;
  /** The caller's user id in this project, or null when the token is not a valid sign-in. Throws when Auth cannot answer. */
  verifyUser: (authorization: string) => Promise<string | null>;
  /** Stores the verdict for the user unless another account already holds the token. Returns whether the user holds it. */
  claim: (userId: string, claim: Claim) => Promise<boolean>;
  fetch: typeof fetch;
  now: () => number;
}

/** Google could not be asked or refused to answer (not a verdict about the purchase): the phone keeps what it has. */
export class GoogleUnavailable extends Error {
  constructor(public readonly code: "NOT_CONFIGURED" | "UNAVAILABLE", message: string) {
    super(message);
    this.name = "GoogleUnavailable";
  }
}

const rankOf = (p: "FREE" | PaidPlanId): number => (p === "PRO" ? 2 : p === "PLUS" ? 1 : 0);

// ---- Google's side -------------------------------------------------------------------------------------------------

export interface ServiceAccount { clientEmail: string; privateKey: string; tokenUri: string }

/** The service account key as the secret holds it (the JSON file Google gives); null when it is missing or not a key. */
export function parseServiceAccount(raw: string | undefined): ServiceAccount | null {
  if (!raw?.trim()) return null;
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    const clientEmail = o.client_email, privateKey = o.private_key;
    if (typeof clientEmail !== "string" || typeof privateKey !== "string" || !privateKey.includes("PRIVATE KEY")) return null;
    const tokenUri = typeof o.token_uri === "string" && o.token_uri.startsWith("https://") ? o.token_uri : "https://oauth2.googleapis.com/token";
    return { clientEmail, privateKey, tokenUri };
  } catch {
    return null;
  }
}

const b64url = (bytes: ArrayBuffer | Uint8Array): string => {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (const b of u8) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const b64urlText = (text: string): string => b64url(new TextEncoder().encode(text));

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const body = pem.replace(/-----(BEGIN|END) PRIVATE KEY-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
}

/** The signed request for an access token (RFC 7523): the service account signs a short-lived claim with its private key. */
export async function signAssertion(sa: ServiceAccount, nowMs: number): Promise<string> {
  const iat = Math.floor(nowMs / 1000);
  const head = b64urlText(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64urlText(JSON.stringify({ iss: sa.clientEmail, scope: SCOPE, aud: sa.tokenUri, iat, exp: iat + 3000 }));
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", await importPrivateKey(sa.privateKey), new TextEncoder().encode(`${head}.${claim}`));
  return `${head}.${claim}.${b64url(signature)}`;
}

export interface GoogleClient {
  /** The answer for a subscription token (`purchases.subscriptionsv2.get`) or a one-time token (`purchases.products.get`). */
  get(path: string): Promise<{ status: number; body: unknown }>;
}

/** An authorised client for the Play Developer API; the access token is kept until shortly before it ends. */
export function createGoogleClient(sa: ServiceAccount, fetchImpl: typeof fetch, now: () => number): GoogleClient {
  let cached: { token: string; until: number } | null = null;
  const accessToken = async (): Promise<string> => {
    const t = now();
    if (cached && cached.until > t + 60_000) return cached.token;
    let res: Response;
    try {
      res = await fetchImpl(sa.tokenUri, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: await signAssertion(sa, t) }),
        signal: AbortSignal.timeout(GOOGLE_TIMEOUT_MS),
      });
    } catch {
      throw new GoogleUnavailable("UNAVAILABLE", "Google did not answer.");
    }
    // 400/401: Google refuses this service account (wrong key, disabled): a setting to fix, not a verdict about a purchase
    if (res.status === 400 || res.status === 401 || res.status === 403) throw new GoogleUnavailable("NOT_CONFIGURED", "Google refused the service account.");
    if (!res.ok) throw new GoogleUnavailable("UNAVAILABLE", `Google token endpoint: HTTP ${res.status}`);
    const o = (await res.json().catch(() => null)) as { access_token?: unknown; expires_in?: unknown } | null;
    if (!o || typeof o.access_token !== "string") throw new GoogleUnavailable("UNAVAILABLE", "Google gave no access token.");
    const seconds = typeof o.expires_in === "number" && o.expires_in > 0 ? o.expires_in : 3000;
    cached = { token: o.access_token, until: t + seconds * 1000 };
    return o.access_token;
  };
  return {
    async get(path) {
      const token = await accessToken();
      let res: Response;
      try {
        res = await fetchImpl(`${API}/${path}`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(GOOGLE_TIMEOUT_MS) });
      } catch {
        throw new GoogleUnavailable("UNAVAILABLE", "Google did not answer.");
      }
      // The API itself says the service account may not read this app's purchases (not linked in the Play Console, no permission).
      if (res.status === 401 || res.status === 403) {
        cached = null;
        throw new GoogleUnavailable("NOT_CONFIGURED", "The service account has no access to this app in the Play Console.");
      }
      if (res.status === 429 || res.status >= 500) throw new GoogleUnavailable("UNAVAILABLE", `Google: HTTP ${res.status}`);
      return { status: res.status, body: res.ok ? await res.json().catch(() => null) : null };
    },
  };
}

const SUB_PLAN = (productId: string): PaidPlanId | null => PAID_PLAN_IDS.find((p) => PLAY_PRODUCTS[p].productId === productId) ?? null;
const LIFETIME_PLAN = (productId: string): PaidPlanId | null => PAID_PLAN_IDS.find((p) => PLAY_LIFETIME_PRODUCTS[p] === productId) ?? null;

/**
 * Google's `SubscriptionPurchaseV2`. Paid while ACTIVE or IN_GRACE_PERIOD (Google is still collecting the payment), and
 * CANCELED means "will not renew", so it is paid until the end date. ON_HOLD, PAUSED, EXPIRED and PENDING are not.
 */
export function interpretSubscription(body: unknown, now: number): GoogleVerdict {
  const o = (body && typeof body === "object" ? body : {}) as { subscriptionState?: unknown; lineItems?: unknown };
  const items = Array.isArray(o.lineItems) ? (o.lineItems as { productId?: unknown; expiryTime?: unknown }[]) : [];
  // the best of our products among the line items (a purchase has one; stay safe if Google ever lists more)
  let best: { plan: PaidPlanId; productId: string; expiresAt: number } | null = null;
  for (const it of items) {
    const productId = typeof it?.productId === "string" ? it.productId : "";
    const plan = SUB_PLAN(productId);
    const expiresAt = typeof it?.expiryTime === "string" ? Date.parse(it.expiryTime) : NaN;
    if (!plan || !Number.isFinite(expiresAt)) continue;
    if (!best || rankOf(plan) > rankOf(best.plan) || (plan === best.plan && expiresAt > best.expiresAt)) best = { plan, productId, expiresAt };
  }
  if (!best) return { state: "NOT_ENTITLED", reason: "UNKNOWN_PRODUCT", plan: null, productId: null, kind: null, expiresAt: null };
  const base = { plan: best.plan, productId: best.productId, kind: "SUBSCRIPTION" as const, expiresAt: best.expiresAt };
  const state = o.subscriptionState;
  const paying = state === "SUBSCRIPTION_STATE_ACTIVE" || state === "SUBSCRIPTION_STATE_IN_GRACE_PERIOD" || state === "SUBSCRIPTION_STATE_CANCELED";
  if (paying && best.expiresAt > now) return { state: "ENTITLED", ...base };
  const reason: NotEntitledReason =
    state === "SUBSCRIPTION_STATE_PENDING" ? "PENDING" : state === "SUBSCRIPTION_STATE_ON_HOLD" ? "ON_HOLD" : state === "SUBSCRIPTION_STATE_PAUSED" ? "PAUSED"
      : state === "SUBSCRIPTION_STATE_EXPIRED" || paying ? "EXPIRED" : "UNKNOWN_STATE";
  return { state: "NOT_ENTITLED", reason, ...base };
}

/** Google's `ProductPurchase` (a one-time product): purchaseState 0 is paid, 1 canceled (a refund shows up like this), 2 pending. */
export function interpretProduct(body: unknown, productId: string): GoogleVerdict {
  const plan = LIFETIME_PLAN(productId);
  const o = (body && typeof body === "object" ? body : {}) as { purchaseState?: unknown };
  const base = { plan, productId, kind: "LIFETIME" as const, expiresAt: null };
  if (!plan) return { state: "NOT_ENTITLED", reason: "UNKNOWN_PRODUCT", plan: null, productId: null, kind: null, expiresAt: null };
  if (o.purchaseState === 0) return { state: "ENTITLED", ...base, plan };
  return { state: "NOT_ENTITLED", reason: o.purchaseState === 2 ? "PENDING" : o.purchaseState === 1 ? "REFUNDED" : "UNKNOWN_STATE", ...base };
}

/**
 * Asks Google about one token. The phone says which product it is only so we know which API to ask: the answer (and the plan)
 * is Google's. A token Google does not know (400, 404, 410: wrong app, forged, too old) is `NOT_FOUND`.
 */
export async function verifyWithGoogle(google: GoogleClient, packageName: string, productId: string, token: string, now: number): Promise<GoogleVerdict> {
  const pkg = encodeURIComponent(packageName), t = encodeURIComponent(token);
  if (SUB_PLAN(productId)) {
    const { status, body } = await google.get(`${pkg}/purchases/subscriptionsv2/tokens/${t}`);
    if (status === 400 || status === 404 || status === 410) return { state: "NOT_FOUND" };
    if (status !== 200) throw new GoogleUnavailable("UNAVAILABLE", `Google: HTTP ${status}`);
    return interpretSubscription(body, now);
  }
  if (LIFETIME_PLAN(productId)) {
    const { status, body } = await google.get(`${pkg}/purchases/products/${encodeURIComponent(productId)}/tokens/${t}`);
    if (status === 400 || status === 404 || status === 410) return { state: "NOT_FOUND" };
    if (status !== 200) throw new GoogleUnavailable("UNAVAILABLE", `Google: HTTP ${status}`);
    return interpretProduct(body, productId);
  }
  return { state: "NOT_FOUND" };
}

// ---- the request ---------------------------------------------------------------------------------------------------

function cors(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  return {
    "Access-Control-Allow-Origin": (ALLOWED_ORIGINS as readonly string[]).includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}
const json = (req: Request, status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), { status, headers: { ...cors(req), "Content-Type": "application/json" } });
const fail = (req: Request, status: number, code: string, message: string): Response => json(req, status, { error: { code, message } });

export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** A secret's value, trimmed; a secret saved empty counts as not set. */
const setting = (env: VerifyDeps["env"], name: string): string | undefined => {
  const v = env(name)?.trim();
  return v ? v : undefined;
};

interface Sent { productId: string; token: string }

function parseBody(body: unknown): Sent[] | null {
  const list = (body as { purchases?: unknown } | null)?.purchases;
  if (!Array.isArray(list) || list.length === 0 || list.length > MAX_TOKENS) return null;
  const out: Sent[] = [];
  for (const p of list) {
    const o = (p ?? {}) as { productId?: unknown; purchaseToken?: unknown };
    if (typeof o.productId !== "string" || typeof o.purchaseToken !== "string" || !TOKEN_SHAPE.test(o.purchaseToken)) return null;
    if (!SUB_PLAN(o.productId) && !LIFETIME_PLAN(o.productId)) return null;
    if (!out.some((x) => x.token === o.purchaseToken)) out.push({ productId: o.productId, token: o.purchaseToken });
  }
  return out;
}

export async function handleVerify(req: Request, deps: VerifyDeps): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });
  if (req.method !== "POST") return fail(req, 405, "METHOD", "Use POST.");

  const authorization = req.headers.get("Authorization") ?? "";
  if (!/^Bearer \S+$/.test(authorization)) return fail(req, 401, "UNAUTHENTICATED", "Sign in first.");
  let userId: string | null;
  try {
    userId = await deps.verifyUser(authorization);
  } catch {
    return fail(req, 503, "UNAVAILABLE", "The account service did not answer. Try again later.");
  }
  if (!userId) return fail(req, 401, "UNAUTHENTICATED", "Sign in first.");

  let raw: unknown;
  try { raw = await req.json(); } catch { return fail(req, 400, "INVALID_REQUEST", "The request is not valid JSON."); }
  const sent = parseBody(raw);
  if (!sent) return fail(req, 400, "INVALID_REQUEST", `Send 1 to ${MAX_TOKENS} purchases of our products, each with its purchase token.`);

  const account = parseServiceAccount(setting(deps.env, "PLAY_SERVICE_ACCOUNT_JSON"));
  if (!account) return fail(req, 503, "NOT_CONFIGURED", "Purchase checking is not set up yet.");
  const google = createGoogleClient(account, deps.fetch, deps.now);
  const packageName = setting(deps.env, "PLAY_PACKAGE_NAME") ?? PLAY_PACKAGE_NAME;
  const now = deps.now();

  const results: TokenResult[] = [];
  try {
    // one after the other: a phone has one or two purchases, and Google's quota is not worth racing
    for (const s of sent) {
      const verdict = await verifyWithGoogle(google, packageName, s.productId, s.token, now);
      if (verdict.state === "NOT_FOUND") { results.push({ state: "NOT_FOUND" }); continue; }
      const entitled = verdict.state === "ENTITLED";
      const mine = await deps.claim(userId, {
        tokenHash: await sha256Hex(s.token), productId: verdict.productId ?? s.productId, plan: verdict.plan, kind: verdict.kind,
        entitled, reason: verdict.state === "NOT_ENTITLED" ? verdict.reason : null, expiresAt: verdict.expiresAt, verifiedAt: now,
      });
      if (!mine) { results.push({ state: "CLAIMED" }); continue; }
      results.push(verdict.state === "ENTITLED"
        ? { state: "ENTITLED", plan: verdict.plan, kind: verdict.kind, expiresAt: verdict.expiresAt }
        : { state: "NOT_ENTITLED", reason: verdict.reason, ...(verdict.plan ? { plan: verdict.plan } : {}) });
    }
  } catch (err) {
    if (err instanceof GoogleUnavailable) return fail(req, 503, err.code, err.code === "NOT_CONFIGURED" ? "Purchase checking is not set up correctly yet." : "Google Play did not answer. Try again later.");
    return fail(req, 503, "UNAVAILABLE", "Purchase checking is not available right now.");
  }

  let plan: "FREE" | PaidPlanId = "FREE";
  let expiresAt: number | null = null;
  for (const r of results) {
    if (r.state !== "ENTITLED" || !r.plan) continue;
    const e = r.expiresAt ?? null;
    // a purchase made once has no end: it outlasts any dated one of the same plan
    const later = plan === r.plan && (e === null || (expiresAt !== null && e > expiresAt));
    if (rankOf(r.plan) > rankOf(plan) || later) { plan = r.plan; expiresAt = e; }
  }
  const body: VerifyResponse = { plan, expiresAt, definitive: !results.some((r) => r.state === "CLAIMED"), verifiedAt: now, results };
  return json(req, 200, body);
}

/** The real world inside the Edge Function: Deno env, this project's Auth and database (service role). */
export function createVerifyDeps(env: (name: string) => string | undefined, fetchImpl: typeof fetch = fetch): VerifyDeps {
  const url = env("SUPABASE_URL") ?? "";
  const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  return {
    env,
    fetch: fetchImpl,
    now: () => Date.now(),
    async verifyUser(authorization) {
      const res = await fetchImpl(`${url}/auth/v1/user`, { headers: { apikey: serviceKey, Authorization: authorization }, signal: AbortSignal.timeout(SERVICE_TIMEOUT_MS) });
      if (res.status === 429 || res.status >= 500) throw new Error(`auth/v1/user: HTTP ${res.status}`);
      if (!res.ok) return null;
      const user = (await res.json()) as { id?: unknown };
      return typeof user.id === "string" && /^[0-9a-f-]{36}$/i.test(user.id) ? user.id : null;
    },
    async claim(userId, c) {
      const res = await fetchImpl(`${url}/rest/v1/rpc/claim_play_purchase`, {
        method: "POST",
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          p_user: userId, p_hash: c.tokenHash, p_product: c.productId, p_plan: c.plan, p_kind: c.kind, p_entitled: c.entitled,
          p_reason: c.reason, p_expires: c.expiresAt === null ? null : new Date(c.expiresAt).toISOString(), p_verified: new Date(c.verifiedAt).toISOString(),
        }),
        signal: AbortSignal.timeout(SERVICE_TIMEOUT_MS),
      });
      if (!res.ok) throw new Error(`claim_play_purchase: HTTP ${res.status}`);
      return (await res.json()) === true;
    },
  };
}
