import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { I18nProvider } from "@/components/I18nProvider";
import { ChallengePanel, revealSummary } from "@/components/game/hud/ChallengePanel";
import type { PublicChallenge } from "@/lib/game/challenges/grade";
import { DICTIONARIES, makeT, type DictKey, type Locale } from "@/lib/i18n";
import { mathRuns } from "@/lib/i18n/bidi";
import { formatNextReview, formatWhen } from "../../mobile/src/format";

/**
 * Text that was wrong in one language only: dates in Spanish, raw parameter names in a revealed solution, and a count
 * glued to a plural noun ("1 attempts left", "Te quedan 1 intentos").
 */

describe("Spanish dates in the app", () => {
  const at = (d: number, hh = 14, mm = 30) => new Date(2026, 9, 11 + d, hh, mm).getTime();
  const now = at(0, 9, 0);

  it("the next review is written in Spanish, not English", () => {
    expect(formatNextReview(at(0), now, "es")).toBe("hoy, 14:30");
    expect(formatNextReview(at(1), now, "es")).toBe("mañana, 14:30");
    expect(formatNextReview(at(3), now, "es")).toMatch(/^(lunes|martes|miércoles|jueves|viernes|sábado|domingo), 14:30$/);
    expect(formatNextReview(at(16), now, "es")).toMatch(/octubre/);
  });

  it("the last sync is a Spanish date (day first, 24-hour clock) and English and Hebrew are unchanged", () => {
    const ts = new Date(2026, 9, 11, 14, 30).getTime();
    expect(formatWhen(ts, "es")).toMatch(/^11\/10\/(20)?26, 14:30$/);
    expect(formatWhen(ts, "en")).toBe("11/10/2026, 14:30");
    expect(formatWhen(ts, "he")).toMatch(/11\.10\.2026/);
  });
});

describe("a revealed simulation solution uses the sliders' own names", () => {
  const sim = (kind: "projectile" | "lever"): PublicChallenge =>
    ({ id: "s", title: "Sim", prompt: "p", concept: "c", level: 1, hasHint: false, type: "simulation", sim: { kind } } as unknown as PublicChallenge);

  it.each(["he", "en", "es"] as const)("%s: no raw `angle` / `speed` / `distance` keys", (locale) => {
    const t = makeT(DICTIONARIES[locale]);
    const projectile = revealSummary(sim("projectile"), { params: { angle: 45, speed: 12.5 } }, t);
    expect(projectile).toBe(`${t("sim.angle")}: 45, ${t("sim.speed")}: 12.5`);
    expect(revealSummary(sim("lever"), { params: { distance: 3.2 } }, t)).toBe(`${t("sim.lever.distance")}: 3.2`);
    if (locale !== "en") expect(projectile).not.toMatch(/\b(angle|speed)\b/);
  });

  it("an unknown parameter keeps its key instead of printing `undefined`", () => {
    expect(revealSummary(sim("lever"), { params: { weight: 4 } }, makeT(DICTIONARIES.en))).toBe("weight: 4");
  });
});

describe("a count of one never sits in front of a plural noun", () => {
  const ONE_KEYS = ["challenge.attemptsLeft", "topics.count", "mob.deck.due", "mob.deck.later", "a11y.collectibles"] as const;

  it("each count key has a singular twin in every language, and the twin has no count placeholder", () => {
    for (const locale of ["he", "en", "es"] as const) {
      for (const key of ONE_KEYS) {
        const one = DICTIONARIES[locale][`${key}.one` as DictKey];
        expect(one, `${locale} ${key}.one`).toBeTruthy();
        expect(one, `${locale} ${key}.one`).not.toMatch(/\{\w+\}/);
        expect(DICTIONARIES[locale][key], `${locale} ${key}`).toMatch(/\{n\}/);
      }
    }
  });

  it("the singular twins read as one thing", () => {
    const en = DICTIONARIES.en;
    expect(en["challenge.attemptsLeft.one"]).toBe("1 attempt left");
    expect(en["topics.count.one"]).toBe("1 topic");
    expect(en["mob.deck.due.one"]).toBe("1 question ready now");
    expect(en["a11y.collectibles.one"]).toBe("1 collectible left in this area.");
    const es = DICTIONARIES.es;
    expect(es["challenge.attemptsLeft.one"]).toBe("Te queda 1 intento");
    expect(es["topics.count.one"]).toBe("1 tema");
    expect(es["mob.deck.due.one"]).toBe("1 pregunta lista ahora");
    expect(es["a11y.collectibles.one"]).toBe("Queda 1 coleccionable en esta zona.");
  });

  it("English and Spanish messages that count games, runs, cards or items write the count as a label (like Hebrew), so 1 reads right", () => {
    const keys = ["mob.backup.exported", "mob.backup.imported", "mob.backup.skipped", "mob.backup.skipped.runs", "mob.backup.downloaded", "mob.backup.copied", "mob.storage.damaged", "mob.storage.purged"] as const;
    const COUNT_BEFORE_NOUN = /\{\w+\} (?:games|runs|review|saved|damaged|items|juegos|partidas|tarjetas|elementos)/;
    for (const locale of ["en", "es"] as const) {
      for (const key of keys) expect(DICTIONARIES[locale][key], `${locale} ${key}`).not.toMatch(COUNT_BEFORE_NOUN);
    }
  });

  it("the challenge panel says '1 attempt left' on the last try", () => {
    const challenge: PublicChallenge = { id: "c1", title: "Pick", prompt: "Which?", concept: "loops", level: 1, hasHint: false, type: "choice", options: [{ id: "a", text: "A" }, { id: "b", text: "B" }] };
    const render = (attemptsLeft: number, locale: Locale) => {
      const result = { correct: false, feedback: "No", resolved: false, revealed: false, pointsAwarded: 0, attemptsLeft };
      const el = h(ChallengePanel, { challenge, stationLabel: "S", result, hint: null, busy: false, onSubmit: () => undefined, onHint: () => undefined, onClose: () => undefined });
      return renderToStaticMarkup(h(I18nProvider, { locale, dict: DICTIONARIES[locale], children: el }));
    };
    expect(render(1, "en")).toContain("1 attempt left");
    expect(render(1, "en")).not.toContain("1 attempts left");
    expect(render(2, "en")).toContain("2 attempts left");
    expect(render(1, "es")).toContain("Te queda 1 intento");
    expect(render(1, "he")).toContain("נותר ניסיון אחד");
    expect(render(3, "he")).toContain("ניסיונות שנותרו: 3");
  });
});

describe("maths inside a Hebrew line: a number written into a variable, a bracket after a factor, exponents", () => {
  const runs = (s: string) => mathRuns(s).filter((p) => p.math).map((p) => p.text);

  it("an equation with implicit multiplication is one left-to-right run (it was cut into '3' and 'x = 12', which an RTL line swaps)", () => {
    expect(runs("מחסרים 2 משני האגפים: 3x = 12")).toEqual(["2", "3x = 12"]);
    expect(runs("משוואה שנכונה לכל ערך, כמו 2(x + 1) = 2x + 2")).toEqual(["2(x + 1) = 2x + 2"]);
    expect(runs("פתרו (x + 2)(x − 3) = 0")).toEqual(["(x + 2)(x − 3) = 0"]);
    expect(runs("כתיבה כמכפלה, כמו 60 = 2² × 3 × 5")).toEqual(["60 = 2² × 3 × 5"]);
    expect(runs("בכתיב מדעי: 3 × 10⁸")).toEqual(["3 × 10⁸"]);
  });

  it("dimensions and Latin words next to a number are not broken apart, and every character is kept in order", () => {
    expect(runs("מטריצה 3x3 בגודל")).toEqual(["3x3"]);
    expect(runs("השם 2xyz הוא שם")).toEqual(["2"]);
    const line = "פתרו 3x + 2 = 14, ואז (x − 1)2 = 8 ו־x² = 9";
    expect(mathRuns(line).map((p) => p.text).join("")).toBe(line);
  });

  const render = (challenge: PublicChallenge, locale: Locale = "he") =>
    renderToStaticMarkup(h(I18nProvider, { locale, dict: DICTIONARIES[locale], children: h(ChallengePanel, { challenge, stationLabel: "S", result: null, hint: null, busy: false, onSubmit: () => undefined, onHint: () => undefined, onClose: () => undefined }) }));

  it("sequence steps and matching cards draw their maths left to right", () => {
    const seq: PublicChallenge = { id: "s", title: "סדר", prompt: "p", concept: "c", level: 1, hasHint: false, type: "sequence", items: [{ id: "1", text: "מחסרים 2 משני האגפים: 3x = 12" }, { id: "2", text: "מחלקים ב-3" }] };
    expect(render(seq)).toContain('<bdi dir="ltr">3x = 12</bdi>');
    const match: PublicChallenge = { id: "m", title: "התאמה", prompt: "p", concept: "c", level: 1, hasHint: false, type: "match", lefts: [{ id: "1", text: "משוואה" }], rights: [{ id: "1", text: "כמו 2(x + 1) = 2x + 2" }] };
    expect(render(match)).toContain('<bdi dir="ltr">2(x + 1) = 2x + 2</bdi>');
    // English content is untouched: no isolation element is added
    const english: PublicChallenge = { ...match, rights: [{ id: "1", text: "e.g. 2(x + 1) = 2x + 2" }] } as PublicChallenge;
    expect(render(english, "en")).not.toContain("<bdi");
  });
});
