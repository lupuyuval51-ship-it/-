import { describe, expect, it } from "vitest";
import { DICTIONARIES, makeT, type DictKey } from "@/lib/i18n";
import { app } from "@/lib/i18n/dict/app";
import { common } from "@/lib/i18n/dict/common";
import { game } from "@/lib/i18n/dict/game";
import { mobile } from "@/lib/i18n/dict/mobile";
import { site } from "@/lib/i18n/dict/site";

/**
 * `defineDict` makes a missing key a compile error, but three things escape the type checker and silently break one language:
 *  - the same key defined in two dictionary files (the later spread wins, one translation is dead),
 *  - a `{placeholder}` that exists in one language only (the other language prints the raw text or an empty hole),
 *  - a Hebrew string that was left in English (or English text that was pasted into Hebrew).
 */
const files = { common, game, site, app, mobile } as const;
const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
const HEBREW = /[֐-׿]/;
const LATIN_WORD = /[A-Za-z]{3,}/;

const { en, he } = DICTIONARIES;
const keys = Object.keys(en) as DictKey[];

describe("i18n dictionaries: he and en are the same dictionary", () => {
  it("both languages have exactly the same keys", () => {
    expect(Object.keys(he).sort()).toEqual([...keys].sort());
  });

  it("no key is defined in two dictionary files (a later spread would silently replace the earlier translation)", () => {
    const owner = new Map<string, string>();
    const clashes: string[] = [];
    for (const [file, dict] of Object.entries(files)) {
      for (const k of Object.keys(dict.en)) {
        const first = owner.get(k);
        if (first) clashes.push(`${k} (${first} and ${file})`);
        else owner.set(k, file);
      }
    }
    expect(clashes).toEqual([]);
  });

  it("every key has the same {placeholders} in Hebrew and English", () => {
    const mismatched = keys.filter((k) => placeholders(en[k]).join() !== placeholders(he[k]).join()).map((k) => `${k}: en ${JSON.stringify(placeholders(en[k]))} vs he ${JSON.stringify(placeholders(he[k]))}`);
    expect(mismatched).toEqual([]);
  });

  it("no string is empty and none has a stray or unbalanced brace", () => {
    const bad: string[] = [];
    for (const lang of ["en", "he"] as const) {
      for (const k of keys) {
        const v = DICTIONARIES[lang][k];
        if (v.trim() === "") bad.push(`${lang}.${k} is empty`);
        const stripped = v.replace(/\{\w+\}/g, "");
        if (/[{}]/.test(stripped)) bad.push(`${lang}.${k} has a stray brace: ${v}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it("English strings contain no Hebrew letters (except the language's own name in the language picker)", () => {
    const endonyms = new Set<string>(["lang.he"]); // shown as "עברית" in both languages, so a reader can find their own language
    expect(keys.filter((k) => HEBREW.test(en[k]) && !endonyms.has(k))).toEqual([]);
  });

  it("Hebrew strings are translated: any string with a real English word also has Hebrew letters, apart from a short list of brand/code terms", () => {
    // Strings that are legitimately Latin in Hebrew UI: the product name, plan names and the English endonym. Anything new must be deliberate.
    const untranslatedOk = new Set<string>(["app.name", "lang.en", "plan.PLUS", "plan.PRO", "footer.rights", "nav.account", "acc.title", "acc.methods.google"]);
    const untranslated = keys.filter((k) => !HEBREW.test(he[k]) && LATIN_WORD.test(he[k].replace(/\{\w+\}/g, "")) && !untranslatedOk.has(k));
    // Report the key and the text so a failure says exactly what to translate.
    expect(untranslated.map((k) => `${k}: ${he[k]}`)).toEqual([]);
  });

  it("the translator fills every placeholder in both languages and leaves no brace behind", () => {
    const tEn = makeT(en);
    const tHe = makeT(he);
    for (const k of keys) {
      const params = Object.fromEntries(placeholders(en[k]).map((p) => [p, "X1"]));
      for (const out of [tEn(k, params), tHe(k, params)]) expect(out, k).not.toMatch(/\{\w+\}/);
    }
  });

  it("an unknown key falls back to the key itself instead of throwing or printing 'undefined'", () => {
    const t = makeT(en);
    expect(t("definitely.not.a.key" as DictKey)).toBe("definitely.not.a.key");
  });
});
