import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/server/security/password";
import { sha256Hex, signToken, verifyToken } from "@/server/security/tokens";
import { readCookie } from "@/server/auth/session";

describe("password hashing", () => {
  it("verifies the right password and rejects wrong ones, with unique salts", async () => {
    const a = await hashPassword("S3cure passphrase!");
    const b = await hashPassword("S3cure passphrase!");
    expect(a).not.toEqual(b);
    expect(a.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("S3cure passphrase!", a)).toBe(true);
    expect(await verifyPassword("s3cure passphrase!", a)).toBe(false);
    expect(await verifyPassword("anything", "not-a-hash")).toBe(false);
  });
});

describe("signed tokens", () => {
  it("round-trips, rejects tampering and expiry", () => {
    const now = 1_700_000_000_000;
    const t = signToken({ sid: "abc", tier: "B" }, 60, now);
    expect(verifyToken<{ sid: string; tier: string }>(t, now + 1000)).toMatchObject({ sid: "abc", tier: "B" });
    expect(verifyToken(t, now + 61_000)).toBeNull();
    const [body, sig] = t.split(".");
    const forged = Buffer.from(JSON.stringify({ sid: "abc", tier: "A", exp: 9_999_999_999 })).toString("base64url");
    expect(verifyToken(`${forged}.${sig}`, now)).toBeNull();
    expect(verifyToken(`${body}.AAAA`, now)).toBeNull();
    expect(verifyToken("garbage", now)).toBeNull();
  });
  it("hashes deterministically", () => {
    expect(sha256Hex("x")).toBe(sha256Hex("x"));
    expect(sha256Hex("x")).toHaveLength(64);
  });
});

describe("cookie parsing", () => {
  it("reads a named cookie", () => {
    expect(readCookie("a=1; levelup_session=tok%20en; b=2", "levelup_session")).toBe("tok en");
    expect(readCookie("a=1", "levelup_session")).toBeUndefined();
    expect(readCookie(null, "x")).toBeUndefined();
  });
});
