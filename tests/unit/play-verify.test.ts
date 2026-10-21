import { createVerify, generateKeyPairSync } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { build } from "esbuild";
import { describe, expect, it } from "vitest";
import {
  MAX_TOKENS, handleVerify, interpretProduct, interpretSubscription, parseServiceAccount, sha256Hex, type Claim, type VerifyDeps, type VerifyResponse,
} from "@/server/play/verify";

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const PEM = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
const SA = JSON.stringify({ type: "service_account", client_email: "verifier@levelup.iam.gserviceaccount.com", private_key: PEM, token_uri: "https://oauth2.googleapis.com/token" });
const NOW = Date.parse("2026-11-01T10:00:00Z");
const DAY = 86_400_000;
const TOKEN = (n: string) => `token.${n}`.padEnd(40, "x");
const iso = (ms: number) => new Date(ms).toISOString();

type GoogleAnswer = { status: number; body?: unknown };
interface World {
  /** keyed by the part of the URL after /applications/<package>/ */
  google: Record<string, GoogleAnswer>;
  claims: Map<string, string>;
  stored: Claim[];
  calls: string[];
  tokenCalls: number;
  tokenStatus: number;
  users: Record<string, string | null>;
  env: Record<string, string>;
}
const world = (over: Partial<World> = {}): World => ({ google: {}, claims: new Map(), stored: [], calls: [], tokenCalls: 0, tokenStatus: 200, users: { "Bearer good": "11111111-1111-1111-1111-111111111111" }, env: { PLAY_SERVICE_ACCOUNT_JSON: SA }, ...over });

function deps(w: World): VerifyDeps {
  const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url === "https://oauth2.googleapis.com/token") {
      w.tokenCalls++;
      if (w.tokenStatus !== 200) return new Response("{}", { status: w.tokenStatus });
      // the assertion must really be signed by the service account's key
      const assertion = new URLSearchParams(String(init?.body)).get("assertion") ?? "";
      const [h, c, s] = assertion.split(".");
      const ok = createVerify("RSA-SHA256").update(`${h}.${c}`).verify(publicKey, Buffer.from(s!, "base64url"));
      const claim = JSON.parse(Buffer.from(c!, "base64url").toString());
      if (!ok || claim.iss !== "verifier@levelup.iam.gserviceaccount.com" || claim.scope !== "https://www.googleapis.com/auth/androidpublisher") return new Response("{}", { status: 400 });
      return new Response(JSON.stringify({ access_token: "g-access", expires_in: 3599 }), { status: 200 });
    }
    const m = /^https:\/\/androidpublisher\.googleapis\.com\/androidpublisher\/v3\/applications\/([^/]+)\/(.+)$/.exec(url);
    if (!m) return new Response("no", { status: 404 });
    expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer g-access");
    w.calls.push(`${decodeURIComponent(m[1]!)}|${m[2]}`);
    const a = w.google[m[2]!];
    return a ? new Response(a.body === undefined ? null : JSON.stringify(a.body), { status: a.status }) : new Response("{}", { status: 404 });
  }) as typeof fetch;
  return {
    env: (n) => w.env[n],
    fetch: fetchImpl,
    now: () => NOW,
    verifyUser: async (auth) => { const u = w.users[auth]; if (u === undefined) throw new Error("down"); return u; },
    claim: async (user, c) => {
      const owner = w.claims.get(c.tokenHash);
      if (owner && owner !== user) return false;
      w.claims.set(c.tokenHash, user);
      w.stored.push(c);
      return true;
    },
  };
}

const call = (w: World, body: unknown, auth = "Bearer good", method = "POST") =>
  handleVerify(new Request("https://x/functions/v1/verify-purchase", { method, headers: { Authorization: auth, "Content-Type": "application/json", Origin: "https://localhost" }, body: method === "POST" ? JSON.stringify(body) : undefined }), deps(w));
const subPath = (t: string) => `purchases/subscriptionsv2/tokens/${t}`;
const sub = (state: string, productId: string, expiry: number) => ({ subscriptionState: state, lineItems: [{ productId, expiryTime: iso(expiry) }] });

describe("what Google's subscription answer means", () => {
  it("paid while active, in grace or canceled-but-not-ended; not on hold, paused, pending or expired", () => {
    const future = NOW + 10 * DAY, past = NOW - DAY;
    expect(interpretSubscription(sub("SUBSCRIPTION_STATE_ACTIVE", "levelup_pro", future), NOW)).toEqual({ state: "ENTITLED", plan: "PRO", productId: "levelup_pro", kind: "SUBSCRIPTION", expiresAt: future });
    expect(interpretSubscription(sub("SUBSCRIPTION_STATE_IN_GRACE_PERIOD", "levelup_plus", future), NOW).state).toBe("ENTITLED");
    expect(interpretSubscription(sub("SUBSCRIPTION_STATE_CANCELED", "levelup_plus", future), NOW).state).toBe("ENTITLED");
    const no = (state: string, expiry = future) => interpretSubscription(sub(state, "levelup_plus", expiry), NOW);
    expect(no("SUBSCRIPTION_STATE_ON_HOLD")).toMatchObject({ state: "NOT_ENTITLED", reason: "ON_HOLD" });
    expect(no("SUBSCRIPTION_STATE_PAUSED")).toMatchObject({ state: "NOT_ENTITLED", reason: "PAUSED" });
    expect(no("SUBSCRIPTION_STATE_PENDING")).toMatchObject({ state: "NOT_ENTITLED", reason: "PENDING" });
    expect(no("SUBSCRIPTION_STATE_EXPIRED", past)).toMatchObject({ state: "NOT_ENTITLED", reason: "EXPIRED" });
    // an "active" answer whose end date has passed is over
    expect(no("SUBSCRIPTION_STATE_ACTIVE", past)).toMatchObject({ state: "NOT_ENTITLED", reason: "EXPIRED" });
    expect(no("SUBSCRIPTION_STATE_SOMETHING_NEW")).toMatchObject({ state: "NOT_ENTITLED", reason: "UNKNOWN_STATE" });
  });

  it("a product that is not ours, or no line item at all, is never a plan", () => {
    expect(interpretSubscription(sub("SUBSCRIPTION_STATE_ACTIVE", "someone_elses_product", NOW + DAY), NOW)).toMatchObject({ state: "NOT_ENTITLED", reason: "UNKNOWN_PRODUCT", plan: null });
    expect(interpretSubscription({ subscriptionState: "SUBSCRIPTION_STATE_ACTIVE" }, NOW).state).toBe("NOT_ENTITLED");
    expect(interpretSubscription(null, NOW).state).toBe("NOT_ENTITLED");
    // a one-time product id inside a subscription answer is not a subscription of ours
    expect(interpretSubscription(sub("SUBSCRIPTION_STATE_ACTIVE", "levelup_pro_lifetime", NOW + DAY), NOW).state).toBe("NOT_ENTITLED");
  });

  it("a one-time purchase: 0 paid, 1 canceled (a refund), 2 pending", () => {
    expect(interpretProduct({ purchaseState: 0 }, "levelup_pro_lifetime")).toEqual({ state: "ENTITLED", plan: "PRO", productId: "levelup_pro_lifetime", kind: "LIFETIME", expiresAt: null });
    expect(interpretProduct({ purchaseState: 1 }, "levelup_plus_lifetime")).toMatchObject({ state: "NOT_ENTITLED", reason: "REFUNDED", plan: "PLUS" });
    expect(interpretProduct({ purchaseState: 2 }, "levelup_plus_lifetime")).toMatchObject({ state: "NOT_ENTITLED", reason: "PENDING" });
    expect(interpretProduct({}, "levelup_plus_lifetime")).toMatchObject({ state: "NOT_ENTITLED", reason: "UNKNOWN_STATE" });
    expect(interpretProduct({ purchaseState: 0 }, "levelup_pro")).toMatchObject({ state: "NOT_ENTITLED", reason: "UNKNOWN_PRODUCT" });
  });
});

describe("the service account key", () => {
  it("is read from the secret; anything that is not a key is null", () => {
    expect(parseServiceAccount(SA)).toMatchObject({ clientEmail: "verifier@levelup.iam.gserviceaccount.com", tokenUri: "https://oauth2.googleapis.com/token" });
    expect(parseServiceAccount(undefined)).toBeNull();
    expect(parseServiceAccount("  ")).toBeNull();
    expect(parseServiceAccount("not json")).toBeNull();
    expect(parseServiceAccount(JSON.stringify({ client_email: "a@b" }))).toBeNull();
    // a token endpoint that is not https is ignored, the real one is used
    expect(parseServiceAccount(JSON.stringify({ client_email: "a@b", private_key: PEM, token_uri: "http://evil.test/token" }))?.tokenUri).toBe("https://oauth2.googleapis.com/token");
  });
});

describe("verify-purchase", () => {
  it("a paid subscription is the plan Google reports, with Google's end date, and is stored for the account", async () => {
    const w = world({ google: { [subPath(TOKEN("a"))]: { status: 200, body: sub("SUBSCRIPTION_STATE_ACTIVE", "levelup_plus", NOW + 20 * DAY) } } });
    const res = await call(w, { purchases: [{ productId: "levelup_plus", purchaseToken: TOKEN("a") }] });
    expect(res.status).toBe(200);
    const body = (await res.json()) as VerifyResponse;
    expect(body).toMatchObject({ plan: "PLUS", expiresAt: NOW + 20 * DAY, definitive: true, verifiedAt: NOW });
    expect(w.calls).toEqual(["app.levelup.learn3d|" + subPath(TOKEN("a"))]);
    // only the hash of the token is stored, never the token
    expect(w.stored).toHaveLength(1);
    expect(w.stored[0]).toMatchObject({ tokenHash: await sha256Hex(TOKEN("a")), productId: "levelup_plus", plan: "PLUS", kind: "SUBSCRIPTION", entitled: true });
    expect(JSON.stringify(w.stored)).not.toContain(TOKEN("a"));
  });

  it("the phone's claim about the product changes nothing: the plan is what Google says it is", async () => {
    // a Plus purchase presented as Pro
    const w = world({ google: { [subPath(TOKEN("a"))]: { status: 200, body: sub("SUBSCRIPTION_STATE_ACTIVE", "levelup_plus", NOW + DAY) } } });
    const body = (await (await call(w, { purchases: [{ productId: "levelup_pro", purchaseToken: TOKEN("a") }] })).json()) as VerifyResponse;
    expect(body.plan).toBe("PLUS");
    // a subscription token presented as a one-time Pro purchase: Google has no such product purchase
    const w2 = world({});
    const b2 = (await (await call(w2, { purchases: [{ productId: "levelup_pro_lifetime", purchaseToken: TOKEN("a") }] })).json()) as VerifyResponse;
    expect(b2).toMatchObject({ plan: "FREE", definitive: true, results: [{ state: "NOT_FOUND" }] });
  });

  it("a one-time purchase has no end date and uses the products API", async () => {
    const w = world({ google: { [`purchases/products/levelup_pro_lifetime/tokens/${TOKEN("b")}`]: { status: 200, body: { purchaseState: 0 } } } });
    const body = (await (await call(w, { purchases: [{ productId: "levelup_pro_lifetime", purchaseToken: TOKEN("b") }] })).json()) as VerifyResponse;
    expect(body).toMatchObject({ plan: "PRO", expiresAt: null, results: [{ state: "ENTITLED", kind: "LIFETIME" }] });
  });

  it("a refunded or expired purchase is Free, and the verdict is still stored", async () => {
    const w = world({
      google: {
        [`purchases/products/levelup_plus_lifetime/tokens/${TOKEN("r")}`]: { status: 200, body: { purchaseState: 1 } },
        [subPath(TOKEN("e"))]: { status: 200, body: sub("SUBSCRIPTION_STATE_EXPIRED", "levelup_pro", NOW - 2 * DAY) },
      },
    });
    const body = (await (await call(w, { purchases: [{ productId: "levelup_plus_lifetime", purchaseToken: TOKEN("r") }, { productId: "levelup_pro", purchaseToken: TOKEN("e") }] })).json()) as VerifyResponse;
    expect(body).toMatchObject({ plan: "FREE", expiresAt: null, definitive: true });
    expect(body.results.map((r) => r.state)).toEqual(["NOT_ENTITLED", "NOT_ENTITLED"]);
    expect(w.stored.map((c) => [c.entitled, c.reason])).toEqual([[false, "REFUNDED"], [false, "EXPIRED"]]);
  });

  it("the best plan wins; a purchase made once outlasts a dated one of the same plan", async () => {
    const w = world({
      google: {
        [subPath(TOKEN("s"))]: { status: 200, body: sub("SUBSCRIPTION_STATE_ACTIVE", "levelup_plus", NOW + 9 * DAY) },
        [`purchases/products/levelup_pro_lifetime/tokens/${TOKEN("p")}`]: { status: 200, body: { purchaseState: 0 } },
        [`purchases/products/levelup_plus_lifetime/tokens/${TOKEN("l")}`]: { status: 200, body: { purchaseState: 0 } },
      },
    });
    const both = (await (await call(w, { purchases: [{ productId: "levelup_plus", purchaseToken: TOKEN("s") }, { productId: "levelup_pro_lifetime", purchaseToken: TOKEN("p") }] })).json()) as VerifyResponse;
    expect(both).toMatchObject({ plan: "PRO", expiresAt: null });
    const same = (await (await call(w, { purchases: [{ productId: "levelup_plus", purchaseToken: TOKEN("s") }, { productId: "levelup_plus_lifetime", purchaseToken: TOKEN("l") }] })).json()) as VerifyResponse;
    expect(same).toMatchObject({ plan: "PLUS", expiresAt: null });
  });

  it("a token Google does not know (forged, another app, too old) is NOT_FOUND and stores nothing", async () => {
    for (const status of [400, 404, 410]) {
      const w = world({ google: { [subPath(TOKEN("f"))]: { status } } });
      const body = (await (await call(w, { purchases: [{ productId: "levelup_pro", purchaseToken: TOKEN("f") }] })).json()) as VerifyResponse;
      expect(body).toMatchObject({ plan: "FREE", definitive: true, results: [{ state: "NOT_FOUND" }] });
      expect(w.stored).toHaveLength(0);
    }
  });

  it("a purchase another account already proved is not given to this one (and the answer is not definitive)", async () => {
    const g = { [subPath(TOKEN("a"))]: { status: 200, body: sub("SUBSCRIPTION_STATE_ACTIVE", "levelup_pro", NOW + DAY) } };
    const w = world({ google: g, users: { "Bearer good": "11111111-1111-1111-1111-111111111111", "Bearer other": "22222222-2222-2222-2222-222222222222" } });
    const first = (await (await call(w, { purchases: [{ productId: "levelup_pro", purchaseToken: TOKEN("a") }] })).json()) as VerifyResponse;
    expect(first.plan).toBe("PRO");
    const second = (await (await call(w, { purchases: [{ productId: "levelup_pro", purchaseToken: TOKEN("a") }] }, "Bearer other")).json()) as VerifyResponse;
    expect(second).toMatchObject({ plan: "FREE", definitive: false, results: [{ state: "CLAIMED" }] });
    // the owner can ask again and again
    expect(((await (await call(w, { purchases: [{ productId: "levelup_pro", purchaseToken: TOKEN("a") }] })).json()) as VerifyResponse).plan).toBe("PRO");
  });

  it("when Google cannot answer, nothing is decided: 503 and the phone keeps its plan", async () => {
    const token = { purchases: [{ productId: "levelup_pro", purchaseToken: TOKEN("a") }] };
    for (const status of [429, 500, 503]) {
      const w = world({ google: { [subPath(TOKEN("a"))]: { status } } });
      const res = await call(w, token);
      expect(res.status).toBe(503);
      expect(((await res.json()) as { error: { code: string } }).error.code).toBe("UNAVAILABLE");
      expect(w.stored).toHaveLength(0);
    }
    // the service account is not linked to the app / has no permission: a setting to fix, never a verdict
    const w = world({ google: { [subPath(TOKEN("a"))]: { status: 403 } } });
    const res = await call(w, token);
    expect(res.status).toBe(503);
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe("NOT_CONFIGURED");
    // Google refuses the key itself
    const w2 = world({ tokenStatus: 400 });
    expect(((await (await call(w2, token)).json()) as { error: { code: string } }).error.code).toBe("NOT_CONFIGURED");
  });

  it("without the secret it says it is not set up and checks nothing", async () => {
    const w = world({ env: {} });
    const res = await call(w, { purchases: [{ productId: "levelup_pro", purchaseToken: TOKEN("a") }] });
    expect(res.status).toBe(503);
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe("NOT_CONFIGURED");
    expect(w.tokenCalls).toBe(0);
    const w2 = world({ env: { PLAY_SERVICE_ACCOUNT_JSON: "   " } });
    expect((await call(w2, { purchases: [{ productId: "levelup_pro", purchaseToken: TOKEN("a") }] })).status).toBe(503);
  });

  it("asks Google's token endpoint once for several purchases, and checks the configured package", async () => {
    const w = world({
      env: { PLAY_SERVICE_ACCOUNT_JSON: SA, PLAY_PACKAGE_NAME: "app.levelup.test" },
      google: { [subPath(TOKEN("a"))]: { status: 200, body: sub("SUBSCRIPTION_STATE_ACTIVE", "levelup_plus", NOW + DAY) }, [subPath(TOKEN("b"))]: { status: 200, body: sub("SUBSCRIPTION_STATE_ACTIVE", "levelup_pro", NOW + DAY) } },
    });
    await call(w, { purchases: [{ productId: "levelup_plus", purchaseToken: TOKEN("a") }, { productId: "levelup_pro", purchaseToken: TOKEN("b") }] });
    expect(w.tokenCalls).toBe(1);
    expect(w.calls.every((c) => c.startsWith("app.levelup.test|"))).toBe(true);
  });

  it("only a signed-in account, POST, and a well-formed list of our products", async () => {
    const w = world();
    const ok = { purchases: [{ productId: "levelup_pro", purchaseToken: TOKEN("a") }] };
    expect((await call(w, ok, "")).status).toBe(401);
    expect((await call(w, ok, "Bearer nobody-knows")).status).toBe(503); // Auth did not answer
    w.users["Bearer expired"] = null;
    expect((await call(w, ok, "Bearer expired")).status).toBe(401);
    expect((await call(w, ok, "Bearer good", "GET")).status).toBe(405);
    const options = await handleVerify(new Request("https://x/", { method: "OPTIONS", headers: { Origin: "https://localhost" } }), deps(w));
    expect(options.status).toBe(204);
    expect(options.headers.get("Access-Control-Allow-Origin")).toBe("https://localhost");
    expect((await handleVerify(new Request("https://x/", { method: "OPTIONS", headers: { Origin: "https://evil.test" } }), deps(w))).headers.get("Access-Control-Allow-Origin")).toBe("https://localhost");
    for (const bad of [
      {}, { purchases: [] }, { purchases: "x" },
      { purchases: [{ productId: "other_app_product", purchaseToken: TOKEN("a") }] },
      { purchases: [{ productId: "levelup_pro", purchaseToken: "short" }] },
      { purchases: [{ productId: "levelup_pro", purchaseToken: `${TOKEN("a")}/../../x` }] },
      { purchases: [{ productId: 7, purchaseToken: TOKEN("a") }] },
      { purchases: Array.from({ length: MAX_TOKENS + 1 }, (_, i) => ({ productId: "levelup_pro", purchaseToken: TOKEN(String(i)) })) },
    ]) expect((await call(w, bad)).status).toBe(400);
    expect(w.tokenCalls).toBe(0);
  });
});

describe("the deployed bundle", () => {
  const root = path.resolve(__dirname, "../..");
  const bundled = async () => {
    const out = await build({
      entryPoints: [path.join(root, "src/server/play/edge-entry.ts")], bundle: true, format: "esm", platform: "browser", target: "es2022", minify: false,
      legalComments: "none", tsconfig: path.join(root, "tsconfig.json"), write: false, logLevel: "silent",
      banner: { js: "// @ts-nocheck\n// LEVEL UP — verify-purchase Edge Function. Generated by scripts/build-verify-function.mjs; do not edit." },
    });
    return out.outputFiles[0]!.text;
  };

  it("supabase/functions/verify-purchase/index.ts is what the source builds to (run: node scripts/build-verify-function.mjs)", async () => {
    expect(readFileSync(path.join(root, "supabase/functions/verify-purchase/index.ts"), "utf8")).toBe(await bundled());
  });

  it("holds no secret: no key material, only the names of the settings it reads", async () => {
    const text = await bundled();
    expect(text).not.toMatch(/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]{20}/);
    expect(text).toContain("PLAY_SERVICE_ACCOUNT_JSON");
    expect(readFileSync(path.join(root, "supabase/migrations/20261021000000_play_purchases.sql"), "utf8")).not.toMatch(/purchase_token\s+text/);
  });
});
