import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { LibraryGame } from "../../mobile/src/library-model";
import { GameCard } from "../../mobile/src/pages/library-parts";

const t = ((key: string, vars?: Record<string, unknown>) => (vars?.action ? `${key}:${String(vars.action)}` : key)) as never;
const game = (over: Partial<LibraryGame>): LibraryGame => ({
  id: "g1", title: "Fractions", subject: "Fractions", generatorKind: "catalog", createdAt: 1, lastPlayedAt: 1,
  bestScore: 0, maxScore: 100, bestStars: 0, inProgress: false, percent: 0, lastSessionId: null, ...over,
} as LibraryGame);
const label = (g: LibraryGame) => /data-testid="mobile-play"[^>]*>([^<]*)/.exec(renderToStaticMarkup(createElement(GameCard, { game: g, t, onDelete: () => {} })))?.[1] ?? "";

describe("library game card: the main button", () => {
  it("reads Play for a game that was only opened (an open run at 0 %)", () => {
    expect(label(game({ inProgress: true, percent: 0, lastSessionId: "s1" }))).toContain("lib.play");
  });
  it("reads Continue once the open run made progress", () => {
    expect(label(game({ inProgress: true, percent: 25, lastSessionId: "s1" }))).toContain("lib.continue");
  });
  it("reads Play for a finished or never-started game", () => {
    expect(label(game({ inProgress: false, percent: 0 }))).toContain("lib.play");
    expect(label(game({ inProgress: false, percent: 100, bestStars: 3, lastSessionId: "s1" }))).toContain("lib.play");
  });
});
