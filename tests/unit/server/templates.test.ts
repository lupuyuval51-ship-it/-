import { describe, expect, it } from "vitest";
import { COACH_TEMPLATES, detectLocale, isTemplateEligible, matchTemplate, normalizeMessage } from "@/server/ai/templates";

describe("coach templates", () => {
  it("ships a basic knowledge base with answers in both languages", () => {
    expect(COACH_TEMPLATES.length).toBeGreaterThanOrEqual(25);
    for (const t of COACH_TEMPLATES) {
      expect(t.answer.he.length).toBeGreaterThan(40);
      expect(t.answer.en.length).toBeGreaterThan(40);
      expect(t.keywords.he.length + t.keywords.en.length).toBeGreaterThan(0);
    }
  });

  it("matches short basic questions in Hebrew and English", () => {
    const he = matchTemplate("מה זה handler?");
    expect(he?.template.id).toBe("role_handler");
    expect(he?.locale).toBe("he");
    expect(he?.reply).toContain("Handler");
    const en = matchTemplate("What is a stall count?", "he");
    expect(en?.template.id).toBe("stall_count");
    expect(en?.locale).toBe("en");
    expect(matchTemplate("איך אוחזים forehand?")?.template.id).toBe("grip_forehand");
    expect(matchTemplate("How do I throw a hammer")?.template.id).toBe("grip_hammer");
    expect(matchTemplate("מה לעשות ברוח חזקה?")?.template.id).toBe("wind");
  });

  it("returns null for long, unrelated or ambiguous messages", () => {
    expect(matchTemplate("x".repeat(121))).toBeNull();
    expect(matchTemplate("תכנן לי שבוע שלם עם התאמות לפי הכאב בכתף שלי ולפי מזג האוויר מחר, ותסביר מה לעשות אם אין לי קונוסים או שותף – " + "עוד טקסט ".repeat(4))).toBeNull();
    expect(matchTemplate("hello there")).toBeNull();
    expect(matchTemplate("מה קורה")).toBeNull();
    // Generic words alone never match.
    expect(matchTemplate("what")).toBeNull();
  });

  it("normalizes and detects locale", () => {
    expect(normalizeMessage("  Mah zeh, HANDLER?!  ")).toBe(" mah zeh handler ");
    expect(detectLocale("שלום", "en")).toBe("he");
    expect(detectLocale("hello", "he")).toBe("en");
    expect(detectLocale("123", "he")).toBe("he");
    expect(isTemplateEligible("what is a pivot")).toBe(true);
    expect(isTemplateEligible("tell me a story about my dog")).toBe(false);
  });
});
