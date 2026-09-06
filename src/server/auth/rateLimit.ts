/** Per-IP sliding-window limits for the auth routes (register / login / delete). */
import { HttpError } from "../http";
import { SlidingWindow } from "../util/slidingWindow";

export const AUTH_WINDOW_MS = 15 * 60 * 1000;
export const AUTH_LIMIT_PER_WINDOW = 20;

export const authWindow = new SlidingWindow(AUTH_WINDOW_MS);

/** Throws 429 "rate_limited" when the IP made too many auth attempts in the window. */
export function checkAuthRateLimit(ip: string, limit = AUTH_LIMIT_PER_WINDOW): void {
  const n = Number(process.env.AUTH_RATE_LIMIT_PER_15M);
  const effective = Number.isFinite(n) && n > 0 ? Math.floor(n) : limit;
  const r = authWindow.check(`auth:${ip}`, effective);
  if (!r.allowed) throw new HttpError(429, "rate_limited", { retryAfterSeconds: r.retryAfterSeconds });
}

/** Test helper. */
export function resetAuthRateLimit(): void {
  authWindow.reset();
}
