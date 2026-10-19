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

  it("the footer lists all three provenance labels, matching the badges", () => {
    for (const locale of ["en", "he"] as const) {
      const footer = DICTIONARIES[locale]["footer.demo"];
      for (const badge of ["ai.badge", "engine.badge", "catalog.badge"] as const) expect(footer).toContain(DICTIONARIES[locale][badge]);
    }
  });

  describe("Hebrew copy hygiene (the Hebrew dictionary is the product default)", () => {
    const he = Object.entries(DICTIONARIES.he);
    const en = Object.entries(DICTIONARIES.en);

    it("no Hebrew string has a space before , . ; : ! ? and no string has a double space", () => {
      // English keeps its own lists (\"Load a text file (.txt, .md)\"), so the space rule is for Hebrew only
      const bad = [...he.filter(([, v]) => / [,.;:!?]/.test(v)), ...[...he, ...en].filter(([, v]) => /\S {2,}\S/.test(v))].map(([k]) => k);
      expect(bad).toEqual([]);
    });

    it("no UI string uses an arrow character (use the Arrow component, which mirrors in RTL)", () => {
      const bad = [...he, ...en].filter(([, v]) => /[←-⇿⟵-⟷]/.test(v)).map(([k]) => k);
      expect(bad).toEqual([]);
    });

    it("Hebrew uses the Hebrew punctuation: geresh (׳) and gershayim (״), never ASCII or curly quotes", () => {
      const bad = he.filter(([, v]) => /['"“”„‘’]/.test(v)).map(([k]) => k);
      expect(bad).toEqual([]);
    });

    it("a count is never written directly before a plural noun (\"נותרו 1 משחקים\"): it is a label (\"משחקים: {n}\") or a fraction (\"{n} מתוך {total}\")", () => {
      const COUNTED = /\{(?:n|count|games|runs|sessions|cards|added|updated|kept|shown|have|left|meters|d|target)\} ?(?:משחקים|שאלות|פריטים|ריצות|כרטיסי|נקודות|שניות|דקות|מעלות|ניסיונות|תווים|עריכות|אתגרים|משימות|אזורים|פעמים|מטרים|מטר\b|בלוקים|סיבובים|כוכבים)/;
      const bad = he.filter(([, v]) => COUNTED.test(v)).map(([k]) => k);
      expect(bad).toEqual([]);
    });

    it("no Hebrew string uses the banned phrasings that were fixed: \"נותרו {n}\" as a count, or singular second-person forms", () => {
      const BANNED = /נותרו \{n\}|(?:^|\s)(?:אתה|ניסית|רוצה|בחרת|הצלחת|שמרת|ספרת|יצרת|למדת)(?=\s|$|[.,!?])/;
      const bad = he.filter(([, v]) => BANNED.test(v)).map(([k]) => k);
      expect(bad).toEqual([]);
    });

    it("a Hebrew prefix is never glued to an inserted name (\"ב{area}\", \"מ{name}\"): names can be Latin or Hebrew", () => {
      // "ב{cell}" and "ב{list}" are fixed phrases whose inserted text always starts with a Hebrew word, so they are allowed.
      const GLUED = /(?:^|\s)[בלכמשה]\{(?!cell\}|list\})\w+\}/;
      const bad = he.filter(([, v]) => GLUED.test(v)).map(([k]) => k);
      expect(bad).toEqual([]);
    });

    it("the mistake-deck intro reads the same arrow-free way in both languages", () => {
      expect(DICTIONARIES.en["mob.deck.intro"]).not.toMatch(/→|←/);
      expect(DICTIONARIES.he["mob.deck.intro"]).not.toMatch(/→|←/);
    });
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

describe("no demo games", () => {
  it("no interface string in any language talks about a demo (older template games are labelled 'ready-made template')", () => {
    for (const locale of ["en", "he", "es"] as const) {
      for (const [key, value] of Object.entries(DICTIONARIES[locale])) {
        expect(/\bdemo\b|הדגמה|demostraci/i.test(String(value)), `${locale}:${key}`).toBe(false);
      }
    }
  });
});

describe("no deadline talk", () => {
  it("no interface string in any language announces a deadline (the product never says when something is due)", () => {
    for (const locale of ["en", "he", "es"] as const) {
      for (const [key, value] of Object.entries(DICTIONARIES[locale])) {
        expect(/דדליין|\bdeadline\b|fecha l[ií]mite/i.test(String(value)), `${locale}:${key}`).toBe(false);
      }
    }
  });
});
