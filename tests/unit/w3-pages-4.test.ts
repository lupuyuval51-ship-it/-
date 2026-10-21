import { createElement as h, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "@/components/I18nProvider";
import { offerText } from "@/components/pricing/PlanPrice";
import { APP_TRACKS, PLAN_IDS } from "@/config/plans";
import { DICTIONARIES, LOCALES, makeT, type Locale } from "@/lib/i18n";
import { setDefaultOfflinePlan } from "@/lib/offline/entitlement";

/**
 * The plans screen of the app (mobile/src/pages/Plans.tsx) and the questionnaire's plan step (FirstSetupPlan.tsx):
 * - what the screen says after Buy / Restore must match the plan the phone really uses (a restore that could not reach Play
 *   used to say "No active subscription was found", next to "Your plan: Plus");
 * - the plan step describes each plan as the app gives it (library topics per half-year, `APP_TRACKS`), like the plans screen,
 *   not with the website's games per level, and no longer claims that every feature is open and free.
 */

// No Play Billing outside the Android app: the plugin is never called by a server render.
vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform: () => false } }));
vi.mock("@capgo/native-purchases", () => ({ NativePurchases: {}, PURCHASE_TYPE: { INAPP: "inapp", SUBS: "subs" } }));
// The plan step reads and writes the app's settings; a plain object stands in (the real module reads the phone's storage at import).
const settings = { region: "IL", planChoice: null as string | null, locale: "en" as Locale };
vi.mock("../../mobile/src/app-state", () => ({ useSettings: () => settings, setSettings: () => undefined }));

const { PlansPage, chooseFrom, messageAfterBuy, messageAfterRestore, messageOnPlanChange, plansMessageKey, tracksText } = await import("../../mobile/src/pages/Plans");
const { PlanStep } = await import("../../mobile/src/pages/FirstSetupPlan");

const mem = new Map<string, string>();
beforeAll(() => {
  vi.stubGlobal("localStorage", { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v), removeItem: (k: string) => void mem.delete(k) });
  setDefaultOfflinePlan("FREE");
});
afterAll(() => { vi.unstubAllGlobals(); setDefaultOfflinePlan("PRO"); });

const render = (el: ReactElement, locale: Locale) => renderToStaticMarkup(h(I18nProvider, { locale, dict: DICTIONARIES[locale], children: el }));
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");

describe("what the plans screen says after Buy", () => {
  it("a purchase is only called done when the phone's plan is really on", () => {
    expect(messageAfterBuy({ ok: true }, "PLUS")).toBe("BOUGHT");
    expect(messageAfterBuy({ ok: true }, "PRO")).toBe("BOUGHT");
    // Play's sheet answered, but the answer could not be read as a paid plan yet: "waiting for Google Play", not "Your plan is on"
    expect(messageAfterBuy({ ok: true }, "FREE")).toBe("PENDING");
  });
  it("a failure says why, and a build without billing says nothing (the screen explains it)", () => {
    for (const reason of ["CANCELLED", "PENDING", "FAILED", "SUBSCRIBED"] as const) expect(messageAfterBuy({ ok: false, reason }, "FREE")).toBe(reason);
    expect(messageAfterBuy({ ok: false, reason: "UNAVAILABLE" }, "FREE")).toBeNull();
  });
  it("a pending payment that Play confirms while the screen is open turns into 'Your plan is on'", () => {
    expect(messageOnPlanChange("PENDING", "PLUS")).toBe("BOUGHT");
    expect(messageOnPlanChange("PENDING", "FREE")).toBe("PENDING");
    expect(messageOnPlanChange("CANCELLED", "PRO")).toBe("CANCELLED");
    expect(messageOnPlanChange(null, "PRO")).toBeNull();
  });
});

describe("what the plans screen says after Restore", () => {
  it("Play could not be asked: it says so, and never that no subscription was found", () => {
    expect(messageAfterRestore(false, "PLUS")).toBe("UNREACHABLE");
    expect(messageAfterRestore(false, "FREE")).toBe("UNREACHABLE");
    for (const locale of LOCALES) expect(makeT(DICTIONARIES[locale])(plansMessageKey("UNREACHABLE"))).toBe(DICTIONARIES[locale]["common.error.network"]);
  });
  it("Play answered: restored with a paid plan, nothing found on Free", () => {
    expect(messageAfterRestore(true, "PRO")).toBe("RESTORED");
    expect(messageAfterRestore(true, "PLUS")).toBe("RESTORED");
    expect(messageAfterRestore(true, "FREE")).toBe("NOTHING");
  });
  it("every message has its text in Hebrew, English and Spanish", () => {
    for (const m of ["BOUGHT", "CANCELLED", "PENDING", "SUBSCRIBED", "FAILED", "RESTORED", "NOTHING", "UNREACHABLE"] as const) {
      for (const locale of LOCALES) {
        const text = DICTIONARIES[locale][plansMessageKey(m)];
        expect(text, `${m} ${locale}`).toBeTruthy();
        if (locale === "he") expect(text).not.toMatch(/[<>]/);
      }
    }
  });
});

describe("the plans are described the same way on the plans screen and in the questionnaire's plan step", () => {
  it("each plan: its library topics per half-year (APP_TRACKS) and where they are chosen from, in every language", () => {
    for (const locale of LOCALES) {
      settings.locale = locale;
      const t = makeT(DICTIONARIES[locale]);
      const step = render(h(PlanStep), locale);
      const plans = render(h(PlansPage), locale);
      for (const plan of PLAN_IDS) {
        const tracks = tracksText(t, plan);
        expect(tracks).toContain(locale === "he" && APP_TRACKS[plan] === 1 ? "נושא אחד" : String(APP_TRACKS[plan]));
        expect(step).toContain(`data-testid="setup-tracks-${plan}">${esc(tracks)}<`);
        expect(plans).toContain(`data-testid="mobile-tracks-${plan}">${esc(tracks)}<`);
        expect(step).toContain(esc(chooseFrom(t, plan)));
        expect(plans).toContain(esc(chooseFrom(t, plan)));
        // the website's allowance (games per level per period) is not what the app gives
        expect(step).not.toContain(esc(offerText(t, plan)));
      }
    }
  });
  it("the plan step no longer says that every feature is open to everyone for free (a new install is Free; Plus and Pro are sold through Google Play)", () => {
    for (const locale of LOCALES) {
      settings.locale = locale;
      const step = render(h(PlanStep), locale);
      expect(step).not.toContain(esc(DICTIONARIES[locale]["pricing.open.now"]));
      expect(step).toContain(esc(DICTIONARIES[locale]["mob.plans.fineprint"]));
      // prices in shekels only
      expect(step).toContain("₪");
      expect(step).not.toContain("$");
    }
  });
  it("outside the Android app the plans screen can buy nothing and says why", () => {
    const html = render(h(PlansPage), "en");
    expect(html).toContain('data-testid="plans-unavailable"');
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*data-testid="plans-restore"/);
    expect(html).not.toContain('data-testid="plans-message"');
    expect(html).toContain(esc(DICTIONARIES.en["mob.plans.current"].replace("{plan}", DICTIONARIES.en["plan.FREE"])));
  });
});
