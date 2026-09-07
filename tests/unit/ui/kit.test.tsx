// @vitest-environment jsdom
/**
 * Smoke tests for the design-system kit (Button, Sheet, Toast) rendered in jsdom.
 * Deliberately dependency-free: React's act() + react-dom/client are enough for a smoke test.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, useState, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Button, Sheet, ToastProvider, useToast } from "@/components/ui";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

if (typeof globalThis.requestAnimationFrame !== "function") {
  globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 0) as unknown as number;
  globalThis.cancelAnimationFrame = (id: number) => clearTimeout(id);
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.useRealTimers();
});

function render(node: ReactNode) {
  act(() => root.render(node));
}

function click(el: Element | null | undefined) {
  if (!el) throw new Error("element not found");
  act(() => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  });
}

function keydown(el: Element, key: string) {
  act(() => {
    el.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
  });
}

const q = <T extends Element = HTMLElement>(selector: string, scope: ParentNode = document) => scope.querySelector<T>(selector);

/* ------------------------------------------------------------------ */
/* Button                                                              */
/* ------------------------------------------------------------------ */

describe("Button", () => {
  it("renders a type=button with its label and fires onClick", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>התחלת אימון</Button>);
    const btn = q<HTMLButtonElement>("button", container);
    expect(btn?.textContent).toBe("התחלת אימון");
    expect(btn?.getAttribute("type")).toBe("button");
    click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled, aria-busy and shows a spinner while loading", () => {
    const onClick = vi.fn();
    render(<Button loading onClick={onClick}>שומר…</Button>);
    const btn = q<HTMLButtonElement>("button", container);
    expect(btn?.disabled).toBe(true);
    expect(btn?.getAttribute("aria-busy")).toBe("true");
    expect(q('[role="status"]', btn!)).not.toBeNull();
    click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("applies variant, size and fullWidth classes", () => {
    render(<Button variant="accent" size="xl" fullWidth>בואו נתחיל</Button>);
    const cls = q("button", container)?.className ?? "";
    expect(cls).toContain("bg-accent");
    expect(cls).toContain("h-14");
    expect(cls).toContain("w-full");
  });

  it("renders as a link when href is given", () => {
    render(<Button href="/workouts">לאימונים</Button>);
    const a = q<HTMLAnchorElement>("a", container);
    expect(a).not.toBeNull();
    expect(a?.getAttribute("href")).toBe("/workouts");
    expect(q("button", container)).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* Sheet                                                               */
/* ------------------------------------------------------------------ */

describe("Sheet", () => {
  it("renders nothing while closed", () => {
    render(
      <Sheet open={false} onClose={() => {}} title="סגור">
        <p>גוף</p>
      </Sheet>,
    );
    expect(q('[role="dialog"]')).toBeNull();
  });

  it("opens as an aria-modal dialog with a labelled title, locks scroll and closes on Escape / close button / backdrop", () => {
    const onClose = vi.fn();
    render(
      <Sheet open onClose={onClose} title="בחירת תרגיל" description="בחרו תרגיל חלופי">
        <button type="button">אפשרות</button>
      </Sheet>,
    );
    const dialog = q('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog?.getAttribute("aria-modal")).toBe("true");
    const titleId = dialog?.getAttribute("aria-labelledby");
    expect(titleId).toBeTruthy();
    expect(document.getElementById(titleId!)?.textContent).toBe("בחירת תרגיל");
    expect(document.body.style.overflow).toBe("hidden");

    keydown(dialog!, "Escape");
    expect(onClose).toHaveBeenCalledTimes(1);

    click(q('button[aria-label="סגירה"]', dialog!));
    expect(onClose).toHaveBeenCalledTimes(2);

    // Backdrop is the sibling before the panel.
    click(dialog!.previousElementSibling);
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it("restores body scroll when it closes and ignores Escape when not dismissible", () => {
    const onClose = vi.fn();
    function Host() {
      const [open, setOpen] = useState(true);
      return (
        <>
          <button type="button" id="toggle" onClick={() => setOpen(false)}>סגירה מבחוץ</button>
          <Sheet open={open} onClose={onClose} dismissible={false} title="ללא סגירה">
            <p>תוכן</p>
          </Sheet>
        </>
      );
    }
    render(<Host />);
    const dialog = q('[role="dialog"]')!;
    keydown(dialog, "Escape");
    expect(onClose).not.toHaveBeenCalled();
    expect(q('button[aria-label="סגירה"]', dialog)).not.toBeNull(); // header close stays available
    click(q("#toggle", container));
    expect(q('[role="dialog"]')).toBeNull();
    expect(document.body.style.overflow).toBe("");
  });
});

/* ------------------------------------------------------------------ */
/* Toast                                                               */
/* ------------------------------------------------------------------ */

function ToastHost() {
  const { success, error } = useToast();
  return (
    <>
      <button type="button" id="ok" onClick={() => success("נשמר")}>ok</button>
      <button type="button" id="err" onClick={() => error("שגיאה בסנכרון", { duration: 0 })}>err</button>
    </>
  );
}

describe("Toast", () => {
  it("shows a success toast inside an aria-live region and auto-dismisses it", () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <ToastHost />
      </ToastProvider>,
    );
    click(q("#ok", container));
    const live = q('[aria-live="polite"]');
    expect(live).not.toBeNull();
    const status = q('[role="status"]', live!);
    expect(status?.textContent).toContain("נשמר");

    act(() => {
      vi.advanceTimersByTime(4100);
    });
    expect(q('[role="status"]', live!)).toBeNull();
  });

  it("renders errors as role=alert, keeps sticky toasts until dismissed", () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <ToastHost />
      </ToastProvider>,
    );
    click(q("#err", container));
    const alert = q('[role="alert"]');
    expect(alert?.textContent).toContain("שגיאה בסנכרון");
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(q('[role="alert"]')).not.toBeNull();
    click(q('button[aria-label="סגירת ההודעה"]', alert!));
    expect(q('[role="alert"]')).toBeNull();
  });

  it("is a safe no-op outside a ToastProvider", () => {
    render(<ToastHost />);
    expect(() => click(q("#ok", container))).not.toThrow();
    expect(q('[role="status"]')).toBeNull();
  });
});
