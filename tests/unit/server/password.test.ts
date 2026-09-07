import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/server/auth/password";

describe("password hashing", () => {
  it("round-trips a password with a fresh salt each time", async () => {
    const a = await hashPassword("s3cret-pass");
    const b = await hashPassword("s3cret-pass");
    expect(a).not.toEqual(b);
    expect(a.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("s3cret-pass", a)).toBe(true);
    expect(await verifyPassword("s3cret-pass", b)).toBe(true);
  });

  it("rejects wrong passwords and malformed hashes", async () => {
    const h = await hashPassword("s3cret-pass");
    expect(await verifyPassword("s3cret-pasS", h)).toBe(false);
    expect(await verifyPassword("", h)).toBe(false);
    expect(await verifyPassword("s3cret-pass", "not-a-hash")).toBe(false);
    expect(await verifyPassword("s3cret-pass", "scrypt$16384$8$1$AAAA$")).toBe(false);
  });

  it("normalizes unicode so composed and decomposed forms match", async () => {
    const h = await hashPassword("café-password");
    expect(await verifyPassword("café-password", h)).toBe(true);
  });
});
