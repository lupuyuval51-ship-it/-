import { createElement as h, type ComponentProps, type ComponentType, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { I18nProvider } from "@/components/I18nProvider";
import { MaterialError, buildMaterialSpec } from "@/lib/game/material/build";
import { GAME_TYPES } from "@/lib/game/spec/constants";
import { DICTIONARIES, makeT, type Locale } from "@/lib/i18n";
import { generationRequestSchema } from "@/lib/schemas/generation";
import type { GenerationRequest } from "@/lib/schemas/generation";

/** Website components: the create form, the material preview, the generation progress and the AI edit panel (wave 3). */

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: () => undefined, refresh: () => undefined, replace: () => undefined }) }));

const { CreateForm, cleanFieldText } = await import("@/components/create/CreateForm");
const { MaterialPreview } = await import("@/components/create/MaterialPreview");
const { failureText } = await import("@/components/create/GenerationProgress");
const { editRequestBody } = await import("@/components/games/AiEditPanel");

const Provider = I18nProvider as unknown as ComponentType<Omit<ComponentProps<typeof I18nProvider>, "children">>;
const render = (locale: Locale, node: ReactNode): string => renderToStaticMarkup(h(Provider, { locale, dict: DICTIONARIES[locale] }, node));

const request = (over: Partial<GenerationRequest> = {}) => ({ mode: "FAST", subject: "Animals", learningGoal: "Animals", difficulty: "beginner", gameType: "adventure", contentLanguage: "en", ...over });

describe("text pasted from a PDF or a word processor", () => {
  const pdf = "Page one: the cell.\fPage two: the nucleus.\u000BA line break from Word.\u0007";

  it("used to be refused by the request schema, and is accepted once cleaned", () => {
    expect(generationRequestSchema.safeParse(request({ material: pdf })).success).toBe(false);
    const cleaned = cleanFieldText(pdf);
    expect(cleaned).toBe("Page one: the cell.\nPage two: the nucleus.\nA line break from Word.");
    expect(generationRequestSchema.safeParse(request({ material: cleaned, learningGoal: cleanFieldText("Goal\f two") })).success).toBe(true);
  });

  it("keeps everything the server accepts: Hebrew, tabs, line breaks and whole emoji", () => {
    const text = "שבר: חלק משלם.\tעמודה\nשורה 🙂 ✓";
    expect(cleanFieldText(text)).toBe(text);
    expect(cleanFieldText("a\r\nb\rc")).toBe("a\nb\nc");
  });

  it("drops half of a two-unit character (a lone surrogate the database refuses), never a whole one", () => {
    const smile = "🙂";
    expect(cleanFieldText(`cut ${smile[0]}`)).toBe("cut ");
    expect(cleanFieldText(`${smile[1]}x`)).toBe("x");
    expect(cleanFieldText(`${smile}${smile}`)).toBe(`${smile}${smile}`);
  });
});

describe("the create form's content language", () => {
  const option = (level: "A" | "B" | "C") => ({
    level, share: 100, limit: 5, remaining: 5, allowed: true, unlockPlan: null, fullAllowed: true,
    gameTypes: GAME_TYPES.map((id) => ({ id, allowed: true, level: "C" as const })),
  });
  const form = (kind: "none" | "ai") => h(CreateForm, {
    backend: { kind, provider: kind, label: kind },
    allowance: { periodEnd: "2026-11-01T00:00:00.000Z", plan: "PRO", activeJobId: null },
    games: [], extensionMechanics: [],
    levels: { options: [option("A"), option("B"), option("C")], defaults: { FAST: "A", FULL: "A" }, fullAllowed: true, unlockPlan: "PLUS" },
  });
  const selected = (markup: string): string | undefined => {
    const select = /<select[^>]*id="contentLanguage"[^>]*>(.*?)<\/select>/s.exec(markup)?.[1] ?? "";
    return /<option value="(\w+)" selected=""/.exec(select)?.[1];
  };

  it("follows a Hebrew or English interface", () => {
    expect(selected(render("he", form("none")))).toBe("he");
    expect(selected(render("en", form("none")))).toBe("en");
  });

  it("starts on English in a Spanish interface (learning content is Hebrew or English), not on the first option, Hebrew", () => {
    expect(selected(render("es", form("none")))).toBe("en");
    expect(selected(render("es", form("ai")))).toBe("en");
  });
});

describe("the live material preview agrees with the server's study engine", () => {
  const verdict = (material: string, lang: "he" | "en" = "en") => /data-ok="(\d)"/.exec(render("en", h(MaterialPreview, { material, full: false, lang })))?.[1];
  const server = (material: string, contentLanguage: "he" | "en" = "en"): "1" | "0" => {
    try {
      buildMaterialSpec(generationRequestSchema.parse(request({ material, contentLanguage })));
      return "1";
    } catch (e) {
      if (e instanceof MaterialError) return "0";
      throw e;
    }
  };

  it("does not count padding towards the minimum length (it said 'enough' for notes the server refused as too short)", () => {
    const padded = "Cat: a small pet.          \n\n\n\n          Dog: a loyal pet.          \n\n\n\n          Cow: a farm animal.";
    expect(padded.trim().length).toBeGreaterThan(60);
    expect(server(padded)).toBe("0");
    expect(verdict(padded)).toBe("0");
  });

  it("gives the server's verdict on real notes in both content languages", () => {
    const en = "Photosynthesis: how plants make food from light.\nChlorophyll: the green pigment in leaves.\nStomata: tiny pores in a leaf.\nRoots take up water from the soil.";
    const he = "פוטוסינתזה: הדרך שבה צמחים מייצרים מזון מאור.\nכלורופיל: הפיגמנט הירוק בעלים.\nפיוניות: נקבוביות זעירות בעלה.\nהשורשים קולטים מים מהאדמה.";
    expect(verdict(en)).toBe(server(en));
    expect(verdict(he, "he")).toBe(server(he, "he"));
    expect(verdict(en)).toBe("1");
  });
});

describe("a failed generation in the interface language", () => {
  const he = makeT(DICTIONARIES.he);

  it("explains a missing AI provider in Hebrew instead of the server's English text", () => {
    const english = "AI generation is not configured on this server. You were not charged.";
    expect(failureText({ code: "AI_UNAVAILABLE", message: english }, he)).toBe(he("gen.err.PROVIDER_AUTH"));
    expect(failureText({ code: "TIMEOUT", message: english }, he)).toBe(he("gen.err.TIMEOUT"));
  });

  it("falls back to the server's message for a code it has no text for (an inherited object key is not a code)", () => {
    expect(failureText({ code: "SOME_NEW_CODE", message: "The game was deleted." }, he)).toBe("The game was deleted.");
    expect(failureText({ code: "constructor", message: "x" }, he)).toBe("x");
    expect(failureText(null, he)).toBe(he("common.error.generic"));
  });
});

describe("the AI edit robot after another change on the same page", () => {
  it("asks for the newest revision the page knows: a restore or a manual edit no longer makes the next edit a conflict", () => {
    // the panel last saw v3 (its own edit); the page was refreshed after restoring an older version, which became v4
    expect(editRequestBody("Add a hint", "k1", { local: 3, page: 4 }).expectedRevision).toBe(4);
    // its own edit is newer than the props until the refresh arrives
    expect(editRequestBody("Add a hint", "k1", { local: 5, page: 4 })).toEqual({ instruction: "Add a hint", idempotencyKey: "k1", expectedRevision: 5 });
  });
});
