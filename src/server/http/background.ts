import "server-only";
import { after } from "next/server";

/**
 * Run work after the HTTP response has been sent while keeping the serverless/Node request alive until it
 * finishes (Next.js `after`). Outside a request scope (scripts, tests) it simply starts the promise.
 * A crashed or stuck background task never holds a credit: jobs carry a deadline and are reaped.
 */
export function runInBackground(task: () => Promise<unknown>): void {
  const safe = () =>
    task().catch((err) => {
      console.error("[background] task failed:", err);
    });
  try {
    after(safe);
  } catch {
    void safe();
  }
}
