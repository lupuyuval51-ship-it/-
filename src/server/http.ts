/**
 * Route-handler helpers: JSON responses, typed errors with Hebrew/English messages,
 * body parsing with Zod, CSRF check (custom header) and client-IP extraction.
 */
import { z } from "zod";
import type { Locale } from "@/lib/types";
import type { ApiErrorBody, ApiErrorCode } from "@/lib/serverTypes";
import { auth as authMessages } from "@/i18n/messages/auth";

export const CLIENT_HEADER = "x-dc-client";
export const GUEST_HEADER = "x-dc-guest";
export const LOCALE_HEADER = "x-dc-locale";

export interface HttpErrorOptions {
  message?: string;
  retryAfterSeconds?: number;
  issues?: { path: string; message: string }[];
}

export class HttpError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode | string;
  readonly retryAfterSeconds?: number;
  readonly issues?: { path: string; message: string }[];
  constructor(status: number, code: ApiErrorCode | string, opts: HttpErrorOptions = {}) {
    super(opts.message ?? code);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.retryAfterSeconds = opts.retryAfterSeconds;
    this.issues = opts.issues;
  }
}

/** Hebrew (default) or English message for an error code, from the auth dictionary. */
export function errorMessage(code: string, locale: Locale = "he"): string {
  const dict = authMessages[locale] ?? authMessages.he;
  return dict[`auth.error.${code}`] ?? dict[`api.error.${code}`] ?? dict["api.error.generic"] ?? "Something went wrong.";
}

export function requestLocale(req: Request): Locale {
  return req.headers.get(LOCALE_HEADER) === "en" ? "en" : "he";
}

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };

export function jsonOk<T>(body: T, init: { status?: number; headers?: Record<string, string> } = {}): Response {
  return new Response(JSON.stringify(body), { status: init.status ?? 200, headers: { ...JSON_HEADERS, ...(init.headers ?? {}) } });
}

export function jsonError(status: number, code: ApiErrorCode | string, locale: Locale, opts: HttpErrorOptions = {}): Response {
  const body: ApiErrorBody = { ok: false, code, message: opts.message ?? errorMessage(code, locale) };
  if (opts.retryAfterSeconds !== undefined) body.retryAfterSeconds = opts.retryAfterSeconds;
  if (opts.issues?.length) body.issues = opts.issues;
  const headers: Record<string, string> = { ...JSON_HEADERS };
  if (opts.retryAfterSeconds !== undefined) headers["retry-after"] = String(opts.retryAfterSeconds);
  return new Response(JSON.stringify(body), { status, headers });
}

export function errorToResponse(err: unknown, locale: Locale): Response {
  if (err instanceof HttpError) return jsonError(err.status, err.code, locale, { message: err.message !== err.code ? err.message : undefined, retryAfterSeconds: err.retryAfterSeconds, issues: err.issues });
  if (err instanceof z.ZodError) return jsonError(400, "validation", locale, { issues: zodIssues(err) });
  if (process.env.NODE_ENV !== "test") console.error("[api] unhandled error:", err instanceof Error ? `${err.name}: ${err.message}` : err);
  return jsonError(500, "internal", locale);
}

/** Shape of an App Router route handler (the second argument is optional so wrappers can be typed loosely). */
export type RouteHandler<Ctx = unknown> = (req: Request, ctx?: Ctx) => Promise<Response>;

/** Wraps a route handler so every failure becomes a JSON error (never a stack trace). */
export function withRoute<Ctx = unknown>(handler: RouteHandler<Ctx>): RouteHandler<Ctx> {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      return errorToResponse(err, requestLocale(req));
    }
  };
}

/** Parses a positive integer query/body value with bounds. */
export function boundedInt(raw: string | null | undefined, fallback: number, min: number, max: number): number {
  if (raw === null || raw === undefined || raw.trim() === "") return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

export function zodIssues(err: z.ZodError): { path: string; message: string }[] {
  return err.issues.slice(0, 20).map((i) => ({ path: i.path.map(String).join("."), message: i.message }));
}

/** Reads and JSON-parses the body with a size cap. */
export async function readJsonBody(req: Request, maxBytes = 1_000_000): Promise<unknown> {
  const declared = Number(req.headers.get("content-length") ?? "0");
  if (declared > maxBytes) throw new HttpError(413, "payload_too_large");
  let text: string;
  try {
    text = await req.text();
  } catch {
    throw new HttpError(400, "bad_json");
  }
  if (Buffer.byteLength(text, "utf8") > maxBytes) throw new HttpError(413, "payload_too_large");
  if (!text.trim()) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new HttpError(400, "bad_json");
  }
}

/** Validates data with a Zod schema; throws a 400 "validation" HttpError with issue paths. */
export function parseWith<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) throw new HttpError(400, "validation", { issues: zodIssues(result.error) });
  return result.data;
}

export async function parseJsonBody<T>(req: Request, schema: z.ZodType<T>, maxBytes?: number): Promise<T> {
  return parseWith(schema, await readJsonBody(req, maxBytes));
}

/**
 * CSRF guard for mutations: the SameSite=Lax cookie cannot be sent cross-site with a custom header,
 * so requiring `x-dc-client: 1` blocks form posts and cross-origin fetches.
 */
export function assertCsrf(req: Request): void {
  if (req.headers.get(CLIENT_HEADER) !== "1") throw new HttpError(403, "csrf");
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip")?.trim() || req.headers.get("cf-connecting-ip")?.trim() || "0.0.0.0";
}

export function readCookie(req: Request, name: string): string | null {
  const header = req.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

export function guestIdFrom(req: Request): string | null {
  const raw = req.headers.get(GUEST_HEADER)?.trim();
  if (!raw) return null;
  return /^[A-Za-z0-9_-]{4,80}$/.test(raw) ? raw : null;
}

export function searchParam(req: Request, name: string): string | null {
  return new URL(req.url).searchParams.get(name);
}
