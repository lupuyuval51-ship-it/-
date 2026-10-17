import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { INPUT_LIMITS } from "@/config/limits";
import { REGIONS, regionLabel } from "@/lib/regions";
import { countrySchema, emailSchema, loginSchema, passwordSchema, registerSchema } from "@/lib/schemas/auth";
import { stableStringify } from "@/lib/game/util/stable";
import { getClientIp } from "@/server/http/client-ip";
import { resetEnvForTests } from "@/server/env";

describe("getClientIp: forwarding headers are trusted only behind a proxy you control", () => {
  const original = process.env.TRUST_PROXY;
  beforeEach(() => resetEnvForTests());
  afterEach(() => {
    if (original === undefined) delete process.env.TRUST_PROXY;
    else process.env.TRUST_PROXY = original;
    resetEnvForTests();
  });
  const headers = (h: Record<string, string>) => new Headers(h);

  it("TRUST_PROXY=false: a spoofed X-Forwarded-For can never mint a new rate-limit bucket", () => {
    process.env.TRUST_PROXY = "false";
    resetEnvForTests();
    expect(getClientIp(headers({ "x-forwarded-for": "6.6.6.6", "x-real-ip": "7.7.7.7" }))).toBe("unknown");
    expect(getClientIp(headers({}))).toBe("unknown");
  });

  it("TRUST_PROXY=true: the entry our own proxy added (the last one by default), then X-Real-IP, trimmed", () => {
    process.env.TRUST_PROXY = "true";
    resetEnvForTests();
    // a proxy appends the address it saw: the left end is whatever the client claimed, so only the right end is believed
    expect(getClientIp(headers({ "x-forwarded-for": " 6.6.6.6 , 203.0.113.9 " }))).toBe("203.0.113.9");
    expect(getClientIp(headers({ "x-forwarded-for": "203.0.113.9" }))).toBe("203.0.113.9");
    expect(getClientIp(headers({ "x-real-ip": "198.51.100.4" }))).toBe("198.51.100.4");
    expect(getClientIp(headers({ "x-forwarded-for": "203.0.113.9", "x-real-ip": "198.51.100.4" }))).toBe("203.0.113.9");
    expect(getClientIp(headers({}))).toBe("unknown");
  });

  it("TRUST_PROXY=true: a value that is not an IP address never becomes a bucket key", () => {
    process.env.TRUST_PROXY = "true";
    resetEnvForTests();
    expect(getClientIp(headers({ "x-forwarded-for": "9".repeat(65) }))).toBe("unknown");
    expect(getClientIp(headers({ "x-forwarded-for": "not-an-ip" }))).toBe("unknown");
  });
});

describe("auth input schemas", () => {
  it("emails are trimmed, lower-cased and bounded", () => {
    expect(emailSchema.parse("  Ada@Example.COM ")).toBe("ada@example.com");
    expect(emailSchema.safeParse("not-an-email").success).toBe(false);
    expect(emailSchema.safeParse(`${"a".repeat(INPUT_LIMITS.emailMax)}@x.io`).success).toBe(false);
  });

  it("passwords: length window and a minimum of 4 distinct characters", () => {
    expect(passwordSchema.safeParse("a".repeat(INPUT_LIMITS.passwordMin - 1)).success).toBe(false);
    expect(passwordSchema.safeParse("abcdefghij").success).toBe(true);
    expect(passwordSchema.safeParse("a".repeat(INPUT_LIMITS.passwordMin)).success).toBe(false); // too repetitive
    expect(passwordSchema.safeParse("abababababab").success).toBe(false); // 2 distinct characters
    expect(passwordSchema.safeParse("abcabcabcabc").success).toBe(false); // 3 distinct characters
    expect(passwordSchema.safeParse("abcdabcdabcd").success).toBe(true);
    expect(passwordSchema.safeParse("x1".repeat(INPUT_LIMITS.passwordMax / 2 + 1)).success).toBe(false); // over the max
  });

  it("registration: locale defaults to Hebrew, country is a two-letter code upper-cased, display name is required", () => {
    const base = { email: "a@b.co", password: "correct horse", displayName: " Ada " };
    expect(registerSchema.parse(base)).toMatchObject({ locale: "he", displayName: "Ada" });
    expect(registerSchema.parse({ ...base, country: "il" }).country).toBe("IL");
    expect(registerSchema.safeParse({ ...base, country: "ISR" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, locale: "fr" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, displayName: "   " }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, displayName: "x".repeat(INPUT_LIMITS.nameMax + 1) }).success).toBe(false);
    expect(countrySchema.safeParse("1A").success).toBe(false);
  });

  it("login accepts any existing password up to the maximum (an old, weak password must still be able to sign in)", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
    expect(loginSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "a@b.co", password: "x".repeat(INPUT_LIMITS.passwordMax + 1) }).success).toBe(false);
  });
});

describe("regions", () => {
  it("region codes are unique, and labels fall back to 'Other' for unknown codes", () => {
    expect(REGIONS.map((r) => r.code)).toContain("IL");
    expect(new Set(REGIONS.map((r) => r.code)).size).toBe(REGIONS.length);
    expect(regionLabel("IL", "en")).toBe("Israel");
    expect(regionLabel("IL", "he")).toBe("ישראל");
    expect(regionLabel("OTHER", "en")).toBe("Other");
    expect(regionLabel(null, "he")).toBe("אחר");
    expect(regionLabel("ZZ", "en")).toBe("Other");
  });
});

describe("stableStringify (used to compare jsonb that PostgreSQL re-orders)", () => {
  it("is independent of key order, at any depth, and keeps array order", () => {
    expect(stableStringify({ b: 1, a: { d: [3, 2, 1], c: null } })).toBe(stableStringify({ a: { c: null, d: [3, 2, 1] }, b: 1 }));
    expect(stableStringify([1, 2])).not.toBe(stableStringify([2, 1]));
    expect(stableStringify({ a: 1 })).not.toBe(stableStringify({ a: "1" }));
  });
});
