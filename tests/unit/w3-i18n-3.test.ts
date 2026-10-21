import { describe, expect, it } from "vitest";
import { PLAN_IDS, displayCurrency } from "@/config/plans";
import { DICTIONARIES, makeT } from "@/lib/i18n";
import { pointsAwarded, POINTS_BY_LEVEL } from "@/lib/game/state/progress";
import { BOX_INTERVAL_DAYS } from "@/lib/offline/deck";
import { app } from "@/lib/i18n/dict/app";
import { appEs } from "@/lib/i18n/dict/es/app";
import { commonEs } from "@/lib/i18n/dict/es/common";

/**
 * The Spanish interface (src/lib/i18n/dict/es/*.ts) must say what the code really does, like the Hebrew and English
 * texts it translates: the hint cost, the pause keys, prices in shekels everywhere, games counted (not credits), no
 * Google promise where Google may be off, counts that read right for one, and the review intervals of the deck.
 */
const { en, es } = DICTIONARIES;
const tEs = makeT(es);

describe("Spanish: the hint button states the real hint cost", () => {
  it("says the share of the points a hint costs (the same at every level), never a fixed number of points", () => {
    const shares = new Set(Object.keys(POINTS_BY_LEVEL).map(Number).map((level) => {
      const base = pointsAwarded({ level, wrongBefore: 0, hints: 0, elapsedMs: null, timedBonus: false });
      const hinted = pointsAwarded({ level, wrongBefore: 0, hints: 1, elapsedMs: null, timedBonus: false });
      return Math.round(((base - hinted) / base) * 100);
    }));
    expect(shares.size).toBe(1);
    expect(es["challenge.hint"]).toContain(`${[...shares][0]}%`);
    expect(es["challenge.hint"]).not.toMatch(/\d+ puntos/);
  });
});

describe("Spanish: the controls help lists the same keys as the English one", () => {
  it("“Pausa: …” names every key that pauses (Esc and P)", () => {
    const keys = (s: string) => s.split(":")[1]!.split("/").map((k) => k.trim());
    expect(keys(es["hud.controls.pause"])).toEqual(keys(en["hud.controls.pause"]));
    expect(keys(es["hud.controls.pause"])).toEqual(["Esc", "P"]);
  });
});

describe("Spanish: prices are the same in every region, in shekels", () => {
  it("no price note names one country or says the region picks the currency or the price", () => {
    for (const plan of PLAN_IDS) for (const r of ["IL", "ES", "MX", "AR", "US", null]) expect(displayCurrency(plan, r)).toBe("ILS");
    expect(es["pricing.region.il"]).not.toMatch(/Israel/i);
    expect(es["pricing.region.il"]).toMatch(/todos los países/);
    for (const key of ["pricing.region.note", "pricing.region.visitor"] as const) {
      const line = tEs(key, { region: "España" });
      expect(line, key).toContain("España");
      expect(line, key).toMatch(/los mismos en todas las regiones/);
      expect(line, key).toContain("₪");
      expect(line, key).not.toMatch(/precios para|se muestran para/i);
    }
    expect(es["acc.region.hint"]).not.toMatch(/moneda/i);
    expect(es["acc.region.hint"]).toContain("₪");
  });
});

describe("Spanish: the create page counts games, not credits", () => {
  it("the allowance note speaks of a game counted in the allowance", () => {
    expect(es["create.policy"]).not.toMatch(/cr[ée]dito/i);
    expect(es["create.policy"]).toMatch(/juego/);
    expect(es["create.policy"]).toMatch(/cupo/);
  });
});

describe("Spanish: text shown whether or not Google sign-in is on never promises it", () => {
  it("the sign-in subtitle and the account intros (web and app) do not name Google", () => {
    for (const key of ["auth.login.subtitle", "acc.intro", "mob.account.intro"] as const) expect(es[key], key).not.toMatch(/Google/);
  });
});

describe("Spanish: counts read right for one area, mission or challenge", () => {
  it("a one-area game card is not '1 zonas', and a one-mission game is not '0 de 1 misiones'", () => {
    const card = tEs("lib.meta", { areas: 1, missions: 1, challenges: 1 });
    expect(card).toBe("Zonas: 1 · Misiones: 1 · Retos: 1");
    expect(card).not.toMatch(/\b1 (zonas|misiones|retos)\b/);
    expect(tEs("det.progress.inProgress", { done: 0, total: 1 })).toBe("En curso. Misiones completadas: 0 de 1.");
  });

  it("no Spanish string of the app or common dictionary puts an area, mission or challenge count straight before a plural noun", () => {
    const COUNT_NOUN = /\{(?:areas|missions|challenges|done|total)\} (?:zonas|misiones|retos|desaf[ií]os)/;
    const bad = Object.entries({ ...commonEs, ...appEs }).filter(([, v]) => COUNT_NOUN.test(v)).map(([k]) => k);
    expect(bad).toEqual([]);
    // the same keys exist in English, so the Spanish file is checked against the full app dictionary
    expect(Object.keys(appEs).sort()).toEqual(Object.keys(app.en).sort());
  });
});

describe("Spanish: the mistake deck and the backup panel", () => {
  it("the deck intro lists the real review intervals, in grammatical Spanish", () => {
    expect(es["mob.deck.intro"]).toContain(`${BOX_INTERVAL_DAYS.slice(0, -1).join(", ")} y ${BOX_INTERVAL_DAYS.at(-1)} días`);
    expect(es["mob.deck.intro"]).not.toMatch(/a los 1\b/);
  });

  it("the copy-backup button has a real name, and the message that points to it uses that name", () => {
    expect(es["mob.backup.copy"]).not.toMatch(/copiar copia/i);
    expect(es["mob.backup.copied"]).not.toMatch(/^copia copiada/i);
    expect(es["mob.backup.downloaded"]).toContain(`“${es["mob.backup.copy"]}”`);
  });

  it("the review tab and the Back link have different names", () => {
    expect(es["mob.nav.review"]).not.toBe(es["mob.back"]);
  });
});
