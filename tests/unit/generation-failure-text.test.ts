import { describe, expect, it } from "vitest";
import { failureText } from "@/components/create/GenerationProgress";
import { DICTIONARIES, makeT } from "@/lib/i18n";

describe("extension failures are told in the interface language", () => {
  for (const locale of ["he", "en", "es"] as const) {
    it(`${locale}: EXTEND_CONFLICT and NO_EXTENSION have their own text, not the server's English`, () => {
      const t = makeT(DICTIONARIES[locale]);
      for (const code of ["EXTEND_CONFLICT", "NO_EXTENSION"] as const) {
        const text = failureText({ code, message: "SERVER-ENGLISH-TEXT" }, t as never);
        expect(text).toBe(DICTIONARIES[locale][`gen.err.${code}`]);
        expect(text).not.toContain("SERVER-ENGLISH-TEXT");
      }
      expect(DICTIONARIES[locale]["create.error.extendFull"].length).toBeGreaterThan(20);
    });
  }

  it("a failure the page does not know keeps the server's message (the material refusal is already in the game's language)", () => {
    const t = makeT(DICTIONARIES.he);
    expect(failureText({ code: "MATERIAL_UNUSABLE", message: "החומר שלכם מספיק רק לשאלה אחת." }, t as never)).toBe("החומר שלכם מספיק רק לשאלה אחת.");
  });
});
