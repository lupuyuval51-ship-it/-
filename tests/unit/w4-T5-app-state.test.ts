import { afterEach, describe, expect, it, vi } from "vitest";
import { generateOffline } from "@/lib/offline/generate";
import { OfflineError } from "@/lib/offline/store";
import { ApiFailure } from "@/components/game/transport";
import { DICTIONARIES, LOCALES } from "@/lib/i18n";
import { NOTES } from "./offline-helpers";
import { request } from "./helpers";

/**
 * The settings of the offline app (`mobile/src/app-state.ts`) as a phone really holds them: whatever an older build, a damaged
 * file or another app left under the key must never crash the first screen or put an unknown value on it; a change is saved and
 * heard by every screen; and the play transport follows the tier the learner picks now, not the one at launch.
 */

const KEY = "levelup.mobile.settings";
const mem = new Map<string, string>();
const storage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: vi.fn((k: string, v: string) => void mem.set(k, v)),
  removeItem: (k: string) => void mem.delete(k),
  key: (i: number) => [...mem.keys()][i] ?? null,
  get length() { return mem.size; },
};
const html = { attrs: new Map<string, string>(), removeAttribute(n: string) { this.attrs.delete(n); }, setAttribute(n: string, v: string) { this.attrs.set(n, v); } };

/** A fresh copy of the module over the phone described by `nav`, with whatever is in `mem`. */
async function boot(nav: { deviceMemory?: number; hardwareConcurrency?: number } = {}) {
  vi.resetModules();
  html.attrs.clear();
  storage.setItem.mockClear();
  vi.stubGlobal("localStorage", storage);
  vi.stubGlobal("navigator", nav);
  vi.stubGlobal("window", { location: { hash: "" }, localStorage: storage, addEventListener: () => {}, removeEventListener: () => {} });
  vi.stubGlobal("document", { documentElement: html });
  return import("../../mobile/src/app-state");
}

afterEach(() => {
  mem.clear();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  storage.setItem.mockImplementation((k: string, v: string) => void mem.set(k, v));
});

describe("loading the saved settings", () => {
  it("keeps every valid value exactly, a switched-off sound included (false is a choice, not a missing value)", async () => {
    const saved = { locale: "es", tier: "C", sound: false, music: false, vibration: false, theme: "dark", region: "IL", interests: ["math", "arts"], minutesPerDay: 20, planChoice: "PLUS", setupDone: true };
    mem.set(KEY, JSON.stringify(saved));
    expect((await boot()).getSettings()).toEqual(saved);
  });

  it("every language the interface offers is accepted", async () => {
    for (const locale of LOCALES) {
      mem.set(KEY, JSON.stringify({ locale, setupDone: true }));
      expect((await boot()).getSettings().locale).toBe(locale);
    }
  });

  it("puts an unknown value back to its default instead of on the screen", async () => {
    mem.set(KEY, JSON.stringify({
      locale: "fr", tier: "Z", sound: "yes", music: 0, vibration: null, theme: "purple", region: "Atlantis",
      interests: ["math", "bogus", "math", 7], minutesPerDay: 7, planChoice: "GOLD", setupDone: "no",
    }));
    const s = (await boot({ deviceMemory: 2, hardwareConcurrency: 2 })).getSettings();
    expect(s).toMatchObject({
      locale: "he", tier: "B", sound: true, music: true, vibration: true, theme: "system", region: "OTHER",
      interests: ["math"], minutesPerDay: null, planChoice: null,
    });
    // saved settings of any shape are an existing install: it is never sent through the first-run questions
    expect(s.setupDone).toBe(true);
  });

  it("damaged or foreign content under the key never throws and always gives a usable settings object", async () => {
    for (const raw of ["{not json", "", "null", "[]", "7", '"text"', "true"]) {
      mem.set(KEY, raw);
      const s = (await boot()).getSettings();
      expect(["he", "en", "es"], raw).toContain(s.locale);
      expect(["A", "B", "C"], raw).toContain(s.tier);
      expect(Array.isArray(s.interests), raw).toBe(true);
      expect(typeof s.sound, raw).toBe("boolean");
    }
  });

  it("a storage that refuses to be read gives the defaults of a fresh install", async () => {
    vi.resetModules();
    const blocked = { ...storage, getItem: () => { throw new Error("blocked"); } };
    vi.stubGlobal("localStorage", blocked);
    vi.stubGlobal("navigator", {});
    vi.stubGlobal("window", { location: { hash: "" }, localStorage: blocked, addEventListener: () => {}, removeEventListener: () => {} });
    vi.stubGlobal("document", { documentElement: html });
    const s = (await import("../../mobile/src/app-state")).getSettings();
    expect(s).toMatchObject({ locale: "he", sound: true, setupDone: false });
  });

  it("applies the saved theme before anything is drawn: an explicit one sets data-theme, `system` leaves none", async () => {
    mem.set(KEY, JSON.stringify({ theme: "light", setupDone: true }));
    await boot();
    expect(html.attrs.get("data-theme")).toBe("light");
    mem.set(KEY, JSON.stringify({ theme: "system", setupDone: true }));
    await boot();
    expect(html.attrs.has("data-theme")).toBe(false);
  });
});

describe("the graphics tier a phone starts with", () => {
  it("is A only for a phone that reports plenty of memory and cores, B for the rest (and for a phone that reports nothing)", async () => {
    expect((await boot({ deviceMemory: 8, hardwareConcurrency: 8 })).getSettings().tier).toBe("A");
    expect((await boot({ deviceMemory: 6, hardwareConcurrency: 8 })).getSettings().tier).toBe("A");
    expect((await boot({ deviceMemory: 8, hardwareConcurrency: 4 })).getSettings().tier).toBe("B");
    expect((await boot({ deviceMemory: 4, hardwareConcurrency: 8 })).getSettings().tier).toBe("B");
    expect((await boot({})).getSettings().tier).toBe("B");
  });
});

describe("the first launch", () => {
  it("a fresh phone starts in Hebrew with no interests, no time and no plan chosen, and the questions still to answer", async () => {
    expect((await boot()).getSettings()).toMatchObject({ locale: "he", interests: [], minutesPerDay: null, planChoice: null, setupDone: false, region: "OTHER", sound: true, music: true, vibration: true, theme: "system" });
  });

  it("the e2e build skips the questions and stays in Hebrew, so the other phone specs start on the library", async () => {
    vi.stubEnv("MODE", "e2e");
    expect((await boot()).getSettings()).toMatchObject({ locale: "he", setupDone: true });
  });
});

describe("changing a setting", () => {
  it("saves the whole settings object, not just the patch (the next launch reads one complete record)", async () => {
    mem.set(KEY, JSON.stringify({ locale: "en", sound: false, setupDone: true }));
    const s = await boot();
    s.setSettings({ music: false });
    expect(s.getSettings()).toMatchObject({ locale: "en", sound: false, music: false });
    expect(JSON.parse(mem.get(KEY)!)).toMatchObject({ locale: "en", sound: false, music: false, setupDone: true });
  });

  it("a theme change reaches <html> at once, and a change of something else leaves the theme alone", async () => {
    mem.set(KEY, JSON.stringify({ setupDone: true }));
    const s = await boot();
    s.setSettings({ theme: "dark" });
    expect(html.attrs.get("data-theme")).toBe("dark");
    s.setSettings({ sound: false });
    expect(html.attrs.get("data-theme")).toBe("dark");
    s.setSettings({ theme: "system" });
    expect(html.attrs.has("data-theme")).toBe(false);
  });

  it("keeps working when the phone cannot store it: the screen shows the change, the next launch simply starts from the old values", async () => {
    mem.set(KEY, JSON.stringify({ locale: "he", setupDone: true }));
    const s = await boot();
    storage.setItem.mockImplementation(() => { throw new DOMException("full", "QuotaExceededError"); });
    expect(() => s.setSettings({ locale: "es" })).not.toThrow();
    expect(s.getSettings().locale).toBe("es");
    expect(JSON.parse(mem.get(KEY)!).locale).toBe("he");
  });

  it("finishing the questions is remembered: the next launch does not ask again", async () => {
    const s = await boot();
    expect(s.getSettings().setupDone).toBe(false);
    s.setSettings({ setupDone: true, interests: ["math"], minutesPerDay: 10 });
    const again = (await boot()).getSettings();
    expect(again).toMatchObject({ setupDone: true, interests: ["math"], minutesPerDay: 10 });
  });
});

describe("the play transport follows the tier chosen now", () => {
  it("a game started after the learner picks another tier is drawn with it", async () => {
    mem.set(KEY, JSON.stringify({ tier: "A", setupDone: true }));
    const s = await boot();
    const game = s.store.addGame(generateOffline(request({ material: NOTES, subject: "Plants", mode: "FAST" })).spec);
    expect((await s.transport.startSession(game.id, true)).render.tier).toBe("A");
    s.setSettings({ tier: "C" });
    expect((await s.transport.startSession(game.id, true)).render.tier).toBe("C");
  });
});

describe("storageErrorKey: the message for a phone that could not save", () => {
  it("names a full phone and blocked saving, for the store's own error and for the transport's copy of it", async () => {
    const { storageErrorKey } = await boot();
    expect(storageErrorKey(new OfflineError(507, "STORAGE_FULL", "x"))).toBe("mob.backup.err.STORAGE_FULL");
    expect(storageErrorKey(new ApiFailure(503, "STORAGE_UNAVAILABLE", "x"))).toBe("mob.backup.err.STORAGE_UNAVAILABLE");
  });

  it("is null for anything else, so the screen keeps its own message", async () => {
    const { storageErrorKey } = await boot();
    for (const e of [new Error("boom"), new ApiFailure(500, "GAME_DAMAGED", "x"), new OfflineError(404, "NOT_FOUND", "x"), null, undefined, "STORAGE_FULL", { code: "storage_full" }, 507]) {
      expect(storageErrorKey(e)).toBeNull();
    }
  });

  it("both messages exist, with text, in every interface language", async () => {
    const { storageErrorKey } = await boot();
    const keys = [storageErrorKey(new OfflineError(507, "STORAGE_FULL", "x")), storageErrorKey(new OfflineError(503, "STORAGE_UNAVAILABLE", "x"))];
    for (const locale of LOCALES) for (const key of keys) expect(DICTIONARIES[locale][key!].trim().length, `${locale} ${key}`).toBeGreaterThan(10);
  });
});
