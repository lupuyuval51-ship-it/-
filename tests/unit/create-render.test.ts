import { createElement, type ComponentProps, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "@/components/I18nProvider";
import { DICTIONARIES, type Locale } from "@/lib/i18n";
import { DRAFT_KEY, emptyForm } from "../../mobile/src/pages/createForm";
import { EXAMPLES } from "../../mobile/src/pages/examples";

/** What the New game screen shows for a given tier, locale, hash and saved draft (server-side render: markup only, no effects). */
const env = vi.hoisted(() => ({ tier: "A" as "A" | "B" | "C" }));
vi.mock("../../mobile/src/app-state", () => ({ store: { addGame: () => ({ id: "x" }) } }));
vi.mock("@/lib/offline/entitlement", () => ({ getOfflinePlan: () => "PRO", getOfflineTier: () => env.tier }));

const { CreatePage } = await import("../../mobile/src/pages/Create");

function fakeWindow(hash: string, saved?: unknown) {
  const data = new Map<string, string>();
  if (saved !== undefined) data.set(DRAFT_KEY, JSON.stringify({ v: 1, savedAt: 1, form: saved }));
  const localStorage = { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v), removeItem: (k: string) => void data.delete(k) };
  Object.assign(globalThis, { window: { location: { hash }, localStorage } });
}

// `createElement` wants the provider's children as arguments, its props type wants them in the props: cast once.
const Provider = I18nProvider as unknown as ComponentType<Omit<ComponentProps<typeof I18nProvider>, "children">>;
const markup = (locale: Locale): string => renderToStaticMarkup(createElement(Provider, { locale, dict: DICTIONARIES[locale] }, createElement(CreatePage)));

function render(locale: Locale = "he", hash = "#/create", saved?: unknown): string {
  fakeWindow(hash, saved);
  return markup(locale);
}

const options = (html: string, id: string): { value: string; disabled: boolean; selected: boolean; label: string }[] => {
  const sel = new RegExp(`<select[^>]*id="${id}"[^>]*>([\\s\\S]*?)</select>`).exec(html);
  expect(sel, `select #${id}`).not.toBeNull();
  return [...sel![1]!.matchAll(/<option([^>]*)>([\s\S]*?)<\/option>/g)].map((m) => ({
    value: /value="([^"]*)"/.exec(m[1]!)![1]!,
    disabled: /\bdisabled\b/.test(m[1]!),
    selected: /\bselected\b/.test(m[1]!),
    label: m[2]!,
  }));
};
const inputValue = (html: string, id: string): string => {
  const m = new RegExp(`<input[^>]*id="${id}"[^>]*>`).exec(html)?.[0] ?? "";
  return /value="([^"]*)"/.exec(m)?.[1] ?? "";
};

beforeEach(() => { env.tier = "A"; });
afterEach(() => { delete (globalThis as { window?: unknown }).window; });

describe("New game screen (offline app)", () => {
  it("keeps the ids and test ids the mobile e2e specs drive", () => {
    const html = render();
    for (const id of ["mobile-create", "create-notes-column", "create-options-column", "notes-help", "example-notes", "mobile-create-submit"]) expect(html).toContain(`data-testid="${id}"`);
    for (const id of ["subject", "material", "goal", "mode", "language", "difficulty", "gameType"]) expect(html).toContain(`id="${id}"`);
    expect(html).toMatch(/מושג: הסבר/); // the help explains the format
    expect(html).toMatch(/<input[^>]*type="file"[^>]*data-testid="material-file"/); // notes can come from a text file on the phone
    expect(html).toContain('data-testid="material-file-button"');
    expect(html).not.toContain('data-testid="mobile-create-error"');
    expect(html).not.toContain('data-testid="mobile-progress"');
  });

  it("offers every example as a button, the first one under the original test id", () => {
    const html = render("he");
    const buttons = [...html.matchAll(/<button[^>]*data-testid="(example-notes[^"]*)"[^>]*>([^<]*)<\/button>/g)];
    expect(buttons.map((b) => b[1])).toEqual(["example-notes", ...EXAMPLES.slice(1).map((e) => `example-notes-${e.id}`)]);
    expect(buttons.map((b) => b[2])).toEqual(EXAMPLES.map((e) => e.he.subject));
    expect(buttons[0]![2]).toBe("מחזור המים");
    const en = render("en");
    expect(en).toContain(">The water cycle</button>");
  });

  it("tier A: nothing is locked and the form starts as an adventure", () => {
    const html = render("en");
    expect(options(html, "mode").every((o) => !o.disabled)).toBe(true);
    expect(options(html, "gameType").every((o) => !o.disabled)).toBe(true);
    expect(options(html, "gameType").find((o) => o.selected)?.value).toBe("adventure");
    expect(html).not.toContain("create-locked-note");
    expect(html).toContain("No notes? You get a ready-made demo game");
  });

  it("tier C: what the plan lacks is disabled and labelled, and the form starts on a game type the tier has", () => {
    env.tier = "C";
    const he = render("he");
    const modes = options(he, "mode");
    expect(modes.find((o) => o.value === "FULL")).toMatchObject({ disabled: true });
    expect(modes.find((o) => o.value === "FULL")!.label).toContain("לא בתוכנית שלכם");
    expect(modes.find((o) => o.value === "FAST")).toMatchObject({ disabled: false, selected: true });
    const types = options(he, "gameType");
    expect(types.filter((o) => o.disabled).map((o) => o.value).sort()).toEqual(["adventure", "platformer", "simulation"]);
    expect(types.find((o) => o.selected)?.value).toBe("exploration");
    expect(he).toContain('data-testid="create-locked-note"');
    const en = render("en");
    expect(options(en, "mode").find((o) => o.value === "FULL")!.label).toBe("Full Adventure (not in your plan)");
  });

  it("restores an unfinished draft, cut down to what the tier has, and says so", () => {
    env.tier = "C";
    const saved = { ...emptyForm("en", "A"), subject: "My unit", goal: "Know it", material: "Term: meaning of the term", mode: "FULL", gameType: "simulation", language: "en" };
    const html = render("en", "#/create", saved);
    expect(inputValue(html, "subject")).toBe("My unit");
    expect(inputValue(html, "goal")).toBe("Know it");
    expect(html).toContain("Term: meaning of the term");
    expect(html).toContain('data-testid="create-restored"');
    expect(html).toContain('data-testid="create-draft"'); // note + clear button
    expect(options(html, "mode").find((o) => o.selected)?.value).toBe("FAST");
    expect(options(html, "gameType").find((o) => o.selected)?.value).toBe("exploration");
  });

  it("opens with the example notes for #/create?example=1 and keeps the learner's own draft behind an undo", () => {
    const plain = render("he", "#/create?example=1");
    expect(inputValue(plain, "subject")).toBe("מחזור המים");
    expect(plain).not.toContain("create-undo");
    const own = { ...emptyForm("he", "A"), subject: "הנושא שלי", material: "חומר שכתבתי בעצמי" };
    const withDraft = render("he", "#/create?example=1", own);
    expect(inputValue(withDraft, "subject")).toBe("מחזור המים");
    expect(withDraft).toContain('data-testid="create-undo"');
    expect(withDraft).toContain("החזרת הטקסט שלי");
    expect(withDraft).not.toContain("create-restored");
  });

  it("a saved draft that is just an example is not offered back as 'my text'", () => {
    const ex = EXAMPLES[1]!.he;
    const html = render("he", "#/create?example=1", { ...emptyForm("he", "A"), subject: ex.subject, material: ex.notes });
    expect(html).not.toContain("create-undo");
  });

  it("works with storage that throws", () => {
    Object.assign(globalThis, { window: { location: { hash: "#/create" }, get localStorage(): never { throw new Error("blocked"); } } });
    const html = markup("he");
    expect(html).toContain('data-testid="mobile-create"');
    expect(html).not.toContain("create-restored");
  });

  it("every field and button is at least 44px tall (min-h-11) so a thumb can hit it", () => {
    const html = render("en");
    for (const id of ["subject", "goal"]) expect(new RegExp(`<input[^>]*id="${id}"[^>]*class="[^"]*min-h-11`).test(html) || new RegExp(`<input[^>]*class="[^"]*min-h-11[^"]*"[^>]*id="${id}"`).test(html)).toBe(true);
    for (const id of ["mode", "gameType", "difficulty", "language"]) expect(new RegExp(`<select[^>]*(?:id="${id}"[^>]*class="[^"]*min-h-11|class="[^"]*min-h-11[^"]*"[^>]*id="${id}")`).test(html)).toBe(true);
    for (const b of html.matchAll(/<button[^>]*class="([^"]*)"/g)) expect(b[1]).toContain("min-h-11");
    expect(html).toMatch(/<a href="#\/"[^>]*class="[^"]*min-h-11/);
  });

  it("uses logical (RTL-safe) spacing only", () => {
    const html = render("he");
    expect(html).not.toMatch(/class="[^"]*\b(?:ml|mr|pl|pr|left|right|text-left|text-right)-/);
  });
});
