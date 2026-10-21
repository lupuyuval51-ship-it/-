import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { GAME_FEATURES } from "@/config/plans";
import { CHALLENGE_TYPES, DIFFICULTIES, ENVIRONMENTS, GAME_TYPES, GENERATION_MODES, LAYOUTS, MECHANICS } from "@/lib/game/spec/constants";
import { TOPIC_CATEGORIES } from "@/lib/game/topics/types";
import { contentLangOf, DEFAULT_LOCALE, DICTIONARIES, dirOf, isLocale, LOCALES, makeT, type DictKey } from "@/lib/i18n";

/**
 * Guards on the three interface dictionaries that the existing parity tests do not give: texts that are looked up through a key built at
 * run time (the casts `t(\`ach.${id}\` as DictKey)` switch the compiler's check off), and the typography rules of AGENTS.md that
 * apply to every string (no `<` or `>` in Hebrew, prices only in shekels, Spanish questions and exclamations opened with their
 * inverted marks). Each rule was checked against the current dictionaries first; they all hold today, so a failure is a new string.
 */

const entries = (locale: (typeof LOCALES)[number]) => Object.entries(DICTIONARIES[locale]) as [string, string][];

// ───────────── texts looked up by a key built at run time ─────────────

describe("every value of a closed vocabulary has its text in every language", () => {
  const achievements = [...readFileSync(path.resolve(import.meta.dirname, "../../src/lib/game/state/progress.ts"), "utf8").matchAll(/\bgrant\("([a-z_0-9]+)"/g)].map((m) => m[1]!);

  /** The dictionary keys the UI builds from each vocabulary (where they are built is named, so a failure says where to look). */
  const built: Record<string, string[]> = {
    "mechanic.* (game page, create form)": MECHANICS.map((m) => `mechanic.${m}`),
    "layout.* (game page)": LAYOUTS.map((l) => `layout.${l}`),
    "env.* (game page)": ENVIRONMENTS.map((e) => `env.${e}`),
    "challengeType.* (game page)": CHALLENGE_TYPES.map((c) => `challengeType.${c}`),
    "gameType.* (cards, game page)": GAME_TYPES.map((g) => `gameType.${g}`),
    "difficulty.* (cards, course screen, library)": DIFFICULTIES.map((d) => `difficulty.${d}`),
    "mode.* and create.mode.*.desc (create form)": GENERATION_MODES.flatMap((m) => [`mode.${m}`, `create.mode.${m}.desc`]),
    "topics.cat.* (picker, first-run questions, library)": TOPIC_CATEGORIES.map((c) => `topics.cat.${c}`),
    "ach.* and ach.*.desc (results, achievement toast)": achievements.flatMap((a) => [`ach.${a}`, `ach.${a}.desc`]),
    "plan.* (pricing, locks)": ["FREE", "PLUS", "PRO"].map((p) => `plan.${p}`),
    "block.* (the program answer, revealed)": ["move", "left", "right", "repeat", "if", "else"].map((b) => `block.${b}`),
    "res.next.* (results)": ["review", "replay", "new"].map((n) => `res.next.${n}`),
    "feat.* (pricing: what a level adds)": GAME_FEATURES.map((f) => `feat.${f.replace(":", ".")}`),
    "gen.stage.* (generation progress)": ["starting", "queued", "generate", "blueprint", "content", "extend", "validate", "repair", "save", "done", "failed"].map((s) => `gen.stage.${s}`),
    "det.rev.* (version history)": ["create", "edit", "extend", "restore"].map((r) => `det.rev.${r}`),
    "acc.sub.status.* (account)": ["INCOMPLETE", "INCOMPLETE_EXPIRED", "TRIALING", "ACTIVE", "PAST_DUE", "CANCELED", "UNPAID", "PAUSED"].map((s) => `acc.sub.status.${s}`),
  };

  it("the achievements the engine can grant are found in its source (the list below would otherwise be empty)", () => {
    expect(achievements.length).toBeGreaterThanOrEqual(9);
    expect(achievements).toContain("first_try");
    expect(achievements).toContain("boss_slayer");
  });

  for (const [where, keys] of Object.entries(built)) {
    it(where, () => {
      expect(keys.length).toBeGreaterThan(0);
      const missing: string[] = [];
      for (const locale of LOCALES) {
        const dict = DICTIONARIES[locale] as Record<string, string>;
        for (const key of keys) if (!Object.hasOwn(dict, key) || !dict[key]!.trim()) missing.push(`${locale}:${key}`);
      }
      expect(missing).toEqual([]);
    });
  }
});

// ───────────── typography rules that apply to every string ─────────────

describe("typography rules of every dictionary string", () => {
  it("no Hebrew string has < or > (a right-to-left line mirrors them, so “a < b” reads as “a > b”)", () => {
    expect(entries("he").filter(([, v]) => /[<>]/.test(v)).map(([k]) => k)).toEqual([]);
  });

  it("prices are in shekels only: no other currency symbol or code in any language", () => {
    const other = /[$€£¥]|\b(?:USD|EUR|GBP)\b|(?<![֐-׿])דולר|dollars?\b|dólares?\b|\beuros?\b/i;
    const bad = LOCALES.flatMap((l) => entries(l).filter(([, v]) => other.test(v)).map(([k]) => `${l}:${k}`));
    expect(bad).toEqual([]);
  });

  it("no string carries markup, an HTML entity, a literal escape or a replacement character (React prints them as typed)", () => {
    const junk = /<\/?[a-z][^>]*>|&(?:amp|lt|gt|nbsp|quot|apos|#\d+);|\\[nu"]|�/i;
    const bad = LOCALES.flatMap((l) => entries(l).filter(([, v]) => junk.test(v)).map(([k]) => `${l}:${k}`));
    expect(bad).toEqual([]);
  });

  it("no string hides an invisible direction mark or a non-breaking space (they survive copy and paste and break the line's order)", () => {
    const hidden = /[‎‏‪-‮⁦-⁩ ]/;
    const bad = LOCALES.flatMap((l) => entries(l).filter(([, v]) => hidden.test(v)).map(([k]) => `${l}:${k}`));
    expect(bad).toEqual([]);
  });

  it("no string starts or ends with a space, except the three fragments that join a list of offers", () => {
    const joiners = new Set(["offer.sep", "offer.and", "offer.and.unlimited"]);
    const bad = LOCALES.flatMap((l) => entries(l).filter(([k, v]) => !joiners.has(k) && v !== v.trim()).map(([k]) => `${l}:${k}`));
    expect(bad).toEqual([]);
  });

  it("the join fragments really do join (a space or a comma-space on the side that meets the next word)", () => {
    for (const l of LOCALES) {
      const d = DICTIONARIES[l];
      expect(d["offer.sep"], l).toMatch(/,\s$/);
      expect(d["offer.and"], l).toMatch(/\s$|-$/); // Hebrew "ו-5": the hyphen is the join
      expect(d["offer.and.unlimited"], l).toMatch(/\S/);
    }
  });

  it("Spanish questions and exclamations open with ¿ and ¡ (and only Spanish uses them)", () => {
    const bad: string[] = [];
    for (const [k, v] of entries("es")) {
      if ((v.match(/\?/g) ?? []).length !== (v.match(/¿/g) ?? []).length) bad.push(`es:${k}: ${v}`);
      if ((v.match(/!/g) ?? []).length !== (v.match(/¡/g) ?? []).length) bad.push(`es:${k}: ${v}`);
    }
    for (const l of ["he", "en"] as const) for (const [k, v] of entries(l)) if (/[¿¡]/.test(v)) bad.push(`${l}:${k}`);
    expect(bad).toEqual([]);
  });

  it("Spanish has no Hebrew letters (the language's own name in the picker is the one exception)", () => {
    expect(entries("es").filter(([k, v]) => k !== "lang.he" && /[֐-׿]/.test(v)).map(([k]) => k)).toEqual([]);
  });
});

// ───────────── the languages themselves ─────────────

describe("the language list", () => {
  it("is Hebrew first (the product default), then English, then Spanish", () => {
    expect([...LOCALES]).toEqual(["he", "en", "es"]);
    expect(DEFAULT_LOCALE).toBe("he");
  });

  it("only the exact codes are languages (a region tag, another case or a non-string is not)", () => {
    for (const l of LOCALES) expect(isLocale(l)).toBe(true);
    for (const v of ["HE", "he-IL", "en-US", "fr", "", " he", null, undefined, 0, {}, ["he"]]) expect(isLocale(v), String(v)).toBe(false);
  });

  it("Hebrew is the only right-to-left interface; Spanish and English learn Hebrew content only as English", () => {
    expect(LOCALES.map(dirOf)).toEqual(["rtl", "ltr", "ltr"]);
    expect(LOCALES.map(contentLangOf)).toEqual(["he", "en", "en"]);
  });

  it("each language is named in itself, identically in every dictionary (a learner must find theirs whatever language is on)", () => {
    for (const l of LOCALES) {
      expect(DICTIONARIES[l]["lang.he"]).toBe("עברית");
      expect(DICTIONARIES[l]["lang.en"]).toBe("English");
      expect(DICTIONARIES[l]["lang.es"]).toBe("Español");
    }
  });

  it("the brand is the same in every language", () => {
    for (const l of LOCALES) expect(DICTIONARIES[l]["app.name"]).toBe("LEVEL UP");
  });

  it("the translator of each language reads its own dictionary (a Spanish key never answers in English)", () => {
    const key: DictKey = "common.cancel";
    const texts = LOCALES.map((l) => makeT(DICTIONARIES[l])(key));
    expect(new Set(texts).size).toBe(3);
    expect(texts[0]).toMatch(/[֐-׿]/);
  });
});

// ───────────── the bottom tabs have little room ─────────────

describe("the bottom tab labels (a tab is a quarter of the screen and clips its label)", () => {
  const keys = ["mob.nav.home", "mob.nav.create", "mob.nav.review", "mob.nav.settings"] as const;
  for (const locale of LOCALES) {
    it(`${locale}: four different, short labels on one line`, () => {
      const labels = keys.map((k) => DICTIONARIES[locale][k]);
      expect(new Set(labels).size).toBe(4);
      for (const label of labels) {
        expect(label.length, label).toBeLessThanOrEqual(14);
        expect(label, label).not.toMatch(/\n/);
      }
    });
  }
});
