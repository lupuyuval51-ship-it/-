import { describe, expect, it } from "vitest";
import { displayCurrency, monthlyPrice, formatMoney } from "@/config/plans";
import { DICTIONARIES, makeT, type DictKey, type Dictionary } from "@/lib/i18n";
import { app } from "@/lib/i18n/dict/app";
import { common } from "@/lib/i18n/dict/common";

/**
 * Website copy that was wrong in Hebrew and English (src/lib/i18n/dict/app.ts, common.ts) and the translator itself.
 */
describe("game card counts read right for one area, mission or challenge", () => {
  const card = (locale: "he" | "en", n: number) => makeT(DICTIONARIES[locale])("lib.meta", { areas: n, missions: n, challenges: n });

  it("a one-area game (every quick game and every level C game) is not '1 areas' / '1 אזורים'", () => {
    expect(card("en", 1)).not.toMatch(/\b1 (areas|missions|challenges)\b/);
    expect(card("he", 1)).not.toMatch(/1 (אזורים|משימות|אתגרים)/);
    // a label before each count, like the rest of the Hebrew interface ("משחקים: 3")
    expect(card("en", 1)).toBe("Areas: 1 · Missions: 1 · Challenges: 1");
    expect(card("he", 3)).toBe("אזורים: 3 · משימות: 3 · אתגרים: 3");
  });

  it("a game with a single mission (the schema allows one) is not '0 of 1 missions' / '0 מתוך 1 משימות' on its page", () => {
    expect(makeT(DICTIONARIES.en)("det.progress.inProgress", { done: 0, total: 1 })).toBe("In progress. Missions complete: 0 of 1.");
    expect(makeT(DICTIONARIES.he)("det.progress.inProgress", { done: 0, total: 1 })).toBe("בתהליך. משימות שהושלמו: 0 מתוך 1.");
  });

  it("no he/en string of the app or common dictionary puts an area, mission or challenge count straight before a plural noun", () => {
    const COUNT_NOUN = /\{(?:areas|missions|challenges|done|total)\} (?:areas|missions|challenges|אזורים|משימות|אתגרים)/;
    const bad = [app, common].flatMap((d) => (["en", "he"] as const).flatMap((l) => Object.entries(d[l]).filter(([, v]) => COUNT_NOUN.test(v)).map(([k]) => `${l} ${k}`)));
    expect(bad).toEqual([]);
  });
});

describe("the account's region hint says what the region really does", () => {
  it("prices are in shekels whatever the region, so the hint never says the region picks the currency", () => {
    // the plan config is the source of truth: every region gets shekels
    for (const country of ["IL", "US", "GB", "DE", null]) expect(displayCurrency("PLUS", country)).toBe("ILS");
    expect(formatMoney(monthlyPrice("PLUS", "US").minor, monthlyPrice("PLUS", "US").currency)).toMatch(/^₪/);
    const { en, he } = DICTIONARIES;
    expect(en["acc.region.hint"]).not.toMatch(/currency/i);
    expect(he["acc.region.hint"]).not.toMatch(/מטבע/);
    expect(en["acc.region.hint"]).toContain("₪");
    expect(he["acc.region.hint"]).toContain("₪");
  });
});

describe("the create page counts games, not credits", () => {
  it("the allowance note speaks of games counted (the product has no credits; Hebrew זיכוי means a refund)", () => {
    expect(DICTIONARIES.en["create.policy"]).not.toMatch(/credit/i);
    expect(DICTIONARIES.he["create.policy"]).not.toMatch(/זיכוי/);
    expect(DICTIONARIES.en["create.policy"]).toMatch(/game/);
    expect(DICTIONARIES.he["create.policy"]).toMatch(/נספר/);
  });
});

describe("Hebrew grammar in the app and common dictionaries", () => {
  it("no Hebrew string ends with a bare preposition (a heading like 'כדאי לחזור על' stops in the middle of the phrase)", () => {
    const DANGLING = /(?:^|\s)(?:על|של|את|עם|אל|בין|לפני|אחרי)[.:]?$/;
    const bad = [app, common].flatMap((d) => Object.entries(d.he).filter(([, v]) => DANGLING.test(v.trim())).map(([k, v]) => `${k}: ${v}`));
    expect(bad).toEqual([]);
  });

  it("the review heading and the practice summary read as whole Hebrew sentences", () => {
    expect(DICTIONARIES.he["res.review"]).toBe("מה כדאי לחזור עליו");
    expect(DICTIONARIES.he["prac.done.more"]).toMatch(/^חלק מהן /);
  });
});

describe("makeT: only the dictionary's and the params' own entries are used", () => {
  const dict = { greet: "Hi {name}{constructor}", plain: "Plain" } as unknown as Dictionary;
  const t = makeT(dict);

  it("a key that is an Object.prototype member falls back to the key instead of returning a function or throwing", () => {
    expect(t("toString" as DictKey)).toBe("toString");
    expect(t("constructor" as DictKey, { n: 1 })).toBe("constructor");
    expect(t("__proto__" as DictKey, { n: 1 })).toBe("__proto__");
  });

  it("a placeholder that is an Object.prototype member prints nothing (it used to print 'function Object() { [native code] }')", () => {
    expect(t("greet" as DictKey, { name: "Dana" })).toBe("Hi Dana");
  });

  it("zero is printed, a missing or null value prints nothing, and a value with $ patterns is inserted literally", () => {
    const tEn = makeT(DICTIONARIES.en);
    expect(tEn("quota.left", { n: 0, limit: 5 })).toBe("0 of 5 left");
    expect(tEn("quota.left", { n: 2 })).toBe("2 of  left");
    expect(tEn("quota.left", { n: null as unknown as number, limit: 5 })).toBe(" of 5 left");
    expect(tEn("dash.greeting", { name: "$& $1 $$" })).toBe("Hi, $& $1 $$");
    expect(t("plain" as DictKey, { anything: 1 })).toBe("Plain");
  });

  it("the shared placeholder pattern is reusable: translating twice in a row gives the same result", () => {
    const tHe = makeT(DICTIONARIES.he);
    const once = tHe("create.allowance", { level: "B", n: 1, limit: 1 });
    expect(tHe("create.allowance", { level: "B", n: 1, limit: 1 })).toBe(once);
    expect(once).not.toMatch(/\{\w+\}/);
  });
});
