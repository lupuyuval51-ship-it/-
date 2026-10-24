import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { focusReturnTarget, OPENER_WINDOW_MS, removedOpener, type Activation } from "@/components/game/hud/focusReturn";

type El = { name: string; connected: boolean };
const el = (name: string, connected = true): El => ({ name, connected });
const usable = (e: El) => e.connected;
const connected = (e: El) => e.connected;
const click = (e: El, id: string | null, at = 1000): Activation<El> => ({ el: e, id, at });

describe("focus return after an in-game dialog closes", () => {
  it("goes back to the element that had the focus when it is still there", () => {
    const pause = el("pause");
    expect(focusReturnTarget(pause, null, usable, () => null)).toBe(pause);
  });

  it("does not use an element that left the page", () => {
    const gone = el("gone", false);
    expect(focusReturnTarget(gone, null, usable, () => null)).toBeNull();
  });

  it("falls back to the replacement of the control that opened the dialog and was removed by it (the interact prompt)", () => {
    // the player activated the prompt: the click is recorded, then the dialog opens in the same render that drops the prompt
    const oldPrompt = el("prompt", false);
    const opener = removedOpener(click(oldPrompt, "interact-prompt"), 1200, connected);
    expect(opener).toEqual({ id: "interact-prompt" });
    // when the dialog closes the prompt is drawn again (same test id, new element)
    const newPrompt = el("prompt-2");
    expect(focusReturnTarget(null, opener, usable, (id) => (id === "interact-prompt" ? newPrompt : null))).toBe(newPrompt);
  });

  it("leaves the focus alone when the replacement is not back (the player walked away) or the id is unknown", () => {
    const opener = { id: "interact-prompt" };
    expect(focusReturnTarget(null, opener, usable, () => null)).toBeNull();
    expect(focusReturnTarget(null, opener, usable, () => el("hidden", false))).toBeNull();
    expect(focusReturnTarget(null, null, usable, () => el("any"))).toBeNull();
  });

  it("prefers the element that had the focus over the opener's replacement", () => {
    const pause = el("pause");
    expect(focusReturnTarget(pause, { id: "interact-prompt" }, usable, () => el("prompt"))).toBe(pause);
  });
});

describe("which click opened the dialog", () => {
  it("ignores a control that is still on the page (it is the focused element's job then)", () => {
    expect(removedOpener(click(el("pause"), "pause-button"), 1100, connected)).toBeNull();
  });

  it("ignores a control without a test id (it could not be found again) and a click that is too old", () => {
    expect(removedOpener(click(el("x", false), null), 1100, connected)).toBeNull();
    expect(removedOpener(click(el("x", false), "interact-prompt"), 1000 + OPENER_WINDOW_MS + 1, connected)).toBeNull();
    expect(removedOpener(click(el("x", false), "interact-prompt"), 1000 + OPENER_WINDOW_MS, connected)).toEqual({ id: "interact-prompt" });
    expect(removedOpener(null, 1100, connected)).toBeNull();
  });
});

describe("the dialog hook uses it", () => {
  const hook = readFileSync("src/components/game/hud/useDialogFocus.ts", "utf8");
  const prompt = readFileSync("src/components/game/hud/Overlays.tsx", "utf8");

  it("restores through focusReturnTarget and never records clicks made inside a dialog", () => {
    expect(hook).toMatch(/focusReturnTarget\(previous, opener, usable/);
    expect(hook).toMatch(/closest\('\[role="dialog"\]'\)/);
  });

  it("the interact prompt keeps the test id the replacement is found by", () => {
    expect(prompt).toMatch(/data-testid="interact-prompt"/);
  });
});
