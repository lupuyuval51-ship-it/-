/** Talk to the service worker over a MessageChannel (see client/public/sw.js). Resolves null when there is no active SW. */
export async function swRequest<T>(msg: { type: 'video-cache-size' | 'clear-video-cache' | 'set-video-budget'; mb?: number }): Promise<T | null> {
  const sw = typeof navigator !== 'undefined' ? navigator.serviceWorker : undefined;
  if (!sw) return null;
  let target: ServiceWorker | null | undefined = sw.controller;
  if (!target) { try { target = (await sw.getRegistration?.())?.active; } catch { target = null; } }
  if (!target) return null;
  return new Promise<T | null>((resolve) => {
    const ch = new MessageChannel();
    const timer = setTimeout(() => resolve(null), 4000);
    ch.port1.onmessage = (e: MessageEvent) => { clearTimeout(timer); resolve(e.data as T); };
    target.postMessage(msg, [ch.port2]);
  });
}
export const bytesToMb = (b: number): number => Math.round((b / (1024 * 1024)) * 10) / 10;
export const BUDGETS_MB = [100, 300, 600, 1000] as const;
const BUDGET_KEY = 'lf_video_budget_mb';
export function storedBudget(): number { try { const n = Number(localStorage.getItem(BUDGET_KEY)); return (BUDGETS_MB as readonly number[]).includes(n) ? n : 300; } catch { return 300; } }
export function storeBudget(mb: number): void { try { localStorage.setItem(BUDGET_KEY, String(mb)); } catch { /* ignore */ } }
