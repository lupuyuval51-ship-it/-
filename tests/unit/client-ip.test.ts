import { afterEach, describe, expect, it } from "vitest";
import { resetEnvForTests } from "@/server/env";
import { getClientIp } from "@/server/http/client-ip";

const KEYS = ["TRUST_PROXY", "TRUSTED_PROXY_HOPS"] as const;
const saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));
afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
  resetEnvForTests();
});

function ip(headers: Record<string, string>, env: { TRUST_PROXY?: string; TRUSTED_PROXY_HOPS?: string } = { TRUST_PROXY: "true" }): string {
  delete process.env.TRUST_PROXY;
  delete process.env.TRUSTED_PROXY_HOPS;
  Object.assign(process.env, env);
  resetEnvForTests();
  return getClientIp(new Headers(headers));
}

describe("client IP for rate limiting", () => {
  it("ignores every forwarding header unless TRUST_PROXY is on (one shared bucket instead of attacker-chosen ones)", () => {
    expect(ip({ "x-forwarded-for": "1.2.3.4", "x-real-ip": "5.6.7.8" }, { TRUST_PROXY: "false" })).toBe("unknown");
  });

  it("believes the entry our own proxy appended, not the client-supplied left end (Cloudflare / nginx append to what the client sent)", () => {
    // the attacker sends X-Forwarded-For: 203.0.113.77 ; the proxy appends the address it actually saw
    expect(ip({ "x-forwarded-for": "203.0.113.77, 198.51.100.9" })).toBe("198.51.100.9");
    // every spoofed value maps to the SAME bucket, because only the proxy-added entry counts
    const a = ip({ "x-forwarded-for": "1.1.1.1, 198.51.100.9" });
    const b = ip({ "x-forwarded-for": "2.2.2.2, 3.3.3.3, 198.51.100.9" });
    expect(a).toBe(b);
  });

  it("a proxy that overwrites the header (a single entry) works unchanged", () => {
    expect(ip({ "x-forwarded-for": "198.51.100.9" })).toBe("198.51.100.9");
    expect(ip({ "x-forwarded-for": "2001:db8::7" })).toBe("2001:db8::7");
  });

  it("TRUSTED_PROXY_HOPS counts proxies we own (CDN in front of a load balancer)", () => {
    const xff = { "x-forwarded-for": "spoofed, 198.51.100.9, 10.0.0.5" };
    expect(ip(xff, { TRUST_PROXY: "true", TRUSTED_PROXY_HOPS: "2" })).toBe("198.51.100.9");
    expect(ip(xff, { TRUST_PROXY: "true", TRUSTED_PROXY_HOPS: "1" })).toBe("10.0.0.5");
    // a short list never indexes out of range
    expect(ip({ "x-forwarded-for": "198.51.100.9" }, { TRUST_PROXY: "true", TRUSTED_PROXY_HOPS: "3" })).toBe("198.51.100.9");
    expect(ip({ "x-forwarded-for": "198.51.100.9" }, { TRUST_PROXY: "true", TRUSTED_PROXY_HOPS: "" })).toBe("198.51.100.9");
  });

  it("strips ports and brackets so one client cannot get a bucket per connection, and refuses non-IP junk", () => {
    expect(ip({ "x-forwarded-for": "198.51.100.9:51234" })).toBe("198.51.100.9");
    expect(ip({ "x-forwarded-for": "[2001:DB8::7]:443" })).toBe("2001:db8::7");
    for (const junk of ["not-an-ip", "1.2.3.4 evil", "<script>", "a".repeat(100), "[::1"]) {
      expect(ip({ "x-forwarded-for": junk })).toBe("unknown");
    }
  });

  it("falls back to X-Real-IP only when there is no X-Forwarded-For", () => {
    expect(ip({ "x-real-ip": "198.51.100.9" })).toBe("198.51.100.9");
    expect(ip({ "x-real-ip": "6.6.6.6", "x-forwarded-for": "198.51.100.10" })).toBe("198.51.100.10");
    expect(ip({})).toBe("unknown");
  });
});
