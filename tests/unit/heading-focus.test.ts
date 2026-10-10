import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("src/app/globals.css", "utf8");
const app = readFileSync("mobile/src/App.tsx", "utf8");

describe("programmatic heading focus", () => {
  it("still moves focus to the page heading after navigation (TalkBack)", () => {
    expect(app).toMatch(/querySelector<HTMLElement>\("main h1"\)/);
    expect(app).toMatch(/tabIndex = -1/);
    expect(app).toMatch(/\.focus\(/);
  });

  it("removes the focus ring from the tabindex=-1 heading only", () => {
    const rule = css.match(/main h1\[tabindex="-1"\]:focus[^{]*\{([^}]*)\}/);
    expect(rule).not.toBeNull();
    expect(rule![1]).toMatch(/outline:\s*none/);
    expect(css).toMatch(/main h1\[tabindex="-1"\]:focus-visible/);
  });

  it("keeps the global focus ring for real interactive elements", () => {
    expect(css).toMatch(/^:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--color-neon\)/m);
    // no other rule strips outlines from buttons, links or fields
    const strippers = [...css.matchAll(/([^{}]+)\{[^}]*outline:\s*(none|0)[^}]*\}/g)].map((m) => m[1].trim());
    for (const sel of strippers) expect(sel ?? "").toMatch(/h1\[tabindex="-1"\]/);
  });
});
