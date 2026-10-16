import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { I18nProvider } from "@/components/I18nProvider";
import { renderProfileFor } from "@/config/graphics";
import { DICTIONARIES, type Locale } from "@/lib/i18n";
import { computeLayout, DEFAULT_LAYOUT } from "@/lib/layout";

const state = vi.hoisted(() => ({ layout: null as unknown }));
vi.mock("@/components/game/useLayout", () => ({ useLayout: () => state.layout }));

import { DoneOverlay, PauseMenu } from "@/components/game/hud/Overlays";

const noop = () => {};
const wrap = (locale: Locale, el: ReturnType<typeof h>) => renderToStaticMarkup(h(I18nProvider, { locale, dict: DICTIONARIES[locale], children: el }));
const render = (locale: Locale) =>
  wrap(locale, h(PauseMenu, { profile: renderProfileFor("B"), reduceMotion: false, sfx: true, music: true, guide: true, onReduceMotion: noop, onSfx: noop, onMusic: noop, onGuide: noop, onResume: noop, onRestart: noop }));
const tagOf = (html: string, testid: string) => html.match(new RegExp(`<[^>]*data-testid="${testid}"[^>]*>`))?.[0] ?? "";

describe("pause menu layout (regression: clipped at the top on a landscape phone)", () => {
  for (const locale of ["he", "en"] as const) {
    for (const [w, ht, short] of [[915, 412, true], [390, 844, false]] as const) {
      it(`${locale} ${w}x${ht}: safe centering, scrolls inside itself, tidy equal-width actions`, () => {
        state.layout = computeLayout(w, ht);
        expect((state.layout as { shortLandscape: boolean }).shortLandscape).toBe(short);
        const html = render(locale);
        // a centred flex box clips its overflow above the top edge, where scrolling cannot reach it
        const outer = tagOf(html, "pause-backdrop");
        expect(outer).toContain("items-start");
        expect(outer).not.toContain("items-center");
        // the dialog centres itself with margins and scrolls internally, bounded by its container
        const dialog = tagOf(html, "pause-menu");
        for (const c of ["my-auto", "max-h-full", "overflow-y-auto"]) expect(dialog).toContain(c);
        expect(html).not.toMatch(/class="[^"]*\b(ml|mr|pl|pr|left|right|text-left|text-right)-/);
        // resume / restart / exit share one grid and fill their cells
        expect(tagOf(html, "pause-actions")).toContain("grid-cols-2");
        for (const id of ["resume-button", "restart-button", "exit-link"]) expect(tagOf(html, id)).toMatch(/\bw-full\b/);
        expect(html).toContain(DICTIONARIES[locale]["hud.exit"]);
      });
    }
  }

  it("is denser in short landscape: toggles beside the actions and compact padding", () => {
    state.layout = computeLayout(915, 412);
    const short = render("en");
    expect(short).toContain("grid grid-cols-2 items-start gap-3");
    expect(tagOf(short, "pause-menu")).toContain("p-3");
    state.layout = DEFAULT_LAYOUT;
    const tall = render("en");
    expect(tall).not.toContain("items-start gap-3");
    expect(tagOf(tall, "pause-menu")).toContain("p-5");
  });

  it("the completion card uses the same safe centering", () => {
    state.layout = computeLayout(915, 412);
    const summary = { score: 10, maxScore: 20, percent: 50, stars: 2, completed: true, achievements: [], collected: 0, collectiblesTotal: 0 };
    const html = wrap("en", h(DoneOverlay, { summary: summary as never, gameId: "g", sessionId: "s", onReplay: noop }));
    expect(html).toContain("items-start");
    expect(html).not.toMatch(/inset-0 z-40 flex items-center/);
    expect(tagOf(html, "done-overlay")).toContain("max-h-full");
  });
});
