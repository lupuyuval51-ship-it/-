import { describe, expect, it } from "vitest";
import { DICTIONARIES } from "@/lib/i18n";
import { app } from "@/lib/i18n/dict/app";
import { common } from "@/lib/i18n/dict/common";
import { site } from "@/lib/i18n/dict/site";

const placeholders = (s: string): string[] => [...new Set([...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!))].sort();

describe("interface copy (both languages)", () => {
  it("every key uses the same {placeholders} in Hebrew and English", () => {
    const bad: string[] = [];
    for (const key of Object.keys(DICTIONARIES.en)) {
      const en = placeholders(DICTIONARIES.en[key as keyof typeof DICTIONARIES.en]);
      const he = placeholders(DICTIONARIES.he[key as keyof typeof DICTIONARIES.he]);
      if (en.join() !== he.join()) bad.push(`${key}: en {${en}} vs he {${he}}`);
    }
    expect(bad).toEqual([]);
  });

  it("no string names a model vendor (the AI is always \"LEVEL UP AI\")", () => {
    const vendor = /anthropic|claude|openai|chatgpt|\bgpt-?\d|gemini|llama|mistral|deepseek/i;
    const bad: string[] = [];
    for (const [locale, dict] of Object.entries(DICTIONARIES)) {
      for (const [key, value] of Object.entries(dict)) if (vendor.test(value)) bad.push(`${locale} ${key}`);
    }
    expect(bad).toEqual([]);
  });

  it("the website's Hebrew uses the Hebrew plan name (חינם), not the English word \"Free\"", () => {
    const bad = Object.entries({ ...common.he, ...site.he, ...app.he }).filter(([, v]) => /\bFree\b/.test(v)).map(([k]) => k);
    expect(bad).toEqual([]);
  });

  it("game pages say what built a game without printing a provider or model name", () => {
    for (const locale of ["en", "he"] as const) {
      for (const key of ["det.generator.ai", "det.generator.demo", "det.generator.engine"] as const) {
        expect(placeholders(DICTIONARIES[locale][key])).toEqual([]);
      }
    }
    expect(DICTIONARIES.en["det.generator.demo"]).toMatch(/not AI/);
    expect(DICTIONARIES.en["det.generator.engine"]).toMatch(/not AI/);
    expect(DICTIONARIES.en["det.generator.catalog"]).toMatch(/not AI/);
  });

  it("the footer lists all four provenance labels, matching the badges", () => {
    for (const locale of ["en", "he"] as const) {
      const footer = DICTIONARIES[locale]["footer.demo"];
      for (const badge of ["ai.badge", "engine.badge", "catalog.badge", "demo.badge"] as const) expect(footer).toContain(DICTIONARIES[locale][badge]);
    }
  });

  it("the example subjects and goals exist for every example button", () => {
    for (const locale of ["en", "he"] as const) {
      for (const n of [1, 2, 3, 4]) {
        expect(DICTIONARIES[locale][`create.example.${n}.subject` as keyof (typeof DICTIONARIES)["en"]].length).toBeGreaterThan(2);
        expect(DICTIONARIES[locale][`create.example.${n}.goal` as keyof (typeof DICTIONARIES)["en"]].length).toBeGreaterThan(10);
      }
    }
  });
});
