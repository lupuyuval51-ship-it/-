import { createElement, type ComponentProps, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "@/components/I18nProvider";
import { DICTIONARIES, type Locale } from "@/lib/i18n";
import { DRAFT_KEY, emptyForm, loadDraft, parseDraft, saveDraft, type CreateFormValues, type DraftStorage } from "../../mobile/src/pages/createForm";

/**
 * Learner check of 2026-10-29: a Hebrew draft (subject "היסטוריה") was left on the New game screen, the app was switched
 * to English, and an English library topic picked from the English list ("Percentages") came out as a Hebrew game
 * ("אחוזים"), the next notes game too ("משימת למידה: Supply and demand"). The draft kept the game language that was only
 * the default of the Hebrew interface it was saved under.
 */
vi.mock("../../mobile/src/app-state", () => ({ store: { addGame: () => ({ id: "x" }) }, getSettings: () => ({ interests: [], minutesPerDay: null }) }));
vi.mock("../../mobile/src/cloud/account", () => ({ useAccount: () => ({ session: null }) }));
vi.mock("@/lib/offline/entitlement", () => ({ getOfflinePlan: () => "PRO", getOfflineTier: () => "A" }));

const memory = (): DraftStorage & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v), removeItem: (k) => void data.delete(k) };
};
const form = (o: Partial<CreateFormValues>): CreateFormValues => ({ ...emptyForm("he", "A"), subject: "היסטוריה", ...o });
const HEBREW_NOTES = "המהפכה האמריקאית החלה בשנת 1775. המושבות דרשו ייצוג בפרלמנט והתנגדו למסים שהוטלו עליהן בלי הסכמתן.";
const ENGLISH_NOTES = "Supply and demand: when the price of a good rises, the quantity demanded usually falls, and producers supply more.";

describe("a draft's game language after the interface language changed", () => {
  it("the default of the old interface gives way to the new one (the reported case)", () => {
    const s = memory();
    saveDraft(s, form({ language: "he" }), 1, "he");
    expect(loadDraft(s, "A", "en")?.language).toBe("en");
    expect(loadDraft(s, "A", "en")?.subject).toBe("היסטוריה"); // the learner's text stays
  });

  it("notes that clearly have a language keep it", () => {
    const s = memory();
    saveDraft(s, form({ language: "he", material: HEBREW_NOTES }), 1, "he");
    expect(loadDraft(s, "A", "en")?.language).toBe("he");
    saveDraft(s, form({ language: "he", subject: "Supply and demand", material: ENGLISH_NOTES }), 2, "he");
    expect(loadDraft(s, "A", "en")?.language).toBe("en");
  });

  it("a language the learner chose (not the interface's default) is kept", () => {
    const s = memory();
    saveDraft(s, form({ language: "en" }), 1, "he");
    expect(loadDraft(s, "A", "en")?.language).toBe("en");
    expect(loadDraft(s, "A", "he")?.language).toBe("en");
    saveDraft(s, form({ language: "he" }), 2, "en");
    expect(loadDraft(s, "A", "en")?.language).toBe("he");
  });

  it("the same interface, an older draft without the interface language, or a broken one change nothing", () => {
    const s = memory();
    saveDraft(s, form({ language: "he" }), 1, "he");
    expect(loadDraft(s, "A", "he")?.language).toBe("he");
    saveDraft(s, form({ language: "he" }), 2);
    expect(JSON.parse(s.data.get(DRAFT_KEY)!)).not.toHaveProperty("ui");
    expect(loadDraft(s, "A", "en")?.language).toBe("he");
    expect(parseDraft(JSON.stringify({ v: 1, ui: "fr", form: form({ language: "he" }) }), "A", "en")?.language).toBe("he");
    expect(parseDraft(JSON.stringify({ v: 1, ui: 7, form: form({ language: "he" }) }), "A", "en")?.language).toBe("he");
  });
});

describe("the New game screen with that draft", () => {
  const Provider = I18nProvider as unknown as ComponentType<Omit<ComponentProps<typeof I18nProvider>, "children">>;
  afterEach(() => { delete (globalThis as { window?: unknown }).window; });

  async function render(locale: Locale, saved: object): Promise<string> {
    const data = new Map<string, string>([[DRAFT_KEY, JSON.stringify(saved)]]);
    const localStorage = { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v), removeItem: (k: string) => void data.delete(k) };
    Object.assign(globalThis, { window: { location: { hash: "#/create" }, localStorage } });
    const { CreatePage } = await import("../../mobile/src/pages/Create");
    return renderToStaticMarkup(createElement(Provider, { locale, dict: DICTIONARIES[locale] }, createElement(CreatePage)));
  }
  const selectedLanguage = (html: string): string | undefined => {
    const sel = /<select[^>]*id="language"[^>]*>([\s\S]*?)<\/select>/.exec(html)?.[1] ?? "";
    return /<option[^>]*value="([^"]*)"[^>]*selected/.exec(sel)?.[1];
  };

  it("opens in English (and in Spanish, whose content is English) with the Hebrew text kept", async () => {
    const saved = { v: 1, savedAt: 1, ui: "he", form: form({ language: "he" }) };
    for (const locale of ["en", "es"] as const) {
      const html = await render(locale, saved);
      expect(html).toContain('data-testid="create-restored"');
      expect(selectedLanguage(html)).toBe("en");
      expect(html).toContain('value="היסטוריה"');
    }
    expect(selectedLanguage(await render("he", saved))).toBe("he");
  });
});
