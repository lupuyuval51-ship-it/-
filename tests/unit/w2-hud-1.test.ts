import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { dialogTabTarget, type TabContext } from "@/components/game/hud/focusReturn";
import { FOCUSABLE, focusablesIn, reachable } from "@/components/game/hud/useDialogFocus";

// ───────── Tab inside a dialog ─────────

/** Elements are their page position; the dialog box is position 0 and holds everything from 1 to 99. */
const ROOT = 0;
const at: TabContext<number> = { inside: (e) => e >= 0 && e < 100, isRoot: (e) => e === ROOT, precedes: (a, b) => a < b };

describe("Tab inside an in-game dialog", () => {
  // the pause menu: four switches, the "Controls" <summary> (not a listed control before this fix), Resume, Restart, Exit
  const sound = 10, music = 11, guide = 12, motion = 13, summary = 20, resume = 30, restart = 31, exit = 32;
  const items = [sound, music, guide, motion, resume, restart, exit];

  it("moves on from the pause menu's 'Controls' summary instead of jumping back to the first switch", () => {
    // before: the summary counted as "outside", so Tab sent the focus to the sound switch and Shift+Tab to "Exit"
    expect(dialogTabTarget(false, summary, items, at)).toBeNull(); // the browser goes on to "Resume"
    expect(dialogTabTarget(true, summary, items, at)).toBeNull(); // and back to the motion switch
  });

  it("still wraps around from an unlisted element at either end of the dialog", () => {
    expect(dialogTabTarget(false, 50, items, at)).toBe(0); // nothing tabbable after it: back to the first control
    expect(dialogTabTarget(true, 50, items, at)).toBeNull();
    expect(dialogTabTarget(true, 5, items, at)).toBe(items.length - 1); // nothing before it: to the last control
    expect(dialogTabTarget(false, 5, items, at)).toBeNull();
  });

  it("keeps the old rules for the listed controls, the dialog box itself and a focus outside the dialog", () => {
    expect(dialogTabTarget(false, exit, items, at)).toBe(0);
    expect(dialogTabTarget(true, sound, items, at)).toBe(items.length - 1);
    expect(dialogTabTarget(false, music, items, at)).toBeNull();
    expect(dialogTabTarget(true, restart, items, at)).toBeNull();
    expect(dialogTabTarget(false, ROOT, items, at)).toBe(0);
    expect(dialogTabTarget(true, ROOT, items, at)).toBe(items.length - 1);
    expect(dialogTabTarget(false, 500, items, at)).toBe(0);
    expect(dialogTabTarget(true, null, items, at)).toBe(items.length - 1);
  });

  it("keeps the focus on the dialog box when it has no control left", () => {
    expect(dialogTabTarget(false, summary, [], at)).toBe(-1);
    expect(dialogTabTarget(true, ROOT, [], at)).toBe(-1);
  });
});

// ───────── which controls are in the Tab order ─────────

interface Fake {
  tabIndex: number;
  disabled?: boolean;
  hidden?: boolean;
  attrs?: Record<string, string>;
  parentElement: Fake | null;
  visible?: boolean;
}

/** Just enough of an element for `reachable` / `focusablesIn` (unit tests run in node, without a DOM). */
function el(f: Partial<Fake> & { parentElement: Fake | null }): HTMLElement {
  const fake = {
    tabIndex: f.tabIndex ?? 0,
    hidden: f.hidden ?? false,
    parentElement: f.parentElement,
    matches: (sel: string) => (sel === ":disabled" ? f.disabled === true : false),
    hasAttribute: (name: string) => name in (f.attrs ?? {}),
    getAttribute: (name: string) => f.attrs?.[name] ?? null,
    ...(f.visible === undefined ? {} : { checkVisibility: () => f.visible }),
  };
  return fake as unknown as HTMLElement;
}
const asFake = (e: HTMLElement) => e as unknown as Fake;

function dialog(children: (root: Fake) => HTMLElement[]): { root: HTMLElement; all: HTMLElement[] } {
  const outside = asFake(el({ parentElement: null, attrs: { "aria-hidden": "true" } })); // e.g. the page behind the modal
  const root = { ...asFake(el({ parentElement: outside })), querySelectorAll: () => all } as unknown as HTMLElement;
  const all = children(asFake(root));
  return { root, all };
}

describe("the dialog's controls", () => {
  it("leaves out the roving radios that are not the tab stop, and disabled controls", () => {
    const { root, all } = dialog((r) => [
      el({ parentElement: r }), // close
      el({ parentElement: r, tabIndex: 0 }), // the checked radio
      el({ parentElement: r, tabIndex: -1 }), // the other radios
      el({ parentElement: r, tabIndex: -1 }),
      el({ parentElement: r, disabled: true }), // "Check" before an answer is picked
    ]);
    expect(focusablesIn(root)).toEqual([all[0], all[1]]);
  });

  it("leaves out what sits inside something hidden, inert or aria-hidden within the dialog, or is not drawn", () => {
    const { root, all } = dialog((r) => {
      const hiddenBox = asFake(el({ parentElement: r, hidden: true }));
      const inertBox = asFake(el({ parentElement: r, attrs: { inert: "" } }));
      const ariaBox = asFake(el({ parentElement: r, attrs: { "aria-hidden": "true" } }));
      return [
        el({ parentElement: hiddenBox }),
        el({ parentElement: inertBox }),
        el({ parentElement: ariaBox }),
        el({ parentElement: r, visible: false }), // display: none from a stylesheet
        el({ parentElement: r, visible: true }),
        el({ parentElement: r }), // a browser without checkVisibility: assumed drawn
      ];
    });
    expect(focusablesIn(root)).toEqual([all[4], all[5]]);
  });

  it("does not look above the dialog (the page behind a modal may be aria-hidden)", () => {
    const { root, all } = dialog((r) => [el({ parentElement: r })]);
    expect(reachable(all[0]!, root)).toBe(true);
  });

  it("lists the summary of a <details> (the pause menu's 'Controls') and never a hidden input", () => {
    expect(FOCUSABLE).toContain("details > summary:first-of-type");
    expect(FOCUSABLE).toContain('input:not([type="hidden"])');
  });
});

describe("the dialog hook is wired to these rules", () => {
  const hook = readFileSync("src/components/game/hud/useDialogFocus.ts", "utf8");

  it("uses the dialog-aware Tab rule and the reachable first focus", () => {
    expect(hook).toMatch(/dialogTabTarget\(e\.shiftKey, active, items/);
    expect(hook).toMatch(/querySelectorAll<HTMLElement>\(initial\)\]\.find\(\(el\) => reachable\(el, root\)\)/);
    // the box itself takes the focus when the wanted control could not (it is then not left outside the modal)
    expect(hook).toMatch(/if \(!first \|\| !root\.contains\(document\.activeElement\)\)/);
  });
});

describe("keyboard inset hook", () => {
  const src = readFileSync("src/components/game/hud/useKeyboardInset.ts", "utf8");

  it("follows the layout viewport as well as the visual one, and lets go of both", () => {
    expect(src).toMatch(/window\.addEventListener\("resize", update\)/);
    expect(src).toMatch(/window\.removeEventListener\("resize", update\)/);
    expect(src).toMatch(/vv\.addEventListener\("resize", update\)/);
  });
});
