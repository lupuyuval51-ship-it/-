"use client";

import { useEffect, useSyncExternalStore } from "react";

export interface AiStatus {
  loaded: boolean;
  configured: boolean;
  model?: string;
  /** האם המודל תומך בתמונות */
  vision?: boolean;
  /** שירות Supabase מחובר בצד השרת – נדרש אימות להשתמש ב-AI */
  authRequired: boolean;
  /** לא הצלחנו להגיע לשרת (למשל אין רשת) ולכן לא ידוע אם ה-AI מחובר */
  unreachable?: boolean;
}

let status: AiStatus = { loaded: false, configured: false, authRequired: false };
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function load() {
  if (inflight) return inflight;
  inflight = fetch("/api/ai/status", { cache: "no-store" })
    .then((r) => r.json())
    .then((j: { configured: boolean; model?: string; vision?: boolean; authRequired?: boolean }) => {
      status = { loaded: true, configured: !!j.configured, model: j.model, vision: !!j.vision, authRequired: !!j.authRequired };
    })
    .catch(() => {
      // אין רשת/שרת: לא יודעים אם ה-AI מחובר. מאפשרים ניסיון, והשגיאה תהיה "אין חיבור" אמיתית ולא "AI לא מחובר" מטעה.
      status = { loaded: true, configured: true, vision: true, authRequired: false, unreachable: true };
    })
    .finally(() => {
      inflight = null;
      listeners.forEach((l) => l());
    });
  return inflight;
}

/** האם שירות ה-AI מחובר בשרת (קיים מפתח). בלי זה כל פיצ'ר AI מוצג כלא זמין עם הסבר, ולא כמזויף. */
export function useAiStatus(): AiStatus {
  useEffect(() => {
    if (!status.loaded || status.unreachable) void load();
    const retry = () => {
      if (status.unreachable) void load();
    };
    window.addEventListener("online", retry);
    return () => window.removeEventListener("online", retry);
  }, []);
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    () => status,
    () => status,
  );
}
