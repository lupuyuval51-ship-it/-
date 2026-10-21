import { describe, expect, it } from "vitest";
import { addFinalBoss } from "@/lib/game/spec/boss";
import { mergeExtension } from "@/lib/game/spec/extension";
import { extensionSchema, type GameSpec, type Mission } from "@/lib/game/spec/schema";
import { crossCheck, validateGameSpec } from "@/lib/game/spec/validate";
import { buildDemoExtension } from "../support/samples";
import { request, validDemoSpec } from "./helpers";

/** An objective the area can always satisfy: solving a challenge that already has a station there. */
function anyObjective(spec: GameSpec, areaId: string): Mission["objectives"][number] {
  const area = spec.areas.find((a) => a.id === areaId)!;
  const station = area.stations.find((s) => s.kind === "challenge" && s.challengeId)!;
  return { type: "solve", text: "Solve it again", challengeIds: [station.challengeId!] };
}

/** A required mission of the area that nothing builds on, with a side mission built on top of it. */
function withSideMissionOnTopOf(spec: GameSpec, areaId: string): { spec: GameSpec; base: Mission } {
  const copy = structuredClone(spec);
  const here = copy.missions.filter((m) => m.areaId === areaId);
  const base = here.find((m) => !m.optional && !here.some((o) => o.requires.includes(m.id)))!;
  copy.missions.push({ id: "m-side-extra", title: "Side quest", story: "An optional detour after the main task.", areaId, requires: [base.id], objectives: [anyObjective(copy, areaId)], optional: true });
  return { spec: copy, base };
}

describe("required missions that only a side mission builds on", () => {
  it("still seal the portal of their area (the player cannot leave them behind)", () => {
    const full = validDemoSpec({ gameType: "adventure", mode: "FULL" });
    const first = full.areas[0]!;
    expect(first.portal).toBeDefined();
    const { spec, base } = withSideMissionOnTopOf(full, first.id);
    spec.areas[0]!.portal!.requiresMissionIds = [];
    const res = validateGameSpec(spec, { alignGameType: spec.meta.gameType });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const portal = res.spec.areas[0]!.portal!;
    expect(portal.requiresMissionIds).toContain(base.id);
    expect(portal.requiresMissionIds).not.toContain("m-side-extra");
  });

  it("are still fought before the final boss", () => {
    const full = validDemoSpec({ gameType: "adventure", mode: "FULL" });
    expect(full.bosses).toHaveLength(0);
    const last = [...full.areas].reverse().find((a) => !a.portal)!;
    const { spec, base } = withSideMissionOnTopOf(full, last.id);
    const out = addFinalBoss(spec);
    expect(out.added).toBe(true);
    const bossMission = out.spec.missions.find((m) => m.objectives.some((o) => o.type === "defeat"))!;
    expect(bossMission.requires).toContain(base.id);
    expect(bossMission.requires).not.toContain("m-side-extra");
  });
});

describe("Extend Existing Game keeps reactions with their renamed mission", () => {
  it("rewrites afterMissionId when a new mission's id clashed with an old one", () => {
    const base = validDemoSpec({ gameType: "adventure", mode: "FULL" });
    const built = buildDemoExtension({ ...base, meta: { ...base.meta, generator: { kind: "demo", provider: "demo", model: "templates", templateId: "programming", mode: "FULL", generatedAt: "x" } } }, request({ mode: "EXTEND" }))!;
    const ext = extensionSchema.parse(built.ext);
    const clash = base.missions[0]!.id;
    const newMission = ext.missions[0]!;
    const oldId = newMission.id;
    newMission.id = clash;
    for (const m of ext.missions) m.requires = m.requires.map((r) => (r === oldId ? clash : r));
    for (const a of ext.areas) if (a.portal) a.portal.requiresMissionIds = a.portal.requiresMissionIds.map((r) => (r === oldId ? clash : r));
    const area = ext.areas.find((a) => a.id === newMission.areaId) ?? ext.areas[0]!;
    if (area.npcs.length === 0) area.npcs.push({ id: "npc-react", name: "Guide", role: "Helper", look: { color: "#3366ff", shape: "robot" }, lines: ["Hello there."], reactions: [] });
    area.npcs[0]!.reactions = [{ afterMissionId: clash, lines: ["You did it!"] }];

    const merged = mergeExtension(base, ext);
    expect(merged.notes.join(" ")).toMatch(/renamed mission/);
    const renamed = merged.raw.missions.find((m) => m.areaId === area.id && m.title === newMission.title)!;
    expect(renamed.id).not.toBe(clash);
    const reaction = merged.raw.areas.find((a) => a.id === area.id)!.npcs[0]!.reactions[0]!;
    expect(reaction.afterMissionId).toBe(renamed.id);
    expect(validateGameSpec(merged.raw).ok).toBe(true);
  });
});

describe("content a player could not tell apart is refused", () => {
  const spec = validDemoSpec({ gameType: "adventure", mode: "FULL" });
  const after = (mutate: (s: GameSpec) => void) => {
    const s = structuredClone(spec);
    mutate(s);
    return crossCheck(s);
  };
  const errorsAfter = (mutate: (s: GameSpec) => void): string[] => after(mutate).errors;
  const warningsAfter = (mutate: (s: GameSpec) => void): string[] => after(mutate).warnings;

  it("two choice options with the same text", () => {
    const errors = errorsAfter((s) => {
      const c = s.challenges.find((x) => x.type === "choice")!;
      if (c.type !== "choice") return;
      c.options[1]!.text = `  ${c.options[0]!.text.replace(/ /g, "   ")} `;
    });
    expect(errors.join(" ")).toMatch(/same text/);
  });

  it("two sequence items or two match pairs with the same text on one side are warned about (the study engine may build them from repetitive notes)", () => {
    const seq = warningsAfter((s) => {
      const c = s.challenges.find((x) => x.type === "sequence");
      if (c?.type === "sequence") c.items[1]!.text = c.items[0]!.text;
      else s.challenges.push({ type: "sequence", id: "seq-dup", title: "t", prompt: "p", concept: "c", explanation: "e", level: 1, items: [{ id: "a", text: "one" }, { id: "b", text: "one" }, { id: "c", text: "two" }] });
    });
    expect(seq.join(" ")).toMatch(/same text/);
    const match = warningsAfter((s) => {
      s.challenges.push({ type: "match", id: "match-dup", title: "t", prompt: "p", concept: "c", explanation: "e", level: 1, pairs: [{ id: "a", left: "x", right: "1" }, { id: "b", left: "y", right: "1" }, { id: "c", left: "z", right: "3" }] });
    });
    expect(match.join(" ")).toMatch(/match-dup.*same text/);
  });

  it("a numeric 'common mistake' that is really the right answer", () => {
    const errors = errorsAfter((s) => {
      s.challenges.push({ type: "numeric", id: "num-dup", title: "t", prompt: "p", concept: "c", explanation: "e", level: 1, answer: 10, tolerance: 0.5, commonMistakes: [{ value: 10.25, feedback: "Did you round?" }] });
    });
    expect(errors.join(" ")).toMatch(/num-dup.*common mistake/);
    const fine = errorsAfter((s) => {
      s.challenges.push({ type: "numeric", id: "num-ok", title: "t", prompt: "p", concept: "c", explanation: "e", level: 1, answer: 10, tolerance: 0.5, commonMistakes: [{ value: 11, feedback: "Did you round?" }] });
    });
    expect(fine.join(" ")).not.toMatch(/num-ok.*common mistake/);
  });
});
