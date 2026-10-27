import { NextResponse } from "next/server";
import { supabaseServerConfig, verifySupabaseToken } from "@/lib/supabase/server";
import { AI_ERROR_HE, AiError, type AiErrorCode } from "./provider";
import { hit } from "./ratelimit";

export interface Identity {
  type: "user" | "guest" | "local";
  id: string;
}

export function errorResponse(code: AiErrorCode | "forbidden" | "too_large" | "invalid", message?: string, status?: number, headers?: Record<string, string>) {
  const defaults: Record<string, number> = { forbidden: 403, too_large: 413, invalid: 400 };
  const msg = message ?? (code in AI_ERROR_HE ? AI_ERROR_HE[code as AiErrorCode] : "שגיאה");
  return NextResponse.json({ error: { code, message: msg } }, { status: status ?? defaults[code] ?? 502, headers });
}

export function aiErrorToResponse(e: unknown) {
  if (e instanceof AiError) {
    const status = e.code === "rate_limited" ? 429 : e.code === "overloaded" ? 503 : e.code === "bad_request" ? 400 : e.code === "timeout" ? 504 : 502;
    return errorResponse(e.code, undefined, status);
  }
  return errorResponse("upstream");
}

const num = (v: string | undefined, d: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : d;
};

function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // קריאות שרת-לשרת / כלי בדיקה; מוגנות בכותרת x-lupu-client ובהגבלת קצב
  try {
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    return !!host && new URL(origin).host === host;
  } catch {
    return false;
  }
}

/**
 * שומר הסף של כל נתיבי ה-AI:
 *  1. אימות מקור ומניעת CSRF (כותרת מותאמת שדפדפן אינו שולח חוצה-אתרים בלי CORS).
 *  2. מגבלת גודל גוף.
 *  3. זיהוי: משתמש מחובר (אסימון Supabase מאומת), אורח, או מצב מקומי.
 *  4. הגבלת קצב לדקה וליום, כדי למנוע ניצול לרעה ועלויות חריגות.
 */
export async function guardAiRequest(req: Request, opts: { maxBytes: number; scope: string }): Promise<{ ok: true; identity: Identity } | { ok: false; response: Response }> {
  if (!sameOrigin(req) || req.headers.get("x-lupu-client") !== "web") {
    return { ok: false, response: errorResponse("forbidden", "הבקשה נדחתה (מקור לא מורשה).") };
  }
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > opts.maxBytes) return { ok: false, response: errorResponse("too_large", "הבקשה גדולה מדי. נסה לקצר את החומר או להקטין את התמונה.") };

  let identity: Identity;
  const auth = req.headers.get("authorization");
  if (supabaseServerConfig()) {
    if (auth?.startsWith("Bearer ")) {
      const user = await verifySupabaseToken(auth.slice(7));
      if (!user) return { ok: false, response: errorResponse("unauthorized", "ההתחברות פגה. התחבר מחדש.", 401) };
      identity = { type: "user", id: user.id };
    } else {
      identity = { type: "guest", id: `ip:${clientIp(req)}` };
    }
  } else {
    identity = { type: "local", id: `ip:${clientIp(req)}` };
  }

  const perMinute = num(process.env.AI_RATE_LIMIT_PER_MINUTE, 12);
  const perDay = identity.type === "guest" ? num(process.env.AI_GUEST_RATE_LIMIT_PER_DAY, 15) : num(process.env.AI_RATE_LIMIT_PER_DAY, 150);
  const minute = hit(`m:${identity.id}`, perMinute, 60_000);
  if (!minute.ok) {
    return { ok: false, response: errorResponse("rate_limited", `שולחים יותר מדי בקשות. נסה שוב בעוד ${minute.retryAfterSec} שניות.`, 429, { "retry-after": String(minute.retryAfterSec) }) };
  }
  const day = hit(`d:${identity.id}`, perDay, 24 * 3600_000);
  if (!day.ok) {
    const msg = identity.type === "guest" ? "הגעת למגבלת השימוש היומית של אורח. התחבר כדי להמשיך." : "הגעת למגבלת השימוש היומית ב-AI. נסה שוב מחר.";
    return { ok: false, response: errorResponse("rate_limited", msg, 429, { "retry-after": String(day.retryAfterSec) }) };
  }
  return { ok: true, identity };
}

export async function readJson(req: Request, maxBytes: number): Promise<{ ok: true; body: unknown } | { ok: false; response: Response }> {
  try {
    const text = await req.text();
    if (text.length > maxBytes) return { ok: false, response: errorResponse("too_large", "הבקשה גדולה מדי.") };
    return { ok: true, body: JSON.parse(text) };
  } catch {
    return { ok: false, response: errorResponse("invalid", "גוף הבקשה אינו JSON תקין.") };
  }
}
