import "server-only";
import { getEnv } from "../env";

/** A plausible IP literal (v4 or v6), with a port or IPv6 brackets removed; anything else is not used as a rate-limit key. */
function normalizeIp(raw: string): string | null {
  let ip = raw.trim();
  if (ip.startsWith("[")) {
    const end = ip.indexOf("]");
    if (end === -1) return null;
    ip = ip.slice(1, end);
  } else if (/^\d{1,3}(\.\d{1,3}){3}:\d{1,5}$/.test(ip)) {
    ip = ip.slice(0, ip.lastIndexOf(":")); // some load balancers append the client's source port
  }
  return /^[0-9a-fA-F:.]{2,45}$/.test(ip) ? ip.toLowerCase() : null;
}

/**
 * Best-effort client IP for rate limiting. Forwarding headers are only honoured when TRUST_PROXY=true,
 * i.e. the deployment sits behind proxies we control; otherwise a spoofed header would let an attacker mint
 * unlimited rate-limit buckets.
 *
 * Proxies APPEND the address they saw to whatever `X-Forwarded-For` the client sent (nginx's
 * `$proxy_add_x_forwarded_for`, Cloudflare, most load balancers), so the LEFT end of the list is attacker-controlled:
 * `X-Forwarded-For: 203.0.113.<anything>` would be a fresh bucket per request. Only the entry added by our own
 * trusted proxy can be believed, and that is `TRUSTED_PROXY_HOPS` entries from the RIGHT (default 1: a single proxy
 * in front of the app, which is also what a proxy that overwrites the header, like Vercel, produces).
 */
export function getClientIp(headers: Headers): string {
  const env = getEnv();
  if (env.TRUST_PROXY) {
    const entries = (headers.get("x-forwarded-for") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (entries.length) {
      const ip = normalizeIp(entries[Math.max(0, entries.length - env.TRUSTED_PROXY_HOPS)]!);
      if (ip) return ip;
    } else {
      const ip = normalizeIp(headers.get("x-real-ip") ?? "");
      if (ip) return ip;
    }
  }
  return "unknown";
}
