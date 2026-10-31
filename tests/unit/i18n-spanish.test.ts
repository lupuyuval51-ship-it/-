import { describe, expect, it } from "vitest";
import { DICTIONARIES, dirOf, contentLangOf, isLocale } from "@/lib/i18n";

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");

describe("Spanish interface language", () => {
  const en = DICTIONARIES.en;
  const es = DICTIONARIES.es;

  it("has exactly the English keys, each with a non-empty value and the same placeholders", () => {
    expect(Object.keys(es).sort()).toEqual(Object.keys(en).sort());
    const bad = (Object.keys(en) as (keyof typeof en)[]).filter((k) => !es[k]?.trim() || placeholders(es[k]) !== placeholders(en[k]));
    expect(bad).toEqual([]);
  });

  it("is actually translated: most values differ from English (brands, symbols and identical words aside)", () => {
    const keys = Object.keys(en) as (keyof typeof en)[];
    const same = keys.filter((k) => es[k] === en[k]);
    expect(same.length / keys.length).toBeLessThan(0.05);
  });

  it("is a left-to-right language whose learning content falls back to English", () => {
    expect(isLocale("es")).toBe(true);
    expect(dirOf("es")).toBe("ltr");
    expect(contentLangOf("es")).toBe("en");
    expect(contentLangOf("he")).toBe("he");
  });
});
