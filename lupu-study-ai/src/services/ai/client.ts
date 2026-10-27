"use client";

import { getAccessToken } from "@/lib/supabase/client";
import type { GenerateRequest, VisionRequest, VisionResult, ChatRequest } from "./schemas";

/** שגיאה מובנית מהשרת, עם הודעה בעברית שמוצגת למשתמש */
export class AiClientError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "AiClientError";
  }
}

async function headers(): Promise<Record<string, string>> {
  const h: Record<string, string> = { "content-type": "application/json", "x-lupu-client": "web" };
  const token = await getAccessToken();
  if (token) h.authorization = `Bearer ${token}`;
  return h;
}

async function post(path: string, body: unknown, signal?: AbortSignal): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(path, { method: "POST", headers: await headers(), body: JSON.stringify(body), signal });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    throw new AiClientError("network", navigator.onLine ? "לא הצלחנו להתחבר לשרת. נסה שוב בעוד רגע." : "אין חיבור לאינטרנט. פיצ׳רי ה-AI יחזרו כשהחיבור יחזור.", 0);
  }
  if (!res.ok) {
    let code = "upstream";
    let message = "אירעה שגיאה. נסה שוב.";
    try {
      const j = (await res.json()) as { error?: { code?: string; message?: string } };
      code = j.error?.code ?? code;
      message = j.error?.message ?? message;
    } catch {
      /* גוף לא JSON */
    }
    throw new AiClientError(code, message, res.status);
  }
  return res;
}

export async function aiGenerate<T = unknown>(body: GenerateRequest, signal?: AbortSignal): Promise<T> {
  const res = await post("/api/ai/generate", body, signal);
  return (await res.json()) as T;
}

export async function aiVision(body: VisionRequest, signal?: AbortSignal): Promise<VisionResult> {
  const res = await post("/api/ai/vision", body, signal);
  return (await res.json()) as VisionResult;
}

/** קורא את זרם ה-NDJSON של השיחה ומעביר כל קטע טקסט ל-onDelta. מחזיר את הטקסט המלא. */
export async function aiChatStream(body: ChatRequest, onDelta: (chunk: string, full: string) => void, signal?: AbortSignal): Promise<string> {
  const res = await post("/api/ai/chat", body, signal);
  if (!res.body) throw new AiClientError("upstream", "התשובה התקבלה ריקה. נסה שוב.", 502);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let full = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line) continue;
      const ev = JSON.parse(line) as { t: "delta"; v: string } | { t: "done" } | { t: "error"; code: string; message: string };
      if (ev.t === "delta") {
        full += ev.v;
        onDelta(ev.v, full);
      } else if (ev.t === "error") {
        throw new AiClientError(ev.code, ev.message, 502);
      }
    }
  }
  if (!full.trim()) throw new AiClientError("bad_output", "ה-AI לא החזיר תשובה. נסה שוב.", 502);
  return full;
}
