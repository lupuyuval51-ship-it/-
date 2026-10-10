/** Only same-site relative paths are allowed as post-login destinations (prevents open redirects). */
export function safeNext(next: string | string[] | undefined | null, fallback = "/dashboard"): string {
  const v = Array.isArray(next) ? next[0] : next;
  if (!v || !v.startsWith("/") || v.startsWith("//") || v.startsWith("/\\") || v.includes("://")) return fallback;
  return v;
}
