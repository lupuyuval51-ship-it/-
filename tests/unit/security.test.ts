import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/server/security/password";
import { sha256Hex } from "@/server/security/tokens";
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

describe("tokens", () => {
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
