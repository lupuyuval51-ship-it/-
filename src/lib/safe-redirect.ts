const ORIGIN = "http://same-site.invalid";

/** Only same-site relative paths are allowed as post-login destinations (prevents open redirects). */
export function safeNext(next: string | string[] | undefined | null, fallback = "/dashboard"): string {
  const v = Array.isArray(next) ? next[0] : next;
  if (!v || !v.startsWith("/") || v.startsWith("//") || v.includes("://")) return fallback;
  // URL parsers (browsers, `Location` handling) silently DROP tab/CR/LF anywhere in the input, so "/\t/evil.example" is
  // really "//evil.example"; and they treat "\" like "/". None of these belong in a legitimate path.
  if (/[\u0000-\u001F\u007F\\]/.test(v)) return fallback;
  try {
    // Belt and braces: whatever the parser makes of it must still be on our own origin.
    if (new URL(v, ORIGIN).origin !== ORIGIN) return fallback;
  } catch {
    return fallback;
  }
  return v;
}
