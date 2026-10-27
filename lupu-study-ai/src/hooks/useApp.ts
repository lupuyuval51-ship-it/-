"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import type { AppData } from "@/types";
import { dataStore } from "@/services/data/store";
import { todayStr } from "@/lib/dates";

/** כל נתוני המשתמש. ברינדור שרת ובטעינה הראשונה מחזיר מבנה ריק (ראה useReady) */
export function useData(): AppData {
  return useSyncExternalStore(dataStore.subscribe, dataStore.getSnapshot, dataStore.getServerSnapshot);
}

/** האם הנתונים נטענו מהדפדפן – עד אז מציגים Skeleton כדי לא להבהב מצב ריק */
export function useReady(): boolean {
  useEffect(() => {
    dataStore.init();
  }, []);
  return useSyncExternalStore(
    dataStore.subscribe,
    () => dataStore.isReady(),
    () => false,
  );
}

/** תאריך היום, מתעדכן בחצות */
export function useToday(): string {
  return useSyncExternalStore(subscribeMinute, () => todayStr(), () => "2000-01-01");
}

function subscribeMinute(cb: () => void) {
  const id = setInterval(cb, 60_000);
  return () => clearInterval(id);
}

export function useSubject(id: string | null | undefined) {
  const data = useData();
  return useMemo(() => data.subjects.find((s) => s.id === id) ?? null, [data.subjects, id]);
}
