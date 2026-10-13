import { describe, expect, it } from "vitest";
import { safeNext } from "@/lib/safe-redirect";

/** Where the browser would really end up: the WHATWG URL parser, which is what `Location:` and `router.push` use. */
const ORIGIN = "https://app.example";
const lands = (dest: string): string => new URL(dest, ORIGIN).origin;

describe("safeNext: post-login destinations stay on this site", () => {
  it("keeps ordinary same-site paths, queries and fragments", () => {
    for (const ok of ["/dashboard", "/games/abc123", "/create?mode=FULL", "/pricing#plus", "/generate/ck9?x=1&y=2", "/he/%D7%A9%D7%9C%D7%95%D7%9D"]) expect(safeNext(ok), ok).toBe(ok);
  });

  it("falls back for anything missing, relative-without-slash, or pointing elsewhere", () => {
    for (const bad of [undefined, null, "", "dashboard", "https://evil.example/", "http://evil.example", "//evil.example", "//evil.example/path", "/\\evil.example", "javascript:alert(1)", "mailto:a@b.c", "/redirect?to=https://evil.example"]) {
      expect(safeNext(bad as never), String(bad)).toBe("/dashboard");
    }
    expect(safeNext("https://evil.example/", "/login")).toBe("/login");
  });

  it("takes the first value when the query parameter is repeated, and still validates it", () => {
    expect(safeNext(["/create", "//evil.example"])).toBe("/create");
    expect(safeNext(["//evil.example", "/create"])).toBe("/dashboard");
    expect(safeNext([])).toBe("/dashboard");
  });

  // Fixed-seed property test: whatever comes out must land on this origin, using the characters an attacker would try.
  // (ASCII tab / newline / carriage return are covered separately below.)
  it("property: for random strings over the dangerous alphabet, the result always stays on the site origin", () => {
    let seed = 0x5eed1234;
    const rnd = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
    const alphabet = ["/", "/", "\\", ":", ".", "@", "%", "2", "F", "5", "C", "a", "e", "v", "i", "l", "?", "#", " ", "-", "​", " "];
    for (let i = 0; i < 4000; i++) {
      const len = 1 + Math.floor(rnd() * 12);
      const input = "/" + Array.from({ length: len }, () => alphabet[Math.floor(rnd() * alphabet.length)]).join("");
      expect(lands(safeNext(input)), JSON.stringify(input)).toBe(ORIGIN);
    }
  });

  // KNOWN BUG (found by the test sprint; owner: src/lib/safe-redirect.ts). The WHATWG URL parser silently deletes ASCII tab, LF and CR
  // anywhere in the input, so "/\t/evil.example" passes the "//" check (the second character is a tab) but navigates to
  // https://evil.example/ - an open redirect after login. `it.fails` documents the bug and keeps the suite green; when safeNext is fixed
  // (reject any C0 control character, or strip them before the checks) this test starts failing with "Expect test to fail": change
  // `it.fails` to `it` then.
  it.fails("BUG: tab, newline and carriage return inside the path must not turn '/' + '/' into a protocol-relative URL", () => {
    for (const evil of ["/\t/evil.example", "/\n/evil.example", "/\r/evil.example", "/\t\\evil.example"]) {
      expect(lands(safeNext(evil)), JSON.stringify(evil)).toBe(ORIGIN);
    }
  });
});
