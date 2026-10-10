import "server-only";
import { headers } from "next/headers";
import { getCurrentUser } from "./auth/current";
import { getEnv } from "./env";

/**
 * Region used to DISPLAY prices. A signed-in user's saved region always wins (and is what checkout charges).
 * For visitors it is a best-effort guess from CDN geo headers (only when running behind a trusted proxy) or the
 * browser language; registration lets the person choose explicitly.
 */
export async function getRegion(): Promise<string | null> {
  const user = await getCurrentUser();
  if (user?.country) return user.country;
  const h = await headers();
  if (getEnv().TRUST_PROXY) {
    const c = h.get("x-vercel-ip-country") ?? h.get("cf-ipcountry");
    if (c && /^[A-Za-z]{2}$/.test(c)) return c.toUpperCase();
  }
  const lang = h.get("accept-language") ?? "";
  if (/-IL\b/i.test(lang) || /^\s*he\b/i.test(lang)) return "IL";
  return null;
}
