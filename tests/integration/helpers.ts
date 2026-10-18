import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { db } from "@/server/db";
import type { FeatureTier, PlanId } from "@/config/plans";
import { POST as registerRoute } from "@/app/api/auth/register/route";
import { getAllowanceSummary } from "@/server/allowance/summary";

export const ORIGIN = "http://localhost:3000";

export interface ReqOptions {
  body?: unknown;
  cookie?: string;
  origin?: string | null;
  headers?: Record<string, string>;
  ip?: string;
}

export function makeRequest(method: string, path: string, opts: ReqOptions = {}): NextRequest {
  const headers = new Headers({ host: "localhost:3000", "x-forwarded-for": opts.ip ?? `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`, ...opts.headers });
  if (opts.origin !== null) headers.set("origin", opts.origin ?? ORIGIN);
  if (opts.cookie) headers.set("cookie", opts.cookie);
  let body: string | undefined;
  if (opts.body !== undefined) {
    body = typeof opts.body === "string" ? opts.body : JSON.stringify(opts.body);
    headers.set("content-type", "application/json");
  }
  return new NextRequest(`${ORIGIN}${path}`, { method, headers, body });
}

export async function readJson<T = Record<string, unknown>>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

export function cookieFrom(res: Response): string {
  const setCookie = res.headers.getSetCookie().find((c) => c.startsWith("levelup_session="));
  if (!setCookie) throw new Error("no session cookie set");
  return setCookie.split(";")[0]!;
}

export interface TestUser {
  id: string;
  email: string;
  password: string;
  cookie: string;
}

export const uniqueEmail = (tag = "user") => `${tag}-${randomUUID().slice(0, 8)}@example.test`;

export async function createTestUser(opts: { country?: string; locale?: "he" | "en"; name?: string } = {}): Promise<TestUser> {
  const email = uniqueEmail();
  const password = "correct horse battery staple";
  const res = await registerRoute(
    makeRequest("POST", "/api/auth/register", {
      body: { email, password, displayName: opts.name ?? "Tester", locale: opts.locale ?? "en", country: opts.country },
    }),
  );
  if (res.status !== 201) throw new Error(`register failed: ${res.status} ${await res.text()}`);
  const body = await readJson<{ userId: string }>(res);
  return { id: body.userId, email, password, cookie: cookieFrom(res) };
}

/** Give a user a paid subscription row as the payment webhook would (status + period). */
export async function grantSubscription(
  userId: string,
  plan: Exclude<PlanId, "FREE">,
  opts: { status?: "ACTIVE" | "PAST_DUE" | "CANCELED" | "TRIALING"; start?: Date; end?: Date } = {},
) {
  const start = opts.start ?? new Date(Date.now() - 3 * 86_400_000);
  const end = opts.end ?? new Date(start.getTime() + 30 * 86_400_000);
  return db.subscription.upsert({
    where: { userId },
    create: {
      userId,
      provider: "STRIPE",
      providerCustomerId: `cus_${randomUUID().slice(0, 10)}`,
      providerSubscriptionId: `sub_${randomUUID().slice(0, 10)}`,
      plan,
      status: opts.status ?? "ACTIVE",
      currentPeriodStart: start,
      currentPeriodEnd: end,
      lastEventAt: new Date(),
    },
    update: { plan, status: opts.status ?? "ACTIVE", currentPeriodStart: start, currentPeriodEnd: end },
  });
}

/** One level's own counters in the user's current allowance period (the suites run at level A, see setup.ts). */
export async function levelAllowance(userId: string, level: FeatureTier = "A", now?: Date) {
  return (await getAllowanceSummary(userId, now)).levels[level];
}
