import { createElement as h, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "@/components/I18nProvider";
import { DICTIONARIES, type Locale } from "@/lib/i18n";
import { TabBar, tabOf } from "../../mobile/src/pages/TabBar";

/**
 * The bottom tab bar marks the tab of the screen that is really shown. App's `route()` matches whole paths and opens the
 * library for any path it does not know; the bar used to match by prefix, so a path such as `/created` (or the plans screen
 * in a build that hides the plans, where Create's "see the plans" button still leads) showed the library while the Create
 * or Settings tab was announced as the current page.
 */

const render = (el: ReactElement, locale: Locale = "en") => renderToStaticMarkup(h(I18nProvider, { locale, dict: DICTIONARIES[locale], children: el }));
const currentTabs = (html: string) => [...html.matchAll(/aria-current="page" data-testid="([\w-]+)"/g)].map((m) => m[1]);

afterEach(() => vi.unstubAllEnvs());

describe("tabOf: the tab of the screen App's route() shows", () => {
  it("each tab's own screen, and the screens opened from it", () => {
    expect(tabOf("/", true)).toBe("/");
    expect(tabOf("/create", true)).toBe("/create");
    expect(tabOf("/review", true)).toBe("/review");
    expect(tabOf("/settings", true)).toBe("/settings");
    for (const p of ["/about", "/privacy", "/plans"]) expect(tabOf(p, true), p).toBe("/settings");
    // a game's results, its mistakes review and practice, a course and the play screen's path belong to Home
    for (const p of ["/games/g1/results/s1", "/games/g1/results/s1/review", "/games/g1/results/s1/practice", "/course/c1", "/play/g1"]) expect(tabOf(p, true), p).toBe("/");
  });

  it("a path route() does not know opens the library, so Home is the current tab", () => {
    for (const p of ["/created", "/reviews", "/settings/", "/settingsx", "/about/x", "/privacy-policy", "/plans/x", "/nope", ""]) expect(tabOf(p, true), p).toBe("/");
  });

  it("the plans screen belongs to Settings only in a build that shows the plans", () => {
    expect(tabOf("/plans", true)).toBe("/settings");
    expect(tabOf("/plans", false)).toBe("/");
    // the other Settings screens do not depend on the plans
    expect(tabOf("/about", false)).toBe("/settings");
    expect(tabOf("/privacy", false)).toBe("/settings");
  });

  it("reads the build's plans switch by default", () => {
    vi.stubEnv("VITE_SHOW_PLANS", "0");
    expect(tabOf("/plans")).toBe("/");
    vi.stubEnv("VITE_SHOW_PLANS", "1");
    expect(tabOf("/plans")).toBe("/settings");
  });
});

describe("TabBar marks exactly the shown screen's tab", () => {
  it("an unknown path shows the library: Home is the one current tab, in every language", () => {
    for (const locale of ["he", "en", "es"] as const) {
      for (const p of ["/created", "/settingsx", "/reviews"]) expect(currentTabs(render(h(TabBar, { path: p }), locale)), `${locale} ${p}`).toEqual(["tab-home"]);
    }
  });

  it("with the plans hidden, /plans (the library) marks Home, not Settings", () => {
    vi.stubEnv("VITE_SHOW_PLANS", "0");
    const html = render(h(TabBar, { path: "/plans" }));
    expect(currentTabs(html)).toEqual(["tab-home"]);
    expect(html).toMatch(/data-testid="tab-home" data-active="1"/);
    expect(html).not.toMatch(/data-testid="tab-settings" data-active/);
  });

  it("the known screens keep their tab (one current tab each)", () => {
    const cases: [string, string][] = [["/", "tab-home"], ["/create", "tab-create"], ["/review", "tab-review"], ["/settings", "tab-settings"], ["/about", "tab-settings"], ["/privacy", "tab-settings"], ["/plans", "tab-settings"], ["/games/g/results/s/review", "tab-home"]];
    for (const [p, tab] of cases) expect(currentTabs(render(h(TabBar, { path: p }))), p).toEqual([tab]);
  });
});
