/**
 * Typed fetch helper for the DiscCoach API (client side).
 * - adds the CSRF header (`x-dc-client: 1`), the guest id (`x-dc-guest`) and the UI locale (`x-dc-locale`)
 * - JSON in / JSON out, hard timeout, cookies included
 * - every failure is an `ApiError` { code, message, status, offline } – `message` is already user-facing
 *   (server messages are Hebrew/English by locale; local failures use the i18n dictionary).
 */
import type { Locale } from "@/lib/types";
import type { ApiErrorBody } from "@/lib/serverTypes";
import { dictionaries } from "@/i18n";
import { useAppStore } from "./appStore";

export const DEFAULT_TIMEOUT_MS = 20_000;

export interface ApiErrorInit {
  code: string;
  message: string;
  status: number;
  offline?: boolean;
  retryAfterSeconds?: number;
  issues?: { path: string; message: string }[];
}

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  /** True when the request never reached the server (no network / timeout). */
  readonly offline: boolean;
  readonly retryAfterSeconds?: number;
  readonly issues?: { path: string; message: string }[];
  constructor(init: ApiErrorInit) {
    super(init.message);
    this.name = "ApiError";
    this.code = init.code;
    this.status = init.status;
    this.offline = init.offline ?? false;
    this.retryAfterSeconds = init.retryAfterSeconds;
    this.issues = init.issues;
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}

export interface ApiFetchOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  timeoutMs?: number;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

/** Message for an error code from the auth/api dictionaries; null when there is no entry. */
export function messageForCode(code: string, locale: Locale): string | null {
  const dict = dictionaries[locale] ?? dictionaries.he;
  return dict[`auth.error.${code}`] ?? dict[`api.error.${code}`] ?? null;
}

/** User-facing text for any error: dictionary by code → server message → generic. */
export function apiErrorMessage(err: unknown, locale: Locale): string {
  const generic = messageForCode("generic", locale) ?? "Something went wrong.";
  if (!isApiError(err)) return generic;
  if (err.offline) return messageForCode("offline", locale) ?? err.message;
  return messageForCode(err.code, locale) ?? (err.message && err.message !== err.code ? err.message : generic);
}

function isOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

function currentLocale(): Locale {
  try {
    return useAppStore.getState().settings.locale;
  } catch {
    return "he";
  }
}

function localError(code: string, status: number, offline: boolean, locale: Locale): ApiError {
  return new ApiError({ code, status, offline, message: messageForCode(code, locale) ?? messageForCode("generic", locale) ?? code });
}

function codeForStatus(status: number): string {
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 413) return "payload_too_large";
  if (status === 429) return "rate_limited";
  if (status === 503) return "ai_unavailable";
  return "internal";
}

export async function apiFetch<T>(path: string, opts: ApiFetchOptions = {}): Promise<T> {
  const state = useAppStore.getState();
  const locale = currentLocale();
  if (isOffline()) throw localError("offline", 0, true, locale);

  const method = opts.method ?? "GET";
  const headers: Record<string, string> = {
    accept: "application/json",
    "x-dc-client": "1",
    "x-dc-locale": locale,
    ...(state.auth.guestId ? { "x-dc-guest": state.auth.guestId } : {}),
    ...(opts.body !== undefined ? { "content-type": "application/json" } : {}),
    ...(opts.headers ?? {}),
  };

  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, opts.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const onOuterAbort = () => controller.abort();
  if (opts.signal) {
    if (opts.signal.aborted) controller.abort();
    else opts.signal.addEventListener("abort", onOuterAbort, { once: true });
  }

  let res: Response;
  try {
    res = await fetch(path, {
      method,
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      credentials: "same-origin",
      cache: "no-store",
      signal: controller.signal,
    });
  } catch {
    if (timedOut) throw localError("timeout", 0, true, locale);
    if (opts.signal?.aborted) throw new ApiError({ code: "aborted", status: 0, offline: false, message: messageForCode("generic", locale) ?? "aborted" });
    // fetch rejects with a TypeError when the network is unreachable.
    throw localError("offline", 0, true, locale);
  } finally {
    clearTimeout(timeout);
    opts.signal?.removeEventListener("abort", onOuterAbort);
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const body = data && typeof data === "object" ? (data as Partial<ApiErrorBody>) : null;
    const code = typeof body?.code === "string" && body.code ? body.code : codeForStatus(res.status);
    const message = typeof body?.message === "string" && body.message ? body.message : (messageForCode(code, locale) ?? messageForCode("generic", locale) ?? code);
    const retryHeader = Number(res.headers.get("retry-after"));
    throw new ApiError({
      code,
      message,
      status: res.status,
      offline: false,
      retryAfterSeconds: typeof body?.retryAfterSeconds === "number" ? body.retryAfterSeconds : Number.isFinite(retryHeader) && retryHeader > 0 ? retryHeader : undefined,
      issues: Array.isArray(body?.issues) ? body!.issues : undefined,
    });
  }
  if (data === null) throw localError("bad_json", res.status, false, locale);
  return data as T;
}
