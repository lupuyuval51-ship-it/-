import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { createElement as h, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { I18nProvider } from "@/components/I18nProvider";
import { ChallengePanel } from "@/components/game/hud/ChallengePanel";
import { TopBar, TouchControls, InteractPrompt } from "@/components/game/hud/Overlays";
import { ProgramBuilder } from "@/components/game/hud/ProgramBuilder";
import { SimulationPanel } from "@/components/game/hud/SimulationPanel";
import type { PublicChallenge } from "@/lib/game/challenges/grade";
import { InputState } from "@/components/game/input";
import {
  describeGrid, describePoint, describeSurroundings, nearbyAnnouncement, objectiveChanges, objectiveSnapshot, radioStep, radioTabIndex,
  relativeDirection, scenePoints, trapTarget,
} from "@/lib/game/a11y/scene";
import { toPublicSpec } from "@/lib/game/spec/public";
import { initialState, toClientState, type ClientState } from "@/lib/game/state/progress";
import { guideTargets } from "@/lib/game/state/guidance";
import { buildWorld } from "@/lib/game/world/build";
import { DICTIONARIES, makeT, type DictKey, type Locale } from "@/lib/i18n";
import { validDemoSpec } from "./helpers";

const tEn = makeT(DICTIONARIES.en);
const tHe = makeT(DICTIONARIES.he);

const setup = () => {
  const spec = toPublicSpec(validDemoSpec({ mode: "FULL" }));
  const areaId = spec.areas[0]!.id;
  const world = buildWorld(spec as never, areaId);
  const client = toClientState(initialState(spec as never, 0));
  return { spec, areaId, world, client };
};
const render = (el: ReactElement, locale: Locale = "en") =>
  renderToStaticMarkup(h(I18nProvider, { locale, dict: DICTIONARIES[locale], children: el }));

describe("a11y: relative directions", () => {
  // yaw 0: the camera looks along -z, its right is +x
  const from = { x: 0, z: 0 };
  it("maps the eight sectors for yaw 0", () => {
    expect(relativeDirection(from, 0, { x: 0, z: -5 })).toBe("ahead");
    expect(relativeDirection(from, 0, { x: 5, z: -5 })).toBe("aheadRight");
    expect(relativeDirection(from, 0, { x: 5, z: 0 })).toBe("right");
    expect(relativeDirection(from, 0, { x: 5, z: 5 })).toBe("behindRight");
    expect(relativeDirection(from, 0, { x: 0, z: 5 })).toBe("behind");
    expect(relativeDirection(from, 0, { x: -5, z: 5 })).toBe("behindLeft");
    expect(relativeDirection(from, 0, { x: -5, z: 0 })).toBe("left");
    expect(relativeDirection(from, 0, { x: -5, z: -5 })).toBe("aheadLeft");
  });
  it("rotates with the camera", () => {
    // yaw +90deg: the camera looks along -x, so a target at -x is straight ahead and -z is to the right
    expect(relativeDirection(from, Math.PI / 2, { x: -5, z: 0 })).toBe("ahead");
    expect(relativeDirection(from, Math.PI / 2, { x: 0, z: -5 })).toBe("right");
    expect(relativeDirection(from, Math.PI, { x: 0, z: 5 })).toBe("ahead");
  });
});

describe("a11y: describing the scene", () => {
  it("lists the nearest things with distance and direction, in both languages", () => {
    const { spec, areaId, world, client } = setup();
    const points = scenePoints(spec, client, world, areaId);
    expect(points.some((p) => p.kind === "station")).toBe(true);
    expect(points.some((p) => p.kind === "npc")).toBe(true);
    const player = { x: world.spawn.x, z: world.spawn.z };
    const goal = guideTargets(spec, client, world)[0] ?? null;
    for (const t of [tEn, tHe]) {
      const text = describeSurroundings({ points, player, yaw: world.spawn.yaw, areaName: "Test Area", goal, t });
      expect(text).toContain("Test Area");
      expect(text).toMatch(/\d+/);
      expect(text).not.toMatch(/\{\w+\}|undefined|NaN/);
      expect(text).toContain(goal!.label);
    }
  });

  it("is sorted by distance and caps the list", () => {
    const { spec, areaId, world, client } = setup();
    const points = scenePoints(spec, client, world, areaId).filter((p) => p.kind !== "collectible");
    const player = { x: world.spawn.x, z: world.spawn.z };
    const text = describeSurroundings({ points, player, yaw: 0, areaName: "A", goal: null, t: tEn, max: 2 });
    expect(text.split(";").length).toBe(2);
    const nearest = [...points].sort((a, b) => Math.hypot(a.x - player.x, a.z - player.z) - Math.hypot(b.x - player.x, b.z - player.z))[0]!;
    expect(text).toContain(nearest.label);
  });

  it("marks locked and completed stations and counts loose collectibles", () => {
    const { spec, areaId, world, client } = setup();
    const done: ClientState = { ...client, resolvedStations: { [world.stations[0]!.stationId]: "correct" } };
    const pts = scenePoints(spec, done, world, areaId);
    expect(pts.find((p) => p.id === world.stations[0]!.stationId)!.status).toBe("done");
    const s = pts.find((p) => p.id === world.stations[0]!.stationId)!;
    expect(describePoint(s, { x: 0, z: 0 }, 0, s, tEn)).toContain(tEn("a11y.status.done"));
    const text = describeSurroundings({ points: [{ kind: "collectible", id: "c0", label: "", x: 1, z: 1 }, { kind: "collectible", id: "c1", label: "", x: 2, z: 2 }], player: { x: 0, z: 0 }, yaw: 0, areaName: "A", goal: null, t: tEn });
    expect(text).toContain("2 collectibles");
  });

  it("announces a station the player walks up to, with the right key for the device", () => {
    const target = { kind: "station", id: "s1", label: "Loops", stationKind: "challenge", status: "active", x: 0, z: 0 } as const;
    expect(nearbyAnnouncement(target, false, tEn)).toBe("Open Loops. Press E to use it.");
    expect(nearbyAnnouncement(target, true, tEn)).toContain("Use button");
    const locked = nearbyAnnouncement({ ...target, status: "locked" }, false, tEn);
    expect(locked).toContain("locked");
    expect(locked).not.toContain("Press E");
  });
});

describe("a11y: objective announcements", () => {
  it("announces completed objectives and partial progress, not unlocks", () => {
    const { spec, client } = setup();
    const before = objectiveSnapshot(spec, client);
    expect(before.length).toBeGreaterThan(0);
    expect(objectiveChanges(before, before, tEn)).toEqual([]);
    const m = spec.missions[0]!;
    const talk = { ...client, talked: [...client.talked, ...spec.areas.flatMap((a) => a.npcs).map((n) => n.id)] };
    const afterTalk = objectiveSnapshot(spec, talk);
    const msgs = objectiveChanges(before, afterTalk, tEn);
    expect(msgs.length).toBeGreaterThan(0);
    expect(msgs.every((x) => /Objective (complete|progress)/.test(x))).toBe(true);
    const finished = { ...talk, missionsDone: [...talk.missionsDone, m.id] };
    const msgs2 = objectiveChanges(afterTalk, objectiveSnapshot(spec, finished), tHe);
    expect(msgs2.join(" ")).toContain(m.title);
  });
});

describe("a11y: keyboard models", () => {
  it("radio arrows wrap and respect RTL", () => {
    expect(radioStep("ArrowDown", 0, 4, false)).toBe(1);
    expect(radioStep("ArrowDown", 3, 4, false)).toBe(0);
    expect(radioStep("ArrowUp", 0, 4, false)).toBe(3);
    expect(radioStep("ArrowRight", 1, 4, false)).toBe(2);
    expect(radioStep("ArrowRight", 1, 4, true)).toBe(0);
    expect(radioStep("ArrowLeft", 1, 4, true)).toBe(2);
    expect(radioStep("Home", 2, 4, false)).toBe(0);
    expect(radioStep("End", 0, 4, false)).toBe(3);
    expect(radioStep("a", 0, 4, false)).toBeNull();
    expect(radioStep("ArrowDown", 0, 0, false)).toBeNull();
  });
  it("has exactly one tab stop in a radio group", () => {
    for (const checked of [-1, 0, 2]) {
      const stops = [0, 1, 2, 3].filter((i) => radioTabIndex(i, checked) === 0);
      expect(stops).toEqual([checked < 0 ? 0 : checked]);
    }
  });
  it("traps Tab inside a dialog", () => {
    expect(trapTarget(false, 2, 3)).toBe(0); // Tab on the last control wraps to the first
    expect(trapTarget(true, 0, 3)).toBe(2); // Shift+Tab on the first wraps to the last
    expect(trapTarget(false, 0, 3)).toBeNull();
    expect(trapTarget(true, 2, 3)).toBeNull();
    expect(trapTarget(false, -1, 3)).toBe(0); // focus escaped: pull it back in
    expect(trapTarget(true, -1, 3)).toBe(2);
    expect(trapTarget(false, -1, 0)).toBe(-1);
  });
});

describe("a11y: robot grid description", () => {
  const grid = { width: 4, height: 3, goal: { x: 3, y: 2 }, walls: [{ x: 1, y: 1 }, { x: 0, y: 1 }] };
  it("describes size, robot, goal and walls", () => {
    const en = describeGrid(grid, { x: 0, y: 0 }, "E", tEn);
    expect(en).toContain("4 columns by 3 rows");
    expect(en).toContain("column 1, row 1, facing right");
    expect(en).toContain("goal is at column 4, row 3");
    expect(en).toContain("Walls at column 1, row 2, column 2, row 2");
    expect(describeGrid({ ...grid, walls: [] }, { x: 0, y: 0 }, "N", tEn)).toContain("no walls");
    expect(describeGrid(grid, { x: 0, y: 0 }, "S", tHe)).not.toMatch(/\{\w+\}/);
  });
});

describe("a11y: dictionaries", () => {
  const keys = Object.keys(DICTIONARIES.en).filter((k) => k.startsWith("a11y.")) as DictKey[];
  const slots = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!).sort().join(",");
  it("every a11y string exists in both languages with the same placeholders", () => {
    expect(keys.length).toBeGreaterThan(60);
    for (const k of keys) {
      expect(DICTIONARIES.he[k], k).toBeTruthy();
      expect(slots(DICTIONARIES.he[k]), k).toBe(slots(DICTIONARIES.en[k]));
    }
  });
});

describe("a11y: rendered HUD (server-rendered markup, both languages)", () => {
  const choice: PublicChallenge = { id: "c1", title: "Pick one", prompt: "Which?", concept: "loops", level: 1, hasHint: true, type: "choice", options: [{ id: "a", text: "Alpha" }, { id: "b", text: "Beta" }, { id: "c", text: "Gamma" }] };
  const noop = () => undefined;
  const panel = (ch: PublicChallenge, extra: Partial<Parameters<typeof ChallengePanel>[0]> = {}) =>
    h(ChallengePanel, { challenge: ch, stationLabel: "Station", result: null, hint: null, busy: false, onSubmit: noop, onHint: noop, onClose: noop, ...extra });

  it("the challenge panel is a modal dialog with a name, a labelled close button and a live region", () => {
    for (const locale of ["en", "he"] as const) {
      const html = render(panel(choice), locale);
      expect(html).toContain('role="dialog"');
      expect(html).toContain('aria-modal="true"');
      expect(html).toContain('aria-labelledby="challenge-title"');
      expect(html).toContain(`aria-label="${DICTIONARIES[locale]["common.close"]}"`);
      expect(html).toMatch(/role="status"[^>]*aria-live="polite"[^>]*data-testid="challenge-live"/);
    }
  });

  it("choice answers form a radio group with one roving tab stop", () => {
    const html = render(panel(choice));
    expect(html).toContain('role="radiogroup"');
    expect((html.match(/role="radio"/g) ?? []).length).toBe(3);
    expect((html.match(/role="radio"[^>]*tabindex="0"/g) ?? []).length).toBe(1);
    expect((html.match(/role="radio"[^>]*tabindex="-1"/g) ?? []).length).toBe(2);
  });

  it("a wrong choice result is available as text, not only as colour", () => {
    const result = { correct: false, feedback: "Try the loop", resolved: false, revealed: false, pointsAwarded: 0, attemptsLeft: 2 };
    const html = render(panel(choice, { result }));
    expect(html).toContain("Not correct. Try the loop");
    expect(html).toContain("2");
    const he = render(panel(choice, { result }), "he");
    expect(he).toContain("לא נכון. Try the loop");
  });

  it("sequence and match controls carry translated names (no hard-coded English)", () => {
    const seq: PublicChallenge = { id: "s", title: "Order", prompt: "p", concept: "c", level: 1, hasHint: false, type: "sequence", items: [{ id: "1", text: "one" }, { id: "2", text: "two" }] };
    const match: PublicChallenge = { id: "m", title: "Match", prompt: "p", concept: "c", level: 1, hasHint: false, type: "match", lefts: [{ id: "1", text: "L" }], rights: [{ id: "1", text: "R" }] };
    const he = render(panel(seq), "he");
    expect(he).toContain(DICTIONARIES.he["a11y.seq.order"]);
    expect(he).toContain(DICTIONARIES.he["a11y.seq.pool"]);
    expect(he).not.toContain("your order");
    const m = render(panel(match), "he");
    expect(m).toContain(DICTIONARIES.he["a11y.match.terms"]);
    expect(m).toContain('aria-pressed="false"');
  });

  it("the program grid and the simulations describe themselves", () => {
    const program: PublicChallenge & { type: "program" } = {
      id: "p", title: "Robot", prompt: "p", concept: "c", level: 1, hasHint: false, type: "program", maxBlocks: 5, allowed: ["move", "turnLeft", "repeat"],
      grid: { width: 3, height: 3, start: { x: 0, y: 0, dir: "E" }, goal: { x: 2, y: 2 }, walls: [{ x: 1, y: 1 }] },
    };
    const html = render(h(ProgramBuilder, { challenge: program, trail: null, disabled: false, onChange: noop }));
    expect(html).toContain('role="img" aria-label="Robot grid, 3 columns by 3 rows.');
    expect(html).toContain('aria-pressed="true"');
    expect(html).not.toContain('aria-label="robot grid"');
    const sim = { kind: "projectile", gravity: 9.8, maxSpeed: 30, targetDistance: 20, tolerance: 2 } as never;
    const simHtml = render(h(SimulationPanel, { challenge: { id: "x", title: "t", prompt: "p", concept: "c", level: 1, hasHint: false, type: "simulation", sim } as never, disabled: false, onChange: noop }), "he");
    expect(simHtml).toContain("תצוגת מסלול");
    expect(simHtml).toContain("aria-valuetext");
    expect(simHtml).not.toContain('aria-label="trajectory"');
  });

  it("the top bar is labelled, and the score reads as one phrase", () => {
    const { spec, client } = setup();
    const html = render(h(TopBar, { spec, client, areaName: "A very long area name that would be cut off", score: 120, maxScore: 900, onPause: noop, demo: false }));
    expect(html).toContain('aria-label="Pause"');
    expect(html).toContain('aria-label="Back to library"');
    expect(html).toContain('aria-label="Score 120 of 900"');
    expect(html).toContain('aria-controls="hud-missions"');
    expect(html).toContain("A very long area name that would be cut off");
  });

  it("touch controls and the interact prompt are labelled in the UI language", () => {
    const input = new InputState();
    const he = render(h(TouchControls, { input, onInteract: noop, hasJump: true }), "he");
    expect(he).toContain(`aria-label="${DICTIONARIES.he["a11y.joystick"].replace(/'/g, "&#x27;")}"`);
    expect(he).toContain(`aria-label="${DICTIONARIES.he["a11y.sprint"]}"`);
    expect(he).not.toContain('aria-label="joystick"');
    const prompt = render(h(InteractPrompt, { target: { kind: "npc", id: "n", label: "Byte", x: 0, z: 0 }, touch: false, onActivate: noop }));
    expect(prompt).toContain('aria-keyshortcuts="E"');
    expect(prompt).toContain("Talk to Byte");
  });
});

// Large system fonts (Android "font size 200%", browser text zoom): layout must be driven by the root font size, not by
// fixed pixel boxes, and text must be allowed to wrap. These are source-level guards because the unit project has no
// layout engine; the real-device check is in the README.
describe("a11y: text-scaling guards on the HUD and mobile pages", () => {
  const root = path.resolve(import.meta.dirname, "../..");
  const files = [
    ...readdirSync(path.join(root, "src/components/game/hud")).filter((f) => f.endsWith(".tsx")).map((f) => `src/components/game/hud/${f}`),
    ...readdirSync(path.join(root, "mobile/src/pages")).filter((f) => f.endsWith(".tsx")).map((f) => `mobile/src/pages/${f}`),
    "mobile/src/App.tsx",
  ];
  const src = Object.fromEntries(files.map((f) => [f, readFileSync(path.join(root, f), "utf8")]));

  it("has no hard-coded English aria-labels / titles", () => {
    for (const [f, text] of Object.entries(src)) {
      const bad = [...text.matchAll(/\baria-label="([^"{}]+)"/g)].map((m) => m[1]!);
      expect(bad, f).toEqual([]);
    }
  });

  it("never fixes the height of a box that holds text", () => {
    for (const [f, text] of Object.entries(src)) {
      expect(text.match(/className="[^"]*\b(?:h|max-h|min-h)-\[\d+px\]/g), f).toBeNull();
      expect(text.match(/className="[^"]*\b(?:w|max-w)-\[\d+px\]/g), f).toBeNull();
    }
  });

  it("does not truncate the area name or position the mission list with a fixed offset", () => {
    const overlays = src["src/components/game/hud/Overlays.tsx"]!;
    const areaTag = overlays.match(/<p[^>]*data-testid="area-name"[^>]*>/)?.[0] ?? "";
    expect(areaTag).not.toBe("");
    expect(areaTag).not.toMatch(/truncate|line-clamp|overflow-hidden/);
    expect(areaTag).toContain("break-words");
    expect(overlays).not.toMatch(/top-\[6\.5rem\]/);
  });

  it("challenge panel: stable, reachable close controls and a scroll cue for hidden answers", () => {
    const panel = src["src/components/game/hud/ChallengePanel.tsx"]!;
    // header X is a 44px target above the content; footer stays above the scrolling body and respects the safe area
    expect(panel).toMatch(/data-testid="challenge-x"[^>]*size-11|size-11[^>]*data-testid="challenge-x"/);
    expect(panel).toMatch(/<header className=\{cx\("relative z-20 flex shrink-0/);
    expect(panel).toMatch(/<footer className=\{cx\("relative z-20 flex shrink-0/);
    expect(panel).toContain("env(safe-area-inset-bottom)");
    expect(panel).toContain("env(safe-area-inset-top)");
    // the wrong-answer shake must not move the header / footer buttons
    expect(panel).toMatch(/const el = bodyRef\.current;\s*if \(!result \|\| result\.correct/);
    expect(panel).not.toMatch(/const el = ref\.current;\s*if \(!result/);
    // scroll affordance
    expect(panel).toContain("challenge-scroll-cue");
    expect(panel).toContain("scrollCue(");
    // landscape phones show the options in two columns so four answers fit
    expect(panel).toMatch(/compact && challenge\.options\.length > 2 \? "grid grid-cols-2/);
  });

  it("scrolls tall dialogs instead of clipping them", () => {
    const overlays = src["src/components/game/hud/Overlays.tsx"]!;
    expect(overlays.match(/max-h-\[96dvh\][^"]*overflow-y-auto/g)?.length).toBe(2); // pause menu + completion card
    expect(src["src/components/game/hud/ChallengePanel.tsx"]).toMatch(/max-h-\[94dvh\][^"]*sm:rounded-3xl/);
    expect(src["src/components/game/hud/ChallengePanel.tsx"]).toMatch(/flex-1 overflow-y-auto/);
  });

  it("touch controls size with the font but never exceed the viewport", () => {
    const o = src["src/components/game/hud/Overlays.tsx"]!;
    expect(o).toContain("max-w-[34vw]");
    expect(o).toContain("m.action");
  });

  it("the mobile viewport allows pinch zoom", () => {
    const html = readFileSync(path.join(root, "mobile/index.html"), "utf8");
    expect(html).not.toMatch(/user-scalable\s*=\s*(no|0)/);
    expect(html).not.toMatch(/maximum-scale\s*=\s*1(\.0)?\b/);
  });
});
