"use client";

import { useEffect } from "react";

/** רושם Service Worker (PWA) רק בפרודקשן, כדי לא להפריע לפיתוח */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* PWA אופציונלי – כישלון רישום אינו משפיע על האפליקציה */
    });
  }, []);
  return null;
}
