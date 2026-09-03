"use client";
export async function api(
  path: string,
  body?: unknown,
  method?: string,
): Promise<any> {
  const response = await fetch("/api" + path, {
    method: method || (body === undefined ? "GET" : "POST"),
    headers:
      body instanceof FormData
        ? undefined
        : { "Content-Type": "application/json" },
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
    credentials: "same-origin",
    cache: "no-store",
  });
  const data = await response
    .json()
    .catch(() => ({ error: "Network response unavailable" }));
  if (!response.ok)
    throw new Error(data.error || data.message || "Request failed");
  return data;
}
export const allTasks = (path: any): any[] =>
  path?.chapters?.flatMap((c: any) => c.tasks) || [];
export const completedIds = (enrollment: any): string[] =>
  enrollment?.completedTasks || [];
export function nextTask(path: any, enrollment: any) {
  return allTasks(path).find(
    (task) => !completedIds(enrollment).includes(task.id),
  );
}
/** Progress bars take a width, so an empty or unavailable path must read 0 rather than NaN. */
export function progressOf(enrollment: any, path: any): number {
  const total = allTasks(path).length;
  if (typeof enrollment?.progress === "number" && Number.isFinite(enrollment.progress))
    return Math.max(0, Math.min(100, enrollment.progress));
  if (!total) return 0;
  return Math.round(
    (Math.min(completedIds(enrollment).length, total) / total) * 100,
  );
}
/** An unstated year of birth must read as a minor, exactly as the server treats it. */
export function isAdult(birthYear: unknown): boolean {
  const year = Number(birthYear);
  return (
    Number.isInteger(year) &&
    year >= 1900 &&
    new Date().getFullYear() - year >= 18
  );
}
