/**
 * Shared pipeline for /api/claude/* routes:
 *   CSRF header → Zod body → identify subject (account / guest / ip) → maintenance + key check →
 *   `quick` path (templates, cache – free, not rate limited) → rate limit → `run` (Claude or fallback) → log.
 * Every outcome writes one ai_request_logs row (no content) and every failure is a JSON error, never a stack.
 */
import type { z } from "zod";
import type { AiAction, Locale } from "@/lib/types";
import type { AiRequestStatus } from "../db/schema";
import { getSessionUser, type SessionUser } from "../auth/session";
import { HttpError, assertCsrf, clientIp, errorToResponse, guestIdFrom, jsonError, jsonOk, parseJsonBody, requestLocale, withRoute } from "../http";
import { maintenanceNotice } from "../settings";
import { claudeConfigured } from "./claude";
import { logAiRequest } from "./log";
import { checkAiRateLimit } from "./rateLimit";
import { RATE_LIMIT_MESSAGE } from "./fallbacks";

export interface AiMeta {
  user: SessionUser | null;
  guestId: string | null;
  /** Rate-limit subject: user:<id> | guest:<id> | ip:<ip>. */
  subject: string;
  ip: string;
  locale: Locale;
  /** False when the key is missing or an admin set a maintenance notice. */
  claudeAvailable: boolean;
  maintenance: string | null;
}

export interface AiOutcome<T> {
  body?: T;
  /** When set the route answers with this error (after logging). */
  error?: HttpError;
  status: AiRequestStatus;
  model?: string | null;
  inputTokens?: number;
  outputTokens?: number;
  errorCode?: string | null;
  jsonValid?: boolean | null;
  cacheHit?: boolean;
}

export interface AiHandler<I extends { context: { locale: Locale } }, O> {
  action: AiAction;
  schema: z.ZodType<I, unknown>;
  maxBytes?: number;
  /** Free answers (templates, cache). Returning null continues to the rate-limited `run`. */
  quick?: (input: I, meta: AiMeta) => Promise<AiOutcome<O> | null>;
  run: (input: I, meta: AiMeta) => Promise<AiOutcome<O>>;
}

export function unavailableError(meta: AiMeta): HttpError {
  return meta.maintenance ? new HttpError(503, "maintenance", { message: meta.maintenance }) : new HttpError(503, "ai_unavailable");
}

export function rateLimitedError(locale: Locale, retryAfterSeconds: number): HttpError {
  return new HttpError(429, "rate_limited", { retryAfterSeconds, message: RATE_LIMIT_MESSAGE[locale] });
}

export async function buildMeta(req: Request, locale: Locale): Promise<AiMeta> {
  const user = await getSessionUser(req);
  const guestId = guestIdFrom(req);
  const ip = clientIp(req);
  const subject = user ? `user:${user.id}` : guestId ? `guest:${guestId}` : `ip:${ip}`;
  const maintenance = await maintenanceNotice();
  return { user, guestId, subject, ip, locale, claudeAvailable: claudeConfigured() && !maintenance, maintenance };
}

export function createAiRoute<I extends { context: { locale: Locale } }, O>(handler: AiHandler<I, O>): (req: Request) => Promise<Response> {
  return withRoute(async (req) => {
    assertCsrf(req);
    const input = await parseJsonBody(req, handler.schema, handler.maxBytes ?? 400_000);
    const locale: Locale = input.context?.locale === "en" ? "en" : input.context?.locale === "he" ? "he" : requestLocale(req);
    const meta = await buildMeta(req, locale);
    const started = Date.now();
    const finish = async (outcome: AiOutcome<O>): Promise<Response> => {
      await logAiRequest({
        action: handler.action,
        userId: meta.user?.id ?? null,
        guestId: meta.guestId,
        ip: meta.ip,
        status: outcome.status,
        latencyMs: Date.now() - started,
        inputTokens: outcome.inputTokens,
        outputTokens: outcome.outputTokens,
        model: outcome.model ?? null,
        errorCode: outcome.errorCode ?? outcome.error?.code ?? null,
        jsonValid: outcome.jsonValid ?? null,
        cacheHit: outcome.cacheHit ?? false,
      });
      if (outcome.error) return errorToResponse(outcome.error, locale);
      if (outcome.body === undefined) return jsonError(500, "internal", locale);
      return jsonOk(outcome.body);
    };

    try {
      if (handler.quick) {
        const quick = await handler.quick(input, meta);
        if (quick) return finish(quick);
      }
      const decision = await checkAiRateLimit(meta.subject, meta.ip);
      if (!decision.allowed) {
        return finish({ status: "rate_limited", errorCode: decision.reason ?? "rate_limited", error: rateLimitedError(locale, decision.retryAfterSeconds) });
      }
      return finish(await handler.run(input, meta));
    } catch (err) {
      if (err instanceof HttpError) return finish({ status: "error", error: err });
      if (process.env.NODE_ENV !== "test") console.error(`[ai:${handler.action}]`, err instanceof Error ? `${err.name}: ${err.message}` : err);
      return finish({ status: "error", errorCode: "unhandled", error: new HttpError(500, "internal") });
    }
  });
}

export type { SessionUser };
