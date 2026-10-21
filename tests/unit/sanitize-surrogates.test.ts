import { describe, expect, it } from "vitest";
import { sanitizeDeep } from "@/lib/game/spec/validate";

describe("sanitizeDeep: lone surrogates", () => {
  it("drops half an emoji (it is not text and Postgres jsonb refuses it), keeps whole ones", () => {
    const half = "\uD83D"; // first half of 😀
    expect(sanitizeDeep(`Bees ${half}and honey`)).toBe("Bees and honey");
    expect(sanitizeDeep(`end\uDE00`)).toBe("end");
    expect(sanitizeDeep("Bees 😀 and honey")).toBe("Bees 😀 and honey");
    expect(sanitizeDeep({ meta: { title: `Nile${half}` }, list: [`a${half}`] })).toEqual({ meta: { title: "Nile" }, list: ["a"] });
  });
  it("the result is always well-formed text", () => {
    for (const s of ["\uD800", "\uDC00x", "x\uDBFF", "ok😀ok"]) expect((sanitizeDeep(s) as string).isWellFormed()).toBe(true);
  });
});
