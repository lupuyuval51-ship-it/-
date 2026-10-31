import { createElement, type ComponentProps, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "@/components/I18nProvider";
import { DICTIONARIES, type Locale } from "@/lib/i18n";
import {
  DRAFT_KEY, createReducer, draftLanguageChosen, emptyForm, loadDraft, parseDraft, saveDraft, startState,
  type ContentLang, type CreateAction, type CreateFormValues, type CreateState, type DraftStorage,
} from "../../mobile/src/pages/createForm";
import { EXAMPLES } from "../../mobile/src/pages/examples";

/**
 * Learner check of 2026-10-29: a Hebrew draft (subject "היסטוריה") was left on the New game screen, the app was switched
 * to English, and an English library topic picked from the English list ("Percentages") came out as a Hebrew game
 * ("אחוזים"), the next notes game too ("משימת למידה: Supply and demand"). The draft kept the game language that was only
 * the default of the Hebrew interface it was saved under. A language the learner chose must still stay.
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
const auto = (ui: ContentLang) => ({ ui, chosen: false });
const chosen = (ui: ContentLang) => ({ ui, chosen: true });

/** One visit of the New game screen as Create.tsx runs it: open (restore), act, save on leaving. */
function visit(s: DraftStorage, ui: ContentLang, ...actions: CreateAction[]): CreateState {
  let state = startState(loadDraft(s, "A", ui), { locale: ui, tier: "A", example: false, languageChosen: draftLanguageChosen(s) });
  saveDraft(s, state.form, 1, { ui, chosen: state.languageChosen }); // the save right after the screen opens
  for (const a of actions) {
    state = createReducer(state, a);
    saveDraft(s, state.form, 2, { ui, chosen: state.languageChosen });
  }
  return state;
}

describe("a draft's game language after the interface language changed", () => {
  it("the default of the old interface gives way to the new one (the reported case)", () => {
    const s = memory();
    saveDraft(s, form({ language: "he" }), 1, auto("he"));
    expect(loadDraft(s, "A", "en")?.language).toBe("en");
    expect(loadDraft(s, "A", "en")?.subject).toBe("היסטוריה"); // the learner's text stays
  });

  it("a default follows the notes when they clearly have a language", () => {
    const s = memory();
    saveDraft(s, form({ language: "he", material: HEBREW_NOTES }), 1, auto("he"));
    expect(loadDraft(s, "A", "en")?.language).toBe("he");
    saveDraft(s, form({ language: "he", subject: "Supply and demand", material: ENGLISH_NOTES }), 2, auto("he"));
    expect(loadDraft(s, "A", "en")?.language).toBe("en");
  });

  it("an untouched example becomes the same example in the new language (the welcome's example, left unbuilt)", () => {
    const s = memory();
    const ex = EXAMPLES[0]!;
    saveDraft(s, form({ subject: ex.he.subject, material: ex.he.notes, language: "he" }), 1, auto("he"));
    expect(loadDraft(s, "A", "en")).toMatchObject({ subject: ex.en.subject, material: ex.en.notes, language: "en" });
    saveDraft(s, form({ subject: ex.he.subject, material: ex.he.notes, language: "he" }), 2, chosen("he"));
    expect(loadDraft(s, "A", "en")).toMatchObject({ subject: ex.he.subject, language: "he" });
  });

  it("a chosen language stays, whatever the interface and the notes", () => {
    const s = memory();
    for (const language of ["he", "en"] as const) for (const ui of ["he", "en"] as const) for (const material of ["", HEBREW_NOTES, ENGLISH_NOTES]) {
      saveDraft(s, form({ language, material }), 1, chosen(ui));
      expect(draftLanguageChosen(s)).toBe(true);
      for (const now of ["he", "en"] as const) expect(loadDraft(s, "A", now)?.language).toBe(language);
    }
  });

  it("the same interface, an older draft without the interface language, or a broken one change nothing", () => {
    const s = memory();
    saveDraft(s, form({ language: "he", material: ENGLISH_NOTES }), 1, auto("he"));
    expect(loadDraft(s, "A", "he")?.language).toBe("he"); // the language hint asks; the language is not switched behind its back
    saveDraft(s, form({ language: "he" }), 2);
    expect(JSON.parse(s.data.get(DRAFT_KEY)!)).not.toHaveProperty("ui");
    expect(loadDraft(s, "A", "en")?.language).toBe("he");
    expect(draftLanguageChosen(s)).toBe(false);
    expect(parseDraft(JSON.stringify({ v: 1, ui: "fr", form: form({ language: "he" }) }), "A", "en")?.language).toBe("he");
    expect(parseDraft(JSON.stringify({ v: 1, ui: 7, form: form({ language: "he" }) }), "A", "en")?.language).toBe("he");
    expect(draftLanguageChosen(null)).toBe(false);
    expect(draftLanguageChosen({ getItem: () => "{oops", setItem: () => undefined, removeItem: () => undefined })).toBe(false);
  });
});

describe("visits of the screen in both interfaces (the screen saves on every visit)", () => {
  const change = (value: ContentLang): CreateAction => ({ type: "change", key: "language", value });

  it("a default moves with the interface both ways", () => {
    const s = memory();
    visit(s, "he", { type: "change", key: "subject", value: "היסטוריה" });
    expect(visit(s, "en").form.language).toBe("en");
    expect(visit(s, "he").form.language).toBe("he");
    expect(visit(s, "en").form.language).toBe("en");
  });

  it("a language picked in the select stays, even when it is the interface's own language", () => {
    const s = memory();
    visit(s, "he", { type: "change", key: "subject", value: "היסטוריה" }, { type: "change", key: "material", value: HEBREW_NOTES });
    expect(visit(s, "en").form.language).toBe("he"); // the notes are Hebrew
    expect(visit(s, "en", change("en")).form.language).toBe("en"); // the learner wants English anyway
    expect(visit(s, "he").form.language).toBe("en");
    expect(visit(s, "en").form.language).toBe("en");
  });

  it("'Keep' on the language hint stays", () => {
    const s = memory();
    visit(s, "en", { type: "change", key: "subject", value: "Bible" }, { type: "change", key: "material", value: HEBREW_NOTES }, { type: "keepLanguage" });
    expect(visit(s, "he").form.language).toBe("en");
    expect(visit(s, "en").form.language).toBe("en");
  });

  it("Clear, then 'Bring back my text', brings the choice back too", () => {
    const s = memory();
    visit(s, "he", { type: "change", key: "subject", value: "היסטוריה" }, change("en"));
    const cleared = visit(s, "en", { type: "clear" });
    expect(s.data.has(DRAFT_KEY)).toBe(false);
    const back = createReducer(cleared, { type: "undo" });
    expect(back).toMatchObject({ languageChosen: true, form: { language: "en", subject: "היסטוריה" } });
    saveDraft(s, back.form, 3, { ui: "en", chosen: back.languageChosen });
    expect(visit(s, "he").form.language).toBe("en");
  });

  it("an example over a draft, then 'Bring back my text', keeps the draft's choice", () => {
    const s = memory();
    saveDraft(s, form({ language: "en", material: HEBREW_NOTES }), 1, chosen("he"));
    const opened = startState(loadDraft(s, "A", "he"), { locale: "he", tier: "A", example: true, languageChosen: draftLanguageChosen(s) });
    expect(opened.languageChosen).toBe(false); // the example is in the interface's language
    expect(createReducer(opened, { type: "undo" })).toMatchObject({ languageChosen: true, form: { language: "en" } });
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
    expect(selectedLanguage(await render("en", { ...saved, chosen: true }))).toBe("he");
  });
});
