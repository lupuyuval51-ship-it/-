import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE } from "@/config/limits";
import { getEnv } from "../env";
import { checkRateLimit, type RateLimitRule } from "../ratelimit";
import { readCookie, getUserBySessionToken, type AuthUser } from "../auth/session";
import { getClientIp } from "./client-ip";
import { ApiError, Errors } from "./errors";

const MAX_BODY_BYTES = 256 * 1024;

type AuthMode = "required" | "optional" | "none";

export interface RouteOptions<B, A extends AuthMode> {
  /** `required` (default) → 401 when signed out. */
  auth?: A;
  /** Zod schema for the JSON body. Omit for routes without a body. */
  body?: z.ZodType<B>;
  /** Skip the Origin check. ONLY for server-to-server webhooks that authenticate by signature. */
  csrf?: boolean;
  /** One or more rate limits applied before the handler runs. */
  rateLimit?: { name: string; rule: RateLimitRule; by?: "ip" | "user" | "both" }[];
}

export interface HandlerContext<B, P, A extends AuthMode> {
  req: NextRequest;
  params: P;
  body: B;
  user: A extends "required" ? AuthUser : AuthUser | null;
  ip: string;
  sessionToken: string | undefined;
}

type RouteCtx<P> = { params: Promise<P> };

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function allowedOrigins(req: NextRequest): Set<string> {
  const origins = new Set<string>();
  try {
    origins.add(new URL(getEnv().APP_URL).origin);
  } catch {
    /* validated by getEnv */
  }
  const host = req.headers.get("host");
  if (host) {
    origins.add(`http://${host}`);
    origins.add(`https://${host}`);
  }
  if (getEnv().TRUST_PROXY) {
    const fwdHost = req.headers.get("x-forwarded-host");
    if (fwdHost) {
      origins.add(`http://${fwdHost}`);
      origins.add(`https://${fwdHost}`);
    }
  }
  return origins;
}

/** CSRF defence in depth on top of SameSite=Lax cookies: mutating requests must come from our own origin. */
function assertSameOrigin(req: NextRequest): void {
  const origin = req.headers.get("origin");
  if (!origin || !allowedOrigins(req).has(origin)) {
    throw Errors.forbidden("Cross-origin requests are not allowed.", "BAD_ORIGIN");
  }
}

export function json(data: unknown, status = 200, headers?: Record<string, string>): NextResponse {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

function errorResponse(err: unknown): NextResponse {
  if (err instanceof ApiError) {
    return json({ error: { code: err.code, message: err.message, details: err.details } }, err.status, err.headers);
  }
  if (err instanceof z.ZodError) {
    return json({ error: { code: "VALIDATION_ERROR", message: "The request is invalid.", details: z.flattenError(err) } }, 400);
  }
  // Never leak internals. The full error is logged server-side only.
  console.error("[api] unhandled error:", err);
  return json({ error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." } }, 500);
}

/**
 * Wraps a route handler with: same-origin check, authentication, rate limiting, body-size limit,
 * strict JSON validation, and uniform, non-leaky error responses.
 */
export function apiRoute<B = undefined, P = Record<string, never>, A extends AuthMode = "required">(
  options: RouteOptions<B, A>,
  handler: (ctx: HandlerContext<B, P, A>) => Promise<unknown>,
) {
  return async function route(req: NextRequest, routeCtx?: RouteCtx<P>): Promise<Response> {
    try {
      const method = req.method.toUpperCase();
      if (!SAFE_METHODS.has(method) && options.csrf !== false) assertSameOrigin(req);

      const ip = getClientIp(req.headers);
      const sessionToken = readCookie(req.headers.get("cookie"), SESSION_COOKIE);
      const authMode: AuthMode = options.auth ?? "required";
      let user: AuthUser | null = null;
      if (authMode !== "none") {
        user = await getUserBySessionToken(sessionToken);
        if (!user && authMode === "required") throw Errors.unauthorized();
      }

      for (const rl of options.rateLimit ?? []) {
        const by = rl.by ?? (user ? "user" : "ip");
        const keys = [] as string[];
        if (by === "user" || by === "both") if (user) keys.push(`${rl.name}:u:${user.id}`);
        if (by === "ip" || by === "both" || keys.length === 0) keys.push(`${rl.name}:ip:${ip}`);
        for (const key of keys) {
          const res = await checkRateLimit(key, rl.rule);
          if (!res.ok) throw Errors.tooMany(res.retryAfterSec);
        }
      }

      let body = undefined as B;
      if (options.body) {
        const len = Number(req.headers.get("content-length") ?? "0");
        if (len > MAX_BODY_BYTES) throw new ApiError(413, "PAYLOAD_TOO_LARGE", "The request body is too large.");
        const text = await req.text();
        if (text.length > MAX_BODY_BYTES) throw new ApiError(413, "PAYLOAD_TOO_LARGE", "The request body is too large.");
        let raw: unknown;
        try {
          raw = text.length ? JSON.parse(text) : {};
        } catch {
          throw Errors.badRequest("The request body must be valid JSON.");
        }
        const parsed = options.body.safeParse(raw);
        if (!parsed.success) throw Errors.validation(z.flattenError(parsed.error));
        body = parsed.data;
      }

      const params = (routeCtx ? await routeCtx.params : {}) as P;
      const result = await handler({ req, params, body, user: user as HandlerContext<B, P, A>["user"], ip, sessionToken });
      if (result instanceof Response) return result;
      return json(result ?? { ok: true });
    } catch (err) {
      return errorResponse(err);
    }
  };
}
