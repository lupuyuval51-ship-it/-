import { createElement as h, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "@/components/I18nProvider";
import { InputState } from "@/components/game/input";
import { InteractPrompt, PauseMenu, Toasts, TopBar, TouchControls, TutorialCard } from "@/components/game/hud/Overlays";
import { ChallengePanel } from "@/components/game/hud/ChallengePanel";
import { renderProfileFor } from "@/config/graphics";
import type { PublicChallenge } from "@/lib/game/challenges/grade";
import { toPublicSpec } from "@/lib/game/spec/public";
import { initialState, toClientState } from "@/lib/game/state/progress";
import { computeLayout, type Layout } from "@/lib/layout";
import { DICTIONARIES, type Locale } from "@/lib/i18n";
import { validDemoSpec } from "./helpers";

// The HUD reads the viewport through useLayout; these tests choose the viewport instead of measuring one.
const view = vi.hoisted(() => ({ layout: null as unknown as Layout }));
vi.mock("@/components/game/useLayout", () => ({ useLayout: () => view.layout }));

const render = (el: ReactElement, locale: Locale = "en") => renderToStaticMarkup(h(I18nProvider, { locale, dict: DICTIONARIES[locale], children: el }));
const noop = () => undefined;
const portrait = () => computeLayout(360, 640);
const sideways = () => computeLayout(740, 360);
const tablet = () => computeLayout(820, 1180);

const setup = () => {
  const spec = toPublicSpec(validDemoSpec({ mode: "FULL" }));
  return { spec, client: toClientState(initialState(spec as never, 0)) };
};
const bar = (extra: Record<string, unknown> = {}, locale: Locale = "en") => {
  const { spec, client } = setup();
  return render(h(TopBar, { spec, client, areaName: "Nile Valley", score: 0, maxScore: 500, onPause: noop, demo: false, ...extra }), locale);
};

beforeEach(() => { view.layout = portrait(); });

describe("top bar: how the game was made is part of the area card, not a floating chip", () => {
  it("shows the study-engine label inside the area card, before the area name", () => {
    const html = bar({ engine: true });
    const card = html.slice(html.indexOf('min-w-[7rem]'), html.indexOf('data-testid="score"'));
    expect(card).toContain('data-testid="source-badge"');
    expect(card).toContain("From your material");
    expect(card.indexOf("source-badge")).toBeLessThan(card.indexOf('data-testid="area-name"'));
    // no second copy as a loose chip
    expect(html.match(/From your material/g)).toHaveLength(1);
  });

  it("says Hebrew in Hebrew, and demo templates are labelled as such", () => {
    expect(bar({ engine: true }, "he")).toContain(DICTIONARIES.he["engine.badge"]);
    const demo = bar({ demo: true });
    expect(demo).toContain("Demo template");
    expect(demo).not.toContain("From your material");
  });

  it("has no label for a game made by a model", () => {
    expect(bar()).not.toContain("source-badge");
  });

  it("keeps the status-chip row out of the layout while it is empty", () => {
    expect(bar({ collect: { have: 0, total: 0 } })).toContain("empty:hidden");
  });

  it("makes the pause button a full-size touch target", () => {
    expect(bar()).toMatch(/data-testid="pause-button"[^>]*min-w-11|min-w-11[^>]*data-testid="pause-button"/);
  });

  it("pads the bar by the notch insets (left, right, top)", () => {
    const html = bar();
    expect(html).toContain("env(safe-area-inset-left");
    expect(html).toContain("env(safe-area-inset-right");
    expect(html).toContain("env(safe-area-inset-top");
  });
});

describe("toasts sit right under the top bar", () => {
  const toasts = [{ id: 1, text: "Hello", tone: "info" as const }];
  it("uses the measured bottom edge when there is one", () => {
    const html = render(h(Toasts, { toasts, top: 132 }));
    expect(html).toContain("top:132px");
    expect(html).not.toContain("top-16");
  });
  it("falls back to a fixed offset before the bar was measured", () => {
    expect(render(h(Toasts, { toasts }))).toContain("top-16");
    view.layout = sideways();
    expect(render(h(Toasts, { toasts }))).toContain("top-12");
  });
});

describe("first-run card", () => {
  it("is a short touch card above the controls on a phone (and speaks about the joystick, not W A S D)", () => {
    const html = render(h(TutorialCard, { touch: true, onDismiss: noop }));
    expect(html).toContain('data-testid="tutorial-card"');
    expect(html).toContain('data-testid="tutorial-ok"');
    expect(html).toContain(DICTIONARIES.en["hud.tutorial.move.touch"]);
    expect(html).toContain(DICTIONARIES.en["hud.tutorial.guide.short"]);
    expect(html).toContain("tap “Use”.");
    expect(html).not.toContain("W A S D");
    expect(html).toContain("bottom:calc(");
    // only the button takes touches
    expect(html.match(/pointer-events-auto/g)).toHaveLength(1);
  });

  it("drops the middle tip and moves between the controls on a phone held sideways", () => {
    view.layout = sideways();
    const html = render(h(TutorialCard, { touch: true, onDismiss: noop }));
    expect(html).toContain('data-compact="1"');
    expect(html).not.toContain(DICTIONARIES.en["hud.tutorial.guide.short"]);
    expect(html).toMatch(/left:max\(7\.25rem/);
    expect(html).toMatch(/right:max\(12\.00rem/);
  });

  it("sits higher on a tablet, above its bigger controls", () => {
    const phone = render(h(TutorialCard, { touch: true, onDismiss: noop }));
    view.layout = tablet();
    const big = render(h(TutorialCard, { touch: true, onDismiss: noop }));
    expect(phone).toContain("bottom:calc(8.75rem");
    expect(big).toContain("bottom:calc(10.50rem");
  });

  it("keeps the keyboard wording for mouse and keyboard players", () => {
    const html = render(h(TutorialCard, { touch: false, onDismiss: noop }));
    expect(html).toContain("W A S D");
    expect(html).not.toContain("bottom:calc(");
  });

  it("has a Hebrew version of every touch tip, with the button name filled in", () => {
    const html = render(h(TutorialCard, { touch: true, onDismiss: noop }), "he");
    expect(html).toContain(DICTIONARIES.he["hud.tutorial.move.touch"]);
    expect(html).toContain(`“${DICTIONARIES.he["touch.interact"]}”`);
    expect(html).not.toMatch(/\{\w+\}/);
  });
});

describe("interact prompt keeps clear of the touch controls", () => {
  const target = { kind: "npc" as const, id: "n1", label: "Byte", x: 0, z: 0 };

  it("floats above the controls on a phone in portrait", () => {
    const html = render(h(InteractPrompt, { target, touch: true, onActivate: noop }));
    expect(html).toContain("bottom:calc(8.75rem");
    expect(html).not.toContain("bottom-28");
  });

  it("uses the free strip between the stick and the buttons when the phone is sideways", () => {
    view.layout = sideways();
    const html = render(h(InteractPrompt, { target, touch: true, onActivate: noop }));
    expect(html).toContain("left:max(7.25rem");
    expect(html).toContain("right:max(12.00rem");
    expect(html).not.toContain("inset-x-0");
  });

  it("keeps the old spot for keyboard and mouse", () => {
    const html = render(h(InteractPrompt, { target, touch: false, onActivate: noop }));
    expect(html).toContain("bottom-28 sm:bottom-10");
    expect(html).not.toContain("style=");
    expect(html).toContain('aria-keyshortcuts="E"');
  });

  it("renders nothing when there is nothing to use", () => {
    expect(render(h(InteractPrompt, { target: null, touch: true, onActivate: noop }))).toBe("");
  });
});

describe("touch controls", () => {
  const input = new InputState();

  it("light the action button while something can be used", () => {
    expect(render(h(TouchControls, { input, onInteract: noop, hasJump: true, ready: true }))).toContain('data-ready="1"');
    expect(render(h(TouchControls, { input, onInteract: noop, hasJump: true }))).toContain('data-ready="0"');
  });

  it("stay left-stick / right-buttons in Hebrew too (a game pad is not mirrored)", () => {
    const he = render(h(TouchControls, { input, onInteract: noop, hasJump: true }), "he");
    expect(he).toContain("direction:ltr");
    expect(he).toContain(DICTIONARIES.he["touch.jump"]);
  });

  it("leave out the jump button when the world has no jumping", () => {
    expect(render(h(TouchControls, { input, onInteract: noop, hasJump: false }))).not.toContain(DICTIONARIES.en["touch.jump"]);
  });

  it("stay clear of the notch and the gesture bar", () => {
    const html = render(h(TouchControls, { input, onInteract: noop, hasJump: true }));
    for (const side of ["left", "right", "bottom"]) expect(html).toContain(`env(safe-area-inset-${side}`);
  });
});

describe("pause menu", () => {
  const profile = renderProfileFor("B");
  const menu = (extra: Record<string, unknown> = {}) => render(h(PauseMenu, { profile, reduceMotion: false, onReduceMotion: noop, sfx: true, music: true, guide: true, onSfx: noop, onMusic: noop, onGuide: noop, onResume: noop, onRestart: noop, ...extra }));

  it("explains where a game came from, in full (a tooltip is not reachable by touch)", () => {
    const engine = menu({ source: "engine" });
    expect(engine).toContain('data-testid="source-note"');
    expect(engine).toContain(DICTIONARIES.en["engine.badge.hint"]);
    expect(menu({ source: "demo" })).toContain(DICTIONARIES.en["demo.badge.hint"]);
    expect(menu()).not.toContain("source-note");
  });

  it("offers the vibration switch only where the browser can vibrate (the app has its own setting)", () => {
    expect(menu()).not.toContain("vibration-toggle");
    const html = menu({ vibration: { on: true, onChange: noop } });
    expect(html).toContain('data-testid="vibration-toggle"');
    expect(html).toContain("Vibration");
  });

  it("lists the on-screen buttons (not keys) for touch players, in both languages", () => {
    const en = menu({ touch: true });
    expect(en).toContain("the joystick on the left");
    expect(en).toContain("tap “Jump”");
    expect(en).not.toContain("Space");
    expect(en).not.toContain("W A S D");
    const he = render(h(PauseMenu, { profile, reduceMotion: false, onReduceMotion: noop, sfx: true, music: true, guide: true, onSfx: noop, onMusic: noop, onGuide: noop, onResume: noop, onRestart: noop, touch: true }), "he");
    expect(he).toContain(`“${DICTIONARIES.he["touch.sprint"]}”`);
    expect(he).not.toMatch(/\{\w+\}/);
    expect(menu()).toContain("Space"); // keyboard players still get the keys
  });

  it("uses two columns on a phone held sideways so Resume needs no scrolling", () => {
    expect(menu()).not.toContain("grid-cols-2");
    view.layout = sideways();
    const html = menu();
    expect(html).toContain("grid-cols-2");
    expect(html.indexOf("grid-cols-2")).toBeLessThan(html.indexOf('data-testid="resume-button"'));
  });
});

describe("challenge panel on a phone", () => {
  const challenge: PublicChallenge = { id: "c1", title: "Pick one", prompt: "Which?", concept: "c", level: 1, hasHint: false, type: "choice", options: [{ id: "a", text: "A" }, { id: "b", text: "B" }] };
  const panel = () => render(h(ChallengePanel, { challenge, stationLabel: "Terminal", result: null, hint: null, busy: false, onSubmit: noop, onHint: noop, onClose: noop }));

  it("keeps the Check button above the gesture bar and the close button a full touch target", () => {
    const html = panel();
    expect(html).toContain("pb-[max(0.75rem,env(safe-area-inset-bottom))]");
    expect(html).toMatch(/aria-label="Close"[^>]*min-w-11|min-w-11[^>]*aria-label="Close"/);
  });

  it("pads the sides by the notch when the phone is sideways", () => {
    expect(panel()).not.toContain("env(safe-area-inset-left");
    view.layout = sideways();
    expect(panel()).toContain("env(safe-area-inset-left");
  });
});
