import { afterEach, describe, expect, it } from "vitest";
import { PLAN_IDS, displayCurrency, monthlyPrice } from "@/config/plans";
import { DICTIONARIES, makeT } from "@/lib/i18n";
import { REGIONS } from "@/lib/regions";
import { pointsAwarded, POINTS_BY_LEVEL } from "@/lib/game/state/progress";
import { InputState } from "@/components/game/input";

/**
 * The interface text in game.ts, mobile.ts and site.ts must say what the code really does: a hint costs a share of the points,
 * the pause help lists the keys that pause, a price note never names one country when prices are the same everywhere, and a
 * screen never promises a Google sign-in that is switched off. Hebrew addresses the learners in the plural throughout.
 */
const { en, he } = DICTIONARIES;

describe("the hint button states the real hint cost", () => {
  it("a hint costs the same share of the points at every level, and the button says that share (not a fixed number of points)", () => {
    const shares = Object.keys(POINTS_BY_LEVEL).map(Number).map((level) => {
      const base = pointsAwarded({ level, wrongBefore: 0, hints: 0, elapsedMs: null, timedBonus: false });
      const hinted = pointsAwarded({ level, wrongBefore: 0, hints: 1, elapsedMs: null, timedBonus: false });
      return Math.round(((base - hinted) / base) * 100);
    });
    expect(new Set(shares).size).toBe(1);
    const share = `${shares[0]}%`;
    // level 2 and level 3 challenges lose more than 15 points, so "−15 points" was wrong for most of them
    expect(pointsAwarded({ level: 3, wrongBefore: 0, hints: 0, elapsedMs: null, timedBonus: false }) - pointsAwarded({ level: 3, wrongBefore: 0, hints: 1, elapsedMs: null, timedBonus: false })).toBeGreaterThan(15);
    for (const dict of [en, he]) {
      expect(dict["challenge.hint"]).toContain(share);
      expect(dict["challenge.hint"]).not.toMatch(/\d+ (?:points|נקודות)/);
    }
  });
});

describe("the pause help lists the keys that really pause", () => {
  const saved = { window: (globalThis as { window?: unknown }).window, HTMLElement: (globalThis as { HTMLElement?: unknown }).HTMLElement };
  afterEach(() => {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete (globalThis as Record<string, unknown>)[k];
      else (globalThis as Record<string, unknown>)[k] = v;
    }
  });

  it("every key named in “Pause: …” opens the pause menu, in both languages", () => {
    class FakeElement {}
    const win = new EventTarget();
    Object.assign(globalThis, { window: win, HTMLElement: FakeElement });
    const host = Object.assign(new EventTarget(), { querySelector: () => null }) as unknown as HTMLElement;
    const input = new InputState();
    let pauses = 0;
    input.onPause = () => pauses++;
    const detach = input.attach(host);
    const CODE: Record<string, string> = { Esc: "Escape", P: "KeyP" };
    try {
      for (const dict of [en, he]) {
        const keys = dict["hud.controls.pause"].split(":")[1]!.split("/").map((k) => k.trim());
        expect(keys).toEqual(["Esc", "P"]);
        for (const key of keys) {
          const before = pauses;
          const ev = Object.assign(new Event("keydown"), { code: CODE[key], key, repeat: false, ctrlKey: false, metaKey: false, altKey: false });
          win.dispatchEvent(ev);
          expect(pauses, `${key} pauses`).toBe(before + 1);
        }
      }
    } finally {
      detach();
    }
  });
});

describe("prices are the same in every region, and the pricing page says so", () => {
  it("every region is charged in shekels, so no price note names a single country", () => {
    for (const plan of PLAN_IDS) for (const r of [...REGIONS.map((x) => x.code), "US", null]) expect(displayCurrency(plan, r)).toBe("ILS");
    expect(monthlyPrice("PLUS", "US")).toEqual(monthlyPrice("PLUS", "IL"));
    // shown under every paid price, whatever the visitor's region
    expect(en["pricing.region.il"]).not.toMatch(/Israel/i);
    expect(he["pricing.region.il"]).not.toMatch(/ישראל/);
    expect(en["pricing.region.il"]).toMatch(/every country/i);
    expect(he["pricing.region.il"]).toMatch(/בכל מדינה/);
  });

  it("the region line never suggests that the region changes the price", () => {
    const tEn = makeT(en);
    const tHe = makeT(he);
    for (const key of ["pricing.region.note", "pricing.region.visitor"] as const) {
      expect(tEn(key, { region: "United States" })).toMatch(/same in every region/);
      expect(tHe(key, { region: "ארצות הברית" })).toMatch(/זהים בכל אזור/);
      expect(en[key]).not.toMatch(/prices for|shown for your/i);
    }
  });
});

describe("Google sign-in is optional, so text shown without it never promises it", () => {
  it("the sign-in subtitle and the account intros (web and app) do not name Google: its button appears only when it is switched on", () => {
    // AuthForm, the account page and the app's AccountPanel show these lines whether or not Google is configured
    for (const key of ["auth.login.subtitle", "acc.intro", "mob.account.intro"] as const) {
      expect(en[key], key).not.toMatch(/Google/);
      expect(he[key], key).not.toMatch(/Google/);
    }
  });
});

describe("Hebrew copy in these dictionaries", () => {
  const heEntries = Object.entries(he);

  it("addresses the learners in the plural (לכם / שלכם), never the singular לך / שלך", () => {
    const SINGULAR = /(?:^|[\s(״"])(?:לך|שלך|אותך|בשבילך|ממך|אליך|עליך|איתך)(?=[\s.,!?:;״")]|$)/u;
    expect(heEntries.filter(([, v]) => SINGULAR.test(v)).map(([k, v]) => `${k}: ${v}`)).toEqual([]);
  });

  it("never glues the conjunction ו to an inserted text (“ו{right}”): the text may be a number or Latin", () => {
    expect(heEntries.filter(([, v]) => /(?:^|\s)ו\{\w+\}/u.test(v)).map(([k]) => k)).toEqual([]);
    expect(makeT(he)("a11y.match.paired", { left: "1/2", right: "0.5", n: 1, total: 4 })).toContain("1/2 עם 0.5");
  });

  it("the review tab and the Back link have different names (both are on most phone screens at once)", () => {
    for (const dict of [en, he]) expect(dict["mob.nav.review"]).not.toBe(dict["mob.back"]);
  });
});
