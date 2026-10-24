import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// AGENTS.md: a blank in maths is written as x ("1/3 = x/9"), never "?": in a Hebrew line the "?" is mirrored to the other end.
const DIR = path.join(import.meta.dirname, "../../src/lib/game/topics/content");
const BLANK_AS_QUESTION_MARK = /(?:\d\s*[×÷+−-]|=)\s*\?/u;

describe("topic library: maths blanks are written as x", () => {
  it("no question, lesson or explanation writes a blank as '= ?' or '3 + ?'", () => {
    const found: string[] = [];
    for (const file of readdirSync(DIR).filter((f) => f.endsWith(".ts"))) {
      readFileSync(path.join(DIR, file), "utf8").split("\n").forEach((line, i) => {
        const m = BLANK_AS_QUESTION_MARK.exec(line);
        if (m) found.push(`${file}:${i + 1}: …${line.slice(Math.max(0, m.index - 30), m.index + m[0].length + 5)}…`);
      });
    }
    expect(found).toEqual([]);
  });

  it("the check itself catches the shapes it is for", () => {
    for (const bad of ["1/2 ÷ 1/4 = ?", "3 + ? = 7", "כתבו: 5 × 4 = ?."]) expect(BLANK_AS_QUESTION_MARK.test(bad), bad).toBe(true);
    for (const ok of ["1/3 = x/9", "מה פירוש הסימן ÷?", "How much is 12 ÷ 3?"]) expect(BLANK_AS_QUESTION_MARK.test(ok), ok).toBe(false);
  });
});
