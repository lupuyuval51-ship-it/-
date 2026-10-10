import "server-only";
import { getEnv } from "../env";

/**
 * Best-effort client IP for rate limiting. Forwarding headers are only honoured when TRUST_PROXY=true,
 * i.e. the deployment sits behind a proxy that overwrites them; otherwise a spoofed header would let an
 * attacker mint unlimited rate-limit buckets.
 */
export function getClientIp(headers: Headers): string {
  if (getEnv().TRUST_PROXY) {
    const fwd = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const real = headers.get("x-real-ip")?.trim();
    const ip = fwd || real;
    if (ip && ip.length <= 64) return ip;
  }
  return "unknown";
}
