import { describe, expect, it } from "vitest";
import { safeNext } from "@/lib/safe-redirect";

describe("safeNext (post-login redirect target)", () => {
  it("keeps ordinary same-site paths, queries and fragments", () => {
    for (const ok of ["/dashboard", "/games/abc123", "/games/abc?tab=2&x=%D7%A9", "/billing/success?session_id=cs_test_1", "/create#top"]) {
      expect(safeNext(ok)).toBe(ok);
    }
    expect(safeNext(["/account", "/x"])).toBe("/account");
  });

  it("falls back for missing, absolute, scheme-relative and backslash targets", () => {
    for (const bad of [undefined, null, "", "dashboard", "https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)", "/redirect?u=http://evil.example"]) {
      expect(safeNext(bad as string | undefined)).toBe("/dashboard");
    }
  });

  it("rejects the tab/newline trick: browsers strip them, so '/\\t/evil.example' becomes '//evil.example'", () => {
    // Prove the premise with the platform's own URL parser, then check that safeNext refuses every variant.
    expect(new URL("/\t/evil.example", "https://app.example").host).toBe("evil.example");
    for (const bad of ["/\t/evil.example", "/\n/evil.example", "/\r/evil.example", "/\t\t/evil.example", "/ok/\u0000/x", "/a\\b", "/\u007F"]) {
      expect(safeNext(bad, "/home")).toBe("/home");
    }
  });
});
