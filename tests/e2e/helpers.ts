import { expect, type Page } from "@playwright/test";
import type { GameEvent } from "@/lib/game/state/events";
import { randomUUID } from "node:crypto";

export const PASSWORD = "e2e correct horse battery";

export async function apiPost<T = Record<string, any>>(page: Page, path: string, data: unknown): Promise<{ status: number; body: T }> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const origin = new URL(page.url() === "about:blank" ? (process.env.E2E_BASE ?? "http://127.0.0.1:3100") : page.url()).origin;
  // The E2E server runs with TRUST_PROXY=true, so each test pretends to be a distinct client for rate limiting.
  const ip = `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${1 + Math.floor(Math.random() * 250)}`;
  const res = await page.request.post(path, { data, headers: { origin, "x-forwarded-for": ip } });
  return { status: res.status(), body: (await res.json().catch(() => ({}))) as T };
}

/** Register a fresh account through the real API (the cookie lands in the browser context). */
export async function registerViaApi(page: Page, opts: { locale?: "he" | "en"; country?: string } = {}) {
  await page.goto("/api/ai/status");
  const email = `e2e-${randomUUID().slice(0, 8)}@example.test`;
  const res = await apiPost(page, "/api/auth/register", { email, password: PASSWORD, displayName: "E2E Player", locale: opts.locale ?? "en", country: opts.country });
  expect(res.status).toBe(201);
  return { email, password: PASSWORD };
}

export async function createGameViaApi(page: Page, over: Record<string, unknown> = {}): Promise<string> {
  const request = { mode: "FAST", subject: "Python loops", learningGoal: "Understand variables and loops", difficulty: "beginner", gameType: "adventure", contentLanguage: "en", ...over };
  const created = await apiPost<{ jobId: string }>(page, "/api/generations", { idempotencyKey: `e2e-${randomUUID()}`, request });
  expect([200, 202]).toContain(created.status);
  for (let i = 0; i < 100; i++) {
    const res = await page.request.get(`/api/generations/${created.body.jobId}`);
    const body = (await res.json()) as { status: string; gameId?: string; error?: { message: string } };
    if (body.status === "SUCCEEDED") return body.gameId!;
    if (body.status === "FAILED") throw new Error(`generation failed: ${body.error?.message}`);
    await page.waitForTimeout(300);
  }
  throw new Error("generation did not finish");
}

/** Register through the real registration form (what a person does). Leaves the browser signed in on /dashboard. */
export async function registerViaUi(page: Page, opts: { name?: string; email?: string; password?: string; region?: string } = {}) {
  const email = opts.email ?? `ui-${randomUUID().slice(0, 8)}@example.test`;
  const password = opts.password ?? PASSWORD;
  await page.route("**/api/auth/register", (route) => route.continue({ headers: { ...route.request().headers(), "x-forwarded-for": randomIp() } }));
  await page.goto("/register");
  await page.locator("#displayName").fill(opts.name ?? "Dana Learner");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  if (opts.region) await page.locator("#country").selectOption(opts.region);
  await page.getByTestId("auth-submit").click();
  await page.waitForURL("**/dashboard");
  return { email, password };
}

export const randomIp = () => `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${1 + Math.floor(Math.random() * 250)}`;

/** Force the interface language for anonymous pages (Hebrew is the default). */
export async function setLocaleCookie(page: Page, locale: "he" | "en") {
  const base = process.env.E2E_BASE ?? "http://127.0.0.1:3100";
  await page.context().addCookies([{ name: "levelup_lang", value: locale, url: base }]);
}

/** POST a gameplay event from inside the page, exactly as the game client does (same cookies and Origin). */
export async function sendPlayEvent(page: Page, sessionId: string, event: GameEvent) {
  return page.evaluate(
    async ({ sessionId, event }) => {
      const res = await fetch(`/api/play/${sessionId}/events`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(event) });
      return { status: res.status, body: (await res.json()) as Record<string, any> }; // eslint-disable-line @typescript-eslint/no-explicit-any
    },
    { sessionId, event },
  );
}

/** Assert that nothing on the page is wider than the viewport (no horizontal scrolling). */
export async function expectNoHorizontalOverflow(page: Page) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
  expect(scrollWidth, `page is ${scrollWidth}px wide in a ${clientWidth}px viewport`).toBeLessThanOrEqual(clientWidth + 1);
}
