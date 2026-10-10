import { expect, type Page } from "@playwright/test";
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
