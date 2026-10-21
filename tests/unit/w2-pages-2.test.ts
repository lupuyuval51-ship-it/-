import { createElement as h, type ComponentType, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "@/components/I18nProvider";
import { findTopic } from "@/lib/game/topics/catalog";
import { COURSES } from "@/lib/game/topics/courses";
import { DICTIONARIES, type Locale } from "@/lib/i18n";

/**
 * The account panel's credential check, and the course screen rendered on the server with a fake localStorage: each chapter
 * shows its own catalogue row (looked up by topic id, never by position) in every interface language.
 */

const hoisted = vi.hoisted(() => ({
  hidden: new Set<string>(),
  account: { session: null as null | { user: { id: string; email: string } }, status: "idle", lastSyncAt: null as number | null, error: null as string | null },
}));

// a catalogue that lacks some chapter rows (the screen must not shift the others onto the wrong chapter)
vi.mock("@/lib/game/topics/catalog", async (importOriginal) => {
  const m = await importOriginal<typeof import("@/lib/game/topics/catalog")>();
  return { ...m, findTopic: (id: string) => (hoisted.hidden.has(id) ? undefined : m.findTopic(id)) };
});
vi.mock("../../mobile/src/cloud/account", () => ({
  useAccount: () => hoisted.account,
  signIn: async () => ({ ok: true }),
  signUp: async () => ({ ok: true }),
  signOut: async () => undefined,
  deleteAccount: async () => ({ ok: true }),
  syncNow: async () => undefined,
}));
vi.mock("../../mobile/src/cloud/google-native", () => ({ isFinishingGoogleSignIn: () => false, onGoogleResult: () => () => undefined, signInWithGoogle: async () => ({ ok: false, reason: "failed" }) }));

const mem = new Map<string, string>();
const fakeStorage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => void mem.set(k, v),
  removeItem: (k: string) => void mem.delete(k),
  key: (i: number) => [...mem.keys()][i] ?? null,
  get length() { return mem.size; },
};
const win = { location: { hash: "" }, localStorage: fakeStorage, addEventListener: () => {}, removeEventListener: () => {} };

let CoursePage: ComponentType<{ courseId: string }>;
let AccountPanel: ComponentType;
let credentialsProblem: (email: string, password: string) => string | null;

beforeAll(async () => {
  vi.stubGlobal("localStorage", fakeStorage);
  vi.stubGlobal("window", win);
  vi.stubGlobal("document", { documentElement: { removeAttribute: () => {}, setAttribute: () => {} } });
  fakeStorage.setItem("levelup.mobile.settings", JSON.stringify({ setupDone: true }));
  ({ CoursePage } = await import("../../mobile/src/pages/Course"));
  ({ AccountPanel, credentialsProblem } = await import("../../mobile/src/pages/AccountPanel"));
});
afterAll(() => vi.unstubAllGlobals());
beforeEach(() => {
  hoisted.hidden.clear();
  hoisted.account = { session: null, status: "idle", lastSyncAt: null, error: null };
});

const render = (el: ReactElement, locale: Locale = "en") => renderToStaticMarkup(h(I18nProvider, { locale, dict: DICTIONARIES[locale], children: el }));
const course = COURSES[0]!;
const titleOf = (id: string, lang: "he" | "en") => findTopic(id)![lang][0];
/** The rendered `<li>` of one chapter, or null. */
const chapterItem = (html: string, topicId: string): string | null => {
  const at = html.indexOf(`data-topic="${topicId}"`);
  return at < 0 ? null : html.slice(at, html.indexOf("</li>", at));
};
const nextCard = (html: string): string => {
  const at = html.indexOf('data-testid="course-next"');
  return html.slice(at, html.indexOf("</section>", at));
};
// React escapes text: compare with the escaped form
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");

describe("account panel: the e-mail and password check", () => {
  it("accepts an address with the space a phone keyboard adds after a suggestion (it is sent trimmed)", () => {
    expect(credentialsProblem("kid@example.test ", "password1")).toBeNull();
    expect(credentialsProblem("  kid@example.test", "password1")).toBeNull();
    expect(credentialsProblem("kid@example.test\n", "password1")).toBeNull();
  });

  it("still refuses what is not an address, and a short password", () => {
    expect(credentialsProblem("not-an-email", "password1")).toBe("mob.account.error.email");
    expect(credentialsProblem("kid @example.test", "password1")).toBe("mob.account.error.email");
    expect(credentialsProblem("   ", "password1")).toBe("mob.account.error.email");
    expect(credentialsProblem("kid@example.test", "1234567")).toBe("mob.account.error.password");
    expect(credentialsProblem("kid@example.test", "12345678")).toBeNull();
  });

  it("takes the password exactly as typed (spaces are part of it, never trimmed away)", () => {
    expect(credentialsProblem("kid@example.test", "  123456")).toBeNull(); // 8 characters with the spaces
    expect(credentialsProblem("kid@example.test", "       ")).toBe("mob.account.error.password");
  });

  it("every message the check can give exists in Hebrew, English and Spanish", () => {
    for (const key of ["mob.account.error.email", "mob.account.error.password"] as const) {
      for (const locale of ["he", "en", "es"] as const) expect((DICTIONARIES[locale] as Record<string, string>)[key], `${locale} ${key}`).toBeTruthy();
    }
  });

  it("renders signed out and signed in; the delete confirmation starts closed", () => {
    const out = render(h(AccountPanel), "he");
    expect(out).toContain('data-testid="account-signed-out"');
    hoisted.account = { session: { user: { id: "u1", email: "kid@example.test" } }, status: "ok", lastSyncAt: 1_700_000_000_000, error: null };
    const inside = render(h(AccountPanel));
    expect(inside).toContain('data-testid="account-signed-in"');
    expect(inside).toContain('data-testid="delete-account"');
    expect(inside).not.toContain('data-testid="delete-account-confirm"');
  });
});

describe("course screen: each chapter shows its own row", () => {
  it("lists every chapter in teaching order with its own title, in every interface language (Spanish shows the English content)", () => {
    for (const [locale, lang] of [["he", "he"], ["en", "en"], ["es", "en"]] as const) {
      const html = render(h(CoursePage, { courseId: course.id }), locale);
      let last = -1;
      for (const id of course.chapters) {
        const li = chapterItem(html, id);
        expect(li, `${locale} ${id}`).not.toBeNull();
        expect(li).toContain(esc(titleOf(id, lang)));
        const at = html.indexOf(`data-topic="${id}"`);
        expect(at).toBeGreaterThan(last);
        last = at;
      }
      expect(nextCard(html)).toContain(esc(titleOf(course.chapters[0]!, lang)));
    }
  });

  it("a chapter the catalogue lacks is left out without shifting the next chapters' titles onto it", () => {
    const [, , c3, c4, c5] = course.chapters as readonly string[];
    hoisted.hidden.add(c3!);
    const html = render(h(CoursePage, { courseId: course.id }));
    expect(chapterItem(html, c3!)).toBeNull();
    expect(chapterItem(html, c4!)).toContain(esc(titleOf(c4!, "en")));
    expect(chapterItem(html, c4!)).not.toContain(esc(titleOf(c5!, "en")));
    expect(chapterItem(html, c5!)).toContain(esc(titleOf(c5!, "en")));
    // the last chapter is still listed (by position it would have been dropped)
    const last = course.chapters[course.chapters.length - 1]!;
    expect(chapterItem(html, last)).toContain(esc(titleOf(last, "en")));
  });

  it("the next-chapter card never names another chapter than the one its button opens", () => {
    const [c1, c2] = course.chapters as readonly string[];
    hoisted.hidden.add(c1!);
    const card = nextCard(render(h(CoursePage, { courseId: course.id })));
    expect(card).toContain('data-chapter="1"');
    expect(card).not.toContain(esc(titleOf(c2!, "en")));
  });

  it("an unknown course is the not-found screen", () => {
    expect(render(h(CoursePage, { courseId: "no-such-course" }))).toContain('data-testid="course-missing"');
  });
});
