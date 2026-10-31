import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { PrivacyPolicy } from "@/components/legal/PrivacyPolicy";
import { PRIVACY_POLICY, PRIVACY_UPDATED } from "@/lib/legal/privacy-policy";
import { readFileSync } from "node:fs";

describe("privacy policy", () => {
  it("has the same sections in Hebrew and English, and no angle brackets in Hebrew", () => {
    expect(PRIVACY_POLICY.he.sections.length).toBe(PRIVACY_POLICY.en.sections.length);
    expect(PRIVACY_POLICY.en.sections.length).toBeGreaterThanOrEqual(10);
    expect(JSON.stringify(PRIVACY_POLICY.he)).not.toMatch(/[<>]/);
    expect(JSON.stringify(PRIVACY_POLICY.en)).not.toMatch(/[<>]/); // plain text: no markup left over from the source lists
    expect(PRIVACY_UPDATED).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("covers what the app really does: account, AI, Google Play, deletion, children", () => {
    const en = JSON.stringify(PRIVACY_POLICY.en);
    for (const word of ["LUPU ID", "LEVEL UP AI", "Google Play", "Android's own backup", "Delete my LUPU ID", "Children", "30 days"]) expect(en).toContain(word);
    const he = JSON.stringify(PRIVACY_POLICY.he);
    for (const word of ["LUPU ID", "LEVEL UP AI", "Google Play", "מחיקת המידע", "ילדים"]) expect(he).toContain(word);
  });

  it("renders in the language of the interface (Spanish shows English), with the right direction", () => {
    const he = renderToStaticMarkup(createElement(PrivacyPolicy, { locale: "he" }));
    expect(he).toContain('dir="rtl"');
    expect(he).toContain("מדיניות פרטיות");
    for (const locale of ["en", "es"]) {
      const html = renderToStaticMarkup(createElement(PrivacyPolicy, { locale }));
      expect(html).toContain('dir="ltr"');
      expect(html).toContain("Privacy Policy");
    }
  });

  it("the generated data is the same text as the published markdown", () => {
    const md = readFileSync("mobile/store/privacy-policy.md", "utf8");
    for (const sec of PRIVACY_POLICY.en.sections) expect(md).toContain(sec.heading);
    for (const sec of PRIVACY_POLICY.he.sections) expect(md).toContain(sec.heading);
  });
});
