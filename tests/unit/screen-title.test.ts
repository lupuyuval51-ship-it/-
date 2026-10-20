import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { APP_TITLE, screenTitle } from "../../mobile/src/screen-title";
import { DICTIONARIES } from "@/lib/i18n";

describe("document title per screen (Android app)", () => {
  it("names the screen from its heading, in every interface language", () => {
    expect(screenTitle("Settings")).toBe("Settings · LEVEL UP");
    for (const locale of ["he", "en", "es"] as const) {
      const heading = DICTIONARIES[locale]["mob.settings"];
      expect(screenTitle(heading)).toBe(`${heading} · ${APP_TITLE}`);
    }
  });

  it("is the plain app name for the home screen (its heading is the name), a screen without a heading and an empty heading", () => {
    expect(screenTitle("LEVEL UP")).toBe("LEVEL UP");
    expect(screenTitle(" LEVEL   UP ")).toBe("LEVEL UP");
    expect(screenTitle(null)).toBe("LEVEL UP");
    expect(screenTitle(undefined)).toBe("LEVEL UP");
    expect(screenTitle("  \n ")).toBe("LEVEL UP");
  });

  it("collapses the whitespace of a heading that spans several lines", () => {
    expect(screenTitle("  Fractions,\n   decimals  ")).toBe("Fractions, decimals · LEVEL UP");
  });

  it("is kept in step with the screen by App.tsx, which moves no focus for a language change", () => {
    const app = readFileSync("mobile/src/App.tsx", "utf8");
    expect(app).toMatch(/document\.title = play \? APP_TITLE : screenTitle\(/);
    // the title effect depends on the language; the focus effect does not (changing the language in Settings must not steal the focus)
    expect(app).toMatch(/\}, \[play, locale\]\);/);
    expect(app).toMatch(/\}, \[first, play\]\);/);
  });

  it("makes the screen after the questionnaire or the sign-in gate take the heading focus", () => {
    const app = readFileSync("mobile/src/App.tsx", "utf8");
    expect(app).toMatch(/const gated = needSignIn \|\| \(!setupDone && !play\);/);
    expect(app).toMatch(/if \(!gated\) return;[\s\S]*first\.current = false;/);
  });
});
